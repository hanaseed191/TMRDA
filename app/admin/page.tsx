'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { MockDataStore } from '@/lib/supabase/mockStore';
import {
  User,
  TrainingCourse,
  TrainingApplication,
  TestForm,
  ExamQuestion,
  ExamChoice,
  QuestionType,
  PracticalItem,
} from '@/lib/types';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

// Clean & Neat Practical Assessment Tree Editor (ตัวหนังสือกะทัดรัด สไตล์เดียวกับภาคทฤษฎี)
function PracticalNodeEditor({
  item,
  level = 1,
  numberPrefix = '1',
  onUpdate,
  onDelete,
}: {
  item: PracticalItem;
  level?: number;
  numberPrefix?: string;
  onUpdate: (updated: PracticalItem) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const levelBadges = [
    { title: 'หมวดหลัก (ชั้น 1)', badgeBg: 'bg-red-600 text-white' },
    { title: 'หัวข้อย่อย (ชั้น 2)', badgeBg: 'bg-blue-600 text-white' },
    { title: 'รายการประเมิน (ชั้น 3)', badgeBg: 'bg-emerald-700 text-white' },
    { title: 'เกณฑ์ย่อย (ชั้น 4)', badgeBg: 'bg-amber-700 text-white' },
  ];

  const config = levelBadges[Math.min(level - 1, 3)];
  const childCount = (item.children || []).length;

  const handleAddSubItem = () => {
    const currentChildren = item.children || [];
    const newId = Date.now() + Math.floor(Math.random() * 10000);
    const newChild: PracticalItem = {
      id: newId,
      item_name: `หัวข้อเกณฑ์ย่อยที่ ${currentChildren.length + 1}`,
      description: 'คำอธิบายเกณฑ์',
      max_score: level === 1 ? 15 : level === 2 ? 10 : 5,
      criteria: 'เกณฑ์การพิจารณาคะแนน',
      children: [],
    };
    onUpdate({
      ...item,
      children: [...currentChildren, newChild],
    });
    setExpanded(true);
  };

  const handleChildUpdate = (childIdx: number, updatedChild: PracticalItem) => {
    const newChildren = [...(item.children || [])];
    newChildren[childIdx] = updatedChild;
    onUpdate({
      ...item,
      children: newChildren,
    });
  };

  const handleChildDelete = (childIdx: number) => {
    const newChildren = (item.children || []).filter((_, idx) => idx !== childIdx);
    onUpdate({
      ...item,
      children: newChildren,
    });
  };

  const levelIndent = level === 1 ? '' : 'pl-3 sm:pl-4 border-l border-l-zinc-300 ml-2 sm:ml-3';

  return (
    <div className={`py-2 ${levelIndent}`}>
      {/* Spacious Card Row */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:border-zinc-300 transition-all space-y-3">
        {/* Line 1: Controls & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {childCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-7 h-7 flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs shrink-0 border border-zinc-200 shadow-2xs"
                title={expanded ? 'ย่อข้อย่อย' : 'ขยายข้อย่อย'}
              >
                <i className={`fa-solid ${expanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} />
              </button>
            )}

            <span className="font-bold text-sm text-zinc-950 shrink-0 font-mono">
              {numberPrefix}.
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide leading-none ${config.badgeBg}`}>
              {config.title}
            </span>

            {childCount > 0 && (
              <span className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded shrink-0 border border-zinc-200">
                {childCount} ข้อย่อย
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-md">
              <span className="text-xs font-bold text-zinc-900">คะแนนเต็ม:</span>
              <input
                type="number"
                value={item.max_score}
                onChange={(e) => onUpdate({ ...item, max_score: Number(e.target.value) })}
                className="w-16 h-8 border border-zinc-300 rounded-md text-xs font-bold text-center text-zinc-950 bg-white focus:border-red-600 focus:outline-none"
              />
            </div>

            {level < 4 && (
              <button
                type="button"
                onClick={handleAddSubItem}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm leading-none"
              >
                <i className="fa-solid fa-plus text-[10px]" />
                <span>เพิ่มข้อย่อย</span>
              </button>
            )}

            <button
              type="button"
              onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-zinc-200 bg-white hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
              title="ลบรายการนี้"
            >
              <i className="fa-solid fa-trash-can text-sm" />
            </button>
          </div>
        </div>

        {/* Line 2: Large Title Input (Full Width - 14px Font) */}
        <div>
          <label className="block text-xs font-bold text-zinc-900 mb-1 flex items-center gap-1">
            <i className="fa-solid fa-pen text-red-600 text-[10px]" />
            <span>ชื่อหัวข้อเกณฑ์ประเมิน</span>
          </label>
          <input
            type="text"
            value={item.item_name}
            onChange={(e) => onUpdate({ ...item, item_name: e.target.value })}
            className="w-full h-10 border border-zinc-300 rounded-lg px-3 text-sm font-bold text-zinc-950 bg-white focus:border-red-600 focus:ring-1 focus:ring-red-600/20 placeholder:font-medium"
            placeholder="พิมพ์ชื่อหัวข้อเกณฑ์ประเมิน..."
          />
        </div>

        {/* Line 3: Large Criteria Description Input (12px Font) */}
        <div>
          <label className="block text-xs font-bold text-zinc-900 mb-1 flex items-center gap-1">
            <i className="fa-solid fa-align-left text-zinc-500 text-[10px]" />
            <span>รายละเอียดและเกณฑ์การให้คะแนน</span>
          </label>
          <input
            type="text"
            value={item.criteria || ''}
            onChange={(e) => onUpdate({ ...item, criteria: e.target.value })}
            className="w-full h-9 border border-zinc-200 rounded-lg px-3 text-xs font-medium text-zinc-900 bg-zinc-50/80 focus:bg-white focus:border-red-600 placeholder:text-zinc-400"
            placeholder="พิมพ์คำอธิบายรายละเอียดและเกณฑ์การตรวจให้คะแนน..."
          />
        </div>
      </div>

      {/* Children Sub-List */}
      {expanded && childCount > 0 && (
        <div className="mt-2 space-y-2">
          {(item.children || []).map((child, childIdx) => (
            <PracticalNodeEditor
              key={child.id || childIdx}
              item={child}
              level={level + 1}
              numberPrefix={`${numberPrefix}.${childIdx + 1}`}
              onUpdate={(updated) => handleChildUpdate(childIdx, updated)}
              onDelete={() => handleChildDelete(childIdx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('overview');

  useEffect(() => {
    const view = searchParams.get('view') || 'overview';
    setCurrentView(view);
  }, [searchParams]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [applications, setApplications] = useState<TrainingApplication[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Separated Modals State
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [activeModal, setActiveModal] = useState<'course_edit' | 'theory_exam' | 'practical_exam' | 'report' | null>(null);

  // Form State - Course Info Edit
  const [courseForm, setCourseForm] = useState({
    agency_name: '',
    course_name: '',
    course_name_en: '',
    traning_hours: 40,
    branch_name: '',
    level_name: '',
    startswith_date: '',
    endswith_date: '',
    limit_course: 30,
    executive_name: '',
  });

  // State for Theory Exam Manager
  const [theoryExams, setTheoryExams] = useState<TestForm[]>([]);
  const [selectedTheoryExamId, setSelectedTheoryExamId] = useState<number | null>(null);
  const [theoryFormData, setTheoryFormData] = useState<Partial<TestForm>>({
    title: '',
    description: '',
    time_limit_minutes: 60,
    passing_percentage: 70,
    score_knowledge_max: 100,
    score_practice_max: 0,
    is_active: true,
    questions: [],
  });

  // State for Practical Exam Manager
  const [practicalExams, setPracticalExams] = useState<TestForm[]>([]);
  const [selectedPracticalExamId, setSelectedPracticalExamId] = useState<number | null>(null);
  const [practicalFormData, setPracticalFormData] = useState<Partial<TestForm>>({
    title: '',
    description: '',
    time_limit_minutes: 180,
    passing_percentage: 75,
    score_knowledge_max: 0,
    score_practice_max: 100,
    is_active: true,
    practical_items: [],
  });

  // Cached test forms for render (avoid async in JSX)
  const [allTestForms, setAllTestForms] = useState<TestForm[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const user = MockDataStore.getCurrentUser();
      setCurrentUser(user);
      const [coursesData, appsData, usersData, testFormsData] = await Promise.all([
        MockDataStore.getCourses(),
        MockDataStore.getApplications(),
        MockDataStore.getUsers(),
        MockDataStore.getTestForms(),
      ]);
      setCourses(coursesData);
      setApplications(appsData);
      setUsersList(usersData);
      setAllTestForms(testFormsData);
    };
    loadData();

    const onFocus = () => { loadData(); };
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); };
  }, []);

  // Open Modal Functions
  const openCourseEditModal = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setCourseForm({
      agency_name: course.agency_name,
      course_name: course.course_name,
      course_name_en: course.course_name_en || '',
      traning_hours: course.traning_hours,
      branch_name: course.branch_name,
      level_name: course.level_name,
      startswith_date: course.startswith_date,
      endswith_date: course.endswith_date,
      limit_course: course.limit_course,
      executive_name: course.executive_name,
    });
    setActiveModal('course_edit');
  };

  const openTheoryExamModal = async (course: TrainingCourse) => {
    setSelectedCourse(course);
    const forms = await MockDataStore.getTestForms(course.id, 'theory');
    setTheoryExams(forms);
    if (forms.length > 0) {
      setSelectedTheoryExamId(forms[0].id);
      setTheoryFormData(forms[0]);
    } else {
      setSelectedTheoryExamId(null);
      resetTheoryFormData(course.id);
    }
    setActiveModal('theory_exam');
  };

  const openPracticalExamModal = async (course: TrainingCourse) => {
    setSelectedCourse(course);
    const forms = await MockDataStore.getTestForms(course.id, 'practical');
    setPracticalExams(forms);
    if (forms.length > 0) {
      setSelectedPracticalExamId(forms[0].id);
      setPracticalFormData(forms[0]);
    } else {
      setSelectedPracticalExamId(null);
      resetPracticalFormData(course.id);
    }
    setActiveModal('practical_exam');
  };

  const openReportModal = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setActiveModal('report');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedCourse(null);
  };

  const resetTheoryFormData = (courseId: number) => {
    setTheoryFormData({
      training_id: courseId,
      exam_type: 'theory',
      title: 'แบบทดสอบภาคทฤษฎี',
      description: 'คำชี้แจงในการทำแบบทดสอบทฤษฎี',
      time_limit_minutes: 60,
      passing_percentage: 70,
      total_score: 100,
      score_knowledge_max: 100,
      score_practice_max: 0,
      is_active: true,
      randomize_questions: false,
      randomize_choices: false,
      questions: [
        {
          id: 1,
          question_text: 'คำถามข้อที่ 1',
          type: 'single_choices',
          category: 'knowledge',
          score: 1,
          choices: [
            { id: 'a', choice_text: 'ตัวเลือก ก', is_correct: true },
            { id: 'b', choice_text: 'ตัวเลือก ข', is_correct: false },
          ],
        },
      ],
    });
  };

  const resetPracticalFormData = (courseId: number) => {
    setPracticalFormData({
      training_id: courseId,
      exam_type: 'practical',
      title: 'ชุดประเมินภาคปฏิบัติ',
      description: 'คำชี้แจงการทดสอบภาคปฏิบัติงาน',
      time_limit_minutes: 180,
      passing_percentage: 75,
      total_score: 100,
      score_knowledge_max: 0,
      score_practice_max: 100,
      is_active: true,
      practical_items: [
        {
          id: 1,
          item_name: 'หมวดที่ 1: การเตรียมความพร้อมและความปลอดภัยในการทำงาน (หมวดหลัก ชั้น 1)',
          description: 'การตรวจสอบสถานที่ อุปกรณ์ และความปลอดภัยในการทำงาน',
          max_score: 30,
          criteria: 'เกณฑ์คะแนนเต็ม 30 คะแนน',
          children: [
            {
              id: 11,
              item_name: '1.1 การตรวจเช็คเครื่องมืออุปกรณ์ (ข้อย่อย ชั้น 2)',
              description: 'ตรวจสอบความพร้อมของอุปกรณ์',
              max_score: 15,
              criteria: 'เกณฑ์ 15 คะแนน',
              children: [
                {
                  id: 111,
                  item_name: '1.1.1 ตรวจเช็คระบบอินเทอร์เน็ตและโปรแกรม (รายการประเมิน ชั้น 3)',
                  description: 'ตรวจความสมบูรณ์ซอฟต์แวร์',
                  max_score: 10,
                  criteria: 'เกณฑ์ 10 คะแนน',
                },
              ],
            },
          ],
        },
      ],
    });
  };

  // Save Course Edit
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const formatToDDMMYYYY = (dateStr?: string) => {
        if (!dateStr) return '';
        if (dateStr.includes('/')) return dateStr;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        }
        return dateStr;
      };

      const startFmt = formatToDDMMYYYY(courseForm.startswith_date);
      const endFmt = formatToDDMMYYYY(courseForm.endswith_date);
      const formattedBetween = (startFmt && endFmt) ? `${startFmt} - ${endFmt}` : (selectedCourse.between_date || '');

      const updated = await MockDataStore.updateCourse(selectedCourse.id, {
        ...courseForm,
        between_date: formattedBetween,
      });
      toast.success(`บันทึกการแก้ไขคอร์ส "${updated.course_name}" เรียบร้อยแล้ว`);
      const coursesData = await MockDataStore.getCourses();
      setCourses(coursesData);
      closeModal();
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleAddCourse = async () => {
    try {
      const newCourse = await MockDataStore.addCourse({
        agency_name: 'สถาบันพัฒนาฝีมือแรงงาน',
        course_name: 'หลักสูตรการฝึกอบรมใหม่ ' + (courses.length + 1),
        course_name_en: 'New Training Course ' + (courses.length + 1),
        traning_hours: 30,
        branch_name: 'เทคโนโลยีสารสนเทศ',
        level_name: 'ระดับ 1',
        startswith_date: '2026-10-01',
        endswith_date: '2026-10-10',
        between_date: '01/10/2026 - 10/10/2026',
        limit_course: 30,
        executive_name: 'ผู้อำนวยการสถาบัน',
      });
      toast.success('สร้างคอร์สใหม่เรียบร้อยแล้ว');
      const coursesData = await MockDataStore.getCourses();
      setCourses(coursesData);
      openCourseEditModal(newCourse);
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Theory Question Handlers
  const handleAddTheoryQuestion = () => {
    const questions = theoryFormData.questions || [];
    const newId = questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    const newQ: ExamQuestion = {
      id: newId,
      question_text: `คำถามข้อที่ ${questions.length + 1}`,
      type: 'single_choices',
      category: 'knowledge',
      score: 1,
      choices: [
        { id: 'a', choice_text: 'ตัวเลือก 1', is_correct: true },
        { id: 'b', choice_text: 'ตัวเลือก 2', is_correct: false },
      ],
    };
    setTheoryFormData({ ...theoryFormData, questions: [...questions, newQ] });
  };

  const handleRemoveTheoryQuestion = (qId: number) => {
    const questions = (theoryFormData.questions || []).filter((q) => q.id !== qId);
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleTheoryQuestionChange = (qId: number, field: keyof ExamQuestion, value: any) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        const updated = { ...q, [field]: value };
        if (field === 'type') {
          if (value === 'matching' && (!updated.matching_pairs || updated.matching_pairs.length === 0)) {
            updated.matching_pairs = [
              { id: '1', left_text: 'โจทย์ฝั่งซ้าย 1', right_text: 'คู่กับ คำตอบฝั่งขวา 1' },
              { id: '2', left_text: 'โจทย์ฝั่งซ้าย 2', right_text: 'คู่กับ คำตอบฝั่งขวา 2' },
            ];
          } else if (value === 'true_false' && updated.true_false_answer === undefined) {
            updated.true_false_answer = true;
          }
        }
        return updated;
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleAddTheoryChoice = (qId: number) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        const choices = q.choices || [];
        const nextId = String.fromCharCode(97 + choices.length);
        return {
          ...q,
          choices: [...choices, { id: nextId, choice_text: `ตัวเลือก ${choices.length + 1}`, is_correct: false }],
        };
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleRemoveTheoryChoice = (qId: number, choiceId: string) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        return { ...q, choices: q.choices.filter((c) => c.id !== choiceId) };
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleTheoryChoiceTextChange = (qId: number, choiceId: string, text: string) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        const choices = q.choices.map((c) => (c.id === choiceId ? { ...c, choice_text: text } : c));
        return { ...q, choices };
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleToggleTheoryCorrect = (qId: number, choiceId: string, qType: QuestionType) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        if (qType === 'single_choices') {
          return { ...q, choices: q.choices.map((c) => ({ ...c, is_correct: c.id === choiceId })) };
        } else if (qType === 'multiple_choices') {
          return { ...q, choices: q.choices.map((c) => (c.id === choiceId ? { ...c, is_correct: !c.is_correct } : c)) };
        }
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleAddMatchingPair = (qId: number) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        const pairs = q.matching_pairs || [];
        return {
          ...q,
          matching_pairs: [...pairs, { id: `${pairs.length + 1}`, left_text: `โจทย์ ${pairs.length + 1}`, right_text: `คำตอบ ${pairs.length + 1}` }],
        };
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleMatchingChange = (qId: number, pairId: string, side: 'left_text' | 'right_text', text: string) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        const matching_pairs = (q.matching_pairs || []).map((p) => (p.id === pairId ? { ...p, [side]: text } : p));
        return { ...q, matching_pairs };
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleRemoveMatchingPair = (qId: number, pairId: string) => {
    const questions = (theoryFormData.questions || []).map((q) => {
      if (q.id === qId) {
        return { ...q, matching_pairs: (q.matching_pairs || []).filter((p) => p.id !== pairId) };
      }
      return q;
    });
    setTheoryFormData({ ...theoryFormData, questions });
  };

  const handleSaveTheoryExam = async () => {
    if (!selectedCourse) return;
    if (!theoryFormData.title?.trim()) {
      toast.error('กรุณากรอกชื่อชุดข้อสอบทฤษฎี');
      return;
    }
    const totalScore = (theoryFormData.questions || []).reduce((sum, q) => sum + Number(q.score || 0), 0);

    try {
      const saved = await MockDataStore.saveTestForm({
        id: selectedTheoryExamId || 0,
        training_id: selectedCourse.id,
        exam_type: 'theory',
        title: theoryFormData.title || 'ข้อสอบทฤษฎี',
        description: theoryFormData.description || '',
        time_limit_minutes: Number(theoryFormData.time_limit_minutes || 60),
        passing_percentage: Number(theoryFormData.passing_percentage || 70),
        total_score: totalScore > 0 ? totalScore : 100,
        score_knowledge_max: totalScore > 0 ? totalScore : 100,
        score_practice_max: 0,
        is_active: theoryFormData.is_active ?? true,
        randomize_questions: theoryFormData.randomize_questions ?? false,
        randomize_choices: theoryFormData.randomize_choices ?? false,
        questions: theoryFormData.questions || [],
      });

      toast.success(`บันทึกชุดข้อสอบทฤษฎี "${saved.title}" เรียบร้อยแล้ว`);
      await openTheoryExamModal(selectedCourse);
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  // Practical Top-Level Node Handlers
  const handleAddTopLevelPracticalItem = () => {
    const items = practicalFormData.practical_items || [];
    const newId = Date.now();
    const newItem: PracticalItem = {
      id: newId,
      item_name: `หมวดที่ ${items.length + 1}: หัวข้อหลักการประเมินปฏิบัติงาน (ชั้น 1)`,
      description: 'คำอธิบายหมวดหลัก',
      max_score: 30,
      criteria: 'เกณฑ์คะแนนรวมหมวด',
      children: [],
    };
    setPracticalFormData({ ...practicalFormData, practical_items: [...items, newItem] });
  };

  const handleTopLevelPracticalUpdate = (idx: number, updatedItem: PracticalItem) => {
    const items = [...(practicalFormData.practical_items || [])];
    items[idx] = updatedItem;
    setPracticalFormData({ ...practicalFormData, practical_items: items });
  };

  const handleTopLevelPracticalDelete = (idx: number) => {
    const items = (practicalFormData.practical_items || []).filter((_, i) => i !== idx);
    setPracticalFormData({ ...practicalFormData, practical_items: items });
  };

  const handleSavePracticalExam = async () => {
    if (!selectedCourse) return;
    if (!practicalFormData.title?.trim()) {
      toast.error('กรุณากรอกชื่อชุดประเมินภาคปฏิบัติ');
      return;
    }

    try {
      const saved = await MockDataStore.saveTestForm({
        id: selectedPracticalExamId || 0,
        training_id: selectedCourse.id,
        exam_type: 'practical',
        title: practicalFormData.title || 'ชุดประเมินภาคปฏิบัติ',
        description: practicalFormData.description || '',
        time_limit_minutes: Number(practicalFormData.time_limit_minutes || 180),
        passing_percentage: Number(practicalFormData.passing_percentage || 75),
        total_score: Number(practicalFormData.score_practice_max || 100),
        score_knowledge_max: 0,
        score_practice_max: Number(practicalFormData.score_practice_max || 100),
        is_active: practicalFormData.is_active ?? true,
        questions: [],
        practical_items: practicalFormData.practical_items || [],
      });

      toast.success(`บันทึกชุดประเมินภาคปฏิบัติ "${saved.title}" เรียบร้อยแล้ว`);
      await openPracticalExamModal(selectedCourse);
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
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex pt-16 min-h-[calc(100vh-64px)]">
        <Sidebar currentUser={currentUser} isOpen={sidebarOpen} />

        <main className="flex-1 md:ml-64 p-6 md:p-8 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 w-full">
            <div>
              <h1 className="text-2xl font-bold text-zinc-950 flex items-center gap-2">
                <i className="fa-solid fa-user-shield text-red-600 text-xl" />
                <span>
                  {currentView === 'courses' && 'การจัดการคอร์สเรียน (Course Management)'}
                  {currentView === 'exams' && 'การจัดการชุดข้อสอบ (Exam Management Table)'}
                  {currentView === 'users' && 'การจัดการสมาชิก & ตรวจสอบเอกสาร (User Management)'}
                  {currentView === 'evaluations' && 'การประเมินผลปฏิบัติ (Practical Evaluation Manager)'}
                  {currentView === 'reports' && 'รายงานผลการทดสอบ (Reports & Analytics)'}
                  {currentView === 'overview' && 'แผงควบคุมหลักผู้ดูแลระบบ (Admin Overview Dashboard)'}
                </span>
              </h1>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                ระบบผู้ดูแลกลาง TMRDA Admin | จัดการภาพรวมระบบ สถิติ คอร์สเรียน และข้อสอบ
              </p>
            </div>

            <button
              onClick={handleAddCourse}
              className="bg-red-600 text-white px-4 py-2.5 rounded-md font-bold text-xs hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm leading-none"
            >
              <i className="fa-solid fa-plus text-xs leading-none" />
              <span>เพิ่มคอร์สฝึกอบรมใหม่</span>
            </button>
          </div>

          {/* Stats Grid - Always Shown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 w-full">
            <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">คอร์สทั้งหมด</span>
                <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-book-open" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-zinc-950 leading-tight">{courses.length}</h2>
              <p className="text-xs text-zinc-500 font-medium leading-none">อัปเดตล่าสุดวันนี้</p>
            </div>

            <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">กำลังเปิดสอน</span>
                <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-play" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-zinc-950 leading-tight">{courses.length}</h2>
              <p className="text-xs text-zinc-500 font-medium leading-none">พร้อมลงทะเบียน</p>
            </div>

            <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">สมาชิกในระบบ</span>
                <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-users" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-zinc-950 leading-tight">{usersList.length} คน</h2>
              <p className="text-xs text-zinc-500 font-medium leading-none">สมาชิกทั้งหมด</p>
            </div>

            <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">ใบสมัครรออนุมัติ</span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-clock-rotate-left" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-amber-600 leading-tight">{applications.length}</h2>
              <p className="text-xs text-amber-600 font-bold leading-none">รายการรอพิจารณา</p>
            </div>
          </div>

          {/* VIEW 0: PURE ADMIN OVERVIEW DASHBOARD ONLY (FEEDBACK #1: หน้าแรก admin เอาแต่ dashboard) */}
          {currentView === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <i className="fa-solid fa-chart-line text-red-600" />
                  <span>สรุปการดำเนินงานระบบ TMRDA Admin</span>
                </h3>
                <div className="space-y-3 text-xs font-medium text-zinc-600">
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span>การเข้าใช้งานผู้ดูแลระบบ:</span>
                    <span className="font-bold text-zinc-950">สถานะปกติ</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span>จำนวนคอร์สเปิดสอบปัจจุบัน:</span>
                    <span className="font-bold text-emerald-600">{courses.length} หลักสูตร</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <span>รายการประเมินผลปฏิบัติรวม:</span>
                    <span className="font-bold text-amber-600">รองรับเกณฑ์ซ้อน 3-4 ชั้น</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <i className="fa-solid fa-bolt text-amber-500" />
                  <span>ทางลัดคำสั่งการบริหารจัดการ (Quick Actions)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <a
                    href="/admin?view=courses"
                    className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-bold text-zinc-900 block text-center"
                  >
                    <i className="fa-solid fa-book-open block text-base mb-1 text-red-600" />
                    <span>จัดการคอร์สเรียน</span>
                  </a>
                  <a
                    href="/admin?view=exams"
                    className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-bold text-zinc-900 block text-center"
                  >
                    <i className="fa-solid fa-file-pen block text-base mb-1 text-blue-600" />
                    <span>จัดการข้อสอบ (Table)</span>
                  </a>
                  <a
                    href="/admin?view=users"
                    className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-bold text-zinc-900 block text-center"
                  >
                    <i className="fa-solid fa-users-gear block text-base mb-1 text-zinc-950" />
                    <span>จัดการสมาชิก</span>
                  </a>
                  <a
                    href="/admin?view=reports"
                    className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg font-bold text-zinc-900 block text-center"
                  >
                    <i className="fa-solid fa-chart-column block text-base mb-1 text-emerald-600" />
                    <span>รายงานผลคะแนน</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 1: COURSES MANAGEMENT PAGE */}
          {currentView === 'courses' && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-8 w-full">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
                  <i className="fa-solid fa-book-open text-red-600" />
                  <span>ตารางรายการคอร์สเรียนทั้งหมด ({courses.length})</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-900 font-bold">
                      <th className="px-6 py-3.5">#</th>
                      <th className="px-6 py-3.5">ชื่อคอร์ส</th>
                      <th className="px-6 py-3.5">สถานที่</th>
                      <th className="px-6 py-3.5">จำนวนชั่วโมง</th>
                      <th className="px-6 py-3.5">แผนก</th>
                      <th className="px-6 py-3.5">ระหว่างวันที่</th>
                      <th className="px-6 py-3.5 text-right">คำสั่งจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {courses.map((course, idx) => {
                      const theoryExamsCount = allTestForms.filter(f => f.training_id === course.id && (f.exam_type || 'theory') === 'theory').length;
                      const practicalExamsCount = allTestForms.filter(f => f.training_id === course.id && f.exam_type === 'practical').length;

                      return (
                        <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-400">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-950 text-sm">{course.course_name}</div>
                            <div className="text-xs text-zinc-500 font-normal">{course.course_name_en}</div>
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold rounded">
                                ทฤษฎี {theoryExamsCount} ชุด
                              </span>
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold rounded">
                                ปฏิบัติ {practicalExamsCount} ชุด
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">{course.agency_name}</td>
                          <td className="px-6 py-4 font-bold text-zinc-950">{course.traning_hours} ชม.</td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2.5 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-bold rounded-md">
                              {course.branch_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">{course.between_date}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => openCourseEditModal(course)}
                                className="px-2.5 py-1.5 bg-zinc-900 text-white rounded-md font-bold text-xs hover:bg-zinc-800 transition-all flex items-center gap-1.5 shadow-sm leading-none"
                              >
                                <i className="fa-solid fa-pen-to-square text-xs" />
                                <span>แก้ไขคอร์ส</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: DEDICATED EXAM MANAGEMENT PAGE (FEEDBACK #3: เมนูข้อมูลสอบ อยากได้เป็น table เหมือนเดิม และถ้าแก้ไขชุดไหนก็ขึ้นชุดนั้น ๆ) */}
          {currentView === 'exams' && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-8 w-full">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
                  <i className="fa-solid fa-file-pen text-blue-600" />
                  <span>ตารางการจัดการชุดข้อสอบทั้งหมดในระบบ ({courses.length} คอร์ส)</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-900 font-bold">
                      <th className="px-6 py-3.5">#</th>
                      <th className="px-6 py-3.5">ชื่อคอร์ส</th>
                      <th className="px-6 py-3.5">สถานที่</th>
                      <th className="px-6 py-3.5">จำนวนชั่วโมง</th>
                      <th className="px-6 py-3.5">แผนก</th>
                      <th className="px-6 py-3.5">ชุดข้อสอบในระบบ</th>
                      <th className="px-6 py-3.5 text-right">คำสั่งเปิดแก้ไขชุดข้อสอบตรง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {courses.map((course, idx) => {
                      const theoryExamsCount = allTestForms.filter(f => f.training_id === course.id && (f.exam_type || 'theory') === 'theory').length;
                      const practicalExamsCount = allTestForms.filter(f => f.training_id === course.id && f.exam_type === 'practical').length;

                      return (
                        <tr key={course.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-zinc-400">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-950 text-sm">{course.course_name}</div>
                            <div className="text-xs text-zinc-500 font-normal">{course.course_name_en}</div>
                          </td>
                          <td className="px-6 py-4 text-zinc-600">{course.agency_name}</td>
                          <td className="px-6 py-4 font-bold text-zinc-950">{course.traning_hours} ชม.</td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2.5 py-1 bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-bold rounded-md">
                              {course.branch_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-md">
                                ทฤษฎี {theoryExamsCount} ชุด
                              </span>
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-md">
                                ปฏิบัติ {practicalExamsCount} ชุด
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => openTheoryExamModal(course)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-bold text-xs hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm leading-none"
                              >
                                <i className="fa-solid fa-file-lines text-xs" />
                                <span>ข้อสอบทฤษฎี</span>
                              </button>
                              <button
                                onClick={() => openPracticalExamModal(course)}
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-md font-bold text-xs hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-sm leading-none"
                              >
                                <i className="fa-solid fa-list-check text-xs" />
                                <span>ข้อสอบปฏิบัติ (เกณฑ์ 3-4 ชั้น)</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: DEDICATED USER MANAGEMENT PAGE */}
          {currentView === 'users' && (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden mb-8 w-full">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-sm text-zinc-950 flex items-center gap-2">
                  <i className="fa-solid fa-users-gear text-red-600" />
                  <span>การจัดการสมาชิก & ตรวจสอบเอกสารอนุมัติ ({usersList.length} คน)</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-900 font-bold">
                      <th className="px-6 py-3.5">#</th>
                      <th className="px-6 py-3.5">ชื่อ-นามสกุล</th>
                      <th className="px-6 py-3.5">เพศ</th>
                      <th className="px-6 py-3.5">สัญชาติ</th>
                      <th className="px-6 py-3.5">อีเมล</th>
                      <th className="px-6 py-3.5">สาขา</th>
                      <th className="px-6 py-3.5">สถานะการอนุญาต</th>
                      <th className="px-6 py-3.5 text-center">ตรวจสอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium">
                    {usersList.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-bold text-zinc-950">
                          {user.title_th} {user.first_name_th} {user.last_name_th}
                        </td>
                        <td className="px-6 py-4">{user.sex_name}</td>
                        <td className="px-6 py-4">{user.nationality_name}</td>
                        <td className="px-6 py-4 text-zinc-600">{user.email}</td>
                        <td className="px-6 py-4">{user.branch_name || 'เทคโนโลยีสารสนเทศ'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                            เปิดใช้งาน
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toast.success(`เปิดดูเอกสารของคุณ ${user.first_name_th}`)}
                            className="px-3.5 py-1.5 bg-zinc-950 text-white font-bold text-xs rounded hover:bg-zinc-800 transition-all flex items-center gap-1.5 mx-auto leading-none"
                          >
                            <i className="fa-solid fa-file-magnifying-glass text-xs" />
                            <span>ตรวจสอบเอกสาร</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: PRACTICAL EVALUATIONS DEDICATED PAGE */}
          {currentView === 'evaluations' && (
            <div className="space-y-6">
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-base text-zinc-950 mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-list-check text-amber-600" />
                  <span>การประเมินผลปฏิบัติและเกณฑ์การตรวจทักษะ</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  กำหนดหัวข้อเกณฑ์การประเมินภาคปฏิบัติแบบซ้อนลำดับชั้น 3-4 ชั้นสำหรับผู้เรียน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-sm text-zinc-950">{course.course_name}</h4>
                    <p className="text-xs text-zinc-500">{course.agency_name}</p>
                    <button
                      onClick={() => openPracticalExamModal(course)}
                      className="w-full py-2.5 bg-amber-600 text-white font-bold text-xs rounded-md hover:bg-amber-700"
                    >
                      จัดการเกณฑ์ประเมินปฏิบัติ 3-4 ชั้น
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 5: REPORTS & ANALYTICS DEDICATED PAGE */}
          {currentView === 'reports' && (
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-base text-zinc-950 flex items-center gap-2">
                <i className="fa-solid fa-chart-column text-emerald-600" />
                <span>รายงานผลการทดสอบและการประเมินทั้งหมด</span>
              </h3>
              <p className="text-xs text-zinc-500">เลือกคอร์สเรียนเพื่อเปิดดูสรุปรายงานผลการสอบรายบุคคล</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openReportModal(c)}
                    className="p-4 border rounded-xl bg-zinc-50 text-left hover:border-emerald-600 hover:bg-emerald-50/40 transition-all"
                  >
                    <span className="font-bold text-xs text-zinc-900 block">{c.course_name}</span>
                    <span className="text-[11px] text-zinc-500">คลิกเพื่อดูรายงานผล</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODAL #1: COURSE EDIT */}
          {activeModal === 'course_edit' && selectedCourse && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-xl w-full max-w-2xl overflow-y-auto shadow-xl border border-zinc-200 my-8">
                <div className="p-5 border-b border-zinc-200 flex justify-between items-center bg-white sticky top-0 z-10">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">แก้ไขข้อมูลคอร์สเรียน</h3>
                    <p className="text-xs text-zinc-500 font-medium">คอร์ส: {selectedCourse.course_name}</p>
                  </div>
                  <button onClick={closeModal} className="text-zinc-400 hover:text-red-600 p-1">
                    <i className="fa-solid fa-xmark text-lg" />
                  </button>
                </div>

                <form onSubmit={handleSaveCourse} className="p-5 space-y-4 text-xs font-medium">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ID คอร์ส</label>
                      <input
                        type="text"
                        value={`00${selectedCourse.id}`}
                        disabled
                        className="w-full h-10 border border-zinc-200 rounded-md px-3 text-xs bg-zinc-100 text-zinc-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ชื่อหน่วยงาน</label>
                      <input
                        type="text"
                        value={courseForm.agency_name}
                        onChange={(e) => setCourseForm({ ...courseForm, agency_name: e.target.value })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ชื่อหลักสูตร (ภาษาไทย)</label>
                      <input
                        type="text"
                        value={courseForm.course_name}
                        onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs font-bold text-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ชื่อหลักสูตร (ภาษาอังกฤษ)</label>
                      <input
                        type="text"
                        value={courseForm.course_name_en}
                        onChange={(e) => setCourseForm({ ...courseForm, course_name_en: e.target.value })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ระยะเวลา (ชม.)</label>
                      <input
                        type="number"
                        value={courseForm.traning_hours}
                        onChange={(e) => setCourseForm({ ...courseForm, traning_hours: Number(e.target.value) })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ระดับหลักสูตร</label>
                      <input
                        type="text"
                        value={courseForm.level_name}
                        onChange={(e) => setCourseForm({ ...courseForm, level_name: e.target.value })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">ผู้เข้าอบรมสูงสุด</label>
                      <input
                        type="number"
                        value={courseForm.limit_course}
                        onChange={(e) => setCourseForm({ ...courseForm, limit_course: Number(e.target.value) })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">วันที่เริ่มอบรม</label>
                      <input
                        type="date"
                        value={courseForm.startswith_date}
                        onChange={(e) => setCourseForm({ ...courseForm, startswith_date: e.target.value })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-900 mb-1">วันที่สิ้นสุด</label>
                      <input
                        type="date"
                        value={courseForm.endswith_date}
                        onChange={(e) => setCourseForm({ ...courseForm, endswith_date: e.target.value })}
                        className="w-full h-10 border border-zinc-300 rounded-md px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 bg-zinc-100 text-zinc-700 font-bold rounded-md hover:bg-zinc-200 transition-all text-xs"
                    >
                      ปิดหน้าต่าง
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-all text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-floppy-disk text-xs" />
                      <span>บันทึกการแก้ไขคอร์ส</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL #2: THEORY EXAM */}
          {activeModal === 'theory_exam' && selectedCourse && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl border border-zinc-200 my-8">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-20 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950">จัดการข้อสอบภาคทฤษฎี</h3>
                    <p className="text-sm text-zinc-600 font-medium mt-0.5">คอร์ส: {selectedCourse.course_name}</p>
                  </div>
                  <button onClick={closeModal} className="text-zinc-400 hover:text-red-600 p-2">
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Selector */}
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-bold text-zinc-900 shrink-0">เลือกชุดข้อสอบ:</span>
                      <select
                        value={selectedTheoryExamId || ''}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedTheoryExamId(id);
                          const found = theoryExams.find((t) => t.id === id);
                          if (found) setTheoryFormData(found);
                        }}
                        className="h-10 px-3 border border-zinc-300 rounded-lg bg-white text-sm font-bold text-zinc-900 flex-1 min-w-0"
                      >
                        {theoryExams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.questions?.length || 0} ข้อ)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheoryExamId(null);
                        resetTheoryFormData(selectedCourse.id);
                      }}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shrink-0"
                    >
                      <i className="fa-solid fa-plus text-sm" />
                      <span>สร้างข้อสอบใหม่</span>
                    </button>
                  </div>

                  {/* Header Title */}
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                    <h4 className="text-base font-bold text-zinc-950">
                      รายละเอียดและโจทย์คำถามภาคทฤษฎี
                    </h4>
                  </div>

                  {/* Theory Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-zinc-50 p-5 rounded-lg border border-zinc-200">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-zinc-900 mb-1.5">ชื่อชุดข้อสอบทฤษฎี <span className="text-red-600">*</span></label>
                      <input
                        type="text"
                        value={theoryFormData.title || ''}
                        onChange={(e) => setTheoryFormData({ ...theoryFormData, title: e.target.value })}
                        placeholder="กรอกชื่อชุดข้อสอบ"
                        className="w-full h-10 border border-zinc-300 rounded-lg px-3 text-sm font-bold text-zinc-950"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-900 mb-1.5">เวลาในการทำข้อสอบ (นาที)</label>
                      <input
                        type="number"
                        value={theoryFormData.time_limit_minutes || 60}
                        onChange={(e) => setTheoryFormData({ ...theoryFormData, time_limit_minutes: Number(e.target.value) })}
                        className="w-full h-10 border border-zinc-300 rounded-lg px-3 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-900 mb-1.5">เกณฑ์ผ่านประเมิน (%)</label>
                      <input
                        type="number"
                        value={theoryFormData.passing_percentage || 70}
                        onChange={(e) => setTheoryFormData({ ...theoryFormData, passing_percentage: Number(e.target.value) })}
                        className="w-full h-10 border border-zinc-300 rounded-lg px-3 text-sm font-bold text-emerald-600"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col sm:flex-row gap-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100 mt-2">
                      <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-900 select-none">
                        <input
                          type="checkbox"
                          checked={theoryFormData.randomize_questions || false}
                          onChange={(e) => setTheoryFormData({ ...theoryFormData, randomize_questions: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>สลับสับเปลี่ยนลำดับโจทย์ข้อสอบอัตโนมัติ</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-900 select-none">
                        <input
                          type="checkbox"
                          checked={theoryFormData.randomize_choices || false}
                          onChange={(e) => setTheoryFormData({ ...theoryFormData, randomize_choices: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>สลับสับเปลี่ยนลำดับตัวเลือก (ช้อย) อัตโนมัติ</span>
                      </label>
                    </div>
                  </div>

                  {/* Question Builder */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="text-base font-bold text-zinc-950">
                        คำถามทั้งหมด ({(theoryFormData.questions || []).length} ข้อ)
                      </h5>
                      <button
                        type="button"
                        onClick={handleAddTheoryQuestion}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                      >
                        <i className="fa-solid fa-plus text-sm" />
                        <span>เพิ่มคำถามใหม่</span>
                      </button>
                    </div>

                    {(theoryFormData.questions || []).map((q, idx) => (
                      <div key={q.id} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-sm bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                              ข้อที่ {idx + 1}
                            </span>
                            <select
                              value={q.type || 'single_choices'}
                              onChange={(e) => handleTheoryQuestionChange(q.id, 'type', e.target.value as QuestionType)}
                              className="h-10 border border-zinc-300 rounded-lg px-3 text-sm font-bold bg-zinc-50 text-zinc-900"
                            >
                              <option value="single_choices">ตัวเลือกเดียว (Single Choice)</option>
                              <option value="multiple_choices">หลายตัวเลือก (Multiple Choice)</option>
                              <option value="true_false">ถูก / ผิด (True/False)</option>
                              <option value="matching">จับคู่คำถาม (Matching)</option>
                              <option value="text_choices">ข้อเขียน (Text Answer)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-700">คะแนน:</span>
                              <input
                                type="number"
                                value={q.score}
                                onChange={(e) => handleTheoryQuestionChange(q.id, 'score', Number(e.target.value))}
                                className="w-20 h-10 border border-zinc-300 rounded-lg px-2 text-sm font-bold text-center"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTheoryQuestion(q.id)}
                              className="text-zinc-400 hover:text-red-600 p-1.5"
                            >
                              <i className="fa-solid fa-trash-can text-base" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="block text-sm font-bold text-zinc-700 mb-1.5">โจทย์คำถาม</label>
                          <textarea
                            value={q.question_text}
                            onChange={(e) => handleTheoryQuestionChange(q.id, 'question_text', e.target.value)}
                            rows={2}
                            className="w-full border border-zinc-300 rounded-lg p-3 text-sm font-medium text-zinc-950 focus:ring-1 focus:ring-red-500"
                            placeholder="พิมพ์คำถามข้อสอบ..."
                          />
                        </div>

                        {/* SINGLE / MULTIPLE CHOICES */}
                        {(q.type === 'single_choices' || q.type === 'multiple_choices') && (
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <label className="text-sm font-bold text-zinc-700">
                                {q.type === 'single_choices' ? 'ตัวเลือก (เลือก 1 ข้อเป็นเฉลยคำตอบ):' : 'ตัวเลือก (เลือกหลายข้อเป็นเฉลยคำตอบ):'}
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddTheoryChoice(q.id)}
                                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-plus-circle text-sm" />
                                <span>เพิ่มตัวเลือก</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(q.choices || []).map((choice) => (
                                <div
                                  key={choice.id}
                                  className={`flex items-center gap-2.5 border p-3 rounded-lg transition-all ${
                                    choice.is_correct ? 'bg-emerald-50 border-emerald-400' : 'bg-zinc-50 border-zinc-200'
                                  }`}
                                >
                                  <input
                                    type={q.type === 'single_choices' ? 'radio' : 'checkbox'}
                                    name={`correct_q_${q.id}`}
                                    checked={choice.is_correct}
                                    onChange={() => handleToggleTheoryCorrect(q.id, choice.id, q.type)}
                                    className="w-5 h-5 text-emerald-600 cursor-pointer"
                                  />
                                  <span className="font-bold text-sm text-zinc-500 w-5">{choice.id})</span>
                                  <input
                                    type="text"
                                    value={choice.choice_text}
                                    onChange={(e) => handleTheoryChoiceTextChange(q.id, choice.id, e.target.value)}
                                    className="flex-1 bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium"
                                    placeholder="ข้อความตัวเลือก"
                                  />
                                  {choice.is_correct && (
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                                      เฉลย
                                    </span>
                                  )}
                                  {q.choices.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTheoryChoice(q.id, choice.id)}
                                      className="text-zinc-400 hover:text-red-600 p-1"
                                    >
                                      <i className="fa-solid fa-circle-minus text-sm" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TRUE / FALSE */}
                        {q.type === 'true_false' && (
                          <div className="bg-zinc-50 p-4 border rounded-lg">
                            <label className="block text-sm font-bold text-zinc-700 mb-3">เฉลยคำตอบ ถูก หรือ ผิด:</label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2.5 cursor-pointer bg-white px-4 py-2.5 border rounded-lg hover:border-emerald-500">
                                <input
                                  type="radio"
                                  name={`tf_${q.id}`}
                                  checked={q.true_false_answer === true}
                                  onChange={() => handleTheoryQuestionChange(q.id, 'true_false_answer', true)}
                                  className="w-5 h-5 text-emerald-600"
                                />
                                <span className="font-bold text-sm text-emerald-700">ถูก (True)</span>
                              </label>

                              <label className="flex items-center gap-2.5 cursor-pointer bg-white px-4 py-2.5 border rounded-lg hover:border-red-500">
                                <input
                                  type="radio"
                                  name={`tf_${q.id}`}
                                  checked={q.true_false_answer === false}
                                  onChange={() => handleTheoryQuestionChange(q.id, 'true_false_answer', false)}
                                  className="w-5 h-5 text-red-600"
                                />
                                <span className="font-bold text-sm text-red-700">ผิด (False)</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* MATCHING */}
                        {q.type === 'matching' && (
                          <div className="bg-zinc-50 p-4 border rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-bold text-zinc-700">จับคู่โจทย์และคำตอบ:</label>
                              <button
                                type="button"
                                onClick={() => handleAddMatchingPair(q.id)}
                                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
                              >
                                <i className="fa-solid fa-plus-circle text-sm" />
                                <span>เพิ่มคู่จับคู่</span>
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              {(q.matching_pairs || []).map((pair, pairIdx) => (
                                <div key={pair.id} className="flex items-center gap-2.5 bg-white p-3 border rounded-lg">
                                  <span className="font-bold text-sm text-zinc-500 w-6">{pairIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={pair.left_text}
                                    onChange={(e) => handleMatchingChange(q.id, pair.id, 'left_text', e.target.value)}
                                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                                    placeholder="โจทย์ฝั่งซ้าย"
                                  />
                                  <i className="fa-solid fa-arrow-right-arrow-left text-zinc-400 text-sm px-1" />
                                  <input
                                    type="text"
                                    value={pair.right_text}
                                    onChange={(e) => handleMatchingChange(q.id, pair.id, 'right_text', e.target.value)}
                                    className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm font-medium bg-white"
                                    placeholder="คำตอบฝั่งขวา"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMatchingPair(q.id, pair.id)}
                                    className="text-zinc-400 hover:text-red-650 p-1"
                                  >
                                    <i className="fa-solid fa-circle-minus text-sm" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* TEXT ESSAY */}
                        {q.type === 'text_choices' && (
                          <div className="space-y-3 bg-zinc-50 p-4 border rounded-lg">
                            <div>
                              <label className="block text-sm font-bold text-zinc-700 mb-1.5">ข้อความตัวอย่าง Placeholder</label>
                              <input
                                type="text"
                                value={q.placeholder_text || ''}
                                onChange={(e) => handleTheoryQuestionChange(q.id, 'placeholder_text', e.target.value)}
                                className="w-full h-10 border border-zinc-300 rounded-lg px-3 text-sm bg-white"
                                placeholder="เช่น อธิบายคำตอบ..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-zinc-700 mb-1.5">เฉลยแนวทางคำตอบที่ถูกต้อง</label>
                              <textarea
                                value={q.correct_answer_text || ''}
                                onChange={(e) => handleTheoryQuestionChange(q.id, 'correct_answer_text', e.target.value)}
                                rows={2}
                                className="w-full border border-zinc-300 rounded-lg p-3 text-sm font-medium bg-white"
                                placeholder="คำตอบสำหรับใช้ตรวจ..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-end gap-3 z-20">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-zinc-100 text-zinc-700 font-bold rounded-lg hover:bg-zinc-200 text-sm"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTheoryExam}
                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-sm shadow-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-floppy-disk text-sm" />
                    <span>บันทึกข้อสอบ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL #3: PRACTICAL EXAM WITH 3-4 LEVEL HIERARCHICAL TREE BUILDER */}
          {activeModal === 'practical_exam' && selectedCourse && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-xl border border-zinc-200 my-8">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-20 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                      <i className="fa-solid fa-list-check text-red-600" />
                      <span>จัดการชุดประเมินภาคปฏิบัติ</span>
                    </h3>
                    <p className="text-sm text-zinc-600 font-medium mt-0.5">คอร์ส: {selectedCourse.course_name}</p>
                  </div>
                  <button onClick={closeModal} className="text-zinc-400 hover:text-red-600 p-2">
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Selector */}
                  <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-bold text-zinc-900 shrink-0">เลือกชุดประเมินปฏิบัติ:</span>
                      <select
                        value={selectedPracticalExamId || ''}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedPracticalExamId(id);
                          const found = practicalExams.find((t) => t.id === id);
                          if (found) setPracticalFormData(found);
                        }}
                        className="h-11 px-4 border border-zinc-300 rounded-lg bg-white text-sm font-bold text-zinc-950 flex-1 min-w-0 shadow-2xs"
                      >
                        {practicalExams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.practical_items?.length || 0} หมวดหลัก)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPracticalExamId(null);
                        resetPracticalFormData(selectedCourse.id);
                      }}
                      className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-bold text-sm hover:bg-amber-700 transition-all flex items-center gap-2 shadow-sm shrink-0"
                    >
                      <i className="fa-solid fa-plus text-sm" />
                      <span>สร้างชุดปฏิบัติ</span>
                    </button>
                  </div>

                  {/* Practical Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-zinc-50 p-5 rounded-xl border border-zinc-300">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-zinc-950 mb-1.5 flex items-center gap-1.5">
                        <span>ชื่อชุดประเมินภาคปฏิบัติ</span>
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={practicalFormData.title || ''}
                        onChange={(e) => setPracticalFormData({ ...practicalFormData, title: e.target.value })}
                        placeholder="กรอกชื่อชุดประเมิน"
                        className="w-full h-12 border border-zinc-300 rounded-lg px-4 text-base font-bold text-zinc-950 bg-white focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-950 mb-1.5">เวลาทดสอบปฏิบัติ (นาที)</label>
                      <input
                        type="number"
                        value={practicalFormData.time_limit_minutes || 180}
                        onChange={(e) => setPracticalFormData({ ...practicalFormData, time_limit_minutes: Number(e.target.value) })}
                        className="w-full h-12 border border-zinc-300 rounded-lg px-4 text-base font-bold text-zinc-950 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-950 mb-1.5">เกณฑ์ผ่านประเมิน (%)</label>
                      <input
                        type="number"
                        value={practicalFormData.passing_percentage || 75}
                        onChange={(e) => setPracticalFormData({ ...practicalFormData, passing_percentage: Number(e.target.value) })}
                        className="w-full h-12 border border-zinc-300 rounded-lg px-4 text-base font-bold text-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* Hierarchical Multi-Level Practical Assessment Tree */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-100 p-4 rounded-xl border border-zinc-300">
                      <div>
                        <h5 className="text-base font-bold text-zinc-950 flex items-center gap-2">
                          <i className="fa-solid fa-sitemap text-red-600" />
                          <span>โครงสร้างเกณฑ์ประเมินแบบเพิ่มข้อย่อยซ้อน 3-4 ชั้น ({(practicalFormData.practical_items || []).length} หมวดหลัก)</span>
                        </h5>
                        <p className="text-xs text-zinc-700 font-bold mt-1">
                          ลำดับชั้น: หมวดหลัก (ชั้น 1) ➔ หัวข้อย่อย (ชั้น 2) ➔ รายการประเมิน (ชั้น 3) ➔ เกณฑ์ย่อย (ชั้น 4)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTopLevelPracticalItem}
                        className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-md shrink-0"
                      >
                        <i className="fa-solid fa-plus text-sm" />
                        <span>+ เพิ่มหมวดหลัก (ชั้น 1)</span>
                      </button>
                    </div>

                    {(practicalFormData.practical_items || []).map((item, idx) => (
                      <PracticalNodeEditor
                        key={item.id || idx}
                        item={item}
                        level={1}
                        onUpdate={(updated) => handleTopLevelPracticalUpdate(idx, updated)}
                        onDelete={() => handleTopLevelPracticalDelete(idx)}
                      />
                    ))}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-end gap-3 z-20">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-3 bg-zinc-100 text-zinc-700 font-bold rounded-lg hover:bg-zinc-200 text-sm"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePracticalExam}
                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-sm shadow-md flex items-center gap-2"
                  >
                    <i className="fa-solid fa-floppy-disk text-sm" />
                    <span>บันทึกชุดประเมิน</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL #4: REPORT */}
          {activeModal === 'report' && selectedCourse && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border border-zinc-200 my-8">
                <div className="p-5 border-b border-zinc-200 flex justify-between items-center sticky top-0 bg-white z-20">
                  <div>
                    <h3 className="text-base font-bold text-zinc-950">รายงานผลการทดสอบคอร์สเรียน</h3>
                    <p className="text-xs text-zinc-500 font-medium">คอร์ส: {selectedCourse.course_name}</p>
                  </div>
                  <button onClick={closeModal} className="text-zinc-400 hover:text-red-600 p-1">
                    <i className="fa-solid fa-xmark text-lg" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="border border-zinc-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse font-medium">
                      <thead>
                        <tr className="bg-zinc-100 text-zinc-900 border-b border-zinc-200 font-bold">
                          <th className="p-3">ลำดับ</th>
                          <th className="p-3">ผู้เข้ารับการทดสอบ</th>
                          <th className="p-3">บัตรประชาชน</th>
                          <th className="p-3 text-center" colSpan={2}>ภาคความรู้ (ทฤษฎี)</th>
                          <th className="p-3 text-center" colSpan={2}>ภาคความสามารถ (ปฏิบัติ)</th>
                          <th className="p-3 text-center" colSpan={2}>รวมคะแนน</th>
                          <th className="p-3">ผลการทดสอบ</th>
                        </tr>
                        <tr className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 font-bold">
                          <th className="p-2"></th>
                          <th className="p-2"></th>
                          <th className="p-2"></th>
                          <th className="p-2 text-center">เต็ม</th>
                          <th className="p-2 text-center">ได้</th>
                          <th className="p-2 text-center">เต็ม</th>
                          <th className="p-2 text-center">ได้</th>
                          <th className="p-2 text-center">เต็ม</th>
                          <th className="p-2 text-center">ได้</th>
                          <th className="p-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        <tr>
                          <td className="p-3 font-bold">1</td>
                          <td className="p-3 font-bold text-zinc-950">นาย สมชาย ใจดี</td>
                          <td className="p-3 text-zinc-600">1234567890123</td>
                          <td className="p-3 text-center">50</td>
                          <td className="p-3 text-center font-bold text-blue-600">45</td>
                          <td className="p-3 text-center">50</td>
                          <td className="p-3 text-center font-bold text-amber-600">42</td>
                          <td className="p-3 text-center font-bold text-zinc-950">100</td>
                          <td className="p-3 text-center font-bold text-emerald-600">87</td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">ผ่าน</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-md hover:bg-zinc-800"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-red-600"></span>
        </div>
      }
    >
      <AdminDashboardContent />
    </React.Suspense>
  );
}
