// =====================================================================
// Data access layer — every read/write to Supabase goes through here.
// No mock data: failures throw and are shown to the user via errorMessage().
// =====================================================================

import { supabase } from './supabase/client';
import type {
  AnswerMap,
  ApprovalStatus,
  DocumentField,
  EnrollmentStatus,
  ExamAttempt,
  LaborHistory,
  PracticalRound,
  PracticalScore,
  ResultStatus,
  Role,
  TestForm,
  TrainingApplication,
  TrainingCourse,
  User,
} from './types';
import { buildQuestionSnapshot, gradeAttempt, normalizeTree, treeMax } from './scoring';
import { legacyBetween } from './format';

// password_hash is never selectable by the browser (column privileges), so list columns explicitly.
export const USER_COLUMNS = [
  'id', 'th_human_number', 'title_th', 'first_name_th', 'last_name_th', 'title_en', 'first_name_en', 'last_name_en',
  'gender_id', 'sex_name', 'nationality_name', 'birth_day', 'phone_number', 'email', 'house_number', 'house_group',
  'road_name', 'alley_name', 'province_name', 'district_name', 'subdistrict_name', 'zip_code', 'education_level',
  'branch_name', 'physical_id', 'disability_types', 'id_photo_file_pathname', 'identification_file_pathname',
  'eq_file_pathname', 'is_allowed', 'is_admin', 'role', 'position_title', 'created_at',
].join(',');

/** Profile fields a signed-in person may edit on their own record. */
export const EDITABLE_USER_FIELDS = [
  'title_th', 'first_name_th', 'last_name_th', 'title_en', 'first_name_en', 'last_name_en', 'sex_name',
  'nationality_name', 'birth_day', 'phone_number', 'email', 'house_number', 'house_group', 'road_name', 'alley_name',
  'province_name', 'district_name', 'subdistrict_name', 'zip_code', 'education_level', 'branch_name', 'physical_id',
  'disability_types',
] as const;

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---------------------------------------------------------------------
// Session (token issued by tmrda_login / tmrda_register, kept in localStorage)
// ---------------------------------------------------------------------

const SESSION_KEY = 'tmrda_session_v2';

export interface StoredSession {
  token: string;
  user: User;
}

export const session = {
  read(): StoredSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },
  write(s: StoredSession | null) {
    if (typeof window === 'undefined') return;
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('tmrda_current_user'); // legacy v1 key
  },
  token(): string {
    const s = session.read();
    if (!s) throw new Error('SESSION_EXPIRED');
    return s.token;
  },
};

