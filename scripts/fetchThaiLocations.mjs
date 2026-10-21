import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/';

async function generateAllLocationData() {
  console.log('Downloading complete Thai Location Data from kongvut/thai-province-data...');

  const [resProv, resDist, resSubDist] = await Promise.all([
    fetch(BASE_URL + 'province.json'),
    fetch(BASE_URL + 'district.json'),
    fetch(BASE_URL + 'sub_district_with_district_and_province.json')
  ]);

  const provinces = await resProv.json();
  const districts = await resDist.json();
  const subdistricts = await resSubDist.json();

  console.log(`Successfully fetched:
  - Provinces: ${provinces.length}
  - Districts: ${districts.length}
  - Subdistricts: ${subdistricts.length}`);

  // Build clean hierarchical JSON structure
  const formattedData = provinces.map((p) => {
    const provDistricts = districts
      .filter((d) => d.province_id === p.id)
      .map((d) => {
        const distSubdistricts = subdistricts
          .filter((s) => s.district_id === d.id)
          .map((s) => ({
            id: s.id,
            name_th: s.name_th,
            name_en: s.name_en,
            zip_code: String(s.zip_code || ''),
          }));

        return {
          id: d.id,
          name_th: d.name_th,
          name_en: d.name_en,
          subdistricts: distSubdistricts,
        };
      });

    return {
      id: p.id,
      name_th: p.name_th,
      name_en: p.name_en,
      districts: provDistricts,
    };
  });

  const jsonPath = path.join(process.cwd(), 'public', 'data', 'thai-locations.json');
  fs.writeFileSync(jsonPath, JSON.stringify(formattedData, null, 2), 'utf-8');
  console.log(`Saved structured JSON to: ${jsonPath}`);

  // Build SQL script for Supabase database
  const sqlLines = [];
  sqlLines.push('-- Complete Thai Master Address Data (77 Provinces, 930 Districts, 7452 Subdistricts)');
  sqlLines.push('-- Downloaded from https://github.com/kongvut/thai-province-data');
  sqlLines.push('');
  sqlLines.push('TRUNCATE TABLE subdistricts, districts, provinces RESTART IDENTITY CASCADE;');
  sqlLines.push('');

  // 1. Insert Provinces
  sqlLines.push('-- Insert 77 Provinces');
  for (const p of provinces) {
    const nameTh = p.name_th.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO provinces (id, province_name) VALUES (${p.id}, '${nameTh}') ON CONFLICT (id) DO UPDATE SET province_name = EXCLUDED.province_name;`);
  }
  sqlLines.push('');

  // 2. Insert Districts
  sqlLines.push('-- Insert 930 Districts');
  for (const d of districts) {
    const nameTh = d.name_th.replace(/'/g, "''");
    sqlLines.push(`INSERT INTO districts (id, of_province_id, district_name) VALUES (${d.id}, ${d.province_id}, '${nameTh}') ON CONFLICT (id) DO UPDATE SET district_name = EXCLUDED.district_name;`);
  }
  sqlLines.push('');

  // 3. Insert Subdistricts
  sqlLines.push('-- Insert 7452 Subdistricts with Zip Codes');
  for (const s of subdistricts) {
    const nameTh = s.name_th.replace(/'/g, "''");
    const zip = String(s.zip_code || '10000');
    sqlLines.push(`INSERT INTO subdistricts (id, of_district_id, subdistrict_name, zip_code) VALUES (${s.id}, ${s.district_id}, '${nameTh}', '${zip}') ON CONFLICT (id) DO UPDATE SET subdistrict_name = EXCLUDED.subdistrict_name, zip_code = EXCLUDED.zip_code;`);
  }

  const sqlPath = path.join(process.cwd(), 'supabase', 'seed_thai_locations.sql');
  fs.writeFileSync(sqlPath, sqlLines.join('\n'), 'utf-8');
  console.log(`Saved SQL seed script to: ${sqlPath}`);
}

generateAllLocationData().catch((err) => {
  console.error('Error generating Thai location data:', err);
});
