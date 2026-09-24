import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AuthRole = 'public' | 'researcher' | 'policymaker' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  affiliation: string;
  designation: string;
  avatar?: string;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  registeredAt: string;
  lastActiveAt: string;
}

interface AuthRecord extends AuthUser {
  passwordHash: string;
  otpHash?: string;
  otpExpiresAt?: string;
  otpAttempts?: number;
  otpLastSentAt?: string;
}

const memoryStore = new Map<string, AuthRecord>();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function safeUser(record: AuthRecord): AuthUser {
  const { passwordHash: _password, otpHash: _otp, otpExpiresAt: _expiry, otpAttempts: _attempts, otpLastSentAt: _sent, ...user } = record;
  return user;
}

function hashSecret(value: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(value, salt, 64).toString('hex')}`;
}

function verifySecret(value: string, stored: string): boolean {
  const [salt, expectedHex] = String(stored || '').split(':');
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(value, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function loadRecord(email: string): Promise<AuthRecord | null> {
  const client = getSupabase();
  if (!client) {
    const record = memoryStore.get(email);
    return record ? structuredClone(record) : null;
  }
  const { data, error } = await client.from('bhu_auth_store').select('payload').eq('email', email).maybeSingle();
  if (error) throw new Error(`Authentication database error: ${error.message}`);
  return (data?.payload as AuthRecord) || null;
}

async function saveRecord(record: AuthRecord): Promise<void> {
  const client = getSupabase();
  if (!client) {
    memoryStore.set(record.email, record);
    return;
  }
  const { error } = await client.from('bhu_auth_store').upsert({ email: record.email, payload: record, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Authentication database error: ${error.message}`);
}

