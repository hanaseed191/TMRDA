import { User, TrainingCourse, TrainingApplication, LaborHistory, TestForm } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './client';

// ===================================================================
// MockDataStore - Now backed by Supabase (real database)
// Only login session (getCurrentUser/setCurrentUser) uses localStorage.
// All other data is read/written directly from Supabase tables.
// ===================================================================

// Fallback users for login mock only
const fallbackUsers: User[] = [
  {
    id: 1,
    th_human_number: '1111111111111',
    first_name_th: 'ผู้ดูแล',
    last_name_th: 'ระบบ',
    first_name_en: 'Admin',
    last_name_en: 'System',
    title_th: 'นาย',
    title_en: 'Mr.',
    gender_id: 1,
    sex_name: 'ชาย',
    nationality_name: 'ไทย',
    birth_day: '2000-01-01',
    phone_number: '0812345678',
    email: 'admin@tmrda.com',
    house_number: '1',
    house_group: 1,
    road_name: 'สุขุมวิท',
    alley_name: 'สุขุมวิท 1',
    province_id: 1,
    district_id: 1,
    subdistrict_id: 1,
    heq_id: 5,
    branch_name: 'เทคโนโลยีสารสนเทศ',
    physical_id: 1,
    is_allowed: 1,
    is_admin: 1,
    status_id: 1,
    redirect_tag: 'admin'
  },
  {
    id: 2,
    th_human_number: '1234567890123',
    first_name_th: 'สมชาย',
    last_name_th: 'ใจดี',
    first_name_en: 'Somchai',
    last_name_en: 'Jaidee',
    title_th: 'นาย',
    title_en: 'Mr.',
    gender_id: 1,
    sex_name: 'ชาย',
    nationality_name: 'ไทย',
    birth_day: '2000-01-01',
    phone_number: '0898765432',
    email: 'somchai@example.com',
    house_number: '99/9',
    house_group: 2,
    road_name: 'พหลโยธิน',
    alley_name: 'พหลโยธิน 5',
    province_id: 2,
    district_id: 5,
    subdistrict_id: 6,
    heq_id: 5,
    branch_name: 'คอมพิวเตอร์',
    physical_id: 1,
    is_allowed: 1,
    is_admin: 0,
    status_id: 1,
    redirect_tag: 'user'
  }
];

export class MockDataStore {
  private static SESSION_KEY = 'tmrda_current_user';

