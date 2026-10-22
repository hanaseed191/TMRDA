/**
 * End-to-end test of the whole TMRDA workflow against the REAL Supabase database,
 * using the same data layer as the web app (lib/api.ts, lib/results.ts).
 *
 *   npx tsx tests/e2e/full-flow.ts
 *
 * Creates a new course "หลักสูตรทดสอบระบบ E2E <time>" with a theory exam (incl. an essay),
 * a practical form and a round with 3 evaluators, then runs 5 candidates through:
 * apply → staff approve → theory exam → essay grading → practical round →
 * 3 evaluators score (4 pass, 1 fail) → staff send to director → director approves → certificates.
 * The data is kept so it can be inspected in the UI afterwards.
 *
 * Staff credentials default to the seeded demo accounts; override with
 * E2E_ADMIN / E2E_ADMIN_PW, E2E_DIRECTOR / E2E_DIRECTOR_PW, E2E_EVALUATOR_PW.
 */

/* ---------- browser storage shim (lib/api keeps the session in localStorage) ---------- */
const store = new Map<string, string>();
const g = globalThis as unknown as Record<string, unknown>;
g.window = globalThis;
g.localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};

type Api = typeof import('../../lib/api');
type Results = typeof import('../../lib/results');
type Types = typeof import('../../lib/types');

const env = (k: string, d: string) => process.env[k] || d;
const STAFF = {
  admin: [env('E2E_ADMIN', '1111111111111'), env('E2E_ADMIN_PW', 'admin123')],
  director: [env('E2E_DIRECTOR', '3333333333333'), env('E2E_DIRECTOR_PW', 'director123')],
  evaluators: ['4444444444441', '4444444444442', '4444444444443'].map((id) => [id, env('E2E_EVALUATOR_PW', 'evaluator123')]),
};

let failures = 0;
const warnings: string[] = [];
const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const warn = (msg: string) => {
  warnings.push(msg);
  console.log(`  ⚠ ${msg}`);
};
function check(cond: unknown, msg: string): asserts cond {
  if (cond) ok(msg);
  else {
    failures++;
    console.log(`  ✗ ${msg}`);
  }
}
async function expectError(p: Promise<unknown>, pattern: RegExp, msg: string) {
  try {
    await p;
    failures++;
    console.log(`  ✗ ${msg} — expected an error but the call succeeded`);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    if (pattern.test(m)) ok(`${msg} (${m.slice(0, 60)})`);
    else {
      failures++;
      console.log(`  ✗ ${msg} — unexpected error: ${m}`);
    }
  }
}
const step = (t: string) => console.log(`\n▶ ${t}`);

