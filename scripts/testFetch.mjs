async function inspectData() {
  const base = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/';
  const r1 = await fetch(base + 'province.json');
  const r2 = await fetch(base + 'district.json');
  const r3 = await fetch(base + 'sub_district_with_district_and_province.json');

  const prov = await r1.json();
  const dist = await r2.json();
  const subdist = await r3.json();

  console.log('Provinces count:', prov.length, 'sample:', prov[0]);
  console.log('Districts count:', dist.length, 'sample:', dist[0]);
  console.log('Subdistricts count:', subdist.length, 'sample:', subdist[0]);
}

inspectData();
