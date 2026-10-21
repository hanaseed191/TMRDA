DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS test_form_results CASCADE;
DROP TABLE IF EXISTS test_forms CASCADE;
DROP TABLE IF EXISTS labor_histories CASCADE;
DROP TABLE IF EXISTS training_applications CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS users_disability CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS subdistricts CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS provinces CASCADE;
DROP TABLE IF EXISTS physical_disabled_list CASCADE;
DROP TABLE IF EXISTS physical_list CASCADE;
DROP TABLE IF EXISTS heq_list CASCADE;
DROP TABLE IF EXISTS gender_list CASCADE;

CREATE TABLE gender_list (
  id SERIAL PRIMARY KEY,
  gender_name_th VARCHAR(50) NOT NULL,
  gender_name_en VARCHAR(50) NOT NULL
);

INSERT INTO gender_list (id, gender_name_th, gender_name_en) VALUES
(1, 'ชาย', 'Male'),
(2, 'หญิง', 'Female'),
(3, 'อื่นๆ', 'Other');

CREATE TABLE heq_list (
  id SERIAL PRIMARY KEY,
  heq_name_th VARCHAR(255) NOT NULL,
  heq_name_en VARCHAR(255) DEFAULT ''
);

INSERT INTO heq_list (id, heq_name_th, heq_name_en) VALUES
(1, 'ประถมศึกษา', 'Primary School'),
(2, 'มัธยมศึกษาตอนต้น', 'Junior High School'),
(3, 'มัธยมศึกษาตอนปลาย / ปวช.', 'Senior High School / Vocational Certificate'),
(4, 'อนุปริญญา / ปวส.', 'Diploma / High Vocational Certificate'),
(5, 'ปริญญาตรี', 'Bachelor Degree'),
(6, 'ปริญญาโท', 'Master Degree'),
(7, 'ปริญญาเอก', 'Doctoral Degree');

CREATE TABLE physical_list (
  id SERIAL PRIMARY KEY,
  physical_name_th VARCHAR(255) NOT NULL,
  physical_name_en VARCHAR(255) DEFAULT ''
);

INSERT INTO physical_list (id, physical_name_th, physical_name_en) VALUES
(1, 'ปกติ', 'Normal'),
(2, 'ผู้พิการ', 'Disabled');

CREATE TABLE physical_disabled_list (
  id SERIAL PRIMARY KEY,
  physical_name_th VARCHAR(255) NOT NULL,
  physical_name_en VARCHAR(255) DEFAULT ''
);

INSERT INTO physical_disabled_list (id, physical_name_th, physical_name_en) VALUES
(1, 'ทางการเห็น', 'Visual Disability'),
(2, 'ทางการได้ยินหรือสื่อความหมาย', 'Hearing or Communication Disability'),
(3, 'ทางการเคลื่อนไหวหรือทางร่างกาย', 'Physical or Mobility Disability'),
(4, 'ทางจิตใจหรือพฤติกรรม', 'Psychological or Behavioral Disability'),
(5, 'ทางสติปัญญา', 'Intellectual Disability'),
(6, 'ทางการเรียนรู้', 'Learning Disability'),
(7, 'ออทิสติก', 'Autistic');

CREATE TABLE provinces (
  id SERIAL PRIMARY KEY,
  province_name VARCHAR(255) NOT NULL
);

CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  of_province_id INT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  district_name VARCHAR(255) NOT NULL
);