/** Random valid Thai citizen ID (mod-11 checksum). */
function citizenId(): string {
  const base = '1' + String(Math.floor(Math.random() * 1e11)).padStart(11, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(base[i]) * (13 - i);
  return base + ((11 - (sum % 11)) % 10);
}

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => new Date(today.getTime() + n * 86400000);

async function main() {
  const api: Api = await import('../../lib/api');
  const R: Results = await import('../../lib/results');
  const { supabase } = await import('../../lib/supabase/client');
  const scoring = await import('../../lib/scoring');
  void ({} as Types);

  const as = async (identifier: string, password: string) => (await api.auth.login(identifier, password)).user;
  const stamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

  // ------------------------------------------------------------------
  step('1. เจ้าหน้าที่สร้างหลักสูตร ข้อสอบทฤษฎี แบบประเมินปฏิบัติ และรอบสอบ');
  const admin = await as(STAFF.admin[0], STAFF.admin[1]);
  check(admin.role === 'admin', `เข้าสู่ระบบเจ้าหน้าที่ (${admin.first_name_th})`);
  const adminSession = api.session.read()!;

  const course = await api.courses.save({
    agency_name: 'สถาบันพัฒนาฝีมือแรงงาน ภาค 1',
    course_name: `หลักสูตรทดสอบระบบ E2E ${stamp}`,
    course_name_en: 'E2E Test Course',
    traning_hours: 30,
    branch_name: 'ช่างอุตสาหการ',
    level_name: 'ระดับ 1',
    startswith_date: iso(addDays(-1)),
    endswith_date: iso(addDays(30)),
    limit_course: 10,
    executive_name: 'ผู้อำนวยการสถาบัน',
    description: 'สร้างโดยสคริปต์ทดสอบระบบอัตโนมัติ (tests/e2e/full-flow.ts)',
    location: 'อาคารทดสอบ',
    is_published: true,
  });
  check(course.id > 0, `สร้างหลักสูตร #${course.id} "${course.course_name}"`);

  const questions = [
    { id: 1, type: 'single_choices', score: 2, question_text: 'อุปกรณ์ป้องกันดวงตาขณะเชื่อมคือข้อใด', choices: [
      { id: 'a', choice_text: 'แว่นกันแดด', is_correct: false }, { id: 'b', choice_text: 'หน้ากากเชื่อม', is_correct: true }] },
    { id: 2, type: 'multiple_choices', score: 2, question_text: 'ข้อใดเป็นอุปกรณ์ป้องกันส่วนบุคคล', choices: [
      { id: 'a', choice_text: 'ถุงมือหนัง', is_correct: true }, { id: 'b', choice_text: 'รองเท้านิรภัย', is_correct: true }, { id: 'c', choice_text: 'นาฬิกา', is_correct: false }] },
    { id: 3, type: 'true_false', score: 1, question_text: 'ควรตัดไฟก่อนซ่อมเครื่องเชื่อม', choices: [], true_false_answer: true },
    { id: 4, type: 'matching', score: 2, question_text: 'จับคู่ท่าเชื่อม', choices: [], matching_pairs: [
      { id: 'p1', left_text: '1G', right_text: 'ท่าราบ' }, { id: 'p2', left_text: '4G', right_text: 'ท่าเหนือศีรษะ' }] },
    { id: 5, type: 'short_answer', score: 1, question_text: 'แรงดันไฟบ้าน 1 เฟส (โวลต์)', choices: [], accepted_answers: ['220', '230'] },
    { id: 6, type: 'text_choices', score: 2, question_text: 'อธิบายการเตรียมชิ้นงานก่อนเชื่อม', choices: [], correct_answer_text: 'ทำความสะอาด บากขอบ จัดระยะ' },
  ] as import('../../lib/types').ExamQuestion[];
  for (const [i, q] of questions.entries()) check(scoring.validateQuestion(q, i) === null, `ข้อ ${i + 1} (${q.type}) ผ่านการตรวจความถูกต้อง`);

  const theory = await api.forms.save({
    training_id: course.id,
    exam_type: 'theory',
    title: 'ทฤษฎี E2E',
    description: 'ชุดข้อสอบทดสอบระบบ',
    time_limit_minutes: 30,
    passing_percentage: 60,
    max_attempts: 1,
    show_answers: true,
    is_active: true,
    exam_start_date: addDays(-1).toISOString(),
    exam_end_date: addDays(30).toISOString(),
    questions,
  });
  check(theory.total_score === 10, `ข้อสอบทฤษฎี #${theory.id} คะแนนเต็ม ${theory.total_score}`);

  const practicalItems = [
    { id: 1, item_name: 'ความปลอดภัย', max_score: 0, children: [
      { id: 11, item_name: 'สวมอุปกรณ์ป้องกัน', max_score: 10, children: [] },
      { id: 12, item_name: 'ตรวจเครื่องมือ', max_score: 10, children: [] }] },
    { id: 2, item_name: 'คุณภาพงานเชื่อม', max_score: 0, children: [
      { id: 21, item_name: 'แนวเชื่อมสม่ำเสมอ', max_score: 15, children: [] },
      { id: 22, item_name: 'ไม่มีรูพรุน', max_score: 15, children: [] }] },
  ];
  const practical = await api.forms.save({
    training_id: course.id,
    exam_type: 'practical',
    title: 'ปฏิบัติ E2E',
    passing_percentage: 60,
    time_limit_minutes: 120,
    is_active: true,
    practical_items: practicalItems,
  });
  check(practical.total_score === 50 && practical.practical_items[0].max_score === 20, `แบบประเมินปฏิบัติ #${practical.id} เต็ม 50 (หัวข้อแม่รวมคะแนนลูกอัตโนมัติ)`);

  const staff = await api.users.staff();
  const evaluatorUsers = STAFF.evaluators.map(([cid]) => staff.find((u) => u.th_human_number === cid));
  check(evaluatorUsers.every(Boolean), 'พบผู้ประเมินครบ 3 ท่าน');
  await expectError(
    api.rounds.save({ training_id: course.id, test_form_id: practical.id, name: 'x', evaluator_ids: [1, 2, 3, 4] }),
    /สูงสุด 3/,
    'กำหนดผู้ประเมินเกิน 3 คนไม่ได้'
  );
  const round = await api.rounds.save({
    training_id: course.id,
    test_form_id: practical.id,
    name: 'รอบทดสอบ E2E',
    exam_date: iso(addDays(3)),
    start_time: '09:00',
    location: 'โรงฝึกงาน E2E',
    evaluator_ids: evaluatorUsers.map((u) => u!.id),
  });
  check(round.evaluator_ids.length === 3, `สร้างรอบสอบ #${round.id} พร้อมผู้ประเมิน 3 ท่าน`);

  // ------------------------------------------------------------------
  step('2. ผู้สมัคร 5 คนสมัครสมาชิกและสมัครหลักสูตร');
  const names = [
    ['นาย', 'ทดสอบหนึ่ง', 'อีทูอี'],
    ['นางสาว', 'ทดสอบสอง', 'อีทูอี'],
    ['นาย', 'ทดสอบสาม', 'อีทูอี'],
    ['นาง', 'ทดสอบสี่', 'อีทูอี'],
    ['นาย', 'ทดสอบห้า', 'อีทูอี'],
  ];
  const run = Date.now().toString(36);
  const students: { user: import('../../lib/types').User; session: NonNullable<ReturnType<Api['session']['read']>>; app?: import('../../lib/types').TrainingApplication; password: string }[] = [];
  for (const [i, [title, first, last]] of names.entries()) {
    const password = 'test1234';
    const s = await api.auth.register(
      {
        th_human_number: citizenId(),
        title_th: title,
        first_name_th: first,
        last_name_th: last,
        title_en: title === 'นาย' ? 'Mr.' : title === 'นาง' ? 'Mrs.' : 'Ms.',
        first_name_en: `Test${i + 1}`,
        last_name_en: 'E2E',
        sex_name: title === 'นาย' ? 'ชาย' : 'หญิง',
        birth_day: '1998-05-1' + i,
        phone_number: `08100000${10 + i}`,
        email: `e2e.${run}.${i + 1}@tmrda.test`,
        house_number: `${i + 1}/9`,
        province_name: 'กรุงเทพมหานคร',
        district_name: 'เขตจตุจักร',
        subdistrict_name: 'จตุจักร',
        zip_code: '10900',
        education_level: 'ประกาศนียบัตรวิชาชีพ (ปวช.)',
        branch_name: 'ช่างกลโรงงาน',
      },
      password
    );
    students.push({ user: s.user, session: s, password });
    const app = await api.applications.apply(s.user.id, course.id, { applicant_type: 'บุคคลทั่วไป', is_skill_testing: true });
    students[i].app = app;
  }
  check(students.length === 5 && students.every((s) => s.user.role === 'user'), 'สมัครสมาชิก 5 คน (บทบาท = ผู้สมัคร)');
  check(students.every((s) => s.app?.status === 'รอพิจารณา'), 'สมัครหลักสูตรแล้ว สถานะ "รอพิจารณา"');
  await expectError(
    api.auth.register({ ...students[0].user, email: `dup.${run}@tmrda.test` }, 'test1234'),
    /DUPLICATE_ID/,
    'สมัครซ้ำด้วยเลขบัตรเดิมไม่ได้'
  );

  // A candidate cannot start the exam before staff approve the application
  api.session.write(students[0].session);
  await expectError(api.attempts.start(students[0].user, students[0].app!, theory), /NOT_ELIGIBLE/, 'ยังไม่ได้รับสิทธิ์สอบ เริ่มสอบไม่ได้');

  // ------------------------------------------------------------------
  step('3. เจ้าหน้าที่อนุมัติสิทธิ์สอบ');
  api.session.write(adminSession);
  await api.applications.setEnrollment(students.map((s) => s.app!.id), 'อนุมัติ');
  const approvedApps = await api.applications.list({ trainingId: course.id });
  check(approvedApps.length === 5 && approvedApps.every((a) => a.status === 'อนุมัติ'), 'อนุมัติสิทธิ์สอบครบ 5 คน');

  // ------------------------------------------------------------------
  step('4. ผู้สมัครทั้ง 5 คนสอบทฤษฎี');
  const allRight = {
    '1': 'b',
    '2': ['a', 'b'],
    '3': true,
    '4': { p1: 'p1', p2: 'p2' },
    '5': ' 220 ',
  } as import('../../lib/types').AnswerMap;
  const essays = ['ทำความสะอาดชิ้นงาน บากขอบ และจัดระยะห่างก่อนเชื่อมแต้ม', 'ขัดสนิมและคราบน้ำมัน', 'บากขอบให้ได้มุม', 'จัดระยะรากและเชื่อมแต้ม', 'ทำความสะอาด'];
  const attemptIds: number[] = [];
  for (const [i, s] of students.entries()) {
    api.session.write(s.session);
    const app = (await api.applications.list({ userId: s.user.id, trainingId: course.id }))[0];
    const attempt = await api.attempts.start(s.user, app, theory);
    if (i === 0) {
      check(attempt.question_snapshot.length === 6, 'ชุดคำถามถูกแช่แข็งไว้กับการสอบ (6 ข้อ)');
      const mins = (new Date(attempt.deadline_at!).getTime() - Date.now()) / 60000;
      check(mins > 28 && mins <= 30.5, `เวลาสิ้นสุดคำนวณจากเซิร์ฟเวอร์ (~${mins.toFixed(1)} นาที)`);
      await expectError(api.attempts.start(s.user, app, theory), /ATTEMPT_IN_PROGRESS|NO_ATTEMPTS_LEFT/, 'เปิดข้อสอบซ้อนระหว่างสอบไม่ได้');
    }
    const answers = { ...allRight, '6': essays[i] };
    await api.attempts.saveAnswers(attempt.id, answers);
    const done = await api.attempts.submit(attempt, answers);
    attemptIds.push(done.id);
    if (i === 0) {
      check(done.status === 'submitted' && done.needs_review && done.passed === null, 'ส่งแล้ว: มีข้อเขียน → รอตรวจ (ยังไม่ตัดสินผ่าน/ไม่ผ่าน)');
      check(Number(done.auto_score) === 8, `ข้อปรนัยได้ ${done.auto_score}/8 (ตอบเติมคำมีช่องว่างก็ยังถูก)`);
      await expectError(api.attempts.start(s.user, app, theory), /NO_ATTEMPTS_LEFT/, 'สอบเกินจำนวนครั้งที่กำหนดไม่ได้');
      const sneaky = await supabase.from('apply_training').update({ approval_status: 'approved', certificate_no: 'HACK' }).eq('id', app.id);
      check(Boolean(sneaky.error), `ผู้สมัครแก้สถานะอนุมัติ/เลขใบประกาศเองไม่ได้ (${sneaky.error?.message?.slice(0, 40)})`);
    }
  }

  // ------------------------------------------------------------------
  step('5. เจ้าหน้าที่ตรวจข้อเขียน (ทุกคนผ่านทฤษฎี)');
  api.session.write(adminSession);
  const essayScores = [2, 2, 1.5, 2, 1];
  for (const [i, id] of attemptIds.entries()) {
    const a = await api.attempts.get(id);
    const graded = await api.attempts.grade(a, { '6': essayScores[i] }, admin.id);
    check(graded.status === 'graded' && graded.passed === true, `${names[i][1]}: ทฤษฎี ${graded.score}/${graded.max_score} (${graded.percent}%) ผ่าน`);
  }

  // ------------------------------------------------------------------
  step('6. จัดเข้ารอบสอบปฏิบัติ');
  let apps = await api.applications.list({ trainingId: course.id });
  const autoAssigned = apps.filter((a) => a.practical_round_id === round.id).length;
  if (autoAssigned === 5) ok('ระบบจัดผู้ที่สอบทฤษฎีผ่านเข้ารอบอัตโนมัติครบ 5 คน');
  else {
    warn(`จัดเข้ารอบอัตโนมัติได้ ${autoAssigned}/5 — ยังไม่ได้รัน supabase/migrations/002_auto_practical_round.sql (ทดสอบต่อด้วยการจัดรอบแบบเจ้าหน้าที่)`);
    await api.applications.assignRound(apps.map((a) => a.id), round.id);
    apps = await api.applications.list({ trainingId: course.id });
    check(apps.every((a) => a.practical_round_id === round.id), 'เจ้าหน้าที่จัดเข้ารอบครบ 5 คน');
  }

  // ------------------------------------------------------------------
  step('7. ผู้ประเมิน 3 ท่านให้คะแนน (ผ่าน 4 คน ไม่ผ่าน 1 คน)');
  // per student, per evaluator: [11, 12, 21, 22] out of [10, 10, 15, 15]; pass mark 60% = 30/50
  const sheets = [
    [[9, 9, 13, 12], [8, 9, 12, 13], [9, 8, 13, 13]],
    [[8, 8, 11, 11], [7, 8, 12, 11], [8, 7, 11, 12]],
    [[10, 9, 14, 14], [9, 10, 14, 13], [10, 10, 13, 14]],
    [[7, 7, 9, 9], [6, 7, 10, 9], [7, 6, 9, 10]],
    [[5, 4, 6, 5], [4, 5, 5, 6], [5, 5, 6, 4]], // fails
  ];
  const expectedAvg: number[] = [];
  for (const [ei, [cid, pw]] of STAFF.evaluators.entries()) {
    const ev = await as(cid, pw);
    const myRounds = await api.rounds.list({ evaluatorId: ev.id });
    check(myRounds.some((r) => r.id === round.id), `ผู้ประเมินท่านที่ ${ei + 1} (${ev.first_name_th}) เห็นรอบที่ได้รับมอบหมาย`);
    for (const [si, s] of students.entries()) {
      const app = apps.find((a) => a.user_id === s.user.id)!;
      const [a, b, c, d] = sheets[si][ei];
      const item_scores = { '11': a, '12': b, '21': c, '22': d };
      await api.scores.save({
        round_id: round.id,
        application_id: app.id,
        evaluator_id: ev.id,
        item_scores,
        total: scoring.treeEarned(practical.practical_items, item_scores),
        max_total: scoring.treeMax(practical.practical_items),
        comment: '',
        status: 'submitted',
      });
    }
  }
  sheets.forEach((s) => expectedAvg.push(scoring.round2(s.reduce((sum, e) => sum + e.reduce((x, y) => x + y, 0), 0) / 3)));

  // ------------------------------------------------------------------
  step('8. เจ้าหน้าที่รวมผลและส่งผู้อำนวยการอนุมัติ');
  api.session.write(adminSession);
  const results = await R.buildCourseResults(course.id);
  check(results.rows.length === 5, 'รวมผลได้ 5 แถว');
  for (const row of results.rows) {
    const i = students.findIndex((s) => s.user.id === row.user?.id);
    check(row.practical?.average?.complete === true && row.practical.score === expectedAvg[i],
      `${names[i][1]}: ปฏิบัติเฉลี่ย 3 ท่าน = ${row.practical?.score} (คาด ${expectedAvg[i]}) → ${row.final.status}`);
  }
  const passed = results.rows.filter((r) => r.final.status === 'passed').length;
  const failed = results.rows.filter((r) => r.final.status === 'failed').length;
  check(passed === 4 && failed === 1, `สรุป: ผ่าน ${passed} คน ไม่ผ่าน ${failed} คน`);
  check(results.rows.every(R.canSubmit), 'ผลทุกคนพร้อมส่งอนุมัติ');

  // a non-admin must not be able to send results
  api.session.write(students[0].session);
  await expectError(api.applications.submitForApproval(results.rows.map(R.snapshotOf)), /FORBIDDEN/, 'ผู้สมัครส่งผลอนุมัติเองไม่ได้');
  api.session.write(adminSession);
  const sent = await api.applications.submitForApproval(results.rows.map(R.snapshotOf));
  check(sent === 5, `ส่งผู้อำนวยการแล้ว ${sent} รายการ`);

  // ------------------------------------------------------------------
  step('9. ผู้อำนวยการอนุมัติ → ออกใบประกาศ');
  await as(STAFF.director[0], STAFF.director[1]);
  const pending = await api.applications.list({ trainingId: course.id, approval: ['submitted'] });
  check(pending.length === 5, 'ผู้อำนวยการเห็นรายการรออนุมัติ 5 รายการ');
  const decided = await api.applications.decide(pending.map((a) => a.id), 'approved', 'อนุมัติผลการทดสอบ (E2E)');
  check(decided === 5, `อนุมัติ ${decided} รายการ`);
  const final = await api.applications.list({ trainingId: course.id });
  const withCert = final.filter((a) => a.certificate_no);
  check(withCert.length === 4, `ออกเลขที่ใบประกาศ ${withCert.length} ใบ (เฉพาะผู้ที่ผ่าน)`);
  check(final.filter((a) => a.result_status === 'failed').every((a) => !a.certificate_no), 'ผู้ที่ไม่ผ่านไม่ได้รับใบประกาศ');
  check(final.every((a) => a.approval_status === 'approved' && a.approved_by_name), 'บันทึกชื่อผู้อนุมัติไว้กับผลทุกรายการ');
  const again = await api.applications.decide(pending.map((a) => a.id), 'approved', '');
  check(again === 0, 'อนุมัติซ้ำไม่มีผล (ป้องกันการกดซ้ำ)');

  // If the DB exam guard is missing, the negative checks above may have opened stray attempts.
  const stray = await supabase.from('exam_attempts').delete().eq('training_id', course.id).eq('status', 'in_progress').select('id');
  if (stray.data?.length) warn(`ลบการสอบค้างที่เกิดจากการทดสอบเชิงลบ ${stray.data.length} รายการ`);

  // ------------------------------------------------------------------
  console.log('\n────────────────────────────────────────────');
  console.log(`หลักสูตรทดสอบ: #${course.id} ${course.course_name}`);
  for (const [i, s] of students.entries()) {
    const a = final.find((x) => x.user_id === s.user.id)!;
    console.log(
      `  ${s.user.th_human_number}  ${names[i][0]}${names[i][1]}  ทฤษฎี ${a.theory_score}/${a.theory_max}  ปฏิบัติ ${a.practical_score}/${a.practical_max}  ${a.result_status}  ${a.certificate_no || '-'}`
    );
  }
  console.log(`  รหัสผ่านผู้สมัครทดสอบทุกคน: test1234`);
  console.log(`  ดูในระบบ: /admin/results?course=${course.id} · /print/approval-report/${course.id}`);
  if (warnings.length) console.log(`\nคำเตือน ${warnings.length} รายการ:\n  - ${warnings.join('\n  - ')}`);
  console.log(failures === 0 ? '\nผลการทดสอบ: ผ่านทั้งหมด ✓' : `\nผลการทดสอบ: ไม่ผ่าน ${failures} รายการ ✗`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('\n✗ การทดสอบหยุดกลางคัน:', e instanceof Error ? e.message : e);
  process.exit(1);
});
