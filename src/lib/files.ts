export const MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024;

export function validateUploadFile(file: File): string | null {
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > MAX_UPLOAD_FILE_SIZE) return 'The selected file is larger than the 25 MB limit.';
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}. Please select the file again.`));
    reader.readAsDataURL(file);
  });
}