CREATE TABLE subdistricts (
  id SERIAL PRIMARY KEY,
  of_district_id INT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  subdistrict_name VARCHAR(255) NOT NULL,
  zip_code VARCHAR(10) NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  th_human_number VARCHAR(13) UNIQUE NOT NULL,
  first_name_th VARCHAR(255) NOT NULL,
  last_name_th VARCHAR(255) NOT NULL,
  first_name_en VARCHAR(255) DEFAULT '',
  last_name_en VARCHAR(255) DEFAULT '',
  title_th VARCHAR(50) DEFAULT 'นาย',
  title_en VARCHAR(50) DEFAULT 'Mr.',
  gender_id INT DEFAULT 1 REFERENCES gender_list(id),
  sex_name VARCHAR(50) DEFAULT 'ชาย',
  nationality_name VARCHAR(100) DEFAULT 'ไทย',
  birth_day TIMESTAMP NOT NULL DEFAULT NOW(),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) DEFAULT 'password123',
  house_number VARCHAR(50) NOT NULL,
  house_group INT DEFAULT 0,
  road_name VARCHAR(100) DEFAULT '',
  alley_name VARCHAR(100) DEFAULT '',
  subdistrict_id INT REFERENCES subdistricts(id),
  district_id INT REFERENCES districts(id),
  province_id INT REFERENCES provinces(id),
  heq_id INT DEFAULT 1 REFERENCES heq_list(id),
  branch_name VARCHAR(255) DEFAULT '',
  physical_id INT DEFAULT 1 REFERENCES physical_list(id),
  id_photo_file_pathname VARCHAR(255) DEFAULT NULL,
  identification_file_pathname VARCHAR(255) DEFAULT NULL,
  eq_file_pathname VARCHAR(255) DEFAULT NULL,
  is_allowed INT DEFAULT 1,
  is_admin INT DEFAULT 0,
  status_id INT DEFAULT 1,
  redirect_tag VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (
  id, th_human_number, first_name_th, last_name_th, first_name_en, last_name_en, title_th, title_en,
  gender_id, sex_name, nationality_name, birth_day, phone_number, email, password_hash,
  house_number, house_group, road_name, alley_name, subdistrict_id, district_id, province_id,
  heq_id, branch_name, physical_id, is_allowed, is_admin, status_id, redirect_tag
) VALUES
(1, '1111111111111', 'ผู้ดูแล', 'ระบบ', 'Admin', 'System', 'นาย', 'Mr.', 1, 'ชาย', 'ไทย', '2000-01-01', '0812345678', 'admin@tmrda.com', 'admin123', '1', 1, 'สุขุมวิท', 'สุขุมวิท 1', NULL, NULL, NULL, 5, 'เทคโนโลยีสารสนเทศ', 1, 1, 1, 1, 'admin'),
(2, '1234567890123', 'สมชาย', 'ใจดี', 'Somchai', 'Jaidee', 'นาย', 'Mr.', 1, 'ชาย', 'ไทย', '2000-01-01', '0898765432', 'somchai@example.com', 'user123', '99/9', 2, 'พหลโยธิน', 'พหลโยธิน 5', NULL, NULL, NULL, 5, 'คอมพิวเตอร์', 1, 1, 0, 1, 'user');

CREATE TABLE users_disability (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  physical_disabled_id INT NOT NULL REFERENCES physical_disabled_list(id)
);