export function normalizeUser(raw: Record<string, unknown>): User {
  const u = raw as unknown as User;
  return { ...u, role: (u.role as Role) || (u.is_admin === 1 ? 'admin' : 'user') };
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

export const auth = {
  async login(identifier: string, password: string): Promise<StoredSession> {
    const data = check(await supabase.rpc('tmrda_login', { p_identifier: identifier, p_password: password })) as {
      token: string;
      user: Record<string, unknown>;
    };
    const s = { token: data.token, user: normalizeUser(data.user) };
    session.write(s);
    return s;
  },

  async register(data: Partial<User>, password: string): Promise<StoredSession> {
    const res = check(await supabase.rpc('tmrda_register', { p_data: data, p_password: password })) as {
      token: string;
      user: Record<string, unknown>;
    };
    const s = { token: res.token, user: normalizeUser(res.user) };
    session.write(s);
    return s;
  },

  /** Validates the stored token and returns a fresh copy of the user. */
  async refresh(): Promise<User> {
    const s = session.read();
    if (!s) throw new Error('SESSION_EXPIRED');
    const raw = check(await supabase.rpc('tmrda_session', { p_token: s.token })) as Record<string, unknown>;
    const user = normalizeUser(raw);
    session.write({ token: s.token, user });
    return user;
  },

  async logout() {
    const s = session.read();
    session.write(null);
    if (s) await supabase.rpc('tmrda_logout', { p_token: s.token });
  },

  async changePassword(oldPassword: string, newPassword: string) {
    check(await supabase.rpc('tmrda_change_password', { p_token: session.token(), p_old: oldPassword, p_new: newPassword }));
  },
};

/** True when the v2 migration has been applied (used to show a setup banner). */
export async function schemaReady(): Promise<boolean> {
  const { error } = await supabase.from('exam_attempts').select('id').limit(1);
  return !error;
}

// ---------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------

export const users = {
  async list(): Promise<User[]> {
    const data = check(await supabase.from('users').select(USER_COLUMNS).order('id'));
    return (data as unknown as Record<string, unknown>[]).map(normalizeUser);
  },

  async get(id: number): Promise<User> {
    const data = check(await supabase.from('users').select(USER_COLUMNS).eq('id', id).single());
    return normalizeUser(data as unknown as Record<string, unknown>);
  },

  async byIds(ids: number[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const data = check(await supabase.from('users').select(USER_COLUMNS).in('id', ids));
    return (data as unknown as Record<string, unknown>[]).map(normalizeUser);
  },

  async staff(): Promise<User[]> {
    const data = check(
      await supabase.from('users').select(USER_COLUMNS).in('role', ['admin', 'director', 'evaluator']).order('role')
    );
    return (data as unknown as Record<string, unknown>[]).map(normalizeUser);
  },

  async updateProfile(id: number, fields: Partial<User>): Promise<User> {
    const payload: Record<string, unknown> = {};
    for (const k of EDITABLE_USER_FIELDS) if (k in fields) payload[k] = (fields as Record<string, unknown>)[k];
    const data = check(await supabase.from('users').update(payload).eq('id', id).select(USER_COLUMNS).single());
    return normalizeUser(data as unknown as Record<string, unknown>);
  },

  /** Admin only (checked in the database): create staff, change role / access / password. */
  async adminSave(userId: number | null, data: Partial<User> & { role: Role }, password?: string): Promise<User> {
    const raw = check(
      await supabase.rpc('tmrda_admin_save_user', {
        p_token: session.token(),
        p_user_id: userId,
        p_data: data,
        p_password: password || null,
      })
    ) as Record<string, unknown>;
    return normalizeUser(raw);
  },

  async uploadDocument(userId: number, field: DocumentField, file: File): Promise<User> {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `user_documents/${userId}/${field}_${Date.now()}.${ext}`;
    const up = await supabase.storage.from('documents').upload(path, file, { cacheControl: '3600', upsert: true });
    if (up.error) throw new Error(up.error.message);
    const url = supabase.storage.from('documents').getPublicUrl(path).data.publicUrl;
    const data = check(await supabase.from('users').update({ [field]: url }).eq('id', userId).select(USER_COLUMNS).single());
    return normalizeUser(data as unknown as Record<string, unknown>);
  },
};

export function documentUrl(u: User | null | undefined, field: DocumentField): string | null {
  const v = u?.[field];
  return v && /^https?:\/\//.test(v) ? v : null;
}

// ---------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------

export const courses = {
  async list(opts: { publishedOnly?: boolean } = {}): Promise<TrainingCourse[]> {
    let q = supabase.from('training').select('*').order('startswith_date', { ascending: false, nullsFirst: false });
    if (opts.publishedOnly) q = q.neq('is_published', false);
    return check(await q) as TrainingCourse[];
  },

  async get(id: number): Promise<TrainingCourse> {
    return check(await supabase.from('training').select('*').eq('id', id).single()) as TrainingCourse;
  },

  async save(c: Partial<TrainingCourse>): Promise<TrainingCourse> {
    const payload = {
      agency_name: c.agency_name ?? '',
      course_name: c.course_name ?? '',
      course_name_en: c.course_name_en ?? '',
      traning_hours: Number(c.traning_hours) || 0,
      branch_name: c.branch_name ?? '',
      level_name: c.level_name ?? '',
      startswith_date: c.startswith_date || null,
      endswith_date: c.endswith_date || null,
      between_date: legacyBetween(c.startswith_date, c.endswith_date),
      limit_course: Number(c.limit_course) || 0,
      executive_name: c.executive_name ?? '',
      description: c.description ?? '',
      location: c.location ?? '',
      is_published: c.is_published ?? true,
    };
    const res = c.id
      ? await supabase.from('training').update(payload).eq('id', c.id).select().single()
      : await supabase.from('training').insert(payload).select().single();
    return check(res) as TrainingCourse;
  },

  async remove(id: number) {
    check(await supabase.from('training').delete().eq('id', id));
  },
};

// ---------------------------------------------------------------------
// Applications (apply_training)
// ---------------------------------------------------------------------

export const applications = {
  async list(filter: { userId?: number; trainingId?: number; approval?: ApprovalStatus[]; ids?: number[] } = {}) {
    let q = supabase.from('apply_training').select('*').order('created_at', { ascending: true });
    if (filter.userId) q = q.eq('user_id', filter.userId);
    if (filter.trainingId) q = q.eq('training_id', filter.trainingId);
    if (filter.approval) q = q.in('approval_status', filter.approval);
    if (filter.ids) q = q.in('id', filter.ids.length ? filter.ids : [-1]);
    return check(await q) as TrainingApplication[];
  },

  async get(id: number): Promise<TrainingApplication> {
    return check(await supabase.from('apply_training').select('*').eq('id', id).single()) as TrainingApplication;
  },

  async apply(userId: number, trainingId: number, opts: { applicant_type: string; is_skill_testing: boolean }) {
    return check(
      await supabase
        .from('apply_training')
        .insert({
          user_id: userId,
          training_id: trainingId,
          applicant_type: opts.applicant_type,
          is_skill_testing: opts.is_skill_testing,
          status: 'รอพิจารณา',
        })
        .select()
        .single()
    ) as TrainingApplication;
  },

  async withdraw(id: number) {
    check(await supabase.from('apply_training').delete().eq('id', id));
  },

  async setEnrollment(ids: number[], status: EnrollmentStatus) {
    check(
      await supabase
        .from('apply_training')
        .update({ status, is_accept: status === 'อนุมัติ' ? 1 : 0, reviewed_at: new Date().toISOString() })
        .in('id', ids)
    );
  },

  async assignRound(ids: number[], roundId: number | null) {
    check(await supabase.from('apply_training').update({ practical_round_id: roundId }).in('id', ids));
  },

  /** Admin → director. Rows carry the frozen result snapshot. */
  async submitForApproval(
    rows: {
      application_id: number;
      theory_score: number | null;
      theory_max: number | null;
      theory_passed: boolean | null;
      practical_score: number | null;
      practical_max: number | null;
      practical_passed: boolean | null;
      result_status: ResultStatus;
    }[]
  ): Promise<number> {
    return check(await supabase.rpc('tmrda_submit_results', { p_token: session.token(), p_rows: rows })) as number;
  },

  async recall(ids: number[]): Promise<number> {
    return check(await supabase.rpc('tmrda_recall_results', { p_token: session.token(), p_application_ids: ids })) as number;
  },

  /** Director only (checked in the database). Approval issues certificate numbers. */
  async decide(ids: number[], decision: 'approved' | 'rejected', note = ''): Promise<number> {
    return check(
      await supabase.rpc('tmrda_decide_results', {
        p_token: session.token(),
        p_application_ids: ids,
        p_decision: decision,
        p_note: note,
      })
    ) as number;
  },
};

// ---------------------------------------------------------------------
// Labor history
// ---------------------------------------------------------------------

export const labor = {
  async get(userId: number): Promise<LaborHistory | null> {
    const data = check(await supabase.from('histories_labor').select('*').eq('user_id', userId).maybeSingle());
    return (data as unknown as LaborHistory | null) || null;
  },

  async save(h: LaborHistory): Promise<LaborHistory> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...rest } = h as LaborHistory & { created_at?: string };
    const existing = await labor.get(h.user_id);
    const res = existing
      ? await supabase.from('histories_labor').update(rest).eq('id', existing.id!).select().single()
      : await supabase.from('histories_labor').insert(rest).select().single();
    return check(res) as LaborHistory;
  },
};

