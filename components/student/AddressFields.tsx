'use client';

import { useEffect, useMemo, useState } from 'react';
import { Field, Input, Select, Skeleton } from '@/components/ui';

interface Subdistrict {
  id: number;
  name_th: string;
  zip_code: string;
}
interface District {
  id: number;
  name_th: string;
  subdistricts: Subdistrict[];
}
interface Province {
  id: number;
  name_th: string;
  districts: District[];
}

let cache: Promise<Province[]> | null = null;

/** Thai provinces → districts → subdistricts (1.4 MB, fetched once and shared). */
export function loadThaiLocations(): Promise<Province[]> {
  if (!cache) {
    cache = fetch('/data/thai-locations.json')
      .then((r) => {
        if (!r.ok) throw new Error('โหลดข้อมูลจังหวัดไม่สำเร็จ');
        return r.json() as Promise<Province[]>;
      })
      .then((list) => [...list].sort((a, b) => a.name_th.localeCompare(b.name_th, 'th')))
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export interface AddressValue {
  house_number: string;
  house_group: string;
  road_name: string;
  alley_name: string;
  province_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

export const emptyAddress: AddressValue = {
  house_number: '',
  house_group: '',
  road_name: '',
  alley_name: '',
  province_name: '',
  district_name: '',
  subdistrict_name: '',
  zip_code: '',
};

export function AddressFields({
  value,
  onChange,
  errors = {},
}: {
  value: AddressValue;
  onChange: (patch: Partial<AddressValue>) => void;
  errors?: Partial<Record<keyof AddressValue, string>>;
}) {
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadThaiLocations()
      .then((p) => alive && setProvinces(p))
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const province = useMemo(() => provinces?.find((p) => p.name_th === value.province_name), [provinces, value.province_name]);
  const district = useMemo(() => province?.districts.find((d) => d.name_th === value.district_name), [province, value.district_name]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="บ้านเลขที่" required error={errors.house_number}>
          {(id) => (
            <Input id={id} value={value.house_number} invalid={!!errors.house_number} placeholder="99/9" onChange={(e) => onChange({ house_number: e.target.value })} />
          )}
        </Field>
        <Field label="หมู่ที่">
          {(id) => (
            <Input id={id} inputMode="numeric" value={value.house_group} placeholder="—" onChange={(e) => onChange({ house_group: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
          )}
        </Field>
        <Field label="ถนน" className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} value={value.road_name} placeholder="—" onChange={(e) => onChange({ road_name: e.target.value })} />}
        </Field>
        <Field label="ซอย" className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} value={value.alley_name} placeholder="—" onChange={(e) => onChange({ alley_name: e.target.value })} />}
        </Field>
      </div>

      {loadError ? (
        <p className="text-sm text-brand-600">{loadError}</p>
      ) : !provinces ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="จังหวัด" required error={errors.province_name}>
            {(id) => (
              <Select
                id={id}
                value={province ? value.province_name : ''}
                placeholder="เลือกจังหวัด"
                invalid={!!errors.province_name}
                onChange={(e) => onChange({ province_name: e.target.value, district_name: '', subdistrict_name: '', zip_code: '' })}
              >
                {provinces.map((p) => (
                  <option key={p.id} value={p.name_th}>
                    {p.name_th}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="เขต / อำเภอ" required error={errors.district_name}>
            {(id) => (
              <Select
                id={id}
                value={district ? value.district_name : ''}
                placeholder={province ? 'เลือกเขต / อำเภอ' : 'เลือกจังหวัดก่อน'}
                disabled={!province}
                invalid={!!errors.district_name}
                onChange={(e) => onChange({ district_name: e.target.value, subdistrict_name: '', zip_code: '' })}
              >
                {province?.districts.map((d) => (
                  <option key={d.id} value={d.name_th}>
                    {d.name_th}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="แขวง / ตำบล" required error={errors.subdistrict_name}>
            {(id) => (
              <Select
                id={id}
                value={district?.subdistricts.some((s) => s.name_th === value.subdistrict_name) ? value.subdistrict_name : ''}
                placeholder={district ? 'เลือกแขวง / ตำบล' : 'เลือกเขต / อำเภอก่อน'}
                disabled={!district}
                invalid={!!errors.subdistrict_name}
                onChange={(e) => {
                  const s = district?.subdistricts.find((x) => x.name_th === e.target.value);
                  onChange({ subdistrict_name: e.target.value, zip_code: s?.zip_code || '' });
                }}
              >
                {district?.subdistricts.map((s) => (
                  <option key={s.id} value={s.name_th}>
                    {s.name_th}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="รหัสไปรษณีย์" hint="เติมให้อัตโนมัติจากตำบลที่เลือก">
            {(id) => <Input id={id} value={value.zip_code} readOnly placeholder="—" className="bg-zinc-50 font-medium tabular" />}
          </Field>
        </div>
      )}
    </div>
  );
}
