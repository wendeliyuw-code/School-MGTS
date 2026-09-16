import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Institution,
  UserProfile,
  AcademicYear,
  Term,
  GradeLevel,
  Subject,
  AssessmentType,
  ClassRoom,
  Student,
  Staff,
  Guardian,
  Enrollment,
  TeachingAssignment,
  TimetableSlot,
  AttendanceRecord,
  Assessment,
  ScoreRecord,
  FeeCategory,
  FeeStructure,
  StudentInvoice,
  Payment,
  Announcement,
  MessageThread,
  ChatMessage,
  TaskItem,
  AuditLog
} from '../types';

export const DEMO_INSTITUTION_ID = 'inst_st_jude_001';

export const DEMO_PERSONAS = [
  {
    role: 'SUPER_ADMIN' as const,
    email: 'superadmin@edusphere.io',
    name: 'Alex Mercer',
    title: 'Platform Super Admin',
    desc: 'Full multi-tenant authority, cross-institution audits & institution management',
    uid: 'user_super_admin_001',
    institution_id: ''
  },
  {
    role: 'ADMIN' as const,
    email: 'admin@stjude.edu',
    name: 'Dr. Eleanor Vance',
    title: 'School Principal / Chief Admin',
    desc: 'Full control of St. Jude College: users, academics, fees, settings',
    uid: 'user_admin_001',
    institution_id: DEMO_INSTITUTION_ID
  },
  {
    role: 'TEACHER' as const,
    email: 'teacher@stjude.edu',
    name: 'Prof. Arthur Pendelton',
    title: 'Head of Physics & Sciences',
    desc: 'Records attendance, enters student marks, communicates with guardians',
    uid: 'user_teacher_001',
    institution_id: DEMO_INSTITUTION_ID
  },
  {
    role: 'STUDENT' as const,
    email: 'student@stjude.edu',
    name: 'Lucas Chen',
    title: 'Pre-U Year 2 Scholar',
    desc: 'Views timetable, attendance rate, assessment scores, fee invoices',
    uid: 'user_student_001',
    institution_id: DEMO_INSTITUTION_ID
  },
  {
    role: 'GUARDIAN' as const,
    email: 'guardian@stjude.edu',
    name: 'Sarah Chen',
    title: 'Parent / Guardian',
    desc: "Monitors Lucas's academic performance, pays fees, messages teachers",
    uid: 'user_guardian_001',
    institution_id: DEMO_INSTITUTION_ID
  },
  {
    role: 'STAFF' as const,
    email: 'staff@stjude.edu',
    name: 'Marcus Brody',
    title: 'Bursar & Finance Officer',
    desc: 'Manages fee structures, generates invoices, logs receipts',
    uid: 'user_staff_001',
    institution_id: DEMO_INSTITUTION_ID
  }
];