// ---------------------------------------------------------------------
// Test forms
// ---------------------------------------------------------------------

function normalizeForm(f: Record<string, unknown>): TestForm {
  const form = f as unknown as TestForm;
  return {
    ...form,
    exam_type: form.exam_type || 'theory',
    questions: Array.isArray(form.questions) ? form.questions : [],
    practical_items: Array.isArray(form.practical_items) ? form.practical_items : [],
    max_attempts: form.max_attempts ?? 1,
    show_answers: form.show_answers ?? true,
  };
}

export const forms = {
  async list(filter: { trainingId?: number; type?: 'theory' | 'practical' } = {}): Promise<TestForm[]> {
    let q = supabase.from('test_form').select('*').order('id');
    if (filter.trainingId) q = q.eq('training_id', filter.trainingId);
    if (filter.type) q = q.eq('exam_type', filter.type);
    return (check(await q) as Record<string, unknown>[]).map(normalizeForm);
  },

  async get(id: number): Promise<TestForm> {
    return normalizeForm(check(await supabase.from('test_form').select('*').eq('id', id).single()) as Record<string, unknown>);
  },

  async save(f: Partial<TestForm> & { training_id: number; exam_type: 'theory' | 'practical' }): Promise<TestForm> {
    const questions = f.exam_type === 'theory' ? f.questions || [] : [];
    const practical = f.exam_type === 'practical' ? normalizeTree(f.practical_items || []) : [];
    const total =
      f.exam_type === 'theory' ? questions.reduce((s, q) => s + (Number(q.score) || 0), 0) : treeMax(practical);
    const payload = {
      training_id: f.training_id,
      exam_type: f.exam_type,
      title: f.title?.trim() || (f.exam_type === 'theory' ? 'แบบทดสอบภาคทฤษฎี' : 'แบบประเมินภาคปฏิบัติ'),
      description: f.description ?? '',
      time_limit_minutes: Math.max(1, Number(f.time_limit_minutes) || 60),
      passing_percentage: Math.min(100, Math.max(0, Number(f.passing_percentage) || 0)),
      total_score: total,
      score_knowledge_max: f.exam_type === 'theory' ? total : 0,
      score_practice_max: f.exam_type === 'practical' ? total : 0,
      is_active: f.is_active ?? true,
      exam_start_date: f.exam_start_date || null,
      exam_end_date: f.exam_end_date || null,
      max_attempts: Math.max(1, Number(f.max_attempts) || 1),
      show_answers: f.show_answers ?? true,
      randomize_questions: Boolean(f.randomize_questions),
      randomize_choices: Boolean(f.randomize_choices),
      questions,
      practical_items: practical,
    };
    const res = f.id
      ? await supabase.from('test_form').update(payload).eq('id', f.id).select().single()
      : await supabase.from('test_form').insert(payload).select().single();
    return normalizeForm(check(res) as Record<string, unknown>);
  },

  async remove(id: number) {
    check(await supabase.from('test_form').delete().eq('id', id));
  },
};

