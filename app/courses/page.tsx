'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { MockDataStore } from '@/lib/supabase/mockStore';
import { User, TrainingCourse, TrainingApplication, TestForm, LaborHistory } from '@/lib/types';
import { toast } from 'sonner';
import StudentExamModal from '@/components/StudentExamModal';

export default function CoursesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [laborHistory, setLaborHistory] = useState<LaborHistory | null>(null);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [applications, setApplications] = useState<TrainingApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'my_courses' | 'all_courses'>('my_courses');

  // Apply Modal State
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [applicantType, setApplicantType] = useState('ผู้ว่างงาน');
  const [isSkillTesting, setIsSkillTesting] = useState(false);

  // Student Exam Taking Modal State
  const [activeTestForm, setActiveTestForm] = useState<{ testForm: TestForm; courseName: string } | null>(null);

  // Print Preview Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedCourseForPrint, setSelectedCourseForPrint] = useState<TrainingCourse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const user = MockDataStore.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const history = await MockDataStore.getLaborHistory(user.id);
        setLaborHistory(history || null);
      }
      const [coursesData, appsData] = await Promise.all([
        MockDataStore.getCourses(),
        MockDataStore.getApplications(),
      ]);
      setCourses(coursesData);
      setApplications(appsData);
    };
    loadData();

    const onFocus = () => { loadData(); };
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); };
  }, []);

  const handleOpenModal = (course: TrainingCourse) => {
    setSelectedCourse(course);
  };

  const handleCloseModal = () => {
    setSelectedCourse(null);
  };

  const handleConfirmApply = async () => {
    if (!currentUser || !selectedCourse) return;
    try {
      await MockDataStore.applyCourse(currentUser.id, selectedCourse.id);
      toast.success(`สมัครคอร์ส "${selectedCourse.course_name}" สำเร็จแล้ว!`);
      const appsData = await MockDataStore.getApplications();
      setApplications(appsData);
      handleCloseModal();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleCancelApplication = async (course: TrainingCourse) => {
    if (!currentUser) return;
    const app = applications.find((a) => a.user_id === currentUser.id && a.training_id === course.id);
    if (!app) return;

    // Check if user has already taken exam
    const examTakenKey = `exam_result_${course.id}_${currentUser.id}`;
    const hasTakenExam = !!localStorage.getItem(examTakenKey) || (app as any).status === 'ผ่าน' || (app as any).status === 'ไม่ผ่าน';

    if (hasTakenExam) {
      toast.error('ไม่สามารถยกเลิกการสมัครได้ เนื่องจากคุณได้เข้าทำข้อสอบเรียบร้อยแล้ว');
      return;
    }

    if (window.confirm(`คุณต้องการยกเลิกการสมัครคอร์ส "${course.course_name}" ใช่หรือไม่?`)) {
      try {
        await MockDataStore.cancelApplication(app.id);
        toast.success(`ยกเลิกการสมัครคอร์ส "${course.course_name}" เรียบร้อยแล้ว`);
        const appsData = await MockDataStore.getApplications();
        setApplications(appsData);
      } catch (err: any) {
        toast.error('ยกเลิกการสมัครล้มเหลว: ' + err.message);
      }
    }
  };

  const isApplied = (courseId: number) => {
    return currentUser ? applications.some((a) => a.user_id === currentUser.id && a.training_id === courseId) : false;
  };

  const getExamScheduleStatus = (course: TrainingCourse) => {
    const today = new Date();
    const startDate = new Date(course.startswith_date);
    const endDate = new Date(course.endswith_date);
    endDate.setHours(23, 59, 59);

    if (today < startDate) {
      return { status: 'upcoming', label: 'ยังไม่ถึงกำหนดเวลาสอบ', color: 'bg-zinc-200 text-zinc-600 cursor-not-allowed' };
    } else if (today > endDate) {
      return { status: 'expired', label: 'หมดเวลาสอบแล้ว', color: 'bg-zinc-200 text-zinc-500 cursor-not-allowed' };
    } else {
      return { status: 'open', label: 'เข้าทำข้อสอบ', color: 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer' };
    }
  };

  const handleStartExam = async (course: TrainingCourse) => {
    const tests = await MockDataStore.getTestForms(course.id, 'theory');
    const activeTests = tests.filter(t => t.is_active);
    if (activeTests.length === 0) {
      toast.info('ยังไม่มีชุดข้อสอบที่เปิดใช้งานสำหรับคอร์สนี้');
      return;
    }

    const cacheKey = `active_test_form_id_${course.id}_${currentUser?.id || 0}`;
    const cachedId = localStorage.getItem(cacheKey);
    let selectedTest = activeTests.find(t => t.id === Number(cachedId));

    if (!selectedTest) {
      const randomIndex = Math.floor(Math.random() * activeTests.length);
      selectedTest = activeTests[randomIndex];
      localStorage.setItem(cacheKey, String(selectedTest.id));
    }

    setActiveTestForm({ testForm: selectedTest, courseName: course.course_name });
  };

  const handleOpenPrintModal = (course: TrainingCourse) => {
    setSelectedCourseForPrint(course);
    setIsPrintModalOpen(true);
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.branch_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myAppliedCourses = filteredCourses.filter((c) => isApplied(c.id));
  const availableCourses = filteredCourses.filter((c) => !isApplied(c.id));

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-red-600"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex pt-16 min-h-[calc(100vh-64px)]">
        <Sidebar currentUser={currentUser} isOpen={sidebarOpen} />

        <main className="flex-1 md:ml-64 p-6 md:p-8 w-full">
          {/* Page Title */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 w-full">
            <div>
              <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2">
                <i className="fa-solid fa-graduation-cap text-red-600 text-xl" />
                <span>รายการคอร์สฝึกอบรม TMRDA</span>
              </h1>
              <p className="text-sm text-zinc-600 font-medium mt-1">
                แยกหน้ารายการคอร์สที่ลงทะเบียนแล้ว และคอร์สที่เปิดรับสมัคร
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3.5 text-zinc-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อคอร์ส หรือสาขา..."
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-lg text-sm bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600 font-medium"
              />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-8 w-full">
            <div className="flex border-b border-zinc-200 bg-zinc-50 px-4">
              <button
                onClick={() => setActiveTab('my_courses')}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 leading-none ${
                  activeTab === 'my_courses'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <i className="fa-solid fa-circle-check text-emerald-600 text-sm" />
                <span>คอร์สเรียนของฉัน / สมัครแล้ว ({myAppliedCourses.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('all_courses')}
                className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 leading-none ${
                  activeTab === 'all_courses'
                    ? 'border-red-600 text-red-600 bg-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <i className="fa-solid fa-book-open text-sm" />
                <span>คอร์สทั้งหมดที่เปิดรับสมัคร ({availableCourses.length})</span>
              </button>
            </div>

            {/* TAB 1: MY ENROLLED COURSES TABLE */}
            {activeTab === 'my_courses' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-950 font-bold">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">ชื่อคอร์สที่สมัคร</th>
                      <th className="px-6 py-4">สถานที่อบรม</th>
                      <th className="px-6 py-4">จำนวนชั่วโมง</th>
                      <th className="px-6 py-4">แผนก / สาขา</th>
                      <th className="px-6 py-4">กำหนดวันสอบ (ระบุเวลา)</th>
                      <th className="px-6 py-4 text-center">การจัดการ / ใบสมัคร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {myAppliedCourses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-bold text-xs">
                          ยังไม่มีคอร์สเรียนที่สมัครไว้ สามารถสลับไปยังแท็บ "คอร์สทั้งหมดที่เปิดรับสมัคร" เพื่อกดสมัครได้
                        </td>
                      </tr>
                    ) : (
                      myAppliedCourses.map((course, idx) => {
                        const examSched = getExamScheduleStatus(course);
                        const app = applications.find((a) => a.user_id === currentUser.id && a.training_id === course.id);
                        const examTakenKey = `exam_result_${course.id}_${currentUser.id}`;
                        const hasTakenExam = !!localStorage.getItem(examTakenKey) || (app as any)?.status === 'ผ่าน' || (app as any)?.status === 'ไม่ผ่าน';

                        return (
                          <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-500">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-zinc-950 text-sm">{course.course_name}</div>
                              <div className="text-xs text-zinc-500 font-normal mt-0.5">{course.course_name_en || course.level_name}</div>
                            </td>
                            <td className="px-6 py-4 text-zinc-700 font-medium">{course.agency_name}</td>
                            <td className="px-6 py-4 font-bold text-zinc-950 text-sm">{course.traning_hours} ชม.</td>
                            <td className="px-6 py-4">
                              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-md">
                                {course.branch_name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-zinc-900 font-semibold">{course.between_date}</div>
                              <div className="text-xs text-zinc-500 font-normal mt-0.5">เวลา 08:30 - 16:30 น.</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                {/* 1. PRINT APPLICATION BUTTON */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintModal(course)}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                >
                                  <i className="fa-solid fa-print text-xs" />
                                  <span>พิมพ์ใบสมัคร (A4 PDF)</span>
                                </button>

                                {/* 2. START EXAM BUTTON */}
                                {examSched.status === 'open' ? (
                                  <button
                                    onClick={() => handleStartExam(course)}
                                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs shadow-2xs transition-all flex items-center gap-1.5 whitespace-nowrap ${examSched.color}`}
                                  >
                                    <i className="fa-solid fa-file-pen text-xs" />
                                    <span>{examSched.label}</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs whitespace-nowrap ${examSched.color}`}
                                  >
                                    {examSched.label}
                                  </button>
                                )}

                                {/* 3. CANCEL APPLICATION BUTTON */}
                                {hasTakenExam ? (
                                  <button
                                    type="button"
                                    disabled
                                    title="ไม่สามารถยกเลิกได้ เนื่องจากคุณได้เข้าทำข้อสอบไปแล้ว"
                                    className="px-3 py-2 bg-zinc-100 text-zinc-400 font-semibold rounded-lg text-xs border border-zinc-200 cursor-not-allowed whitespace-nowrap opacity-60 flex items-center gap-1.5"
                                  >
                                    <i className="fa-solid fa-ban text-xs" />
                                    <span>ยกเลิกการสมัคร (ทำข้อสอบแล้ว)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelApplication(course)}
                                    className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="fa-solid fa-trash-can text-xs" />
                                    <span>ยกเลิกการสมัคร</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: AVAILABLE COURSES TO APPLY TABLE */}
            {activeTab === 'all_courses' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-950 font-bold">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">ชื่อคอร์สที่เปิดรับสมัคร</th>
                      <th className="px-6 py-4">หน่วยงานที่จัด</th>
                      <th className="px-6 py-4">ชั่วโมง</th>
                      <th className="px-6 py-4">แผนก / สาขา</th>
                      <th className="px-6 py-4">ช่วงเวลาอบรม/สอบ</th>
                      <th className="px-6 py-4 text-center">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {availableCourses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-zinc-500 font-bold text-xs">
                          ไม่มีคอร์สเปิดรับสมัครเพิ่มเติม หรือคุณได้ลงทะเบียนครบทุกคอร์สแล้ว
                        </td>
                      </tr>
                    ) : (
                      availableCourses.map((course, idx) => (
                        <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-500">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-950 text-sm">{course.course_name}</div>
                            <div className="text-xs text-zinc-500 font-normal mt-0.5">{course.course_name_en || course.level_name}</div>
                          </td>
                          <td className="px-6 py-4 text-zinc-700 font-medium">{course.agency_name}</td>
                          <td className="px-6 py-4 font-bold text-zinc-950 text-sm">{course.traning_hours} ชม.</td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2.5 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-semibold rounded-md">
                              {course.branch_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-zinc-900 font-semibold">{course.between_date}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleOpenModal(course)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 mx-auto"
                            >
                              <i className="fa-solid fa-file-pen text-xs" />
                              <span>ลงทะเบียนสมัครคอร์สนี้</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* APPLY MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
              <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                <i className="fa-solid fa-file-pen text-red-600" />
                <span>ยืนยันการสมัครคอร์สฝึกอบรม</span>
              </h3>
              <button onClick={handleCloseModal} className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs font-medium">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <p className="text-xs text-zinc-500 font-normal">ชื่อคอร์สฝึกอบรม / ทดสอบ:</p>
                <p className="text-sm font-bold text-zinc-950">{selectedCourse.course_name}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  หน่วยงาน: <strong className="font-semibold text-zinc-900">{selectedCourse.agency_name}</strong> | ระยะเวลา: <strong className="font-semibold text-zinc-900">{selectedCourse.traning_hours} ชั่วโมง</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                  ประเภทผู้สมัคร <span className="text-red-600">*</span>
                </label>
                <select
                  value={applicantType}
                  onChange={(e) => setApplicantType(e.target.value)}
                  className="w-full h-10 border border-zinc-300 rounded-lg px-3 text-xs bg-white font-medium text-zinc-900 focus:outline-none focus:border-red-600"
                >
                  <option value="ผู้ว่างงาน">ผู้ว่างงาน</option>
                  <option value="แรงงานในระบบ">แรงงานในระบบ / พนักงานประจำ</option>
                  <option value="ผู้ประกอบการ">ผู้ประกอบการ / อาชีพอิสระ</option>
                  <option value="นักเรียน/นักศึกษา">นักเรียน / นักศึกษา</option>
                  <option value="ประชาชนทั่วไป">ประชาชนทั่วไป</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <input
                  type="checkbox"
                  id="skillTest"
                  checked={isSkillTesting}
                  onChange={(e) => setIsSkillTesting(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-zinc-300 focus:ring-red-500"
                />
                <label htmlFor="skillTest" className="text-xs font-medium cursor-pointer">
                  ต้องการเข้ารับการทดสอบมาตรฐานฝีมือแรงงานหลังจบการอบรม
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-2xs cursor-pointer"
              >
                ยืนยันสมัครเข้าร่วมอบรม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT EXAM TAKING MODAL */}
      {activeTestForm && (
        <StudentExamModal
          testForm={activeTestForm.testForm}
          courseName={activeTestForm.courseName}
          onClose={() => setActiveTestForm(null)}
          onSubmitted={async () => {
            setActiveTestForm(null);
            const appsData = await MockDataStore.getApplications();
            setApplications(appsData);
          }}
        />
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
                  {selectedCourseForPrint ? `คอร์สที่เลือกพิมพ์: ${selectedCourseForPrint.course_name}` : 'พิมพ์ใบสมัครทางการ 1 หน้าถ้วน'}
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

                  const courseNameStr = selectedCourseForPrint?.course_name || 'ช่างพ่นสีรถยนต์';
                  const courseLevelStr = selectedCourseForPrint?.level_name || '1';
                  const courseHoursStr = selectedCourseForPrint?.traning_hours ? String(selectedCourseForPrint.traning_hours) : '30';
                  const agencyNameStr = selectedCourseForPrint?.agency_name || 'กรมพัฒนาฝีมือแรงงาน';

                  const photoUrl = MockDataStore.getUserDocumentUrl(currentUser, 'id_photo_file_pathname');
                  const isValidPhoto = photoUrl && !photoUrl.toLowerCase().includes('oppo') && (photoUrl.startsWith('http') || photoUrl.startsWith('data:'));

                  // Helper logic for labor history PDF checkboxes
                  const isHaveJob = Boolean(laborHistory?.is_have_job?.includes('ทำงาน') && !laborHistory?.is_have_job?.includes('ไม่ทำงาน'));
                  const isNotHaveJob = Boolean(laborHistory?.is_have_job?.includes('ไม่ทำงาน') || laborHistory?.is_have_job?.includes('ว่างงาน') || !isHaveJob);

                  const matchLaborStatus = (val: string): boolean => {
                    if (!laborHistory?.labor_status) return false;
                    return laborHistory.labor_status.toLowerCase().includes(val.toLowerCase());
                  };

                  const matchSalary = (val: string): boolean => {
                    if (!laborHistory?.labor_salary) return false;
                    const dbClean = laborHistory.labor_salary.replace(/[–—\-]/g, '-').replace(/\s+/g, '');
                    const valClean = val.replace(/[–—\-]/g, '-').replace(/\s+/g, '');
                    return dbClean.includes(valClean) || valClean.includes(dbClean);
                  };

                  const matchSource = (val: string): boolean => {
                    if (!laborHistory?.known_source_of_training) return false;
                    return laborHistory.known_source_of_training.toLowerCase().includes(val.toLowerCase());
                  };

                  const matchPublish = (val: string): boolean => {
                    if (!laborHistory?.is_accept_publish) return false;
                    return laborHistory.is_accept_publish.includes(val);
                  };

                  const matchWantJob = (val: string): boolean => {
                    if (!laborHistory?.is_want_job) return false;
                    return laborHistory.is_want_job.includes(val);
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
                          <Dot w="220px" center>{currentUser.title_th}{currentUser.first_name_th} {currentUser.last_name_th}</Dot>
                          <span style={{ marginLeft: '10px' }}>เพศ</span>
                          <Dot w="50px" center>{currentUser.sex_name || 'ชาย'}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>ชื่อ-สกุล ภาษาอังกฤษ</span>
                          <Dot w="300px">{currentUser.title_en}{currentUser.first_name_en} {currentUser.last_name_en}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>เลขบัตรประชาชน</span>
                          <Dot w="95px" center>{currentUser.th_human_number}</Dot>
                          <span>สัญชาติ</span>
                          <Dot w="35px" center>{currentUser.nationality_name || 'ไทย'}</Dot>
                          <span>วัน/เดือน/ปีเกิด</span>
                          <Dot w="75px" center>{formatThaiDate(currentUser.birth_day)}</Dot>
                          <span>โทรศัพท์</span>
                          <Dot w="80px" center>{currentUser.phone_number || '-'}</Dot>
                          <span>อีเมล (ถ้ามี)</span>
                          <Dot w="120px" center>{currentUser.email || '-'}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>ที่อยู่ตามทะเบียนบ้าน/ที่อยู่ตามบัตรประชาชน เลขที่</span>
                          <Dot w="50px" center>{currentUser.house_number || '99/9'}</Dot>
                          <span>หมู่</span>
                          <Dot w="25px" center>-</Dot>
                          <span>ถนน</span>
                          <Dot w="110px" center>{currentUser.road_name || 'พหลโยธิน'}</Dot>
                          <span>ซอย</span>
                          <Dot w="60px">{'\u00A0'}</Dot>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap" style={{ marginTop: '1px' }}>
                          <span>แขวง/ตำบล</span>
                          <Dot w="90px" center>{currentUser.subdistrict_name || 'ดุสิต'}</Dot>
                          <span>เขต/อำเภอ</span>
                          <Dot w="90px" center>{currentUser.district_name || 'ดุสิต'}</Dot>
                          <span>จังหวัด</span>
                          <Dot w="110px" center>{currentUser.province_name || 'กรุงเทพมหานคร'}</Dot>
                          <span>รหัสไปรษณีย์</span>
                          <Dot w="45px" center>10300</Dot>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px' }}>
                          <span>วุฒิการศึกษาสูงสุด</span>
                          <CB checked={currentUser.education_level === 'ประถมศึกษา'} label="ประถมศึกษา" />
                          <CB checked={currentUser.education_level === 'มัธยมศึกษาปีที่ 3'} label="มัธยมต้น" />
                          <CB checked={currentUser.education_level === 'มัธยมศึกษาปีที่ 6'} label="มัธยมปลาย" />
                          <CB checked={currentUser.education_level === 'อนุปริญญา'} label="อนุปริญญา" />
                          <CB checked={currentUser.education_level === 'ประกาศนียบัตรวิชาชีพ (ปวช.)'} label="ปวช." />
                          <CB checked={currentUser.education_level === 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)'} label="ปวส./ปวท." />
                          <CB checked={['ปริญญาตรี','ปริญญาโท','ปริญญาเอก'].includes(currentUser.education_level||'')} label="ปริญญาตรีขึ้นไป" />
                          <CB checked={currentUser.education_level === 'ไม่จบการศึกษา'} label="ไม่จบการศึกษา" />
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px' }}>
                          <span>สาขา</span>
                          <Dot>{currentUser.branch_name || 'คอมพิวเตอร์'}</Dot>
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
                          <Dot w="90px">{laborHistory?.occupation || '-'}</Dot>
                          <span>ตำแหน่ง</span>
                          <Dot w="90px">{laborHistory?.position || '-'}</Dot>
                          <span>อายุงาน</span>
                          <Dot w="35px" center>{laborHistory?.year_of_service || '-'}</Dot>
                          <span>ปี</span>
                        </div>
                        <div className="flex items-center gap-1" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span>สถานที่ทำงาน ชื่อหน่วยงาน</span>
                          <Dot>{laborHistory?.agency_name || '-'}</Dot>
                          <span>จังหวัด</span>
                          <Dot w="80px" center>{currentUser.province_name || 'กรุงเทพมหานคร'}</Dot>
                          <span>โทรศัพท์</span>
                          <Dot w="80px" center>{laborHistory?.phone_number || '-'}</Dot>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span>กลุ่มอุตสาหกรรมที่ทำงาน</span>
                          <CB checked={isHaveJob && (laborHistory?.industrial_groups_working?.includes('อาหาร') ?? false)} label="การแปรรูปอาหาร" />
                          <CB checked={isHaveJob && (laborHistory?.industrial_groups_working?.includes('เกษตร') ?? false)} label="การเกษตรและเทคโนโลยีชีวภาพ" />
                          <CB checked={false} label="ท่องเที่ยวกลุ่มรายได้ดีและท่องเที่ยวเชิงสุขภาพ" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ paddingLeft: '15px' }}>
                          <CB checked={false} label="อิเล็กทรอนิกส์อัจฉริยะ" />
                          <CB checked={isHaveJob && (laborHistory?.industrial_groups_working?.includes('ยานยนต์') ?? false)} label="ยานยนต์สมัยใหม่" />
                          <CB checked={isHaveJob && (laborHistory?.industrial_groups_working?.includes('ดิจิตอล') ?? false)} label="ดิจิตอล" />
                          <CB checked={false} label="เชื้อเพลิง/เคมีชีวภาพ" />
                          <CB checked={isHaveJob && (laborHistory?.industrial_groups_working?.includes('ขนส่ง') ?? false)} label="ขนส่งและการบิน" />
                          <CB checked={isHaveJob && (laborHistory?.industrial_groups_working?.includes('แพทย์') ?? false)} label="การแพทย์ครบวงจร" />
                          <CB checked={false} label="หุ่นยนต์เพื่ออุตสาหกรรม" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: '1px', paddingLeft: '15px' }}>
                          <span style={{ fontWeight: 700 }}>2.2 ผู้ไม่มีงานทำ</span>
                          <CB checked={isNotHaveJob && (laborHistory?.not_have_job_status?.includes('หางาน') ?? false)} label="อยู่ระหว่างหางาน" />
                          <CB checked={isNotHaveJob && (laborHistory?.not_have_job_status?.includes('นักศึกษา') ?? false)} label="นักเรียน/นักศึกษา" />
                          <CB checked={isNotHaveJob && (laborHistory?.not_have_job_status?.includes('ถูกเลิกจ้าง') ?? false)} label="ผู้ประกันตนที่ถูกเลิกจ้าง" />
                          <CB checked={isNotHaveJob && (laborHistory?.not_have_job_status?.includes('ผู้ต้องขัง') ?? false)} label="ผู้ต้องขัง" />
                          <CB checked={isNotHaveJob && (laborHistory?.not_have_job_status?.includes('ทหาร') ?? false)} label="ทหารก่อนปลด" />
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
                            <Dot w="60px" center>{laborHistory?.accept_job_position || '-'}</Dot>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CB checked={matchWantJob('ในต่างประเทศ')} label="ต้องการจัดหางานในต่างประเทศ ประเทศ" />
                            <Dot w="60px" center>{laborHistory?.accept_job_in_country_name || '-'}</Dot>
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
                            <p style={{ marginTop: '1px' }}>({currentUser.title_th}{currentUser.first_name_th} {currentUser.last_name_th})</p>
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