async function removeRecord(email: string): Promise<void> {
  const client = getSupabase();
  if (!client) {
    memoryStore.delete(email);
    return;
  }
  const { error } = await client.from('bhu_auth_store').delete().eq('email', email);
  if (error) throw new Error(`Authentication database error: ${error.message}`);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Email service is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL on Render.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email delivery failed: ${details.slice(0, 250)}`);
  }
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
  return secret;
}

export function createSession(user: AuthUser): string {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, role: user.role, exp: Date.now() + 7 * 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export async function verifySession(token: string): Promise<AuthUser> {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature) throw new Error('Invalid session.');
  const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('Invalid session.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!claims.exp || claims.exp < Date.now()) throw new Error('Session expired.');
  if (claims.role === 'admin' && claims.email === normalizeEmail(process.env.ADMIN_EMAIL || 'bhudristi@admin')) {
    return adminUser();
  }
  const record = await loadRecord(normalizeEmail(claims.email));
  if (!record || record.status !== 'active' || !record.emailVerified) throw new Error('Account is unavailable.');
  return safeUser(record);
}

function adminUser(): AuthUser {
  const now = new Date().toISOString();
  return {
    id: 'bhu-admin', email: normalizeEmail(process.env.ADMIN_EMAIL || 'bhudristi@admin'), name: 'BHU-DRISHTI Administrator',
    role: 'admin', affiliation: 'BHU-DRISHTI', designation: 'Platform Administrator', status: 'active',
    emailVerified: true, registeredAt: now, lastActiveAt: now
  };
}

export async function requestOtp(input: { email: string; password: string; name?: string; role?: AuthRole; mode: 'signup' | 'login' }): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.');
  if (String(input.password || '').length < 8) throw new Error('Password must contain at least 8 characters.');
  let record = await loadRecord(email);
  if (input.mode === 'signup' && record?.emailVerified) throw new Error('An account with this email already exists.');
  if (input.mode === 'signup' && record && !verifySecret(input.password, record.passwordHash)) throw new Error('An unfinished signup already exists for this email. Use the same password or sign in.');
  if (input.mode === 'login' && (!record || !verifySecret(input.password, record.passwordHash))) throw new Error('Incorrect email or password.');
  if (record?.status === 'suspended') throw new Error('This account has been suspended.');
  if (record?.otpLastSentAt && Date.now() - new Date(record.otpLastSentAt).getTime() < OTP_COOLDOWN_MS) throw new Error('Please wait 60 seconds before requesting another OTP.');

  const otp = String(crypto.randomInt(100000, 1000000));
  const now = new Date().toISOString();
  if (!record) {
    const role: AuthRole = ['public', 'researcher', 'policymaker'].includes(String(input.role)) ? input.role! : 'public';
    record = {
      id: crypto.randomUUID(), email, name: String(input.name || '').trim() || email.split('@')[0], role,
      affiliation: '', designation: '', status: 'active', emailVerified: false,
      registeredAt: now, lastActiveAt: now, passwordHash: hashSecret(input.password)
    };
  }
  record.otpHash = hashSecret(otp);
  record.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  record.otpAttempts = 0;
  record.otpLastSentAt = now;
  await sendEmail(email, 'Your BHU-DRISHTI verification code', `<div style="font-family:Arial,sans-serif"><h2>BHU-DRISHTI</h2><p>Your verification code is:</p><p style="font-size:30px;font-weight:700;letter-spacing:7px">${otp}</p><p>This code expires in 10 minutes. Never share it.</p></div>`);
  await saveRecord(record);
}

export async function verifyOtp(emailInput: string, otp: string): Promise<{ user: AuthUser; token: string }> {
  const email = normalizeEmail(emailInput);
  const record = await loadRecord(email);
  if (!record || !record.otpHash || !record.otpExpiresAt) throw new Error('Request a new OTP.');
  if (new Date(record.otpExpiresAt).getTime() < Date.now()) throw new Error('OTP expired. Request a new one.');
  if ((record.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) throw new Error('Too many attempts. Request a new OTP.');
  record.otpAttempts = (record.otpAttempts || 0) + 1;
  if (!verifySecret(String(otp || ''), record.otpHash)) {
    await saveRecord(record);
    throw new Error('Incorrect OTP.');
  }
  record.emailVerified = true;
  record.lastActiveAt = new Date().toISOString();
  delete record.otpHash; delete record.otpExpiresAt; delete record.otpAttempts;
  await saveRecord(record);
  const user = safeUser(record);
  return { user, token: createSession(user) };
}

export function adminLogin(emailInput: string, password: string): { user: AuthUser; token: string } {
  const email = normalizeEmail(emailInput);
  const expectedEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'bhudristi@admin');
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) throw new Error('ADMIN_PASSWORD is not configured.');
  const emailOk = email === expectedEmail;
  const supplied = Buffer.from(String(password || ''));
  const expected = Buffer.from(expectedPassword);
  const passwordOk = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  if (!emailOk || !passwordOk) throw new Error('Incorrect administrator credentials.');
  const user = adminUser();
  return { user, token: createSession(user) };
}

export async function updateAccount(email: string, updates: Partial<Pick<AuthUser, 'name' | 'affiliation' | 'designation' | 'avatar'>>): Promise<AuthUser> {
  const record = await loadRecord(normalizeEmail(email));
  if (!record) throw new Error('Account not found.');
  if (updates.avatar && (!updates.avatar.startsWith('data:image/') || updates.avatar.length > 2_000_000)) throw new Error('Profile image must be an image smaller than 1.5 MB.');
  for (const key of ['name', 'affiliation', 'designation', 'avatar'] as const) {
    if (updates[key] !== undefined) (record as any)[key] = String(updates[key]).trim();
  }
  await saveRecord(record);
  return safeUser(record);
}

export async function deleteAccount(email: string): Promise<void> { await removeRecord(normalizeEmail(email)); }

export async function listUsers(): Promise<AuthUser[]> {
  const client = getSupabase();
  if (!client) return Array.from(memoryStore.values()).map(safeUser);
  const { data, error } = await client.from('bhu_auth_store').select('payload').order('updated_at', { ascending: false });
  if (error) throw new Error(`Authentication database error: ${error.message}`);
  return (data || []).map(row => safeUser(row.payload as AuthRecord));
}

export async function suspendUser(id: string): Promise<AuthUser> {
  const users = await listUsers();
  const user = users.find(item => item.id === id);
  if (!user) throw new Error('User not found.');
  const record = await loadRecord(user.email);
  if (!record) throw new Error('User not found.');
  record.status = 'suspended';
  await saveRecord(record);
  await sendEmail(record.email, 'Your BHU-DRISHTI account has been suspended', '<p>Your BHU-DRISHTI account has been suspended by an administrator. Contact the platform team if you believe this is a mistake.</p>');
  return safeUser(record);
}
