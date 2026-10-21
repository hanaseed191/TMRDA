-- =====================================================================
-- TMRDA — realistic TEST DATA for trying the whole workflow end to end.
-- Run AFTER supabase/migrations/001_tmrda_v2.sql, in Supabase → SQL Editor.
-- Safe to re-run: it does nothing if the seed course already exists.
--
-- What you get
--   • Course "ช่างเชื่อมไฟฟ้า ระดับ 1" (open now) with
--       - a theory exam using all 6 question types (20 points, pass 60%)
--       - a practical criteria sheet, 3 levels deep (50 points, pass 60%)
--       - practical round "รอบที่ 1" with the 3 seeded evaluators
--       - 5 candidates in different states (see below)
--   • Course "ช่างไฟฟ้าภายในอาคาร ระดับ 1" with an open theory exam, no applicants yet
--
-- Candidates (password for all: test1234)
--   1101700230708  นายอนุชา ศรีสุข        theory 17/20 ✓, practical 3/3 evaluators ✓ → ready to send to director
--   3100400123456  นางสาวพิมพ์ชนก แก้วมณี  theory has an essay waiting for grading, practical 2/3 evaluators
--   1509900456789  นายธนากร วงศ์ใหญ่       theory 7/20 ✗, practical 3/3 ✓ → overall fail
--   3401200789017  นางวรรณา ทองดี         approved, nothing taken yet → try the exam yourself
--   5100300567898  นายกิตติพัฒน์ มีชัย     application waiting for staff review
-- =====================================================================

do $$
declare
  v_course int;
  v_course2 int;
  v_theory int;
  v_practical int;
  v_theory2 int;
  v_round int;
  v_admin int;
  e1 int; e2 int; e3 int;
  u_anucha int; u_pim int; u_thana int; u_wanna int; u_kitti int;
  a_anucha int; a_pim int; a_thana int; a_wanna int; a_kitti int;
  v_questions jsonb;
  v_items jsonb;
