'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { MockDataStore } from '@/lib/supabase/mockStore';
import { User, TrainingApplication, LaborHistory } from '@/lib/types';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [laborHistory, setLaborHistory] = useState<LaborHistory | null>(null);
  const [applications, setApplications] = useState<TrainingApplication[]>([]);
  const [selectedAppForPrint, setSelectedAppForPrint] = useState<TrainingApplication | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Profile Edit Form State (Directly editable on page)
  const [userForm, setUserForm] = useState({
    title_th: 'นาย',
    first_name_th: '',
    last_name_th: '',
    title_en: 'Mr.',
    first_name_en: '',
    last_name_en: '',
    sex_name: 'ชาย',
    nationality_name: 'ไทย',
    th_human_number: '',
    phone_number: '',
    email: '',
    birth_day: '2000-01-01',
    house_number: '',
    road_name: '',
    subdistrict_name: '',
    district_name: '',
    province_name: '',
    education_level: 'ปริญญาตรี',
    branch_name: '',
  });

  // Labor History Form State (Directly editable on page)
  const [laborForm, setLaborForm] = useState<LaborHistory>({
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
    not_have_job_status: 'อยู่ระหว่างหางาน',
    known_source_of_training: 'โทรทัศน์',
    is_accept_publish: 'ยินยอมเปิดเผย',
    is_want_job: 'ไม่ต้องการ',
    is_want_job_inside: 'ไม่ต้องการ',
    accept_job_position: '',
    accept_job_in_country_name: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = MockDataStore.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      // 1. Applications
      const apps = await MockDataStore.getApplications();
      const userApps = apps.filter((a) => a.user_id === user.id);
      setApplications(userApps);
      if (userApps.length > 0) {
        setSelectedAppForPrint(userApps[0]);
      }

      // 2. Labor history
      try {
        const history = await MockDataStore.getLaborHistory(user.id);
        if (history) {
          setLaborHistory(history);
          setLaborForm(history);
        } else {
          setLaborForm((prev) => ({ ...prev, user_id: user.id, phone_number: user.phone_number }));
        }
      } catch (err) {
        console.error('Failed to load labor history:', err);
      }

      // 3. User Form State
      setUserForm({
        title_th: user.title_th || 'นาย',
        first_name_th: user.first_name_th || '',
        last_name_th: user.last_name_th || '',
        title_en: user.title_en || 'Mr.',
        first_name_en: user.first_name_en || '',
        last_name_en: user.last_name_en || '',
        sex_name: user.sex_name || 'ชาย',
        nationality_name: user.nationality_name || 'ไทย',
        th_human_number: user.th_human_number || '',
        phone_number: user.phone_number || '',
        email: user.email || '',
        birth_day: user.birth_day || '2000-01-01',
        house_number: user.house_number || '99/9',
        road_name: user.road_name || 'พหลโยธิน',
        subdistrict_name: user.subdistrict_name || 'ดุสิต',
        district_name: user.district_name || 'ดุสิต',
        province_name: user.province_name || 'กรุงเทพมหานคร',
        education_level: user.education_level || 'ปริญญาตรี',
        branch_name: user.branch_name || 'เทคโนโลยีสารสนเทศ',
      });
    }
  };

  const handleFileUpload = async (
    field: 'identification_file_pathname' | 'eq_file_pathname' | 'id_photo_file_pathname',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    try {
      setUploadingField(field);
      toast.loading('กำลังอัปโหลดไฟล์...', { id: 'upload-doc' });

      const fileUrl = await MockDataStore.uploadUserDocument(currentUser.id, field, file);
      const dbVal = fileUrl.startsWith('data:') ? `local_storage_file_for_${field}` : fileUrl;

      const updatedUser = await MockDataStore.updateUser(currentUser.id, { [field]: dbVal });
      setCurrentUser(updatedUser);

      toast.success('อัปโหลดไฟล์เอกสารเรียบร้อยแล้ว!', { id: 'upload-doc' });
    } catch (error: any) {
      console.error('Upload document error:', error);
      toast.error('อัปโหลดล้มเหลว: ' + error.message, { id: 'upload-doc' });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSaveAllDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      toast.loading('กำลังบันทึกอัปเดตข้อมูลทั้งหมด...', { id: 'save-all' });
      
      // 1. Update user profile
      const updatedUser = await MockDataStore.updateUser(currentUser.id, userForm);
      setCurrentUser(updatedUser);

      // 2. Save labor history
      const updatedLabor = await MockDataStore.saveLaborHistory({
        ...laborForm,
        user_id: currentUser.id,
      });
      setLaborHistory(updatedLabor);

      toast.success('บันทึกอัปเดตข้อมูลโปรไฟล์และประวัติแรงงานเรียบร้อยแล้ว!', { id: 'save-all' });
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message, { id: 'save-all' });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <span className="loading loading-spinner loading-lg text-red-600"></span>
      </div>
    );
  }

  const userPhotoUrl = MockDataStore.getUserDocumentUrl(currentUser, 'id_photo_file_pathname');
  const isValidUserPhoto = userPhotoUrl && !userPhotoUrl.toLowerCase().includes('oppo') && (userPhotoUrl.startsWith('http') || userPhotoUrl.startsWith('data:'));

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex pt-16 min-h-[calc(100vh-64px)]">
        <Sidebar currentUser={currentUser} isOpen={sidebarOpen} />

        <main className="flex-1 md:ml-64 p-6 md:p-8 w-full space-y-6">
          
          {/* HEADER BANNER */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 shadow-2xs">
                {isValidUserPhoto ? (
                  <img src={userPhotoUrl!} alt="รูปประจำตัว" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 font-semibold text-lg">
                    {currentUser.first_name_th?.[0] || 'U'}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-md">
                    ผู้สมัครเข้าร่วมการอบรม TMRDA
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-zinc-950">
                  ยินดีต้อนรับคุณ {currentUser.first_name_th} {currentUser.last_name_th}
                </h1>
                <p className="text-xs text-zinc-600 font-normal mt-0.5">
                  เลขบัตรประชาชน: <strong className="font-semibold text-zinc-900">{currentUser.th_human_number}</strong> | อีเมล: <strong className="font-semibold text-zinc-900">{currentUser.email}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/courses"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-all shadow-2xs flex items-center gap-2"
              >
                <i className="fa-solid fa-graduation-cap" />
                <span>ค้นหาคอร์สฝึกอบรม</span>
              </Link>
            </div>
          </div>

          {/* QUICK STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center font-bold text-xl shrink-0">
                <i className="fa-solid fa-book-open" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">คอร์สที่สมัครไว้</p>
                <p className="text-xl font-bold text-zinc-950">{applications.length} คอร์ส</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
                <i className="fa-solid fa-hourglass-half" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">สถานะการพิจารณา</p>
                <p className="text-xl font-bold text-amber-600">รออนุมัติ</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">
                <i className="fa-solid fa-circle-check" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">สถานะบัญชี</p>
                <p className="text-xl font-bold text-emerald-600">ปกติ (ยืนยันแล้ว)</p>
              </div>
            </div>
          </div>

          {/* 📋 PERMANENT FULLY-OPEN EDITABLE CARDS (SECTIONS #1 TO #5 WITHOUT ACCORDION COLLAPSE) */}
          <form onSubmit={handleSaveAllDirect} className="space-y-6 w-full">
            
            {/* #1 GENERAL INFORMATION */}
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 w-full">
              <div className="border-b border-zinc-100 pb-4">
                <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md mb-2">
                  ข้อมูลทั่วไป (GENERAL INFORMATION)
                </span>
                <h2 className="text-base font-bold text-zinc-950">ข้อมูลส่วนบุคคลและบัตรประชาชน</h2>
              </div>

              <div className="space-y-6 text-xs font-medium">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">คำนำหน้า (ไทย)</label>
                    <select
                      value={userForm.title_th}
                      onChange={(e) => setUserForm({ ...userForm, title_th: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">ชื่อ (ไทย) <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={userForm.first_name_th}
                      onChange={(e) => setUserForm({ ...userForm, first_name_th: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">นามสกุล (ไทย) <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={userForm.last_name_th}
                      onChange={(e) => setUserForm({ ...userForm, last_name_th: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">Title (EN)</label>
                    <select
                      value={userForm.title_en}
                      onChange={(e) => setUserForm({ ...userForm, title_en: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Miss">Miss</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">First Name (EN)</label>
                    <input
                      type="text"
                      value={userForm.first_name_en}
                      onChange={(e) => setUserForm({ ...userForm, first_name_en: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">Last Name (EN)</label>
                    <input
                      type="text"
                      value={userForm.last_name_en}
                      onChange={(e) => setUserForm({ ...userForm, last_name_en: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">เพศ</label>
                    <select
                      value={userForm.sex_name}
                      onChange={(e) => setUserForm({ ...userForm, sex_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">สัญชาติ</label>
                    <input
                      type="text"
                      value={userForm.nationality_name}
                      onChange={(e) => setUserForm({ ...userForm, nationality_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">เลขบัตรประชาชน <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={userForm.th_human_number}
                      onChange={(e) => setUserForm({ ...userForm, th_human_number: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">เบอร์โทรศัพท์ <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={userForm.phone_number}
                      onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-900 mb-1.5">อีเมลติดต่อ <span className="text-red-600">*</span></label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>
            </div>

            {/* #2 ADDRESS INFORMATION */}
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 w-full">
              <div className="border-b border-zinc-100 pb-4">
                <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md mb-2">
                  ข้อมูลที่อยู่ (ADDRESS INFORMATION)
                </span>
                <h2 className="text-base font-bold text-zinc-950">ที่อยู่ตามทะเบียนบ้าน / บัตรประชาชน</h2>
              </div>

              <div className="space-y-6 text-xs font-medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">บ้านเลขที่ / หมู่</label>
                    <input
                      type="text"
                      value={userForm.house_number}
                      onChange={(e) => setUserForm({ ...userForm, house_number: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">ถนน</label>
                    <input
                      type="text"
                      value={userForm.road_name}
                      onChange={(e) => setUserForm({ ...userForm, road_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">แขวง / ตำบล</label>
                    <input
                      type="text"
                      value={userForm.subdistrict_name}
                      onChange={(e) => setUserForm({ ...userForm, subdistrict_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">เขต / อำเภอ</label>
                    <input
                      type="text"
                      value={userForm.district_name}
                      onChange={(e) => setUserForm({ ...userForm, district_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">จังหวัด</label>
                    <input
                      type="text"
                      value={userForm.province_name}
                      onChange={(e) => setUserForm({ ...userForm, province_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* #3 EDUCATION QUALIFICATION */}
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 w-full">
              <div className="border-b border-zinc-100 pb-4">
                <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md mb-2">
                  ข้อมูลการศึกษา (EDUCATION QUALIFICATION)
                </span>
                <h2 className="text-base font-bold text-zinc-950">วุฒิการศึกษาและสาขาวิชา</h2>
              </div>

              <div className="space-y-6 text-xs font-medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">วุฒิการศึกษาสูงสุด <span className="text-red-600">*</span></label>
                    <select
                      value={userForm.education_level}
                      onChange={(e) => setUserForm({ ...userForm, education_level: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="ปริญญาเอก">ปริญญาเอก</option>
                      <option value="ปริญญาโท">ปริญญาโท</option>
                      <option value="ปริญญาตรี">ปริญญาตรี</option>
                      <option value="ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)</option>
                      <option value="ประกาศนียบัตรวิชาชีพ (ปวช.)">ประกาศนียบัตรวิชาชีพ (ปวช.)</option>
                      <option value="มัธยมศึกษาปีที่ 6">มัธยมศึกษาปีที่ 6</option>
                      <option value="มัธยมศึกษาปีที่ 3">มัธยมศึกษาปีที่ 3</option>
                      <option value="ประถมศึกษา">ประถมศึกษา</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">สาขาวิชา / คณะ <span className="text-red-600">*</span></label>
                    <input
                      type="text"
                      required
                      value={userForm.branch_name}
                      onChange={(e) => setUserForm({ ...userForm, branch_name: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                      placeholder="เทคโนโลยีสารสนเทศ"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* #4 ATTACHED DOCUMENTS */}
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 w-full">
              <div className="border-b border-zinc-100 pb-4">
                <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md mb-2">
                  เอกสารแนบประกอบการสมัคร (ATTACHED DOCUMENTS)
                </span>
                <h2 className="text-base font-bold text-zinc-950">สำเนาเอกสารและรูปถ่ายประจำตัว</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { field: 'identification_file_pathname' as const, label: 'สำเนาบัตรประชาชน', isPdf: true },
                  { field: 'eq_file_pathname' as const, label: 'สำเนาวุฒิการศึกษา', isPdf: true },
                  { field: 'id_photo_file_pathname' as const, label: 'รูปถ่าย 1.5 นิ้ว', isPdf: false },
                ].map(({ field, label, isPdf }) => {
                  const docUrl = MockDataStore.getUserDocumentUrl(currentUser, field);
                  const hasFile = !!docUrl;

                  return (
                    <div key={field} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 flex flex-col justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${hasFile ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-200 text-zinc-500'}`}>
                          <i className={`fa-solid ${isPdf ? 'fa-file-pdf text-red-600' : 'fa-file-image text-blue-600'} text-xl`} />
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950 text-xs">{label}</p>
                          <span className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${hasFile ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {hasFile ? <><i className="fa-solid fa-circle-check" />แนบเรียบร้อย</> : <><i className="fa-solid fa-circle-exclamation" />ยังไม่ได้แนบ</>}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="file"
                          id={`file-input-${field}`}
                          className="hidden"
                          accept={isPdf ? 'application/pdf, image/*' : 'image/*'}
                          onChange={(e) => handleFileUpload(field, e)}
                        />
                        {hasFile ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ url: docUrl, label })}
                              className="flex-1 py-2 bg-white border border-zinc-300 hover:border-zinc-400 font-semibold rounded-lg text-xs text-zinc-800 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                              <i className="fa-solid fa-eye" />
                              <span>เปิดดูไฟล์</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-input-${field}`)?.click()}
                              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 font-semibold rounded-lg text-xs text-zinc-700 cursor-pointer"
                            >
                              เปลี่ยน
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => document.getElementById(`file-input-${field}`)?.click()}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <i className="fa-solid fa-arrow-up-from-bracket" />
                            <span>อัปโหลดไฟล์</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 💼 #5 LABOR HISTORY INFORMATION */}
            <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 w-full">
              <div className="border-b border-zinc-100 pb-4">
                <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md mb-2">
                  อัพเดตประวัติสถานภาพแรงงาน
                </span>
                <h2 className="text-base font-bold text-zinc-950">ข้อมูลสถานภาพปัจจุบัน</h2>
              </div>

              <div className="space-y-6 text-xs font-medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                      สถานภาพแรงงาน <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="is_have_job"
                      value={laborForm.is_have_job}
                      onChange={(e) => setLaborForm({ ...laborForm, is_have_job: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="ทำงาน">ทำงาน</option>
                      <option value="ไม่ทำงานหรือว่างงาน">ไม่ทำงานหรือว่างงาน</option>
                    </select>
                  </div>

                  {laborForm.is_have_job === 'ทำงาน' ? (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                        งานที่ทำ <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="labor_status"
                        value={laborForm.labor_status}
                        onChange={(e) => setLaborForm({ ...laborForm, labor_status: e.target.value })}
                        className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                      >
                        <option value="ภาคเอกชน">ภาคเอกชน</option>
                        <option value="รัฐวิสาหกิจ">รัฐวิสาหกิจ</option>
                        <option value="ภาครัฐ">ภาครัฐ</option>
                        <option value="ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ">ประกอบธุรกิจส่วนตัว / อิสระ</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                        ผู้ไม่มีงานทำ <span className="text-red-600">*</span>
                      </label>
                      <select
                        name="not_have_job_status"
                        value={laborForm.not_have_job_status}
                        onChange={(e) => setLaborForm({ ...laborForm, not_have_job_status: e.target.value })}
                        className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                      >
                        <option value="อยู่ระหว่างหางาน">อยู่ระหว่างหางาน</option>
                        <option value="นักเรียน/นักศึกษา">นักเรียน/นักศึกษา</option>
                        <option value="ผู้ประกันตนที่ถูกเลิกจ้าง">ผู้ประกันตนที่ถูกเลิกจ้าง</option>
                      </select>
                    </div>
                  )}
                </div>

                {laborForm.is_have_job === 'ทำงาน' && (
                  <div className="space-y-6 pt-4 border-t border-zinc-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">รายได้เฉลี่ยต่อเดือน</label>
                        <select
                          name="labor_salary"
                          value={laborForm.labor_salary}
                          onChange={(e) => setLaborForm({ ...laborForm, labor_salary: e.target.value })}
                          className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        >
                          <option value="1 - 5,000 บาท">1 - 5,000 บาท</option>
                          <option value="5,001 – 9,000 บาท">5,001 – 9,000 บาท</option>
                          <option value="9,001 – 15,000 บาท">9,001 – 15,000 บาท</option>
                          <option value="15,001 – 20,000 บาท">15,001 – 20,000 บาท</option>
                          <option value="20,001 – 30,000 บาท">20,001 – 30,000 บาท</option>
                          <option value="30,001 – 40,000 บาท">30,001 – 40,000 บาท</option>
                          <option value="40,001 บาทขึ้นไป">40,001 บาทขึ้นไป</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">อาชีพ</label>
                        <input
                          type="text"
                          name="occupation"
                          value={laborForm.occupation}
                          onChange={(e) => setLaborForm({ ...laborForm, occupation: e.target.value })}
                          placeholder="เช่น เจ้าหน้าที่วิเคราะห์ข้อมูล / ช่างพ่นสี"
                          className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">ตำแหน่ง</label>
                        <input
                          type="text"
                          name="position"
                          value={laborForm.position}
                          onChange={(e) => setLaborForm({ ...laborForm, position: e.target.value })}
                          placeholder="เช่น Senior Data Analyst / พนักงานประจำ"
                          className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">อายุงาน</label>
                        <input
                          type="text"
                          name="year_of_service"
                          value={laborForm.year_of_service}
                          onChange={(e) => setLaborForm({ ...laborForm, year_of_service: e.target.value })}
                          placeholder="เช่น 1 ปี"
                          className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">ชื่อหน่วยงาน / บริษัท</label>
                        <input
                          type="text"
                          name="agency_name"
                          value={laborForm.agency_name}
                          onChange={(e) => setLaborForm({ ...laborForm, agency_name: e.target.value })}
                          placeholder="บริษัท เทคโนโลยี จำกัด"
                          className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs font-medium text-zinc-900 bg-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-900 mb-1.5">กลุ่มอุตสาหกรรมที่ทำงาน</label>
                        <select
                          name="industrial_groups_working"
                          value={laborForm.industrial_groups_working}
                          onChange={(e) => setLaborForm({ ...laborForm, industrial_groups_working: e.target.value })}
                          className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                        >
                          <option value="ยานยนต์สมัยใหม่">ยานยนต์สมัยใหม่</option>
                          <option value="การแปรรูปอาหาร">การแปรรูปอาหาร</option>
                          <option value="ดิจิตอล">ดิจิตอล (IT)</option>
                          <option value="ขนส่งและการบิน">ขนส่งและการบิน</option>
                          <option value="การแพทย์ครบวงจร">การแพทย์ครบวงจร</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6 pt-4 border-t border-zinc-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-900 mb-1.5">แหล่งที่ทราบข่าวการฝึกอบรม</label>
                      <select
                        name="known_source_of_training"
                        value={laborForm.known_source_of_training}
                        onChange={(e) => setLaborForm({ ...laborForm, known_source_of_training: e.target.value })}
                        className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                      >
                        <option value="สื่อออนไลน์">สื่อออนไลน์ / Facebook</option>
                        <option value="โทรทัศน์">โทรทัศน์</option>
                        <option value="วิทยุ">วิทยุ</option>
                        <option value="หนังสือพิมพ์">หนังสือพิมพ์</option>
                        <option value="เพื่อน / คนรู้จัก">เพื่อน / คนรู้จัก</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-900 mb-1.5">ความประสงค์ให้จัดหางาน</label>
                      <select
                        name="is_want_job"
                        value={laborForm.is_want_job}
                        onChange={(e) => setLaborForm({ ...laborForm, is_want_job: e.target.value })}
                        className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                      >
                        <option value="ไม่ต้องการ">ไม่ต้องการ</option>
                        <option value="ต้องการจัดหางานในประเทศ">ต้องการจัดหางานในประเทศ</option>
                        <option value="ต้องการจัดหางานในต่างประเทศ">ต้องการจัดหางานในต่างประเทศ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1">ข้าพเจ้ายินยอมเปิดเผยข้อมูลส่วนบุคคล</label>
                    <p className="text-xs text-zinc-500 mb-2 font-normal">
                      ให้แก่หน่วยงานของรัฐและเอกชนเพื่อประโยชน์ในการจัดหางานและบริหารจัดการแรงงานต่อไป
                    </p>
                    <select
                      name="is_accept_publish"
                      value={laborForm.is_accept_publish}
                      onChange={(e) => setLaborForm({ ...laborForm, is_accept_publish: e.target.value })}
                      className="w-full h-11 border border-zinc-300 rounded-lg px-3.5 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    >
                      <option value="ยินยอมเปิดเผย">ยินยอมเปิดเผย</option>
                      <option value="ไม่ยินยอมเปิดเผย">ไม่ยินยอมเปิดเผย</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN BOTTOM SAVE BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-zinc-950 hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-floppy-disk text-sm" />
                <span>บันทึกข้อมูล</span>
              </button>
            </div>
          </form>

        </main>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 shrink-0">
              <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <i className="fa-solid fa-file-invoice text-blue-600" />
                <span>แสดงเอกสาร: {previewDoc.label}</span>
              </h3>
              <button onClick={() => setPreviewDoc(null)} className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-200 mt-3 min-h-[300px]">
              {previewDoc.url.includes('application/pdf') || previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewDoc.url} className="w-full h-[55vh] border-0 rounded-lg bg-zinc-100" />
              ) : (
                <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-sm" />
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-200 mt-3 shrink-0">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2.5 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 text-xs shadow-2xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ A4 PRINT PREVIEW MODAL */}
      {isPrintModalOpen && currentUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-zinc-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                  <i className="fa-solid fa-print text-emerald-600" />
                  <span>ตัวอย่างใบสมัครทางการ A4 (Print Preview)</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  {selectedAppForPrint?.course?.course_name ? `คอร์สที่เลือกพิมพ์: ${selectedAppForPrint.course.course_name}` : 'พิมพ์ใบสมัครทางการ 1 หน้าถ้วน'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-print" />
                  <span>พิมพ์เอกสาร</span>
                </button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer">
                  <i className="fa-solid fa-xmark text-xl" />
                </button>
              </div>
            </div>

            <div className="py-4 overflow-y-auto flex-1 bg-zinc-100 p-3 rounded-xl mt-3 flex justify-center">
              <div 
                id="print-area" 
                className="bg-white w-[210mm] h-[297mm] max-h-[297mm] shadow-md border border-zinc-200 text-zinc-950 relative box-border select-none overflow-hidden"
                style={{
                  fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
                  fontSize: '10pt',
                  lineHeight: '1.15',
                  padding: '4mm 8mm',
                }}
              >
                {(() => {
                  const CB = ({ checked, label }: { checked: boolean; label: string }) => (
                    <span className="inline-flex items-center" style={{ gap: '3px', lineHeight: '1.15' }}>
                      <span className="inline-flex items-center justify-center border border-zinc-900 bg-white shrink-0" style={{ width: '10px', height: '10px', fontSize: '7.5pt', fontWeight: 700 }}>
                        {checked ? '✓' : '\u00A0'}
                      </span>
                      <span>{label}</span>
                    </span>
                  );

                  const Dot = ({ w, children, center }: { w?: string; children?: React.ReactNode; center?: boolean }) => (
                    <span className={`border-b border-dotted border-zinc-700 inline-block ${center ? 'text-center' : ''}`} style={{ minWidth: w || '45px', flex: w ? undefined : 1, paddingBottom: '0px', paddingLeft: '2px', paddingRight: '2px' }}>
                      {children || '\u00A0'}
                    </span>
                  );

                  const formatThaiDate = (dateStr?: string) => {
                    if (!dateStr || dateStr === '-') return '-';
                    try {
                      const cleanStr = dateStr.split('T')[0];
                      const parts = cleanStr.split('-');
                      if (parts.length === 3) {
                        const year = parseInt(parts[0], 10);
                        const month = parts[1];
                        const day = parts[2];
                        if (!isNaN(year)) {
                          const beYear = year < 2400 ? year + 543 : year;
                          return `${day}/${month}/${beYear}`;
                        }
                      }
                    } catch (e) {}
                    return dateStr;
                  };

                  const targetCourse = selectedAppForPrint?.course;
                  const courseNameStr = targetCourse?.course_name || 'ช่างพ่นสีรถยนต์';
                  const courseLevelStr = targetCourse?.level_name || '1';
                  const courseHoursStr = targetCourse?.traning_hours ? String(targetCourse.traning_hours) : '30';
                  const agencyNameStr = targetCourse?.agency_name || 'กรมพัฒนาฝีมือแรงงาน';

                  const photoUrl = MockDataStore.getUserDocumentUrl(currentUser, 'id_photo_file_pathname');
                  const isValidPhoto = photoUrl && !photoUrl.toLowerCase().includes('oppo') && (photoUrl.startsWith('http') || photoUrl.startsWith('data:'));

                  // Helper logic for labor history PDF checkboxes
                  const isHaveJob = Boolean(laborForm?.is_have_job?.includes('ทำงาน') && !laborForm?.is_have_job?.includes('ไม่ทำงาน'));
                  const isNotHaveJob = Boolean(laborForm?.is_have_job?.includes('ไม่ทำงาน') || laborForm?.is_have_job?.includes('ว่างงาน') || !isHaveJob);

                  const matchLaborStatus = (val: string): boolean => {
                    if (!laborForm?.labor_status) return false;
                    return laborForm.labor_status.toLowerCase().includes(val.toLowerCase());
                  };

                  const matchSalary = (val: string): boolean => {
                    if (!laborForm?.labor_salary) return false;
                    const dbClean = laborForm.labor_salary.replace(/[–—\-]/g, '-').replace(/\s+/g, '');
                    const valClean = val.replace(/[–—\-]/g, '-').replace(/\s+/g, '');
                    return dbClean.includes(valClean) || valClean.includes(dbClean);
                  };

                  const matchSource = (val: string): boolean => {
                    if (!laborForm?.known_source_of_training) return false;
                    return laborForm.known_source_of_training.toLowerCase().includes(val.toLowerCase());
                  };

                  const matchPublish = (val: string): boolean => {
                    if (!laborForm?.is_accept_publish) return false;
                    return laborForm.is_accept_publish.includes(val);
                  };

                  const matchWantJob = (val: string): boolean => {
                    if (!laborForm?.is_want_job) return false;
                    return laborForm.is_want_job.includes(val);
                  };

                  return (
                    <>
                      {/* Floating Photo Box Frame */}
                      <div 
                        className="absolute border border-zinc-900 flex flex-col items-center justify-center bg-zinc-100 overflow-hidden text-center select-none z-10" 
                        style={{ top: '4mm', right: '8mm', width: '2.3cm', height: '3.0cm' }}
                      >
                        {isValidPhoto ? (
                          <img src={photoUrl!} alt="รูปถ่าย" className="w-full h-full object-cover absolute inset-0" />
                        ) : (
                          <span className="text-zinc-700 font-medium" style={{ fontSize: '8pt', lineHeight: '1.15' }}>
                            ติดรูปถ่าย<br />1.5 นิ้ว
                          </span>
                        )}
                      </div>

                      {/* Header Logo & Title */}
                      <div className="flex items-center gap-3" style={{ paddingRight: '2.5cm', paddingTop: '2px' }}>
                        <img src="/logo.jpeg" alt="โลโก้" className="object-contain shrink-0" style={{ width: '75px', height: '75px' }}
                          onError={(e) => { e.currentTarget.src = 'https://iccvbxlfntrkqzdhgzqn.supabase.co/storage/v1/object/public/documents/dsd_logo.png'; }}
                        />
                        <div className="text-center flex-1" style={{ paddingTop: '2px' }}>
                          <p className="whitespace-nowrap" style={{ fontSize: '11.5pt', fontWeight: 700, lineHeight: '1.15' }}>
                            ใบสมัครเข้ารับการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1" style={{ marginTop: '3px', fontWeight: 700, paddingRight: '2.5cm' }}>
                        <span>กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน หน่วยงาน:</span>
                        <Dot>{agencyNameStr}</Dot>
                      </div>

                      {/* ข้าพเจ้ามีความประสงค์ */}
                      <div style={{ marginTop: '3px' }}>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingRight: '2.5cm' }}>
                          <span style={{ fontWeight: 700 }}>ข้าพเจ้ามีความประสงค์เข้ารับ</span>
                          <CB checked={false} label="การฝึกอบรมฝีมือแรงงาน" />
                          <CB checked={false} label="ฝึกเตรียมเข้าทำงาน" />
                          <CB checked={false} label="ฝึกยกระดับฝีมือแรงงาน" />
                          <CB checked={false} label="ฝึกอาชีพเสริม" />
                          <CB checked={false} label="ฝึกคนครัวบนเรือ" />
                        </div>
                        <div className="flex items-center gap-2" style={{ marginTop: '1px', paddingLeft: '130px' }}>
                          <span style={{ fontWeight: 700 }}>การทดสอบฝีมือแรงงาน</span>
                          <CB checked={true} label="ทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ" />
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
                          <span>หลักสูตร (ฝึกอบรม)</span>
                          <Dot>{courseNameStr}</Dot>
                          <span>จำนวนชั่วโมงฝึก</span>
                          <Dot w="40px" center>{courseHoursStr}</Dot>
                          <span>ชั่วโมง</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
                          <span>สาขา (ทดสอบ)</span>
                          <Dot>{courseNameStr}</Dot>
                          <span>ระดับ (ทดสอบ)</span>
                          <Dot w="45px" center>{courseLevelStr}</Dot>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
                          <span>ประเภทผู้สมัคร (ทดสอบ)</span>
                          <CB checked={false} label="ผู้รับการฝึกจาก กพร." />
                          <CB checked={false} label="จากสถานศึกษา" />
                          <CB checked={false} label="จากภาครัฐ" />
                          <CB checked={false} label="จากภาคเอกชน" />
                          <CB checked={true} label="บุคคลทั่วไป" />
                          <span>ระหว่างวันที่</span>
                          <Dot w="90px">{'\u00A0'}</Dot>
                        </div>
                      </div>

                      {/* Section 1 - ข้อมูลส่วนบุคคล */}
                      <div style={{ marginTop: '3px' }}>
                        <p style={{ fontSize: '10.5pt', fontWeight: 700 }}>1. ข้อมูลส่วนบุคคล</p>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>ชื่อ-สกุล ภาษาไทย (นาย/นาง/นางสาว)</span>
                          <Dot w="220px" center>{userForm.title_th}{userForm.first_name_th} {userForm.last_name_th}</Dot>
                          <span style={{ marginLeft: '10px' }}>เพศ</span>
                          <Dot w="50px" center>{userForm.sex_name || 'ชาย'}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>ชื่อ-สกุล ภาษาอังกฤษ</span>
                          <Dot w="300px">{userForm.title_en}{userForm.first_name_en} {userForm.last_name_en}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>เลขบัตรประชาชน</span>
                          <Dot w="95px" center>{userForm.th_human_number}</Dot>
                          <span>สัญชาติ</span>
                          <Dot w="35px" center>{userForm.nationality_name || 'ไทย'}</Dot>
                          <span>วัน/เดือน/ปีเกิด</span>
                          <Dot w="75px" center>{formatThaiDate(userForm.birth_day)}</Dot>
                          <span>โทรศัพท์</span>
                          <Dot w="80px" center>{userForm.phone_number || '-'}</Dot>
                          <span>อีเมล (ถ้ามี)</span>
                          <Dot w="120px" center>{userForm.email || '-'}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ตามบัตรประชาชน เลขที่</span>
                          <Dot w="50px" center>{userForm.house_number || '99/9'}</Dot>
                          <span>หมู่</span>
                          <Dot w="25px" center>-</Dot>
                          <span>ถนน</span>
                          <Dot w="110px" center>{userForm.road_name || 'พหลโยธิน'}</Dot>
                          <span>ซอย</span>
                          <Dot w="60px">{'\u00A0'}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>แขวง/ตำบล</span>
                          <Dot w="90px" center>{userForm.subdistrict_name || 'ดุสิต'}</Dot>
                          <span>เขต/อำเภอ</span>
                          <Dot w="90px" center>{userForm.district_name || 'ดุสิต'}</Dot>
                          <span>จังหวัด</span>
                          <Dot w="110px" center>{userForm.province_name || 'กรุงเทพมหานคร'}</Dot>
                          <span>รหัสไปรษณีย์</span>
                          <Dot w="45px" center>10300</Dot>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
                          <span>วุฒิการศึกษาสูงสุด</span>
                          <CB checked={userForm.education_level === 'ประถมศึกษา'} label="ประถมศึกษา" />
                          <CB checked={userForm.education_level === 'มัธยมศึกษาปีที่ 3'} label="มัธยมต้น" />
                          <CB checked={userForm.education_level === 'มัธยมศึกษาปีที่ 6'} label="มัธยมปลาย" />
                          <CB checked={userForm.education_level === 'อนุปริญญา'} label="อนุปริญญา" />
                          <CB checked={userForm.education_level === 'ประกาศนียบัตรวิชาชีพ (ปวช.)'} label="ปวช." />
                          <CB checked={userForm.education_level === 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)'} label="ปวส./ปวท." />
                          <CB checked={['ปริญญาตรี','ปริญญาโท','ปริญญาเอก'].includes(userForm.education_level||'')} label="ปริญญาตรีขึ้นไป" />
                          <CB checked={userForm.education_level === 'ไม่จบการศึกษา'} label="ไม่จบการศึกษา" />
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
                          <span>สาขา</span>
                          <Dot>{userForm.branch_name || 'คอมพิวเตอร์'}</Dot>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
                          <span>สภาพร่างกาย</span>
                          <CB checked={true} label="ปกติ" />
                          <CB checked={false} label="พิการ (" />
                          <CB checked={false} label="การเห็น" />
                          <CB checked={false} label="การได้ยินหรือสื่อความหมาย" />
                          <CB checked={false} label="การเคลื่อนไหวหรือทางร่างกาย" />
                          <CB checked={false} label="ทางจิตใจหรือพฤติกรรม" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '80px' }}>
                          <CB checked={false} label="ทางสติปัญญา" />
                          <CB checked={false} label="การเรียนรู้" />
                          <CB checked={false} label="ทางออทิสติก" />
                          <span>)</span>
                        </div>
                      </div>

                      {/* Section 2 - สถานภาพแรงงาน (DYNAMIC BINDING FROM USER PROFILE & LABOR HISTORY) */}
                      <div style={{ marginTop: '3px' }}>
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>2. สถานภาพแรงงาน</span>
                          <CB checked={isHaveJob} label="ทำงาน (กรอกข้อ 2.1)" />
                          <CB checked={isNotHaveJob} label="ไม่ทำงานหรือว่างงาน (กรอกข้อ 2.2)" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span style={{ fontWeight: 700 }}>2.1 ผู้มีงานทำ</span>
                          <CB checked={isHaveJob && matchLaborStatus('เอกชน')} label="ภาคเอกชน" />
                          <CB checked={isHaveJob && matchLaborStatus('รัฐวิสาหกิจ')} label="รัฐวิสาหกิจ" />
                          <CB checked={isHaveJob && matchLaborStatus('ภาครัฐ')} label="ภาครัฐ" />
                          <span>( ) ข้าราชการพลเรือน ( ) ข้าราชการตำรวจ ( ) ข้าราชการทหาร ( ) ข้าราชการครู</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '40px' }}>
                          <CB checked={isHaveJob && (matchLaborStatus('อิสระ') || matchLaborStatus('ส่วนตัว'))} label="ประกอบธุรกิจส่วนตัว/ประกอบอาชีพอิสระ" />
                          <span>( ) วิสาหกิจชุมชน ( ) เกษตรกร ( ) ผู้รับจ้างทั่วไปโดยไม่มีนายจ้าง (Freelance)</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span>รายได้เฉลี่ยต่อเดือน</span>
                          <CB checked={isHaveJob && matchSalary('1 - 5,000')} label="1 - 5,000 บาท" />
                          <CB checked={isHaveJob && matchSalary('5,001')} label="5,001 – 9,000 บาท" />
                          <CB checked={isHaveJob && matchSalary('9,001')} label="9,001 – 15,000 บาท" />
                          <CB checked={isHaveJob && matchSalary('15,001')} label="15,001 – 20,000 บาท" />
                          <CB checked={isHaveJob && matchSalary('20,001')} label="20,001 – 30,000 บาท" />
                          <CB checked={isHaveJob && matchSalary('30,001')} label="30,001 – 40,000 บาท" />
                          <CB checked={isHaveJob && matchSalary('40,001')} label="40,001 บาทขึ้นไป" />
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span>อาชีพ</span>
                          <Dot w="90px">{laborForm?.occupation || '-'}</Dot>
                          <span>ตำแหน่ง</span>
                          <Dot w="90px">{laborForm?.position || '-'}</Dot>
                          <span>อายุงาน</span>
                          <Dot w="35px" center>{laborForm?.year_of_service || '-'}</Dot>
                          <span>ปี</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span>สถานที่ทำงาน ชื่อหน่วยงาน</span>
                          <Dot>{laborForm?.agency_name || '-'}</Dot>
                          <span>จังหวัด</span>
                          <Dot w="80px" center>{userForm.province_name || 'กรุงเทพมหานคร'}</Dot>
                          <span>โทรศัพท์</span>
                          <Dot w="80px" center>{laborForm?.phone_number || '-'}</Dot>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span>กลุ่มอุตสาหกรรมที่ทำงาน</span>
                          <CB checked={isHaveJob && (laborForm?.industrial_groups_working?.includes('อาหาร') ?? false)} label="การแปรรูปอาหาร" />
                          <CB checked={isHaveJob && (laborForm?.industrial_groups_working?.includes('เกษตร') ?? false)} label="การเกษตรและเทคโนโลยีชีวภาพ" />
                          <CB checked={false} label="ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '15px' }}>
                          <CB checked={false} label="อิเล็กทรอนิกส์อัจฉริยะ" />
                          <CB checked={isHaveJob && (laborForm?.industrial_groups_working?.includes('ยานยนต์') ?? false)} label="ยานยนต์สมัยใหม่" />
                          <CB checked={isHaveJob && (laborForm?.industrial_groups_working?.includes('ดิจิตอล') ?? false)} label="ดิจิตอล" />
                          <CB checked={false} label="เชื้อเพลิง/เคมีชีวภาพ" />
                          <CB checked={isHaveJob && (laborForm?.industrial_groups_working?.includes('ขนส่ง') ?? false)} label="ขนส่งและการบิน" />
                          <CB checked={isHaveJob && (laborForm?.industrial_groups_working?.includes('แพทย์') ?? false)} label="การแพทย์ครบวงจร" />
                          <CB checked={false} label="หุ่นยนต์เพื่ออุตสาหกรรม" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span style={{ fontWeight: 700 }}>2.2 ผู้ไม่มีงานทำ</span>
                          <CB checked={isNotHaveJob && (laborForm?.not_have_job_status?.includes('หางาน') ?? false)} label="อยู่ระหว่างหางาน" />
                          <CB checked={isNotHaveJob && (laborForm?.not_have_job_status?.includes('นักศึกษา') ?? false)} label="นักเรียน/นักศึกษา" />
                          <CB checked={isNotHaveJob && (laborForm?.not_have_job_status?.includes('ถูกเลิกจ้าง') ?? false)} label="ผู้ประกันตนที่ถูกเลิกจ้าง" />
                          <CB checked={isNotHaveJob && (laborForm?.not_have_job_status?.includes('ผู้ต้องขัง') ?? false)} label="ผู้ต้องขัง" />
                          <CB checked={isNotHaveJob && (laborForm?.not_have_job_status?.includes('ทหาร') ?? false)} label="ทหารก่อนปลด" />
                          <span>อื่น ๆ ระบุ</span>
                          <Dot w="80px">{'\u00A0'}</Dot>
                        </div>
                      </div>

                      {/* Section 3 - แหล่งที่ทราบการฝึก */}
                      <div style={{ marginTop: '3px' }}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span style={{ fontSize: '10.5pt', fontWeight: 700 }}>3. แหล่งที่ทราบการฝึก</span>
                          <CB checked={matchSource('โทรทัศน์')} label="โทรทัศน์" />
                          <CB checked={matchSource('วิทยุ')} label="วิทยุ" />
                          <CB checked={matchSource('หนังสือพิมพ์')} label="หนังสือพิมพ์" />
                          <CB checked={matchSource('ออนไลน์') || matchSource('Facebook')} label="สื่อออนไลน์ของหนังสือพิมพ์ วิทยุ หรือ โทรทัศน์ ทั้งสื่อส่วนกลางและสื่อท้องถิ่น" />
                        </div>
                      </div>

                      {/* Section 4 - ความประสงค์หางาน */}
                      <div style={{ marginTop: '3px' }}>
                        <p style={{ fontWeight: 700 }}>4. ข้าพเจ้ายินยอมเปิดเผยข้อมูลส่วนบุคคล ให้กับหน่วยงานของรัฐและเอกชนทราบ เพื่อประโยชน์ในการจัดหางานและบริหารแรงงานต่อไป</p>
                        <div className="flex items-center gap-3" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <CB checked={matchPublish('ยินยอมเปิดเผย') && !matchPublish('ไม่ยินยอม')} label="ยินยอมเปิดเผย" />
                          <CB checked={matchPublish('ไม่ยินยอม')} label="ไม่ยินยอมเปิดเผย" />
                        </div>
                        <p style={{ marginTop: '1px', paddingLeft: '15px' }}>ท่านมีความประสงค์จะให้กรมการจัดหางาน หางานให้เมื่อผ่านการฝึกอบรมฝีมือแรงงาน/ทดสอบมาตรฐานฝีมือแรงงาน</p>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <CB checked={matchWantJob('ไม่ต้องการ')} label="ไม่ต้องการ" />
                          <span className="inline-flex items-center gap-1">
                            <CB checked={matchWantJob('ในประเทศ')} label="ต้องการจัดหางานในประเทศ ตำแหน่ง" />
                            <Dot w="60px" center>{laborForm?.accept_job_position || '-'}</Dot>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CB checked={matchWantJob('ในต่างประเทศ')} label="ต้องการจัดหางานในต่างประเทศ ประเทศ" />
                            <Dot w="60px" center>{laborForm?.accept_job_in_country_name || '-'}</Dot>
                          </span>
                        </div>
                      </div>

                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-2 border border-zinc-900" style={{ marginTop: '4px' }}>
                        <div className="border-r border-zinc-900 flex flex-col justify-between" style={{ padding: '3px 6px' }}>
                          <div>
                            <p style={{ fontWeight: 700 }}><u>(เฉพาะเจ้าหน้าที่)</u> ตรวจสอบข้อมูลข้างต้นจากฐานข้อมูลในระบบ</p>
                            <p>และหลักฐานตัวจริงเรียบร้อยแล้ว</p>
                          </div>
                          <div>
                            <p style={{ marginTop: '6px' }}>เจ้าหน้าที่รับสมัคร ............................................................</p>
                            <p style={{ marginTop: '1px' }}>วันที่รับสมัคร .............. / .............. / ..................</p>
                          </div>
                        </div>
                        <div className="text-center flex flex-col justify-between" style={{ padding: '3px 6px' }}>
                          <p style={{ fontWeight: 700 }}>ข้าพเจ้าขอรับรองว่าข้อความข้างต้นเป็นความจริงทุกประการ</p>
                          <div>
                            <p style={{ marginTop: '6px' }}>ลงชื่อ ........................................................................ ผู้สมัคร</p>
                            <p style={{ marginTop: '1px' }}>({userForm.title_th}{userForm.first_name_th} {userForm.last_name_th})</p>
                            <p style={{ marginTop: '1px' }}>วันที่ .............. / .............. / ..................</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-200 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-100 text-zinc-800 font-semibold rounded-lg hover:bg-zinc-200 text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