CREATE TABLE training (
  id SERIAL PRIMARY KEY,
  agency_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_name_en VARCHAR(255) DEFAULT '',
  traning_hours INT DEFAULT 0,
  branch_name VARCHAR(255) DEFAULT '',
  level_name VARCHAR(255) DEFAULT '',
  startswith_date DATE DEFAULT NULL,
  endswith_date DATE DEFAULT NULL,
  between_date VARCHAR(255) DEFAULT '',
  limit_course INT DEFAULT 30,
  executive_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO training (id, agency_name, course_name, course_name_en, traning_hours, branch_name, level_name, startswith_date, endswith_date, between_date, limit_course, executive_name) VALUES
(1, 'สถาบันพัฒนาฝีมือแรงงาน', 'การเขียนโปรแกรมเว็บเบื้องต้น', 'Basic Web Development', 30, 'เทคโนโลยีสารสนเทศ', 'ระดับ 1', '2026-08-10', '2026-08-15', '10/08/2026 - 15/08/2026', 30, 'ผู้อำนวยการสถาบัน'),
(2, 'สถาบันพัฒนาฝีมือแรงงาน', 'การวิเคราะห์ข้อมูลด้วย Python', 'Data Analysis with Python', 40, 'เทคโนโลยีสารสนเทศ', 'ระดับ 2', '2026-09-01', '2026-09-07', '01/09/2026 - 07/09/2026', 25, 'ผู้อำนวยการสถาบัน');

CREATE TABLE apply_training (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  history_id INT DEFAULT 0,
  training_id INT NOT NULL REFERENCES training(id) ON DELETE CASCADE,
  training_type VARCHAR(100) DEFAULT 'ปกติ',
  applicant_type VARCHAR(100) DEFAULT 'ประชาชนทั่วไป',
  is_skill_testing BOOLEAN DEFAULT FALSE,
  is_accept INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'รอพิจารณา',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE histories_labor (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_have_job VARCHAR(50) DEFAULT 'ทำงาน',
  labor_status VARCHAR(100) DEFAULT 'ภาคเอกชน',
  labor_salary VARCHAR(100) DEFAULT '1 - 5,000 บาท',
  occupation VARCHAR(255) DEFAULT '',
  position VARCHAR(255) DEFAULT '',
  year_of_service VARCHAR(50) DEFAULT '',
  agency_name VARCHAR(255) DEFAULT '',
  province_id INT DEFAULT 1,
  phone_number VARCHAR(50) DEFAULT '',
  industrial_groups_working VARCHAR(255) DEFAULT 'การแปรรูปอาหาร',
  not_have_job_status VARCHAR(255) DEFAULT '',
  known_source_of_training VARCHAR(255) DEFAULT 'โทรทัศน์',
  is_accept_publish VARCHAR(50) DEFAULT 'ยินยอมเปิดเผย',
  is_want_job VARCHAR(50) DEFAULT 'ไม่ต้องการ',
  is_want_job_inside VARCHAR(50) DEFAULT 'ไม่ต้องการ',
  accept_job_position VARCHAR(255) DEFAULT '',
  accept_job_industry VARCHAR(255) DEFAULT '',
  accept_job_in_country_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_form (
  id SERIAL PRIMARY KEY,
  training_id INT NOT NULL REFERENCES training(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit_minutes INT DEFAULT 60,
  passing_percentage INT DEFAULT 70,
  total_score INT DEFAULT 100,
  score_knowledge_max INT DEFAULT 40,
  score_practice_max INT DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  randomize_questions BOOLEAN DEFAULT FALSE,
  randomize_choices BOOLEAN DEFAULT FALSE,
  questions JSONB DEFAULT '[]'::jsonb,
  practical_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO test_form (id, training_id, title, description, time_limit_minutes, passing_percentage, total_score, score_knowledge_max, score_practice_max, is_active) VALUES
(1, 1, 'แบบทดสอบวัดระดับการเขียนโปรแกรมเว็บ', 'วัดความรู้พื้นฐาน HTML, CSS และ JavaScript', 60, 70, 100, 40, 60, TRUE),
(2, 2, 'แบบประเมินผลการวิเคราะห์ข้อมูลด้วย Python', 'วัดความรู้ Data Cleaning, Pandas และ Visualizations', 90, 75, 100, 50, 50, TRUE);

CREATE TABLE test_form_history (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_form_id INT NOT NULL REFERENCES test_form(id) ON DELETE CASCADE,
  score_knowledge FLOAT DEFAULT 0,
  score_practice FLOAT DEFAULT 0,
  total_score FLOAT DEFAULT 0,
  result_status VARCHAR(50) DEFAULT 'ผ่านการประเมิน',
  pratice_history_path VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE training ENABLE ROW LEVEL SECURITY;
ALTER TABLE apply_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_form_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read training" ON training FOR SELECT USING (true);
CREATE POLICY "Allow public insert training" ON training FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update training" ON training FOR UPDATE USING (true);

CREATE POLICY "Allow public read apply_training" ON apply_training FOR SELECT USING (true);
CREATE POLICY "Allow public insert apply_training" ON apply_training FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update apply_training" ON apply_training FOR UPDATE USING (true);

CREATE POLICY "Allow public read histories_labor" ON histories_labor FOR SELECT USING (true);
CREATE POLICY "Allow public insert histories_labor" ON histories_labor FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update histories_labor" ON histories_labor FOR UPDATE USING (true);

CREATE POLICY "Allow public read test_form" ON test_form FOR SELECT USING (true);
CREATE POLICY "Allow public read test_form_history" ON test_form_history FOR SELECT USING (true);
