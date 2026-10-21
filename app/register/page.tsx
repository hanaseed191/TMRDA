'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MockDataStore } from '@/lib/supabase/mockStore';
import thaiLocations from '@/lib/thaiLocationData.json';

interface ProvinceData {
  id: number;
  name_th: string;
  districts: {
    id: number;
    name_th: string;
    subdistricts: {
      id: number;
      name_th: string;
      zip_code: string;
    }[];
  }[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const locationData = thaiLocations as ProvinceData[];

  // Cascading Address Selection State
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>(locationData[0]?.id || 1);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(locationData[0]?.districts[0]?.id || 1001);
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number>(
    locationData[0]?.districts[0]?.subdistricts[0]?.id || 100101
  );

  // Form State
  const [formData, setFormData] = useState({
    title_th: 'นาย',
    first_name_th: '',
    last_name_th: '',
    title_en: 'Mr.',
    first_name_en: '',
    last_name_en: '',
    th_human_number: '',
    nationality_name: 'ไทย',
    birth_day: '2000-01-01',
    physical_id: 1,
    sex_name: 'ชาย',
    phone_number: '',
    email: '',
    house_number: '',
    house_group: '',
    road_name: '',
    alley_name: '',
    province_name: locationData[0]?.name_th || 'กรุงเทพมหานคร',
    district_name: locationData[0]?.districts[0]?.name_th || 'เขตพระนคร',
    subdistrict_name: locationData[0]?.districts[0]?.subdistricts[0]?.name_th || 'พระบรมมหาราชวัง',
    zip_code: locationData[0]?.districts[0]?.subdistricts[0]?.zip_code || '10200',
    heq_name: 'ปริญญาตรี',
    branch_name: '',
    file_name: '',
  });

  const availableDistricts = locationData.find((p) => p.id === Number(selectedProvinceId))?.districts || [];
  const availableSubdistricts =
    availableDistricts.find((d) => d.id === Number(selectedDistrictId))?.subdistricts || [];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = Number(e.target.value);
    const prov = locationData.find((p) => p.id === provId);
    if (!prov) return;

    const firstDist = prov.districts[0];
    const firstSub = firstDist?.subdistricts[0];

    setSelectedProvinceId(provId);
    setSelectedDistrictId(firstDist?.id || 0);
    setSelectedSubdistrictId(firstSub?.id || 0);

    setFormData((prev) => ({
      ...prev,
      province_name: prov.name_th,
      district_name: firstDist?.name_th || '',
      subdistrict_name: firstSub?.name_th || '',
      zip_code: firstSub?.zip_code || '',
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = Number(e.target.value);
    const dist = availableDistricts.find((d) => d.id === distId);
    if (!dist) return;

    const firstSub = dist.subdistricts[0];

    setSelectedDistrictId(distId);
    setSelectedSubdistrictId(firstSub?.id || 0);

    setFormData((prev) => ({
      ...prev,
      district_name: dist.name_th,
      subdistrict_name: firstSub?.name_th || '',
      zip_code: firstSub?.zip_code || '',
    }));
  };

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = Number(e.target.value);
    const sub = availableSubdistricts.find((s) => s.id === subId);
    if (!sub) return;

    setSelectedSubdistrictId(subId);

    setFormData((prev) => ({
      ...prev,
      subdistrict_name: sub.name_th,
      zip_code: sub.zip_code || '',
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, file_name: file.name });
      toast.success(`เลือกไฟล์ ${file.name} เรียบร้อยแล้ว`);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.first_name_th || !formData.last_name_th || !formData.th_human_number) {
        toast.error('กรุณากรอกชื่อ-นามสกุล และเลขบัตรประชาชนให้ครบถ้วน');
        return;
      }
      if (formData.th_human_number.length !== 13) {
        toast.error('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.phone_number || !formData.email) {
        toast.error('กรุณากรอกเบอร์โทรศัพท์และอีเมล');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.house_number) {
        toast.error('กรุณากรอกบ้านเลขที่');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleCompleteRegistration();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      const createdUser = await MockDataStore.addUser({
        th_human_number: formData.th_human_number,
        first_name_th: formData.first_name_th,
        last_name_th: formData.last_name_th,
        first_name_en: formData.first_name_en,
        last_name_en: formData.last_name_en,
        title_th: formData.title_th,
        title_en: formData.title_en,
        phone_number: formData.phone_number,
        email: formData.email,
        house_number: formData.house_number,
        road_name: formData.road_name,
        alley_name: formData.alley_name,
        branch_name: formData.branch_name,
        is_admin: 0,
      });

      MockDataStore.setCurrentUser(createdUser);
      toast.success('ลงทะเบียนและสร้างบัญชีผู้ใช้สำเร็จ!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      {/* Header */}
      <header className="flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-2xl font-bold tracking-tight text-zinc-950 flex items-center gap-2">
            <span className="bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-sm">
              <i className="fa-solid fa-shield-halved" />
            </span>
            TMRDA
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-zinc-950 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-red-600 transition-all shadow-sm"
          >
            <i className="fa-solid fa-right-to-bracket mr-1.5" />
            เข้าสู่ระบบ
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-3xl mx-auto w-full flex-1">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-950 mb-1.5">ลงทะเบียนสมาชิก TMRDA</h1>
          <p className="text-xs text-zinc-500 font-medium">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งานระบบบริหารจัดการการฝึกอบรม
          </p>
        </div>

        {/* Stepper Container (Shadcn style) */}
        <div className="relative flex justify-between mb-10 px-4">
          <div className="absolute top-5 left-8 right-8 h-[2px] bg-zinc-200 -z-0">
            <div
              className="h-full bg-red-600 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>

          {[
            { num: 1, label: 'ข้อมูลทั่วไป', icon: 'fa-user' },
            { num: 2, label: 'ติดต่อ', icon: 'fa-phone' },
            { num: 3, label: 'ที่อยู่', icon: 'fa-location-dot' },
            { num: 4, label: 'การศึกษา', icon: 'fa-graduation-cap' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-2 z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm ${
                  currentStep > s.num
                    ? 'bg-zinc-950 text-white'
                    : currentStep === s.num
                    ? 'bg-red-600 text-white ring-4 ring-red-600/20'
                    : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {currentStep > s.num ? <i className="fa-solid fa-check text-xs" /> : <i className={`fa-solid ${s.icon} text-xs`} />}
              </div>
              <span className={`text-xs font-bold ${currentStep === s.num ? 'text-red-600' : 'text-zinc-600'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Box (Shadcn UI style) */}
        <div className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm space-y-6">
          {/* Section 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-user text-red-600 text-sm" />
                #1 ข้อมูลส่วนตัวพื้นฐาน
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">คำนำหน้า (TH) <span className="text-red-600">*</span></label>
                  <select
                    name="title_th"
                    value={formData.title_th}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">ชื่อ (TH) <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="first_name_th"
                    value={formData.first_name_th}
                    onChange={handleChange}
                    placeholder="สมชาย"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">นามสกุล (TH) <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="last_name_th"
                    value={formData.last_name_th}
                    onChange={handleChange}
                    placeholder="ใจดี"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">Title (EN) <span className="text-red-600">*</span></label>
                  <select
                    name="title_en"
                    value={formData.title_en}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">First Name (EN)</label>
                  <input
                    type="text"
                    name="first_name_en"
                    value={formData.first_name_en}
                    onChange={handleChange}
                    placeholder="Somchai"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">Last Name (EN)</label>
                  <input
                    type="text"
                    name="last_name_en"
                    value={formData.last_name_en}
                    onChange={handleChange}
                    placeholder="Jaidee"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">เลขบัตรประชาชน <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="th_human_number"
                    maxLength={13}
                    value={formData.th_human_number}
                    onChange={handleChange}
                    placeholder="1749900112233"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">สัญชาติ <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="nationality_name"
                    value={formData.nationality_name}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs bg-zinc-50 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">วัน/เดือน/ปี เกิด <span className="text-red-600">*</span></label>
                  <input
                    type="date"
                    name="birth_day"
                    value={formData.birth_day}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">สภาพร่างกาย <span className="text-red-600">*</span></label>
                  <select
                    name="physical_id"
                    value={formData.physical_id}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value={1}>ปกติ</option>
                    <option value={2}>ผู้พิการ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">เพศ <span className="text-red-600">*</span></label>
                  <select
                    name="sex_name"
                    value={formData.sex_name}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-phone text-red-600 text-sm" />
                #2 ข้อมูลการติดต่อ
              </h2>
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">เบอร์โทรศัพท์ติดต่อ <span className="text-red-600">*</span></label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="0627157551"
                  className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">อีเมล <span className="text-red-600">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="somchai@example.com"
                  className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  required
                />
              </div>
            </div>
          )}

          {/* Section 3 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-location-dot text-red-600 text-sm" />
                #3 ที่อยู่ตามทะเบียนบ้าน (ข้อมูล 77 จังหวัดทั่วไทย)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">บ้านเลขที่ <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    placeholder="99/9"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">หมู่ที่</label>
                  <input
                    type="text"
                    name="house_group"
                    value={formData.house_group}
                    onChange={handleChange}
                    placeholder="1"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">ถนน</label>
                  <input
                    type="text"
                    name="road_name"
                    value={formData.road_name}
                    onChange={handleChange}
                    placeholder="พหลโยธิน"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">ซอย</label>
                  <input
                    type="text"
                    name="alley_name"
                    value={formData.alley_name}
                    onChange={handleChange}
                    placeholder="พหลโยธิน 5"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Cascading Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">จังหวัด <span className="text-red-600">*</span></label>
                  <select
                    value={selectedProvinceId}
                    onChange={handleProvinceChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    {locationData.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_th}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">เขต/อำเภอ <span className="text-red-600">*</span></label>
                  <select
                    value={selectedDistrictId}
                    onChange={handleDistrictChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name_th}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">แขวง/ตำบล <span className="text-red-600">*</span></label>
                  <select
                    value={selectedSubdistrictId}
                    onChange={handleSubdistrictChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    {availableSubdistricts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_th}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">รหัสไปรษณีย์ (เติมให้อัตโนมัติ)</label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  readOnly
                  className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs bg-zinc-100 font-bold text-red-600"
                />
              </div>
            </div>
          )}

          {/* Section 4 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <i className="fa-solid fa-graduation-cap text-red-600 text-sm" />
                #4 ประวัติการศึกษาและหลักฐาน
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">วุฒิการศึกษาสูงสุด <span className="text-red-600">*</span></label>
                  <select
                    name="heq_name"
                    value={formData.heq_name}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="ประถมศึกษา">ประถมศึกษา</option>
                    <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น</option>
                    <option value="มัธยมศึกษาตอนปลาย / ปวช.">มัธยมศึกษาตอนปลาย / ปวช.</option>
                    <option value="อนุปริญญา / ปวส.">อนุปริญญา / ปวส.</option>
                    <option value="ปริญญาตรี">ปริญญาตรี</option>
                    <option value="ปริญญาโท">ปริญญาโท</option>
                    <option value="ปริญญาเอก">ปริญญาเอก</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">สาขา/วิชาเอก <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    name="branch_name"
                    value={formData.branch_name}
                    onChange={handleChange}
                    placeholder="เช่น เทคโนโลยีสารสนเทศ"
                    className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="p-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50 flex flex-col items-center justify-center gap-2">
                <i className="fa-solid fa-file-arrow-up text-3xl text-zinc-400" />
                <p className="text-xs font-medium text-zinc-600">
                  {formData.file_name ? `ไฟล์ที่เลือก: ${formData.file_name}` : 'แนบไฟล์สำเนาวุฒิการศึกษา (.pdf, .jpg)'}
                </p>
                <label className="cursor-pointer text-red-600 font-bold text-xs hover:underline">
                  <span>เลือกไฟล์เพื่อแนบ...</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-4 border-t border-zinc-100">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 h-11 border border-zinc-300 rounded-md font-bold text-zinc-900 text-xs hover:bg-zinc-50 transition-all"
              >
                ย้อนกลับ
              </button>
            )}
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 h-11 bg-zinc-950 text-white rounded-md font-bold text-xs hover:bg-red-600 transition-all shadow-sm active:scale-98"
            >
              {currentStep === totalSteps ? 'ยืนยันลงทะเบียน' : 'ถัดไป'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-5 px-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500 font-medium">
          <p>© 2026 TMRDA ระบบบริหารจัดการการฝึกอบรม (Training Management System)</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-red-600 transition-colors">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-red-600 transition-colors">คู่มือการใช้งาน</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
