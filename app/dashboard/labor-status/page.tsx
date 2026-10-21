'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { MockDataStore } from '@/lib/supabase/mockStore';
import { User, LaborHistory } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LaborStatusPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState<LaborHistory>({
    user_id: 0,
    is_have_job: 'ทำงาน',
    labor_status: 'ภาคเอกชน',
    labor_salary: '1 - 5,000 บาท',
    occupation: '',
    position: '',
    year_of_service: '1 ปี',
    agency_name: '',
    province_id: 1,
    phone_number: '',
    industrial_groups_working: 'การแปรรูปอาหาร',
    not_have_job_status: 'อยู่ระหว่างว่างงาน',
    known_source_of_training: 'โทรทัศน์',
    is_accept_publish: 'ยินยอมเปิดเผย',
    is_want_job: 'ไม่ต้องการ',
    is_want_job_inside: 'ไม่ต้องการ',
  });

  useEffect(() => {
    const loadData = async () => {
      const user = MockDataStore.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const existing = await MockDataStore.getLaborHistory(user.id);
        if (existing) {
          setFormData(existing);
        } else {
          setFormData((prev) => ({ ...prev, user_id: user.id, phone_number: user.phone_number }));
        }
      }
    };
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await MockDataStore.saveLaborHistory({
        ...formData,
        user_id: currentUser.id,
      });

      toast.success('อัปเดตประวัติสถานภาพแรงงานเรียบร้อยแล้ว');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-red-600"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex pt-16 min-h-[calc(100vh-64px)]">
        <Sidebar currentUser={currentUser} isOpen={sidebarOpen} />

        <main className="flex-1 md:ml-64 p-6 md:p-8 w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2">
              <i className="fa-solid fa-id-card-clip text-red-600 text-xl" />
              <span>อัพเดตประวัติสถานภาพแรงงาน</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              บันทึกและแก้ไขข้อมูลสถานภาพการทำงาน การประกอบอาชีพ และความประสงค์ด้านการจัดหางาน
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 p-8 rounded-2xl shadow-sm space-y-6 w-full">
            <div className="border-b border-zinc-100 pb-4">
              <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md mb-2">
                อัพเดตประวัติสถานภาพแรงงาน
              </span>
              <h2 className="text-base font-bold text-zinc-950">ข้อมูลสถานภาพปัจจุบัน</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">สถานภาพแรงงาน <span className="text-red-600">*</span></label>
                <select
                  name="is_have_job"
                  value={formData.is_have_job}
                  onChange={handleChange}
                  className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                >
                  <option value="ทำงาน">ทำงาน</option>
                  <option value="ไม่ทำงานหรือว่างงาน">ไม่ทำงานหรือว่างงาน</option>
                </select>
              </div>

              {formData.is_have_job === 'ทำงาน' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">งานที่ทำ <span className="text-red-600">*</span></label>
                  <select
                    name="labor_status"
                    value={formData.labor_status}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="ภาคเอกชน">ภาคเอกชน</option>
                    <option value="ภาครัฐ/รัฐวิสาหกิจ">ภาครัฐ / รัฐวิสาหกิจ</option>
                    <option value="ธุรกิจส่วนตัว/อิสระ">ธุรกิจส่วนตัว / อิสระ</option>
                    <option value="เกษตรกรรม">เกษตรกรรม</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">ผู้ไม่มีงานทำ <span className="text-red-600">*</span></label>
                  <select
                    name="not_have_job_status"
                    value={formData.not_have_job_status}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="อยู่ระหว่างว่างงาน">อยู่ระหว่างว่างงาน</option>
                    <option value="ผู้ถูกเลิกจ้าง">ผู้ถูกเลิกจ้าง</option>
                    <option value="นักเรียน/นักศึกษาจบใหม่">นักเรียน / นักศึกษาจบใหม่</option>
                  </select>
                </div>
              )}
            </div>

            {formData.is_have_job === 'ทำงาน' && (
              <div className="space-y-6 pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1.5">รายได้เฉลี่ยต่อเดือน</label>
                    <select
                      name="labor_salary"
                      value={formData.labor_salary}
                      onChange={handleChange}
                      className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                    >
                      <option value="1 - 5,000 บาท">1 - 5,000 บาท</option>
                      <option value="5,001 - 10,000 บาท">5,001 - 10,000 บาท</option>
                      <option value="10,001 - 15,000 บาท">10,001 - 15,000 บาท</option>
                      <option value="15,001 - 20,000 บาท">15,001 - 20,000 บาท</option>
                      <option value="20,000+ บาท">มากกว่า 20,000 บาท</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1.5">อาชีพ</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      placeholder="เช่น เจ้าหน้าที่วิเคราะห์ข้อมูล"
                      className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1.5">ตำแหน่ง</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      placeholder="เช่น Senior Data Analyst"
                      className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1.5">อายุงาน</label>
                    <input
                      type="text"
                      name="year_of_service"
                      value={formData.year_of_service}
                      onChange={handleChange}
                      placeholder="เช่น 2 ปี 6 เดือน"
                      className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1.5">ชื่อหน่วยงาน / บริษัท</label>
                    <input
                      type="text"
                      name="agency_name"
                      value={formData.agency_name}
                      onChange={handleChange}
                      placeholder="บริษัท เทคโนโลยี จำกัด"
                      className="w-full h-11 border border-zinc-300 rounded-md px-3.5 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-900 mb-1.5">กลุ่มอุตสาหกรรมที่ทำงาน</label>
                    <select
                      name="industrial_groups_working"
                      value={formData.industrial_groups_working}
                      onChange={handleChange}
                      className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                    >
                      <option value="การแปรรูปอาหาร">การแปรรูปอาหาร</option>
                      <option value="เทคโนโลยีสารสนเทศ">เทคโนโลยีสารสนเทศ (IT)</option>
                      <option value="อิเล็กทรอนิกส์">อิเล็กทรอนิกส์</option>
                      <option value="การขนส่งและโลจิสติกส์">การขนส่งและโลจิสติกส์</option>
                      <option value="การท่องเที่ยวและบริการ">การท่องเที่ยวและบริการ</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 pt-4 border-t border-zinc-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">แหล่งที่ทราบข่าวการฝึกอบรม</label>
                  <select
                    name="known_source_of_training"
                    value={formData.known_source_of_training}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="โทรทัศน์">โทรทัศน์</option>
                    <option value="สื่อโซเชียลมีเดีย / Facebook">สื่อโซเชียลมีเดีย / Facebook</option>
                    <option value="เว็บไซต์กรมพัฒนาฝีมือแรงงาน">เว็บไซต์กรมพัฒนาฝีมือแรงงาน</option>
                    <option value="เพื่อน / คนรู้จัก">เพื่อน / คนรู้จัก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-900 mb-1.5">ความประสงค์ให้จัดหางาน</label>
                  <select
                    name="is_want_job"
                    value={formData.is_want_job}
                    onChange={handleChange}
                    className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                  >
                    <option value="ไม่ต้องการ">ไม่ต้องการ</option>
                    <option value="ต้องการจัดหางานในประเทศ">ต้องการจัดหางานในประเทศ</option>
                    <option value="ต้องการจัดหางานต่างประเทศ">ต้องการจัดหางานต่างประเทศ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-900 mb-1.5">ข้าพเจ้ายินยอมเปิดเผยข้อมูลส่วนบุคคล</label>
                <p className="text-xs text-zinc-500 mb-2 font-medium">
                  ให้แก่หน่วยงานของรัฐและเอกชนเพื่อประโยชน์ในการจัดหางานและบริหารจัดการแรงงานต่อไป
                </p>
                <select
                  name="is_accept_publish"
                  value={formData.is_accept_publish}
                  onChange={handleChange}
                  className="w-full h-11 border border-zinc-300 rounded-md px-3 text-xs bg-white font-medium"
                >
                  <option value="ยินยอมเปิดเผย">ยินยอมเปิดเผย</option>
                  <option value="ไม่ยินยอมเปิดเผย">ไม่ยินยอมเปิดเผย</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-zinc-950 text-white rounded-md font-bold text-xs hover:bg-red-600 transition-all shadow-sm flex items-center gap-2 leading-none"
              >
                <i className="fa-solid fa-floppy-disk text-xs leading-none" />
                <span>อัพเดตสถานภาพแรงงาน</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