begin
  if exists (select 1 from training where course_name = 'ช่างเชื่อมไฟฟ้า ระดับ 1') then
    raise notice 'Seed data already present — skipping.';
    return;
  end if;

  select id into v_admin from users where role = 'admin' order by id limit 1;
  select id into e1 from users where th_human_number = '4444444444441';
  select id into e2 from users where th_human_number = '4444444444442';
  select id into e3 from users where th_human_number = '4444444444443';
  if e1 is null or e2 is null or e3 is null then
    raise exception 'Evaluator accounts not found — run 001_tmrda_v2.sql first.';
  end if;

  -- -------------------------------------------------------------------
  -- Courses
  -- -------------------------------------------------------------------
  insert into training (agency_name, course_name, course_name_en, traning_hours, branch_name, level_name,
                        startswith_date, endswith_date, between_date, limit_course, executive_name,
                        description, location, is_published)
  values ('สถาบันพัฒนาฝีมือแรงงาน ภาค 1', 'ช่างเชื่อมไฟฟ้า ระดับ 1', 'Shielded Metal Arc Welder Level 1', 60,
          'ช่างอุตสาหการ', 'ระดับ 1', '2026-10-15', '2026-11-30', '15/10/2026 - 30/11/2026', 20, 'ผู้อำนวยการสถาบัน',
          'ทดสอบมาตรฐานฝีมือแรงงานแห่งชาติ สาขาช่างเชื่อมไฟฟ้า ระดับ 1 ประกอบด้วยภาคทฤษฎี (สอบออนไลน์) และภาคปฏิบัติ (ประเมินโดยคณะกรรมการ 3 ท่าน)',
          'โรงฝึกงานเชื่อม อาคาร 2', true)
  returning id into v_course;

  insert into training (agency_name, course_name, course_name_en, traning_hours, branch_name, level_name,
                        startswith_date, endswith_date, between_date, limit_course, executive_name,
                        description, location, is_published)
  values ('สถาบันพัฒนาฝีมือแรงงาน ภาค 1', 'ช่างไฟฟ้าภายในอาคาร ระดับ 1', 'Building Electrician Level 1', 45,
          'ช่างไฟฟ้า อิเล็กทรอนิกส์และคอมพิวเตอร์', 'ระดับ 1', '2026-11-01', '2026-12-20', '01/11/2026 - 20/12/2026', 25,
          'ผู้อำนวยการสถาบัน', 'ความรู้พื้นฐานการเดินสายไฟ อุปกรณ์ป้องกัน และความปลอดภัยทางไฟฟ้าในอาคาร',
          'ห้องปฏิบัติการไฟฟ้า อาคาร 1', true)
  returning id into v_course2;

  -- -------------------------------------------------------------------
  -- Theory exam — every question type
  -- -------------------------------------------------------------------
  v_questions := '[
    {"id":1,"type":"single_choices","score":2,"question_text":"อุปกรณ์ป้องกันดวงตาที่ถูกต้องสำหรับงานเชื่อมไฟฟ้าคือข้อใด",
     "choices":[{"id":"a","choice_text":"แว่นกันแดดทั่วไป","is_correct":false},
                {"id":"b","choice_text":"หน้ากากเชื่อมพร้อมกระจกกรองแสงเบอร์ 10–12","is_correct":true},
                {"id":"c","choice_text":"แว่นสายตา","is_correct":false},
                {"id":"d","choice_text":"ไม่จำเป็นต้องใช้ หากเชื่อมไม่นาน","is_correct":false}],
     "explanation":"แสงอาร์กมีรังสีอัลตราไวโอเลตและอินฟราเรดสูง ต้องใช้กระจกกรองแสงที่มีเบอร์เหมาะสมเสมอ"},
    {"id":2,"type":"single_choices","score":2,"question_text":"กระแสไฟเชื่อมที่เหมาะสมกับลวดเชื่อมขนาด 3.2 มม. โดยประมาณคือข้อใด",
     "choices":[{"id":"a","choice_text":"30–50 แอมแปร์","is_correct":false},
                {"id":"b","choice_text":"90–130 แอมแปร์","is_correct":true},
                {"id":"c","choice_text":"200–250 แอมแปร์","is_correct":false},
                {"id":"d","choice_text":"300 แอมแปร์ขึ้นไป","is_correct":false}]},
    {"id":3,"type":"multiple_choices","score":3,"partial_credit":true,"question_text":"ข้อใดเป็นสาเหตุที่ทำให้แนวเชื่อมเกิดรูพรุน (Porosity)",
     "choices":[{"id":"a","choice_text":"ลวดเชื่อมมีความชื้น","is_correct":true},
                {"id":"b","choice_text":"ชิ้นงานมีคราบน้ำมันหรือสนิม","is_correct":true},
                {"id":"c","choice_text":"สวมหน้ากากเชื่อมขณะปฏิบัติงาน","is_correct":false},
                {"id":"d","choice_text":"ลมพัดแรงบริเวณที่เชื่อม","is_correct":true}]},
    {"id":4,"type":"true_false","score":1,"question_text":"ผู้ปฏิบัติงานเชื่อมควรสวมถุงมือหนังและเสื้อแขนยาวทุกครั้ง","choices":[],"true_false_answer":true},
    {"id":5,"type":"true_false","score":1,"question_text":"สามารถเชื่อมใกล้วัสดุไวไฟได้ หากทำงานให้เสร็จอย่างรวดเร็ว","choices":[],"true_false_answer":false},
    {"id":6,"type":"matching","score":4,"question_text":"จับคู่รหัสท่าเชื่อมรอยต่อชนกับลักษณะท่าเชื่อมให้ถูกต้อง","choices":[],
     "matching_pairs":[{"id":"p1","left_text":"1G","right_text":"ท่าราบ"},
                       {"id":"p2","left_text":"2G","right_text":"ท่าขนานนอน"},
                       {"id":"p3","left_text":"3G","right_text":"ท่าตั้ง"},
                       {"id":"p4","left_text":"4G","right_text":"ท่าเหนือศีรษะ"}]},
    {"id":7,"type":"short_answer","score":2,"question_text":"ลวดเชื่อม E6013 ตัวเลข 60 หมายถึงค่าความต้านแรงดึงขั้นต่ำกี่พันปอนด์ต่อตารางนิ้ว (ตอบเป็นตัวเลข)","choices":[],
     "accepted_answers":["60","60,000","60000"],"placeholder_text":"เช่น 50"},
    {"id":8,"type":"text_choices","score":5,"question_text":"อธิบายขั้นตอนการเตรียมชิ้นงานก่อนเชื่อมรอยต่อชน (Butt joint) อย่างน้อย 3 ขั้นตอน","choices":[],
     "placeholder_text":"อธิบายเป็นข้อ ๆ","correct_answer_text":"1) ทำความสะอาดผิวชิ้นงาน ขจัดสนิม น้ำมัน สี 2) เตรียมขอบรอยต่อ/บากร่องตามความหนา 3) จัดระยะห่างรากและยึดชิ้นงานด้วยการเชื่อมแต้ม 4) ตรวจสอบแนวและการจัดวาง"}
  ]'::jsonb;

  insert into test_form (training_id, exam_type, title, description, time_limit_minutes, passing_percentage,
                         total_score, score_knowledge_max, score_practice_max, is_active, exam_start_date, exam_end_date,
                         max_attempts, show_answers, randomize_questions, randomize_choices, questions, practical_items)
  values (v_course, 'theory', 'ทฤษฎีช่างเชื่อมไฟฟ้า ระดับ 1 (ชุด A)',
          'อ่านโจทย์ให้ครบก่อนตอบ ระบบบันทึกคำตอบอัตโนมัติ เมื่อหมดเวลาระบบจะส่งคำตอบให้ทันที ข้อเขียนจะได้รับการตรวจโดยเจ้าหน้าที่',
          30, 60, 20, 20, 0, true, '2026-10-01T00:00:00+07', '2026-12-31T23:59:00+07', 1, true, true, true, v_questions, '[]')
  returning id into v_theory;

  insert into test_form (training_id, exam_type, title, description, time_limit_minutes, passing_percentage,
                         total_score, score_knowledge_max, score_practice_max, is_active, max_attempts, show_answers, questions, practical_items)
  values (v_course2, 'theory', 'ทฤษฎีช่างไฟฟ้าภายในอาคาร ระดับ 1',
          'ข้อสอบปรนัยและเติมคำ 5 ข้อ ใช้เวลา 15 นาที', 15, 60, 6, 6, 0, true, 1, true,
          '[
            {"id":1,"type":"single_choices","score":1,"question_text":"อุปกรณ์ใดใช้ตัดวงจรเมื่อเกิดไฟรั่วลงดิน",
             "choices":[{"id":"a","choice_text":"RCD / เครื่องตัดไฟรั่ว","is_correct":true},{"id":"b","choice_text":"สวิตช์ทางเดียว","is_correct":false},{"id":"c","choice_text":"เต้ารับ","is_correct":false}]},
            {"id":2,"type":"true_false","score":1,"question_text":"สายดินในระบบไฟฟ้าบ้านมาตรฐานใช้สายสีเขียวหรือสีเขียวแถบเหลือง","choices":[],"true_false_answer":true},
            {"id":3,"type":"multiple_choices","score":2,"question_text":"ข้อใดเป็นอุปกรณ์ป้องกันกระแสเกิน","choices":[{"id":"a","choice_text":"ฟิวส์","is_correct":true},{"id":"b","choice_text":"เซอร์กิตเบรกเกอร์","is_correct":true},{"id":"c","choice_text":"หลอดไฟ","is_correct":false}]},
            {"id":4,"type":"short_answer","score":1,"question_text":"แรงดันไฟฟ้าระบบ 1 เฟสในบ้านพักอาศัยของไทยคือกี่โวลต์","choices":[],"accepted_answers":["220","230","220 v","230 v"]},
            {"id":5,"type":"true_false","score":1,"question_text":"ควรตรวจสอบว่าไม่มีแรงดันไฟฟ้าก่อนเริ่มปฏิบัติงานทุกครั้ง","choices":[],"true_false_answer":true}
          ]'::jsonb, '[]')
  returning id into v_theory2;

  -- -------------------------------------------------------------------
  -- Practical criteria (leaf scores sum to 50)
  -- -------------------------------------------------------------------
  v_items := '[
    {"id":1,"item_name":"การเตรียมงานและความปลอดภัย","max_score":10,"criteria":"ประเมินก่อนเริ่มเชื่อม","children":[
      {"id":11,"item_name":"สวมอุปกรณ์ป้องกันส่วนบุคคลครบถ้วน","max_score":5,"criteria":"หน้ากาก ถุงมือหนัง เสื้อแขนยาว รองเท้านิรภัย","children":[]},
      {"id":12,"item_name":"ตรวจสอบเครื่องเชื่อมและการต่อสายดิน","max_score":5,"criteria":"สายไม่ชำรุด ขั้วต่อแน่น","children":[]}]},
    {"id":2,"item_name":"การเชื่อมรอยต่อชนท่าราบ (1G)","max_score":30,"criteria":"ชิ้นงานเหล็กหนา 6 มม.","children":[
      {"id":21,"item_name":"การตั้งกระแสไฟและการจุดอาร์ก","max_score":10,"criteria":"กระแสเหมาะสมกับลวด อาร์กต่อเนื่อง","children":[]},
      {"id":22,"item_name":"คุณภาพแนวเชื่อม","max_score":20,"criteria":"ตรวจด้วยสายตาและเกจ","children":[
        {"id":221,"item_name":"ความสม่ำเสมอของเกล็ดและความกว้างแนวเชื่อม","max_score":10,"criteria":"","children":[]},
        {"id":222,"item_name":"การหลอมลึก ไม่มีรูพรุนหรือรอยแตก","max_score":10,"criteria":"","children":[]}]}]},
    {"id":3,"item_name":"การตรวจสอบและเก็บงาน","max_score":10,"criteria":"","children":[
      {"id":31,"item_name":"ทำความสะอาดสแลกและตรวจพินิจชิ้นงาน","max_score":5,"criteria":"","children":[]},
      {"id":32,"item_name":"จัดเก็บเครื่องมือและทำความสะอาดพื้นที่","max_score":5,"criteria":"","children":[]}]}
  ]'::jsonb;

  insert into test_form (training_id, exam_type, title, description, time_limit_minutes, passing_percentage,
                         total_score, score_knowledge_max, score_practice_max, is_active, questions, practical_items)
  values (v_course, 'practical', 'แบบประเมินภาคปฏิบัติ ช่างเชื่อมไฟฟ้า ระดับ 1',
          'ผู้ประเมิน 3 ท่านให้คะแนนอิสระต่อกัน คะแนนภาคปฏิบัติ = ผลรวมคะแนนของผู้ประเมิน ÷ จำนวนผู้ประเมิน',
          180, 60, 50, 0, 50, true, '[]', v_items)
  returning id into v_practical;

  insert into practical_rounds (training_id, test_form_id, name, exam_date, start_time, location, evaluator_ids, status)
  values (v_course, v_practical, 'รอบที่ 1 — ภาคเช้า', '2026-11-08', '09:00', 'โรงฝึกงานเชื่อม อาคาร 2', array[e1, e2, e3], 'open')
  returning id into v_round;

  -- -------------------------------------------------------------------
  -- Candidates
  -- -------------------------------------------------------------------
  insert into users (th_human_number, title_th, first_name_th, last_name_th, title_en, first_name_en, last_name_en, sex_name,
                     birth_day, phone_number, email, house_number, road_name, province_name, district_name, subdistrict_name,
                     zip_code, education_level, branch_name, password_hash, role, is_admin, redirect_tag)
  values
    ('1101700230708', 'นาย', 'อนุชา', 'ศรีสุข', 'Mr.', 'Anucha', 'Srisuk', 'ชาย', '1995-03-14', '0812340001', 'anucha.test@tmrda.com',
     '45/2', 'พหลโยธิน', 'กรุงเทพมหานคร', 'เขตจตุจักร', 'จตุจักร', '10900', 'ประกาศนียบัตรวิชาชีพ (ปวช.)', 'ช่างกลโรงงาน',
     extensions.crypt('test1234', extensions.gen_salt('bf')), 'user', 0, 'user'),
    ('3100400123456', 'นางสาว', 'พิมพ์ชนก', 'แก้วมณี', 'Ms.', 'Pimchanok', 'Kaewmanee', 'หญิง', '1998-07-02', '0812340002', 'pimchanok.test@tmrda.com',
     '12', 'รามคำแหง', 'กรุงเทพมหานคร', 'เขตบางกะปิ', 'หัวหมาก', '10240', 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)', 'ช่างเชื่อมโลหะ',
     extensions.crypt('test1234', extensions.gen_salt('bf')), 'user', 0, 'user'),
    ('1509900456789', 'นาย', 'ธนากร', 'วงศ์ใหญ่', 'Mr.', 'Thanakorn', 'Wongyai', 'ชาย', '1992-11-20', '0812340003', 'thanakorn.test@tmrda.com',
     '88/8', 'ห้วยแก้ว', 'เชียงใหม่', 'เมืองเชียงใหม่', 'สุเทพ', '50200', 'มัธยมศึกษาตอนปลาย', 'สายสามัญ',
     extensions.crypt('test1234', extensions.gen_salt('bf')), 'user', 0, 'user'),
    ('3401200789017', 'นาง', 'วรรณา', 'ทองดี', 'Mrs.', 'Wanna', 'Thongdee', 'หญิง', '1988-01-09', '0812340004', 'wanna.test@tmrda.com',
     '7', 'มิตรภาพ', 'ขอนแก่น', 'เมืองขอนแก่น', 'ในเมือง', '40000', 'ปริญญาตรี', 'วิศวกรรมอุตสาหการ',
     extensions.crypt('test1234', extensions.gen_salt('bf')), 'user', 0, 'user'),
    ('5100300567898', 'นาย', 'กิตติพัฒน์', 'มีชัย', 'Mr.', 'Kittipat', 'Meechai', 'ชาย', '2001-05-30', '0812340005', 'kittipat.test@tmrda.com',
     '199', 'สุขุมวิท', 'ชลบุรี', 'เมืองชลบุรี', 'บ้านสวน', '20000', 'ประกาศนียบัตรวิชาชีพ (ปวช.)', 'ช่างยนต์',
     extensions.crypt('test1234', extensions.gen_salt('bf')), 'user', 0, 'user')
  on conflict (th_human_number) do nothing;

  select id into u_anucha from users where th_human_number = '1101700230708';
  select id into u_pim from users where th_human_number = '3100400123456';
  select id into u_thana from users where th_human_number = '1509900456789';
  select id into u_wanna from users where th_human_number = '3401200789017';
  select id into u_kitti from users where th_human_number = '5100300567898';

  insert into apply_training (user_id, training_id, applicant_type, is_skill_testing, status, is_accept, reviewed_at, practical_round_id)
  values (u_anucha, v_course, 'บุคคลทั่วไป', true, 'อนุมัติ', 1, now() - interval '6 days', v_round) returning id into a_anucha;
  insert into apply_training (user_id, training_id, applicant_type, is_skill_testing, status, is_accept, reviewed_at, practical_round_id)
  values (u_pim, v_course, 'จากสถานศึกษา', true, 'อนุมัติ', 1, now() - interval '6 days', v_round) returning id into a_pim;
  insert into apply_training (user_id, training_id, applicant_type, is_skill_testing, status, is_accept, reviewed_at, practical_round_id)
  values (u_thana, v_course, 'บุคคลทั่วไป', true, 'อนุมัติ', 1, now() - interval '5 days', v_round) returning id into a_thana;
  insert into apply_training (user_id, training_id, applicant_type, is_skill_testing, status, is_accept, reviewed_at, practical_round_id)
  values (u_wanna, v_course, 'จากภาคเอกชน', true, 'อนุมัติ', 1, now() - interval '2 days', v_round) returning id into a_wanna;
  insert into apply_training (user_id, training_id, applicant_type, is_skill_testing, status)
  values (u_kitti, v_course, 'บุคคลทั่วไป', true, 'รอพิจารณา') returning id into a_kitti;

  insert into histories_labor (user_id, is_have_job, labor_status, labor_salary, occupation, position, year_of_service, agency_name,
                               province_id, phone_number, industrial_groups_working, not_have_job_status, known_source_of_training,
                               is_accept_publish, is_want_job, is_want_job_inside)
  values (u_anucha, 'ทำงาน', 'ภาคเอกชน', '15,001 – 20,000 บาท', 'ช่างซ่อมบำรุง', 'พนักงานประจำ', '3', 'บริษัท สยามเมทัลเวิร์ค จำกัด',
          1, '0812340001', 'ยานยนต์สมัยใหม่', '', 'เว็บไซต์กรมพัฒนาฝีมือแรงงาน', 'ยินยอมเปิดเผย', 'ไม่ต้องการ', 'ไม่ต้องการ');

  -- -------------------------------------------------------------------
  -- Theory attempts
  -- -------------------------------------------------------------------
  -- อนุชา: 2+2+3+1+1+2+2 auto = 13, essay graded 4 → 17/20 = 85% ✓
  insert into exam_attempts (user_id, training_id, test_form_id, application_id, question_snapshot, answers, manual_scores,
                             auto_score, score, max_score, percent, passing_percentage, passed, needs_review, status,
                             started_at, deadline_at, submitted_at, graded_by, graded_at)
  values (u_anucha, v_course, v_theory, a_anucha, v_questions,
          '{"1":"b","2":"b","3":["a","b","d"],"4":true,"5":false,"6":{"p1":"p1","p2":"p2","p3":"p4","p4":"p3"},"7":"60",
            "8":"1. ทำความสะอาดผิวชิ้นงานขจัดสนิมและคราบน้ำมัน 2. บากขอบชิ้นงานตามความหนา 3. จัดระยะห่างรากแล้วเชื่อมแต้มยึด"}',
          '{"8":4}', 13, 17, 20, 85, 60, true, false, 'graded',
          now() - interval '4 days 2 hours', now() - interval '4 days 1 hour 30 minutes', now() - interval '4 days 1 hour 40 minutes',
          v_admin, now() - interval '3 days');

  -- พิมพ์ชนก: auto 13, essay not graded yet → needs review
  insert into exam_attempts (user_id, training_id, test_form_id, application_id, question_snapshot, answers,
                             auto_score, score, max_score, percent, passing_percentage, passed, needs_review, status,
                             started_at, deadline_at, submitted_at)
  values (u_pim, v_course, v_theory, a_pim, v_questions,
          '{"1":"b","2":"a","3":["a","b","d"],"4":true,"5":false,"6":{"p1":"p1","p2":"p2","p3":"p3","p4":"p4"},"7":"60,000",
            "8":"เตรียมผิวงานให้สะอาด เจียรขอบให้ได้มุม และจับยึดชิ้นงานให้ได้ระยะห่างก่อนเชื่อมแต้ม"}',
          13, 13, 20, 65, 60, null, true, 'submitted',
          now() - interval '1 day 3 hours', now() - interval '1 day 2 hours 30 minutes', now() - interval '1 day 2 hours 40 minutes');

  -- ธนากร: 0+0+0+1+0+4+0 auto = 5, essay graded 2 → 7/20 = 35% ✗
  insert into exam_attempts (user_id, training_id, test_form_id, application_id, question_snapshot, answers, manual_scores,
                             auto_score, score, max_score, percent, passing_percentage, passed, needs_review, status,
                             started_at, deadline_at, submitted_at, graded_by, graded_at)
  values (u_thana, v_course, v_theory, a_thana, v_questions,
          '{"1":"a","2":"c","3":["c"],"4":true,"5":true,"6":{"p1":"p1","p2":"p2","p3":"p3","p4":"p4"},"7":"6013","8":"ทำความสะอาดชิ้นงาน"}',
          '{"8":2}', 5, 7, 20, 35, 60, false, false, 'graded',
          now() - interval '3 days 5 hours', now() - interval '3 days 4 hours 30 minutes', now() - interval '3 days 4 hours 35 minutes',
          v_admin, now() - interval '2 days');

  -- -------------------------------------------------------------------
  -- Practical scores (leaf ids: 11,12,21,221,222,31,32)
  -- -------------------------------------------------------------------
  insert into practical_scores (round_id, application_id, evaluator_id, item_scores, total, max_total, comment, status) values
    (v_round, a_anucha, e1, '{"11":5,"12":5,"21":8,"221":9,"222":8,"31":4,"32":5}', 44, 50, 'แนวเชื่อมสม่ำเสมอ ปฏิบัติตามขั้นตอนความปลอดภัยครบ', 'submitted'),
    (v_round, a_anucha, e2, '{"11":5,"12":4,"21":9,"221":8,"222":8,"31":5,"32":5}', 44, 50, '', 'submitted'),
    (v_round, a_anucha, e3, '{"11":4,"12":5,"21":8,"221":8,"222":9,"31":4,"32":4}', 42, 50, 'ควรตรวจสายดินให้ละเอียดขึ้น', 'submitted'),
    (v_round, a_thana, e1, '{"11":4,"12":4,"21":6,"221":6,"222":5,"31":3,"32":2}', 30, 50, '', 'submitted'),
    (v_round, a_thana, e2, '{"11":4,"12":4,"21":7,"221":6,"222":6,"31":3,"32":2}', 32, 50, '', 'submitted'),
    (v_round, a_thana, e3, '{"11":4,"12":4,"21":6,"221":6,"222":6,"31":3,"32":2}', 31, 50, 'การจุดอาร์กยังไม่ต่อเนื่อง', 'submitted'),
    (v_round, a_pim, e1, '{"11":5,"12":5,"21":9,"221":9,"222":9,"31":5,"32":5}', 47, 50, 'ฝีมือดีมาก', 'submitted'),
    (v_round, a_pim, e2, '{"11":5,"12":5,"21":9,"221":8,"222":9,"31":5,"32":4}', 45, 50, '', 'submitted');

  raise notice 'Seed complete: course %, theory form %, practical form %, round %', v_course, v_theory, v_practical, v_round;
end $$;