export async function seedDemoDatabase(force = false): Promise<{ success: boolean; message: string }> {
  try {
    // Check if demo institution already exists
    const instRef = doc(db, 'institutions', DEMO_INSTITUTION_ID);
    if (!force) {
      const existing = await getDocs(query(collection(db, 'institutions'), where('code', '==', 'STJUDE')));
      if (!existing.empty) {
        return { success: true, message: 'Demo data already initialized.' };
      }
    }

    const now = new Date().toISOString();

    // 1. Institution
    const demoInstitution: Institution = {
      id: DEMO_INSTITUTION_ID,
      name: 'St. Jude Pre-University College',
      code: 'STJUDE',
      type: 'Pre-University & Sixth Form',
      address: '42 Academic Avenue, Cambridge District',
      region: 'East Anglia',
      phone: '+44 1223 908123',
      email: 'info@stjude.edu',
      logo_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
      timezone: 'UTC',
      settings: {
        grading_scale: [
          { grade: 'A*', min: 90, max: 100, gpa: 4.0 },
          { grade: 'A', min: 80, max: 89, gpa: 3.8 },
          { grade: 'B', min: 70, max: 79, gpa: 3.3 },
          { grade: 'C', min: 60, max: 69, gpa: 2.7 },
          { grade: 'D', min: 50, max: 59, gpa: 2.0 },
          { grade: 'F', min: 0, max: 49, gpa: 0.0 }
        ],
        currency: 'USD',
        allow_parent_registration: false,
        passmark: 50
      },
      status: 'active',
      created_at: now,
      updated_at: now
    };
    await setDoc(instRef, demoInstitution);

    // 2. Academic Year & Terms
    const yearId = 'ay_2025_2026';
    const academicYear: AcademicYear = {
      id: yearId,
      institution_id: DEMO_INSTITUTION_ID,
      name: '2025 / 2026 Academic Year',
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      is_current: true,
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'academic_years', yearId), academicYear);

    const term1Id = 'term_michaelmas_2025';
    const term2Id = 'term_lent_2026';
    const terms: Term[] = [
      {
        id: term1Id,
        institution_id: DEMO_INSTITUTION_ID,
        academic_year_id: yearId,
        name: 'Term 1 (Michaelmas)',
        start_date: '2025-09-01',
        end_date: '2025-12-15',
        is_current: false,
        created_at: now,
        updated_at: now
      },
      {
        id: term2Id,
        institution_id: DEMO_INSTITUTION_ID,
        academic_year_id: yearId,
        name: 'Term 2 (Lent)',
        start_date: '2026-01-10',
        end_date: '2026-04-10',
        is_current: true,
        created_at: now,
        updated_at: now
      }
    ];
    for (const t of terms) {
      await setDoc(doc(db, 'terms', t.id), t);
    }

    // 3. Grade Levels
    const gradeLevel1Id = 'gl_year1';
    const gradeLevel2Id = 'gl_year2';
    const gradeLevels: GradeLevel[] = [
      { id: gradeLevel1Id, institution_id: DEMO_INSTITUTION_ID, name: 'Pre-U Year 1 (AS Level)', sort_order: 1, created_at: now },
      { id: gradeLevel2Id, institution_id: DEMO_INSTITUTION_ID, name: 'Pre-U Year 2 (A2 Level)', sort_order: 2, created_at: now }
    ];
    for (const gl of gradeLevels) {
      await setDoc(doc(db, 'grade_levels', gl.id), gl);
    }

    // 4. Subjects
    const subjects: Subject[] = [
      { id: 'subj_math', institution_id: DEMO_INSTITUTION_ID, name: 'Advanced Pure Mathematics', code: 'MATH101', is_elective: false, created_at: now },
      { id: 'subj_phys', institution_id: DEMO_INSTITUTION_ID, name: 'Theoretical & Applied Physics', code: 'PHYS101', is_elective: false, created_at: now },
      { id: 'subj_chem', institution_id: DEMO_INSTITUTION_ID, name: 'Organic & Physical Chemistry', code: 'CHEM101', is_elective: true, created_at: now },
      { id: 'subj_econ', institution_id: DEMO_INSTITUTION_ID, name: 'Macroeconomics & Global Finance', code: 'ECON101', is_elective: true, created_at: now },
      { id: 'subj_lit', institution_id: DEMO_INSTITUTION_ID, name: 'World Literature & Critical Analysis', code: 'LIT101', is_elective: true, created_at: now },
      { id: 'subj_cs', institution_id: DEMO_INSTITUTION_ID, name: 'Computer Science & Algorithms', code: 'CS101', is_elective: true, created_at: now }
    ];
    for (const s of subjects) {
      await setDoc(doc(db, 'subjects', s.id), s);
    }

    // 5. Assessment Types
    const assessmentTypes: AssessmentType[] = [
      { id: 'at_hw', institution_id: DEMO_INSTITUTION_ID, name: 'Problem Sets & Continuous Work', weight: 15, created_at: now },
      { id: 'at_mid', institution_id: DEMO_INSTITUTION_ID, name: 'Mid-Term Examination', weight: 25, created_at: now },
      { id: 'at_final', institution_id: DEMO_INSTITUTION_ID, name: 'End-of-Term Final Assessment', weight: 60, created_at: now }
    ];
    for (const at of assessmentTypes) {
      await setDoc(doc(db, 'assessment_types', at.id), at);
    }

    // 6. Users (All 6 Roles)
    for (const p of DEMO_PERSONAS) {
      const userDoc: UserProfile = {
        uid: p.uid,
        institution_id: p.institution_id,
        email: p.email,
        role: p.role,
        display_name: p.name,
        is_active: true,
        email_verified: true,
        last_login: now,
        created_at: now,
        updated_at: now
      };
      await setDoc(doc(db, 'users', p.uid), userDoc);
    }

    // 7. Classes
    const class1Id = 'class_yr2_sci';
    const class2Id = 'class_yr2_econ';
    const classes: ClassRoom[] = [
      {
        id: class1Id,
        institution_id: DEMO_INSTITUTION_ID,
        academic_year_id: yearId,
        grade_level_id: gradeLevel2Id,
        name: 'Year 2 - Science Cohort Alpha',
        class_teacher_id: 'user_teacher_001',
        capacity: 25,
        created_at: now,
        updated_at: now
      },
      {
        id: class2Id,
        institution_id: DEMO_INSTITUTION_ID,
        academic_year_id: yearId,
        grade_level_id: gradeLevel2Id,
        name: 'Year 2 - Social Sciences & Econ',
        class_teacher_id: 'user_teacher_001',
        capacity: 25,
        created_at: now,
        updated_at: now
      }
    ];
    for (const c of classes) {
      await setDoc(doc(db, 'classes', c.id), c);
    }

    // 8. Staff Details
    const staffDoc: Staff = {
      id: 'staff_arthur',
      user_id: 'user_teacher_001',
      institution_id: DEMO_INSTITUTION_ID,
      staff_no: 'ST-0042',
      first_name: 'Arthur',
      last_name: 'Pendelton',
      date_of_birth: '1980-05-14',
      gender: 'male',
      qualification: 'M.Sc. Physics (Oxon), PGCE',
      designation: 'Senior Physics Lecturer',
      hire_date: '2018-08-15',
      status: 'active',
      extra_data: { lab_clearance: 'Level 3 Hazardous Materials', office: 'Kelvin Hall Room 302' },
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'staff', staffDoc.id), staffDoc);

    const nonTeachingStaff: Staff = {
      id: 'staff_marcus',
      user_id: 'user_staff_001',
      institution_id: DEMO_INSTITUTION_ID,
      staff_no: 'ST-0089',
      first_name: 'Marcus',
      last_name: 'Brody',
      date_of_birth: '1975-11-20',
      gender: 'male',
      qualification: 'CPA, B.Sc. Accountancy',
      designation: 'College Bursar',
      hire_date: '2016-03-01',
      status: 'active',
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'staff', nonTeachingStaff.id), nonTeachingStaff);

    // 9. Guardians
    const guardianDoc: Guardian = {
      id: 'guard_sarah',
      user_id: 'user_guardian_001',
      institution_id: DEMO_INSTITUTION_ID,
      first_name: 'Sarah',
      last_name: 'Chen',
      phone: '+44 7700 900123',
      email: 'guardian@stjude.edu',
      occupation: 'Biomedical Consultant',
      address: '18 Orchard Road, Cambridge',
      student_ids: ['stud_lucas'],
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'guardians', guardianDoc.id), guardianDoc);

    // 10. Students
    const student1: Student = {
      id: 'stud_lucas',
      user_id: 'user_student_001',
      institution_id: DEMO_INSTITUTION_ID,
      admission_no: 'STU-2024-001',
      first_name: 'Lucas',
      middle_name: 'Wei',
      last_name: 'Chen',
      date_of_birth: '2007-04-12',
      gender: 'male',
      nationality: 'British-Singaporean',
      address: '18 Orchard Road, Cambridge',
      photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      enrollment_date: '2024-09-02',
      status: 'active',
      guardian_ids: ['guard_sarah'],
      extra_data: { dietary: 'Vegetarian', medical_flag: 'Mild peanut allergy' },
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'students', student1.id), student1);

    const student2: Student = {
      id: 'stud_charlotte',
      institution_id: DEMO_INSTITUTION_ID,
      admission_no: 'STU-2024-002',
      first_name: 'Charlotte',
      last_name: 'Taylor',
      date_of_birth: '2007-08-23',
      gender: 'female',
      nationality: 'British',
      address: '5 Grange Road, Cambridge',
      photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      enrollment_date: '2024-09-02',
      status: 'active',
      guardian_ids: [],
      extra_data: { scholarship: 'St. Jude Academic Honor' },
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'students', student2.id), student2);

    const student3: Student = {
      id: 'stud_amara',
      institution_id: DEMO_INSTITUTION_ID,
      admission_no: 'STU-2024-003',
      first_name: 'Amara',
      last_name: 'Okonkwo',
      date_of_birth: '2007-01-19',
      gender: 'female',
      nationality: 'Nigerian',
      address: '9 Victoria Crescent, Cambridge',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      enrollment_date: '2024-09-02',
      status: 'active',
      guardian_ids: [],
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'students', student3.id), student3);

    const student4: Student = {
      id: 'stud_elias',
      institution_id: DEMO_INSTITUTION_ID,
      admission_no: 'STU-2024-004',
      first_name: 'Elias',
      last_name: 'Rostova',
      date_of_birth: '2006-12-05',
      gender: 'male',
      nationality: 'German',
      address: '77 Hills Road, Cambridge',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      enrollment_date: '2024-09-02',
      status: 'active',
      guardian_ids: [],
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'students', student4.id), student4);

    // 11. Enrollments
    const enrollments: Enrollment[] = [
      { id: 'enr_lucas', institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_lucas', class_id: class1Id, academic_year_id: yearId, roll_no: '01', enrolled_on: '2024-09-02', status: 'active', created_at: now },
      { id: 'enr_charlotte', institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_charlotte', class_id: class1Id, academic_year_id: yearId, roll_no: '02', enrolled_on: '2024-09-02', status: 'active', created_at: now },
      { id: 'enr_amara', institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_amara', class_id: class1Id, academic_year_id: yearId, roll_no: '03', enrolled_on: '2024-09-02', status: 'active', created_at: now },
      { id: 'enr_elias', institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_elias', class_id: class1Id, academic_year_id: yearId, roll_no: '04', enrolled_on: '2024-09-02', status: 'active', created_at: now }
    ];
    for (const e of enrollments) {
      await setDoc(doc(db, 'enrollments', e.id), e);
    }

    // 12. Teaching Assignments
    const ta1: TeachingAssignment = {
      id: 'ta_arthur_phys',
      institution_id: DEMO_INSTITUTION_ID,
      staff_id: 'user_teacher_001',
      class_id: class1Id,
      subject_id: 'subj_phys',
      term_id: term2Id,
      created_at: now
    };
    const ta2: TeachingAssignment = {
      id: 'ta_arthur_math',
      institution_id: DEMO_INSTITUTION_ID,
      staff_id: 'user_teacher_001',
      class_id: class1Id,
      subject_id: 'subj_math',
      term_id: term2Id,
      created_at: now
    };
    await setDoc(doc(db, 'teaching_assignments', ta1.id), ta1);
    await setDoc(doc(db, 'teaching_assignments', ta2.id), ta2);

    // 13. Timetable
    const timetable: TimetableSlot[] = [
      { id: 'tt_1', institution_id: DEMO_INSTITUTION_ID, class_id: class1Id, day_of_week: 'Monday', period: 1, subject_id: 'subj_phys', staff_id: 'user_teacher_001', room: 'Lab 4B', created_at: now },
      { id: 'tt_2', institution_id: DEMO_INSTITUTION_ID, class_id: class1Id, day_of_week: 'Monday', period: 2, subject_id: 'subj_math', staff_id: 'user_teacher_001', room: 'Room 201', created_at: now },
      { id: 'tt_3', institution_id: DEMO_INSTITUTION_ID, class_id: class1Id, day_of_week: 'Tuesday', period: 1, subject_id: 'subj_chem', staff_id: 'user_teacher_001', room: 'Lab 2A', created_at: now },
      { id: 'tt_4', institution_id: DEMO_INSTITUTION_ID, class_id: class1Id, day_of_week: 'Wednesday', period: 3, subject_id: 'subj_cs', staff_id: 'user_teacher_001', room: 'Tech Suite 1', created_at: now },
      { id: 'tt_5', institution_id: DEMO_INSTITUTION_ID, class_id: class1Id, day_of_week: 'Thursday', period: 2, subject_id: 'subj_phys', staff_id: 'user_teacher_001', room: 'Lab 4B', created_at: now },
      { id: 'tt_6', institution_id: DEMO_INSTITUTION_ID, class_id: class1Id, day_of_week: 'Friday', period: 4, subject_id: 'subj_econ', staff_id: 'user_teacher_001', room: 'Seminar Hall', created_at: now }
    ];
    for (const item of timetable) {
      await setDoc(doc(db, 'timetable', item.id), item);
    }

    // 14. Attendance (Recent sample days)
    const recentDates = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-16'];
    for (const d of recentDates) {
      const records: AttendanceRecord[] = [
        { id: `att_${d}_lucas`, institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_lucas', class_id: class1Id, date: d, status: 'present', remarks: 'Engaged and prepared', recorded_by: 'user_teacher_001', created_at: now },
        { id: `att_${d}_charlotte`, institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_charlotte', class_id: class1Id, date: d, status: 'present', remarks: '', recorded_by: 'user_teacher_001', created_at: now },
        { id: `att_${d}_amara`, institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_amara', class_id: class1Id, date: d, status: d === '2026-03-12' ? 'late' : 'present', remarks: d === '2026-03-12' ? 'Train delayed 10m' : '', recorded_by: 'user_teacher_001', created_at: now },
        { id: `att_${d}_elias`, institution_id: DEMO_INSTITUTION_ID, student_id: 'stud_elias', class_id: class1Id, date: d, status: d === '2026-03-11' ? 'excused' : 'present', remarks: d === '2026-03-11' ? 'Dental appointment' : '', recorded_by: 'user_teacher_001', created_at: now }
      ];
      for (const rec of records) {
        await setDoc(doc(db, 'attendance', rec.id), rec);
      }
    }

    // 15. Assessments & Scores
    const asm1Id = 'asm_phys_midterm';
    const assessment1: Assessment = {
      id: asm1Id,
      institution_id: DEMO_INSTITUTION_ID,
      term_id: term2Id,
      class_id: class1Id,
      subject_id: 'subj_phys',
      assessment_type_id: 'at_mid',
      title: 'Thermodynamics & Optics Midterm',
      max_score: 100,
      date: '2026-02-20',
      created_at: now
    };
    await setDoc(doc(db, 'assessments', asm1Id), assessment1);

    const scores1: ScoreRecord[] = [
      { id: 'sc_lucas_1', institution_id: DEMO_INSTITUTION_ID, assessment_id: asm1Id, student_id: 'stud_lucas', score: 94, grade: 'A*', remarks: 'Exemplary wave optics derivations', recorded_by: 'user_teacher_001', created_at: now },
      { id: 'sc_charlotte_1', institution_id: DEMO_INSTITUTION_ID, assessment_id: asm1Id, student_id: 'stud_charlotte', score: 88, grade: 'A', remarks: 'Consistent problem solving', recorded_by: 'user_teacher_001', created_at: now },
      { id: 'sc_amara_1', institution_id: DEMO_INSTITUTION_ID, assessment_id: asm1Id, student_id: 'stud_amara', score: 82, grade: 'A', remarks: 'Good mathematical intuition', recorded_by: 'user_teacher_001', created_at: now },
      { id: 'sc_elias_1', institution_id: DEMO_INSTITUTION_ID, assessment_id: asm1Id, student_id: 'stud_elias', score: 76, grade: 'B', remarks: 'Review entropy calculations', recorded_by: 'user_teacher_001', created_at: now }
    ];
    for (const sc of scores1) {
      await setDoc(doc(db, 'scores', sc.id), sc);
    }

    // 16. Finance: Fee Categories, Structures, Invoices, Payments
    const feeCat1: FeeCategory = { id: 'fc_tuition', institution_id: DEMO_INSTITUTION_ID, name: 'Pre-University Tuition', description: 'Core academic instruction and seminar fees', created_at: now };
    const feeCat2: FeeCategory = { id: 'fc_lab', institution_id: DEMO_INSTITUTION_ID, name: 'Science Laboratory & Consumables', description: 'Advanced equipment and lab consumables', created_at: now };
    await setDoc(doc(db, 'fee_categories', feeCat1.id), feeCat1);
    await setDoc(doc(db, 'fee_categories', feeCat2.id), feeCat2);

    const feeStruct: FeeStructure = {
      id: 'fs_yr2_term2',
      institution_id: DEMO_INSTITUTION_ID,
      grade_level_id: gradeLevel2Id,
      term_id: term2Id,
      fee_category_id: 'fc_tuition',
      amount: 3200,
      currency: 'USD',
      created_at: now
    };
    await setDoc(doc(db, 'fee_structures', feeStruct.id), feeStruct);

    const invoice1: StudentInvoice = {
      id: 'inv_lucas_t2',
      institution_id: DEMO_INSTITUTION_ID,
      student_id: 'stud_lucas',
      term_id: term2Id,
      total_amount: 3200,
      amount_paid: 2400,
      balance: 800,
      status: 'partially_paid',
      generated_at: '2026-01-15',
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'student_invoices', invoice1.id), invoice1);

    const payment1: Payment = {
      id: 'pay_001',
      institution_id: DEMO_INSTITUTION_ID,
      invoice_id: invoice1.id,
      amount: 2400,
      method: 'bank_transfer',
      reference_no: 'TRX-99812-STJUDE',
      paid_on: '2026-01-20',
      received_by: 'user_staff_001',
      created_at: now
    };
    await setDoc(doc(db, 'payments', payment1.id), payment1);

    // 17. Announcements
    const announcement1: Announcement = {
      id: 'anc_001',
      institution_id: DEMO_INSTITUTION_ID,
      title: 'Pre-University Spring Colloquium & University Applications Briefing',
      body: 'All Year 2 students and their guardians are cordially invited to the Great Hall on Thursday at 5:00 PM for the Oxbridge & Ivy League university application guidance seminar.',
      audience: 'all',
      published_by: 'user_admin_001',
      published_at: '2026-03-14T10:00:00Z',
      created_at: now
    };
    const announcement2: Announcement = {
      id: 'anc_002',
      institution_id: DEMO_INSTITUTION_ID,
      title: 'Laboratory Safety Inspection and Equipment Upgrade',
      body: 'Physics and Chemistry laboratories will observe scheduled maintenance on Friday afternoon. Practical examinations resume Monday morning.',
      audience: 'staff',
      published_by: 'user_admin_001',
      published_at: '2026-03-15T08:30:00Z',
      created_at: now
    };
    await setDoc(doc(db, 'announcements', announcement1.id), announcement1);
    await setDoc(doc(db, 'announcements', announcement2.id), announcement2);

    // 18. Message Thread (Sarah Chen <-> Prof. Arthur Pendelton regarding Lucas)
    const thread1Id = 'thr_lucas_physics';
    const thread1: MessageThread = {
      id: thread1Id,
      institution_id: DEMO_INSTITUTION_ID,
      subject: 'Lucas Chen - Physics Olympiad Preparation and Extended Project',
      participants: ['user_guardian_001', 'user_teacher_001'],
      student_id: 'stud_lucas',
      created_by: 'user_guardian_001',
      last_message_at: '2026-03-15T14:22:00Z',
      status: 'open',
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'message_threads', thread1Id), thread1);

    const msg1: ChatMessage = {
      id: 'msg_001',
      institution_id: DEMO_INSTITUTION_ID,
      thread_id: thread1Id,
      sender_id: 'user_guardian_001',
      sender_name: 'Sarah Chen (Guardian)',
      body: 'Dear Prof. Pendelton, thank you for Lucas\'s recent report. He is very keen on entering the British Physics Olympiad. Could you recommend supplementary texts for vector calculus?',
      read_by: ['user_guardian_001', 'user_teacher_001'],
      created_at: '2026-03-15T11:15:00Z'
    };
    const msg2: ChatMessage = {
      id: 'msg_002',
      institution_id: DEMO_INSTITUTION_ID,
      thread_id: thread1Id,
      sender_id: 'user_teacher_001',
      sender_name: 'Prof. Arthur Pendelton',
      body: 'Hello Sarah. Lucas has demonstrated exceptional aptitude in wave mechanics. I have reserved the Cambridge University preparatory booklet for him at Kelvin Library, and we hold coaching sessions every Wednesday at 3:30 PM.',
      read_by: ['user_guardian_001', 'user_teacher_001'],
      created_at: '2026-03-15T14:22:00Z'
    };
    await setDoc(doc(db, 'messages', msg1.id), msg1);
    await setDoc(doc(db, 'messages', msg2.id), msg2);

    // 19. Tasks
    const task1: TaskItem = {
      id: 'task_001',
      institution_id: DEMO_INSTITUTION_ID,
      title: 'Submit Mid-Term Physics Assessment Moderation Sheets',
      description: 'Upload moderated grade distributions for Year 2 Science Cohort Alpha to the Academic Board.',
      assigned_to: 'user_teacher_001',
      assigned_by: 'user_admin_001',
      related_entity: { type: 'class', id: class1Id, label: 'Year 2 - Science Cohort Alpha' },
      due_date: '2026-03-20',
      priority: 'high',
      status: 'in_progress',
      comments: [
        { user_id: 'user_teacher_001', user_name: 'Arthur Pendelton', text: 'Grading completed. Finalizing external moderation remarks.', at: '2026-03-15T12:00:00Z' }
      ],
      created_at: now,
      updated_at: now
    };
    const task2: TaskItem = {
      id: 'task_002',
      institution_id: DEMO_INSTITUTION_ID,
      title: 'Review Term 2 Outstanding Fee Invoices',
      description: 'Dispatch friendly reminders to accounts with balances over $500 prior to mid-term freeze.',
      assigned_to: 'user_staff_001',
      assigned_by: 'user_admin_001',
      due_date: '2026-03-22',
      priority: 'medium',
      status: 'pending',
      created_at: now,
      updated_at: now
    };
    const task3: TaskItem = {
      id: 'task_003',
      institution_id: DEMO_INSTITUTION_ID,
      title: 'Prepare Laboratory Apparatus for Friday Spectroscopy Practical',
      description: 'Check spectrometer calibration and optical prisms in Lab 4B.',
      assigned_to: 'user_teacher_001',
      assigned_by: 'user_teacher_001',
      due_date: '2026-03-19',
      priority: 'low',
      status: 'pending',
      created_at: now,
      updated_at: now
    };
    await setDoc(doc(db, 'tasks', task1.id), task1);
    await setDoc(doc(db, 'tasks', task2.id), task2);
    await setDoc(doc(db, 'tasks', task3.id), task3);

    // 20. Audit Logs
    const audit1: AuditLog = {
      id: 'aud_001',
      institution_id: DEMO_INSTITUTION_ID,
      user_id: 'user_admin_001',
      user_name: 'Dr. Eleanor Vance',
      action: 'ACADEMIC_TERM_ACTIVATED',
      entity_type: 'term',
      entity_id: term2Id,
      metadata: { term_name: 'Term 2 (Lent)', academic_year: '2025/2026' },
      timestamp: '2026-01-10T09:00:00Z'
    };
    const audit2: AuditLog = {
      id: 'aud_002',
      institution_id: DEMO_INSTITUTION_ID,
      user_id: 'user_teacher_001',
      user_name: 'Prof. Arthur Pendelton',
      action: 'SCORES_ENTERED',
      entity_type: 'assessment',
      entity_id: asm1Id,
      metadata: { class: 'Year 2 - Science Cohort Alpha', count: 4 },
      timestamp: '2026-02-21T16:40:00Z'
    };
    await setDoc(doc(db, 'audit_logs', audit1.id), audit1);
    await setDoc(doc(db, 'audit_logs', audit2.id), audit2);

    return { success: true, message: 'Demo institution "St. Jude Pre-University College" seeded successfully with comprehensive data!' };
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return { success: false, message: error.message || 'Failed to seed demo database.' };
  }
}

export const seedDemoData = seedDemoDatabase;