// ---------------------------------------------------------------------
// Theory exam attempts
// ---------------------------------------------------------------------

export const attempts = {
  async list(filter: { userId?: number; trainingId?: number; formId?: number; applicationIds?: number[] } = {}) {
    let q = supabase.from('exam_attempts').select('*').order('started_at', { ascending: false });
    if (filter.userId) q = q.eq('user_id', filter.userId);
    if (filter.trainingId) q = q.eq('training_id', filter.trainingId);
    if (filter.formId) q = q.eq('test_form_id', filter.formId);
    if (filter.applicationIds) q = q.in('application_id', filter.applicationIds.length ? filter.applicationIds : [-1]);
    return check(await q) as ExamAttempt[];
  },

  async get(id: number): Promise<ExamAttempt> {
    return check(await supabase.from('exam_attempts').select('*').eq('id', id).single()) as ExamAttempt;
  },

  /** Creates an attempt with a frozen (optionally shuffled) copy of the questions and a server-side deadline. */
  async start(user: User, app: TrainingApplication, form: TestForm): Promise<ExamAttempt> {
    const seed = (user.id * 7919 + form.id * 104729 + Date.now()) % 2147483647;
    const snapshot = buildQuestionSnapshot(form.questions, {
      randomizeQuestions: form.randomize_questions,
      randomizeChoices: form.randomize_choices,
      seed,
    });
    const max = snapshot.reduce((s, q) => s + (Number(q.score) || 0), 0);
    const now = Date.now();
    let deadline = now + Math.max(1, form.time_limit_minutes) * 60_000;
    if (form.exam_end_date) deadline = Math.min(deadline, new Date(form.exam_end_date).getTime());
    return check(
      await supabase
        .from('exam_attempts')
        .insert({
          user_id: user.id,
          training_id: form.training_id,
          test_form_id: form.id,
          application_id: app.id,
          question_snapshot: snapshot,
          max_score: max,
          passing_percentage: form.passing_percentage,
          status: 'in_progress',
          deadline_at: new Date(deadline).toISOString(),
        })
        .select()
        .single()
    ) as ExamAttempt;
  },

  async saveAnswers(id: number, answers: AnswerMap) {
    check(await supabase.from('exam_attempts').update({ answers }).eq('id', id).eq('status', 'in_progress'));
  },

  async submit(attempt: ExamAttempt, answers: AnswerMap): Promise<ExamAttempt> {
    try {
      return await attempts.submitRaw(attempt, answers);
    } catch (e) {
      // Past the server deadline the DB refuses new answers — grade what was saved in time.
      if (e instanceof Error && e.message.includes('ATTEMPT_EXPIRED')) {
        const fresh = await attempts.get(attempt.id);
        if (fresh.status !== 'in_progress') return fresh;
        return attempts.submitRaw(fresh, fresh.answers || {});
      }
      throw e;
    }
  },

  /**
   * Close attempts whose deadline has passed but were never submitted (candidate left the page),
   * grading the answers saved before the deadline. Returns the list with those attempts replaced.
   */
  async finalizeExpired(list: ExamAttempt[]): Promise<ExamAttempt[]> {
    const now = Date.now();
    const expired = list.filter((a) => a.status === 'in_progress' && a.deadline_at && new Date(a.deadline_at).getTime() < now);
    if (expired.length === 0) return list;
    const done = await Promise.all(
      expired.map((a) => attempts.submit(a, a.answers || {}).catch(() => a))
    );
    const byId = new Map(done.map((a) => [a.id, a]));
    return list.map((a) => byId.get(a.id) || a);
  },

  async submitRaw(attempt: ExamAttempt, answers: AnswerMap): Promise<ExamAttempt> {
    const g = gradeAttempt(attempt.question_snapshot, answers, attempt.manual_scores || {}, attempt.passing_percentage);
    return check(
      await supabase
        .from('exam_attempts')
        .update({
          answers,
          auto_score: g.autoScore,
          score: g.score,
          max_score: g.max,
          percent: g.percent,
          passed: g.passed,
          needs_review: g.needsReview,
          status: g.needsReview ? 'submitted' : 'graded',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)
        .eq('status', 'in_progress')
        .select()
        .single()
    ) as ExamAttempt;
  },

  /** Staff grading of essay questions. */
  async grade(attempt: ExamAttempt, manualScores: Record<string, number>, graderId: number): Promise<ExamAttempt> {
    const g = gradeAttempt(attempt.question_snapshot, attempt.answers, manualScores, attempt.passing_percentage);
    return check(
      await supabase
        .from('exam_attempts')
        .update({
          manual_scores: manualScores,
          score: g.score,
          percent: g.percent,
          passed: g.passed,
          needs_review: g.needsReview,
          status: g.needsReview ? 'submitted' : 'graded',
          graded_by: graderId,
          graded_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)
        .select()
        .single()
    ) as ExamAttempt;
  },
};

// ---------------------------------------------------------------------
// Practical rounds & evaluator scores
// ---------------------------------------------------------------------

export const rounds = {
  async list(filter: { trainingId?: number; evaluatorId?: number; ids?: number[] } = {}): Promise<PracticalRound[]> {
    let q = supabase.from('practical_rounds').select('*').order('exam_date', { ascending: true, nullsFirst: false });
    if (filter.trainingId) q = q.eq('training_id', filter.trainingId);
    if (filter.evaluatorId) q = q.contains('evaluator_ids', [filter.evaluatorId]);
    if (filter.ids) q = q.in('id', filter.ids.length ? filter.ids : [-1]);
    return check(await q) as PracticalRound[];
  },

  async get(id: number): Promise<PracticalRound> {
    return check(await supabase.from('practical_rounds').select('*').eq('id', id).single()) as PracticalRound;
  },

  async save(r: Partial<PracticalRound> & { training_id: number; test_form_id: number }): Promise<PracticalRound> {
    const evaluatorIds = Array.from(new Set((r.evaluator_ids || []).map(Number).filter(Boolean)));
    if (evaluatorIds.length > 3) throw new Error('กำหนดผู้ประเมินได้สูงสุด 3 คนต่อรอบ');
    const payload = {
      training_id: r.training_id,
      test_form_id: r.test_form_id,
      name: r.name?.trim() || 'รอบสอบปฏิบัติ',
      exam_date: r.exam_date || null,
      start_time: r.start_time || '09:00',
      location: r.location || '',
      evaluator_ids: evaluatorIds,
      status: r.status || 'open',
    };
    const res = r.id
      ? await supabase.from('practical_rounds').update(payload).eq('id', r.id).select().single()
      : await supabase.from('practical_rounds').insert(payload).select().single();
    return check(res) as PracticalRound;
  },

  async remove(id: number) {
    check(await supabase.from('apply_training').update({ practical_round_id: null }).eq('practical_round_id', id));
    check(await supabase.from('practical_rounds').delete().eq('id', id));
  },
};

export const scores = {
  async list(filter: { roundIds?: number[]; applicationIds?: number[]; evaluatorId?: number } = {}) {
    let q = supabase.from('practical_scores').select('*');
    if (filter.roundIds) q = q.in('round_id', filter.roundIds.length ? filter.roundIds : [-1]);
    if (filter.applicationIds) q = q.in('application_id', filter.applicationIds.length ? filter.applicationIds : [-1]);
    if (filter.evaluatorId) q = q.eq('evaluator_id', filter.evaluatorId);
    return check(await q) as PracticalScore[];
  },

  async save(s: Omit<PracticalScore, 'id' | 'updated_at'>): Promise<PracticalScore> {
    return check(
      await supabase
        .from('practical_scores')
        .upsert({ ...s, updated_at: new Date().toISOString() }, { onConflict: 'round_id,application_id,evaluator_id' })
        .select()
        .single()
    ) as PracticalScore;
  },
};