  // ─── Login Session (localStorage only) ───────────────────────────

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return fallbackUsers[1];
    const data = localStorage.getItem(this.SESSION_KEY);
    if (data) {
      try { return JSON.parse(data); } catch { return null; }
    }
    return null;
  }

  static setCurrentUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    }
  }

  // ─── Users (Supabase: users table) ───────────────────────────────

  static async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error || !data || data.length === 0) {
      return fallbackUsers;
    }
    return data as User[];
  }

  static async updateUser(id: number, updatedFields: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้: ' + (error?.message || 'Unknown error'));
    }

    // Update session if editing current user
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.setCurrentUser(data as User);
    }

    return data as User;
  }

  static async addUser(newUser: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        th_human_number: newUser.th_human_number,
        first_name_th: newUser.first_name_th,
        last_name_th: newUser.last_name_th,
        first_name_en: newUser.first_name_en || '',
        last_name_en: newUser.last_name_en || '',
        title_th: newUser.title_th || 'นาย',
        title_en: newUser.title_en || 'Mr.',
        gender_id: newUser.gender_id || 1,
        sex_name: newUser.sex_name || 'ชาย',
        nationality_name: newUser.nationality_name || 'ไทย',
        birth_day: newUser.birth_day || '2000-01-01',
        phone_number: newUser.phone_number,
        email: newUser.email,
        house_number: newUser.house_number || '',
        house_group: newUser.house_group || 1,
        road_name: newUser.road_name || '',
        alley_name: newUser.alley_name || '',
        province_id: newUser.province_id || null,
        district_id: newUser.district_id || null,
        subdistrict_id: newUser.subdistrict_id || null,
        heq_id: newUser.heq_id || 5,
        branch_name: newUser.branch_name || '',
        physical_id: newUser.physical_id || 1,
        is_allowed: newUser.is_allowed ?? 1,
        is_admin: newUser.is_admin ?? 0,
        status_id: newUser.status_id || 1,
        redirect_tag: newUser.is_admin === 1 ? 'admin' : 'user',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('ไม่สามารถสร้างผู้ใช้งานได้: ' + (error?.message || 'Unknown error'));
    }

    const created = data as User;
    this.setCurrentUser(created);
    return created;
  }

  // ─── Courses (Supabase: training table) ──────────────────────────

  static async getCourses(): Promise<TrainingCourse[]> {
    const { data, error } = await supabase.from('training').select('*').order('id');
    if (error || !data) {
      console.error('getCourses error:', error);
      return [];
    }
    return data as TrainingCourse[];
  }

  static async addCourse(course: Omit<TrainingCourse, 'id'>): Promise<TrainingCourse> {
    const { data, error } = await supabase
      .from('training')
      .insert({
        agency_name: course.agency_name,
        course_name: course.course_name,
        course_name_en: course.course_name_en || '',
        traning_hours: course.traning_hours,
        branch_name: course.branch_name,
        level_name: course.level_name,
        startswith_date: course.startswith_date,
        endswith_date: course.endswith_date,
        between_date: course.between_date,
        limit_course: course.limit_course,
        executive_name: course.executive_name,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('ไม่สามารถสร้างคอร์สได้: ' + (error?.message || 'Unknown error'));
    }
    return data as TrainingCourse;
  }

  static async updateCourse(id: number, updated: Partial<TrainingCourse>): Promise<TrainingCourse> {
    // Remove fields that don't exist in DB table
    const { applied_count, ...dbFields } = updated as any;

    const { data, error } = await supabase
      .from('training')
      .update(dbFields)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error('ไม่สามารถอัปเดตคอร์สได้: ' + (error?.message || 'Unknown error'));
    }
    return data as TrainingCourse;
  }

  // ─── Applications (Supabase: apply_training table) ───────────────

  static async getApplications(): Promise<TrainingApplication[]> {
    const { data, error } = await supabase.from('apply_training').select('*').order('id');
    if (error || !data) {
      console.error('getApplications error:', error);
      return [];
    }
    return data as TrainingApplication[];
  }

  static async applyCourse(userId: number, trainingId: number): Promise<TrainingApplication> {
    // Check if already applied
    const { data: existing } = await supabase
      .from('apply_training')
      .select('*')
      .eq('user_id', userId)
      .eq('training_id', trainingId)
      .maybeSingle();

    if (existing) {
      return existing as TrainingApplication;
    }

    const { data, error } = await supabase
      .from('apply_training')
      .insert({
        user_id: userId,
        training_id: trainingId,
        status: 'รอพิจารณา',
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('ไม่สามารถสมัครคอร์สได้: ' + (error?.message || 'Unknown error'));
    }
    return data as TrainingApplication;
  }

  static async cancelApplication(id: number): Promise<boolean> {
    const { error } = await supabase.from('apply_training').delete().eq('id', id);
    if (error) {
      console.error('cancelApplication error:', error);
      throw new Error('ไม่สามารถยกเลิกการสมัครได้: ' + error.message);
    }
    return true;
  }

  // ─── Labor History (Supabase: histories_labor table) ──────────────

  static async getLaborHistory(userId: number): Promise<LaborHistory | undefined> {
    const { data, error } = await supabase
      .from('histories_labor')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return undefined;
    return data as LaborHistory;
  }

  static async saveLaborHistory(history: LaborHistory): Promise<LaborHistory> {
    // Check if exists
    const { data: existing } = await supabase
      .from('histories_labor')
      .select('id')
      .eq('user_id', history.user_id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('histories_labor')
        .update(history)
        .eq('user_id', history.user_id)
        .select()
        .single();
      if (error) throw new Error('ไม่สามารถอัปเดตประวัติได้: ' + error.message);
      return data as LaborHistory;
    } else {
      const { data, error } = await supabase
        .from('histories_labor')
        .insert(history)
        .select()
        .single();
      if (error) throw new Error('ไม่สามารถบันทึกประวัติได้: ' + error.message);
      return data as LaborHistory;
    }
  }

  // ─── Test Forms (Supabase: test_form table) ──────────────────────

  static async getTestForms(trainingId?: number, examType?: 'theory' | 'practical'): Promise<TestForm[]> {
    let query = supabase.from('test_form').select('*').order('id');
    if (trainingId) {
      query = query.eq('training_id', trainingId);
    }
    const { data, error } = await query;
    if (error || !data) {
      console.error('getTestForms error:', error);
      return [];
    }

    let forms = data as TestForm[];
    if (examType) {
      forms = forms.filter((t) => (t.exam_type || 'theory') === examType);
    }
    return forms;
  }

  static async saveTestForm(form: TestForm): Promise<TestForm> {
    const dbPayload: any = {
      training_id: form.training_id,
      title: form.title,
      description: form.description,
      time_limit_minutes: form.time_limit_minutes,
      passing_percentage: form.passing_percentage,
      total_score: form.total_score,
      score_knowledge_max: form.score_knowledge_max,
      score_practice_max: form.score_practice_max,
      is_active: form.is_active,
      randomize_questions: form.randomize_questions || false,
      randomize_choices: form.randomize_choices || false,
      questions: form.questions || [],
      practical_items: form.practical_items || [],
    };

    if (form.id && form.id > 0) {
      // Update existing
      const { data, error } = await supabase
        .from('test_form')
        .update(dbPayload)
        .eq('id', form.id)
        .select()
        .maybeSingle(); // Use maybeSingle to prevent "Cannot coerce" exception if empty
      if (error || !data) {
        throw new Error(
          'ไม่สามารถอัปเดตชุดข้อสอบได้: ' + (error?.message || 'ไม่พบข้อมูลหรือโดนปฏิเสธสิทธิ์ RLS') + 
          '\n\n*ข้อแนะนำ: กรุณาเข้าไปที่ Supabase SQL Editor แล้วรันคำสั่ง:\n' +
          'CREATE POLICY "Allow public update test_form" ON test_form FOR UPDATE USING (true);*'
        );
      }
      return { ...form, ...data } as TestForm;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('test_form')
        .insert(dbPayload)
        .select()
        .maybeSingle(); // Use maybeSingle to prevent "Cannot coerce" exception if empty
      if (error || !data) {
        throw new Error(
          'ไม่สามารถสร้างชุดข้อสอบได้: ' + (error?.message || 'โดนปฏิเสธสิทธิ์ RLS') + 
          '\n\n*ข้อแนะนำ: กรุณาเข้าไปที่ Supabase SQL Editor แล้วรันคำสั่ง:\n' +
          'CREATE POLICY "Allow public insert test_form" ON test_form FOR INSERT WITH CHECK (true);*'
        );
      }
      return { ...form, ...data } as TestForm;
    }
  }

  static async deleteTestForm(id: number): Promise<void> {
    const { error } = await supabase.from('test_form').delete().eq('id', id);
    if (error) {
      throw new Error(
        'ไม่สามารถลบชุดข้อสอบได้: ' + error.message + 
        '\n\n*ข้อแนะนำ: กรุณาเข้าไปที่ Supabase SQL Editor แล้วรันคำสั่ง:\n' +
        'CREATE POLICY "Allow public delete test_form" ON test_form FOR DELETE USING (true);*'
      );
    }
  }

  // ─── Exam Results ────────────────────────────────────────────────

  static async recordExamResult(userId: number, trainingId: number, score: number, maxScore: number, passed: boolean): Promise<void> {
    // Update apply_training record with exam results
    await supabase
      .from('apply_training')
      .update({
        theory_score: score,
        theory_max_score: maxScore,
        theory_passed: passed,
        exam_submitted_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId)
      .eq('training_id', trainingId);
  }

  // ─── Document Attachments ───────────────────────────────────────

  static async uploadUserDocument(
    userId: number,
    field: 'identification_file_pathname' | 'eq_file_pathname' | 'id_photo_file_pathname',
    file: File
  ): Promise<string> {
    if (isSupabaseConfigured) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${field}_${Date.now()}.${fileExt}`;
        const filePath = `user_documents/${fileName}`;

        // Ensure the bucket 'documents' exists
        try {
          await supabase.storage.createBucket('documents', { public: true });
        } catch (e) {}

        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
          return publicUrlData.publicUrl;
        } else {
          console.warn('Supabase storage upload failed, falling back to local simulation:', error?.message);
        }
      } catch (e) {
        console.warn('Supabase storage error, falling back to local simulation:', e);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        try {
          localStorage.setItem(`mock_doc_${userId}_${field}`, base64data);
        } catch (e) {
          console.warn('Failed to save to localStorage (quota exceeded)');
        }
        resolve(base64data);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  static getUserDocumentUrl(
    user: User,
    field: 'identification_file_pathname' | 'eq_file_pathname' | 'id_photo_file_pathname'
  ): string | null {
    const val = user[field];
    if (!val) return null;
    if (val.startsWith('http') || val.startsWith('data:')) {
      return val;
    }
    if (val === `local_storage_file_for_${field}`) {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(`mock_doc_${user.id}_${field}`);
      }
    }
    return null;
  }
}
