import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson<T>(filename: string): T {
  const filePath = path.join(__dirname, filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as T;
}

async function main() {
  console.log('================================================================');
  console.log('  Bhu-Drishti PostgreSQL Database Seeding Pipeline');
  console.log('================================================================');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is missing.');
    console.error('Please configure DATABASE_URL in your .env or provide a valid PostgreSQL connection string.');
    process.exit(1);
  }

  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database successfully.');

    // 1. Load Seed Data from JSON
    const statesData = loadJson<any[]>('states.json');
    const districtsData = loadJson<any[]>('districts.json');
    const recordsData = loadJson<any[]>('records.json');
    const datasetsData = loadJson<any[]>('datasets.json');
    const dataSourcesData = loadJson<any[]>('datasources.json');
    const policiesData = loadJson<any[]>('policies.json');
    const researchData = loadJson<any[]>('research.json');
    const anomaliesData = loadJson<any[]>('anomalies.json');

    console.log(`📦 Loaded JSON Seed Files:`);
    console.log(`   - ${statesData.length} States`);
    console.log(`   - ${districtsData.length} Districts`);
    console.log(`   - ${recordsData.length} Land Use Records (2005-2025)`);
    console.log(`   - ${datasetsData.length} Datasets`);
    console.log(`   - ${dataSourcesData.length} Data Sources`);
    console.log(`   - ${policiesData.length} Policies`);
    console.log(`   - ${researchData.length} Research Papers`);
    console.log(`   - ${anomaliesData.length} Anomalies`);

    // 2. Seed States
    console.log('\n⏳ Seeding States...');
    for (const state of statesData) {
      await prisma.state.upsert({
        where: { state_code: state.state_code },
        update: {
          state_name: state.state_name,
          capital: state.capital,
          total_area_sqkm: Number(state.total_area_sqkm),
          region: state.region,
          center_lat: state.center_coords[0],
          center_lng: state.center_coords[1]
        },
        create: {
          state_code: state.state_code,
          state_name: state.state_name,
          capital: state.capital,
          total_area_sqkm: Number(state.total_area_sqkm),
          region: state.region,
          center_lat: state.center_coords[0],
          center_lng: state.center_coords[1]
        }
      });
    }
    console.log(`✅ Seeded ${statesData.length} States.`);

    // 3. Seed Districts
    console.log('\n⏳ Seeding Districts...');
    for (const dist of districtsData) {
      // Ensure state exists
      const stateExists = statesData.some(s => s.state_code === dist.state_code);
      if (!stateExists) continue;

      await prisma.district.upsert({
        where: { district_code: dist.district_code },
        update: {
          district_name: dist.district_name,
          state_code: dist.state_code,
          state_name: dist.state_name,
          total_area_sqkm: Number(dist.total_area_sqkm),
          center_lat: dist.center_coords[0],
          center_lng: dist.center_coords[1]
        },
        create: {
          district_code: dist.district_code,
          district_name: dist.district_name,
          state_code: dist.state_code,
          state_name: dist.state_name,
          total_area_sqkm: Number(dist.total_area_sqkm),
          center_lat: dist.center_coords[0],
          center_lng: dist.center_coords[1]
        }
      });
    }
    console.log(`✅ Seeded ${districtsData.length} Districts.`);

    // 4. Seed Land Use Records
    console.log('\n⏳ Seeding Land Use Records (2005-2025)...');
    let recordCount = 0;
    for (const rec of recordsData) {
      const stateExists = statesData.some(s => s.state_code === rec.state_code);
      if (!stateExists) continue;

      const distCode = rec.district_code && districtsData.some(d => d.district_code === rec.district_code)
        ? rec.district_code
        : null;

      await prisma.landUseRecord.upsert({
        where: { id: rec.id },
        update: {
          state_code: rec.state_code,
          state_name: rec.state_name,
          district_code: distCode,
          district_name: rec.district_name || null,
          year: Number(rec.year),
          total_area_ha: Number(rec.total_area_ha || 0),
          agricultural_area_ha: Number(rec.agricultural_area_ha || 0),
          agricultural_pct: Number(rec.agricultural_pct || 0),
          forest_area_ha: Number(rec.forest_area_ha || 0),
          forest_pct: Number(rec.forest_pct || 0),
          builtup_area_ha: Number(rec.builtup_area_ha || 0),
          builtup_pct: Number(rec.builtup_pct || 0),
          waterbodies_area_ha: Number(rec.waterbodies_area_ha || 0),
          waterbodies_pct: Number(rec.waterbodies_pct || 0),
          barren_area_ha: Number(rec.barren_area_ha || 0),
          barren_pct: Number(rec.barren_pct || 0),
          other_area_ha: Number(rec.other_area_ha || 0),
          other_pct: Number(rec.other_pct || 0),
          irrigated_pct: Number(rec.irrigated_pct || 0),
          degraded_pct: Number(rec.degraded_pct || 0),
          source_id: rec.source_id || 'DS-DEFAULT',
          dataset_name: rec.dataset_name || 'MoA&FW Statistics',
          source_url: rec.source_url || 'https://desagri.gov.in',
          confidence_score: Number(rec.confidence_score || 95),
          is_demo: Boolean(rec.is_demo),
          notes: rec.notes || null
        },
        create: {
          id: rec.id,
          state_code: rec.state_code,
          state_name: rec.state_name,
          district_code: distCode,
          district_name: rec.district_name || null,
          year: Number(rec.year),
          total_area_ha: Number(rec.total_area_ha || 0),
          agricultural_area_ha: Number(rec.agricultural_area_ha || 0),
          agricultural_pct: Number(rec.agricultural_pct || 0),
          forest_area_ha: Number(rec.forest_area_ha || 0),
          forest_pct: Number(rec.forest_pct || 0),
          builtup_area_ha: Number(rec.builtup_area_ha || 0),
          builtup_pct: Number(rec.builtup_pct || 0),
          waterbodies_area_ha: Number(rec.waterbodies_area_ha || 0),
          waterbodies_pct: Number(rec.waterbodies_pct || 0),
          barren_area_ha: Number(rec.barren_area_ha || 0),
          barren_pct: Number(rec.barren_pct || 0),
          other_area_ha: Number(rec.other_area_ha || 0),
          other_pct: Number(rec.other_pct || 0),
          irrigated_pct: Number(rec.irrigated_pct || 0),
          degraded_pct: Number(rec.degraded_pct || 0),
          source_id: rec.source_id || 'DS-DEFAULT',
          dataset_name: rec.dataset_name || 'MoA&FW Statistics',
          source_url: rec.source_url || 'https://desagri.gov.in',
          confidence_score: Number(rec.confidence_score || 95),
          is_demo: Boolean(rec.is_demo),
          notes: rec.notes || null
        }
      });
      recordCount++;
    }
    console.log(`✅ Seeded ${recordCount} Land Use Records.`);

    // 5. Seed Datasets & DataSources
    console.log('\n⏳ Seeding Datasets and Data Sources...');
    for (const ds of datasetsData) {
      await prisma.dataset.upsert({
        where: { id: ds.id },
        update: {
          title: ds.title,
          publisher: ds.publisher,
          description: ds.description,
          category: ds.category,
          coverage: ds.coverage,
          date_range: ds.date_range,
          last_updated: ds.last_updated,
          format: ds.format,
          update_frequency: ds.update_frequency,
          source_url: ds.source_url,
          license: ds.license,
          data_quality: ds.data_quality,
          sample_rows: ds.sample_rows || []
        },
        create: {
          id: ds.id,
          title: ds.title,
          publisher: ds.publisher,
          description: ds.description,
          category: ds.category,
          coverage: ds.coverage,
          date_range: ds.date_range,
          last_updated: ds.last_updated,
          format: ds.format,
          update_frequency: ds.update_frequency,
          source_url: ds.source_url,
          license: ds.license,
          data_quality: ds.data_quality,
          sample_rows: ds.sample_rows || []
        }
      });
    }

    for (const src of dataSourcesData) {
      await prisma.dataSource.upsert({
        where: { id: src.id },
        update: {
          name: src.name,
          category: src.category,
          status: src.status,
          last_synced: src.last_synced,
          datasets_count: src.datasets_count,
          records_imported: src.records_imported,
          error_status: src.error_status || null,
          endpoint_url: src.endpoint_url,
          adapter_type: src.adapter_type
        },
        create: {
          id: src.id,
          name: src.name,
          category: src.category,
          status: src.status,
          last_synced: src.last_synced,
          datasets_count: src.datasets_count,
          records_imported: src.records_imported,
          error_status: src.error_status || null,
          endpoint_url: src.endpoint_url,
          adapter_type: src.adapter_type
        }
      });
    }

    // 6. Seed Policies & Anomalies
    console.log('\n⏳ Seeding Policies & Anomalies...');
    for (const pol of policiesData) {
      await prisma.policy.upsert({
        where: { id: pol.id },
        update: {
          name: pol.name,
          acronym: pol.acronym,
          ministry: pol.ministry,
          launch_year: pol.launch_year,
          description: pol.description,
          target_region: pol.target_region,
          objectives: pol.objectives,
          related_indicators: pol.related_indicators,
          documents_url: pol.documents_url,
          pre_period: pol.pre_period,
          post_period: pol.post_period,
          observed_impact_summary: pol.observed_impact_summary,
          methodology_note: pol.methodology_note,
          linked_dataset_ids: pol.linked_dataset_ids
        },
        create: {
          id: pol.id,
          name: pol.name,
          acronym: pol.acronym,
          ministry: pol.ministry,
          launch_year: pol.launch_year,
          description: pol.description,
          target_region: pol.target_region,
          objectives: pol.objectives,
          related_indicators: pol.related_indicators,
          documents_url: pol.documents_url,
          pre_period: pol.pre_period,
          post_period: pol.post_period,
          observed_impact_summary: pol.observed_impact_summary,
          methodology_note: pol.methodology_note,
          linked_dataset_ids: pol.linked_dataset_ids
        }
      });
    }

    for (const anom of anomaliesData) {
      await prisma.anomaly.upsert({
        where: { id: anom.id },
        update: {
          district_code: anom.district_code,
          district_name: anom.district_name,
          state_code: anom.state_code,
          year: anom.year,
          anomaly_type: anom.anomaly_type,
          severity: anom.severity,
          description: anom.description,
          detected_value: anom.detected_value,
          expected_value: anom.expected_value,
          confidence_score: anom.confidence_score,
          recommended_action: anom.recommended_action
        },
        create: {
          id: anom.id,
          district_code: anom.district_code,
          district_name: anom.district_name,
          state_code: anom.state_code,
          year: anom.year,
          anomaly_type: anom.anomaly_type,
          severity: anom.severity,
          description: anom.description,
          detected_value: anom.detected_value,
          expected_value: anom.expected_value,
          confidence_score: anom.confidence_score,
          recommended_action: anom.recommended_action
        }
      });
    }

    console.log('\n🎉 ================================================================');
    console.log('   PostgreSQL Database Successfully Seeded and Ready!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
