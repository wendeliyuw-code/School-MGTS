import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  DollarSign,
  Megaphone,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Award,
  CreditCard,
  Building,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import {
  Student,
  Staff,
  ClassRoom,
  AttendanceRecord,
  StudentInvoice,
  Announcement,
  TaskItem,
  AuditLog,
  Assessment,
  ScoreRecord,
  Guardian
} from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
  const { currentUser, role, isSuperAdmin, isAdmin, isTeacher, isStudent, isGuardian, isStaff, institution } = useAuth();
  const { currentYear, currentTerm, classes, subjects } = useInstitution();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const instId = currentUser?.institution_id;

  // Global counts & stats
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(94.8);
  const [outstandingFees, setOutstandingFees] = useState(0);
  const [collectedFees, setCollectedFees] = useState(0);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [myTasks, setMyTasks] = useState<TaskItem[]>([]);
  const [recentScores, setRecentScores] = useState<ScoreRecord[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);

  // Guardian multi-child state
  const [guardianChildren, setGuardianChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Quick Action Modals
  const [quickAnnounceOpen, setQuickAnnounceOpen] = useState(false);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceBody, setNewAnnounceBody] = useState('');
  const [newAnnounceAudience, setNewAnnounceAudience] = useState<'all' | 'staff' | 'students' | 'guardians'>('all');

  // Load dashboard data
  useEffect(() => {
    if (!instId && !isSuperAdmin) return;

    const loadData = async () => {
      try {
        if (instId) {
          // Students count
          const stSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId)));
          setStudentCount(stSnap.size);

          // Staff count
          const sfSnap = await getDocs(query(collection(db, 'staff'), where('institution_id', '==', instId)));
          setStaffCount(sfSnap.size);

          // Class count
          const clSnap = await getDocs(query(collection(db, 'classes'), where('institution_id', '==', instId)));
          setClassCount(clSnap.size);

          // Invoices summary
          const invSnap = await getDocs(query(collection(db, 'student_invoices'), where('institution_id', '==', instId)));
          let out = 0;
          let col = 0;
          invSnap.forEach(d => {
            const data = d.data() as StudentInvoice;
            out += data.balance || 0;
            col += data.amount_paid || 0;
          });
          setOutstandingFees(out);
          setCollectedFees(col);

          // Announcements
          const ancSnap = await getDocs(query(collection(db, 'announcements'), where('institution_id', '==', instId), limit(5)));
          setAnnouncements(ancSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));

          // Audit logs
          const logSnap = await getDocs(query(collection(db, 'audit_logs'), where('institution_id', '==', instId), limit(6)));
          setRecentLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));

          // Assessments
          const asmSnap = await getDocs(query(collection(db, 'assessments'), where('institution_id', '==', instId), limit(5)));
          setRecentAssessments(asmSnap.docs.map(d => ({ id: d.id, ...d.data() } as Assessment)));

          // Scores
          const scSnap = await getDocs(query(collection(db, 'scores'), where('institution_id', '==', instId), limit(5)));
          setRecentScores(scSnap.docs.map(d => ({ id: d.id, ...d.data() } as ScoreRecord)));

          // Tasks for current user
          const taskSnap = await getDocs(query(collection(db, 'tasks'), where('institution_id', '==', instId)));
          const allTasks = taskSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskItem));
          if (currentUser?.uid) {
            setMyTasks(allTasks.filter(t => t.assigned_to === currentUser.uid || isAdmin));
          } else {
            setMyTasks(allTasks);
          }

          // If Guardian: load linked children
          if (role === 'GUARDIAN') {
            const gSnap = await getDocs(query(collection(db, 'guardians'), where('institution_id', '==', instId), where('user_id', '==', currentUser?.uid || 'user_guardian_001')));
            if (!gSnap.empty) {
              const gData = gSnap.docs[0].data() as Guardian;
              const childIds = gData.student_ids || ['stud_lucas'];
              const childrenList: Student[] = [];
              for (const cid of childIds) {
                const sDoc = stSnap.docs.find(d => d.id === cid);
                if (sDoc) childrenList.push({ id: sDoc.id, ...sDoc.data() } as Student);
              }
              setGuardianChildren(childrenList);
              if (childrenList.length > 0) {
                setSelectedChildId(childrenList[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err);
      }
    };

    loadData();
  }, [instId, currentUser?.uid, isSuperAdmin, role, isAdmin]);

  // Chart datasets
  const enrollmentTrendData = [
    { term: '2024 Michaelmas', students: 142 },
    { term: '2025 Lent', students: 156 },
    { term: '2025 Trinity', students: 168 },
    { term: '2025 Michaelmas', students: 184 },
    { term: '2026 Lent (Now)', students: 198 }
  ];

  const attendanceTrendData = [
    { day: 'Mon', rate: 96 },
    { day: 'Tue', rate: 94 },
    { day: 'Wed', rate: 97 },
    { day: 'Thu', rate: 93 },
    { day: 'Fri', rate: 91 },
    { day: 'Mon (Latest)', rate: 95 }
  ];

  const feeProgressData = [
    { name: 'Collected', value: collectedFees || 75, color: '#4f46e5' },
    { name: 'Outstanding', value: outstandingFees || 25, color: '#f59e0b' }
  ];

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnounceTitle.trim() || !newAnnounceBody.trim() || !instId) return;

    try {
      const docData: Omit<Announcement, 'id'> = {
        institution_id: instId,
        title: newAnnounceTitle,
        body: newAnnounceBody,
        audience: newAnnounceAudience,
        published_by: currentUser?.uid || 'admin',
        published_at: new Date().toISOString()
      };
      const res = await addDoc(collection(db, 'announcements'), docData);
      setAnnouncements(prev => [{ id: res.id, ...docData }, ...prev]);
      success('Announcement published successfully!');
      setQuickAnnounceOpen(false);
      setNewAnnounceTitle('');
      setNewAnnounceBody('');
    } catch (err: any) {
      error(err.message || 'Failed to publish announcement');
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'pending' : currentStatus === 'pending' ? 'in_progress' : 'done';
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    success(`Task status updated to ${nextStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono uppercase">
              {role} Workspace
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {currentYear?.name || '2025/2026 Academic Year'} ({currentTerm?.name || 'Term 2 Lent'})
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white mt-1">
            Welcome back, {currentUser?.display_name || 'Academic Leader'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {institution?.name || 'St. Jude Pre-University College'} • Cambridge Campus
          </p>
        </div>

        {/* Action button depending on role */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setQuickAnnounceOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Publish Notice</span>
              </button>
              <Link
                to="/students"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </Link>
            </>
          )}

          {isTeacher && (
            <>
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                to="/academics/grading"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
              >
                <Award className="w-4 h-4" />
                <span>Enter Marks</span>
              </Link>
            </>
          )}

          {isGuardian && (
            <Link
              to="/messages"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Teacher</span>
            </Link>
          )}

          {isStudent && (
            <Link
              to="/academics/grading"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Award className="w-4 h-4" />
              <span>View My Report Card</span>
            </Link>
          )}
        </div>
      </div>

      {/* GUARDIAN SPECIALIZED VIEW: Child Selector & Child Progress Cards */}
      {isGuardian && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                LC
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                  Linked Student Profile
                </p>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Lucas Wei Chen (Year 2 Science Cohort Alpha)
                </h2>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-indigo-200 dark:border-indigo-800 font-semibold text-indigo-700 dark:text-indigo-300">
              Adm No: STU-2024-001
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-500 font-medium">Term 2 Attendance</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">98.2%</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Present 49 of 50 sessions</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-500 font-medium">Physics Mid-Term</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">94% (A*)</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Class Rank: 1st of 24</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-500 font-medium">Tuition Balance</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">$800.00</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Paid $2,400 of $3,200</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
              <p className="text-xs text-stone-500 font-medium">Next Academic Event</p>
              <p className="text-base font-bold text-stone-900 dark:text-stone-100 mt-1">Spring Colloquium</p>
              <p className="text-[11px] text-stone-400 mt-0.5">Thursday 5:00 PM in Great Hall</p>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SPECIALIZED VIEW: Schedule & Grades */}
      {isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Cumulative Attendance</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">98.2%</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Full compliance achieved</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Highest Mark Achieved</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">94% (A*)</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Theoretical Physics</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Outstanding Balance</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">$800.00</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Invoice #inv_lucas_t2</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Today's Next Class</p>
            <p className="text-base font-bold text-stone-900 dark:text-stone-100 mt-1">Physics Lab 4B</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Period 1 with Prof. Pendelton</p>
          </div>
        </div>
      )}

      {/* TEACHER SPECIALIZED VIEW: Today's classes & Pending Tasks */}
      {isTeacher && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Assigned Classes</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">2 Cohorts</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Year 2 Science Alpha & Econ</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Pending Attendance</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">1 Cohort</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Year 2 Science (Period 1)</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Assessments to Grade</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">0 Pending</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Mid-term marks verified</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <p className="text-xs text-stone-500 font-medium">Unread Parent Messages</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">1 Thread</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Sarah Chen regarding Lucas</p>
          </div>
        </div>
      )}

      {/* ADMIN & SUPER ADMIN: Standard KPI Cards */}
      {(isAdmin || isSuperAdmin || isStaff) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">Total Students</span>
              <GraduationCap className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">
              {studentCount || 198}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12% this academic year
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">Faculty & Staff</span>
              <Users className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">
              {staffCount || 24}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">18 Teaching • 6 Operations</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">Cohort Classes</span>
              <BookOpen className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">
              {classCount || 8}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">Pre-U Year 1 & 2 Streams</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">Attendance Today</span>
              <CalendarCheck className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">
              {attendanceRate}%
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Above target threshold</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium">Outstanding Fees</span>
              <DollarSign className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-2">
              ${(outstandingFees || 800).toLocaleString()}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">92% collection rate</p>
          </div>
        </div>
      )}

      {/* Main Charts Section (For Admin & Staff) */}
      {(isAdmin || isSuperAdmin || isStaff) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrollment Trend Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Enrollment Growth Across Terms
                </h3>
                <p className="text-xs text-stone-500">Pre-University student headcount tracking</p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                5 Terms
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                  <XAxis dataKey="term" tick={{ fontSize: 11 }} stroke="#88888880" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#88888880" domain={[100, 220]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '8px',
                      color: '#fafaf9',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="students" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#enrollmentGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Collection Progress Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Fee Collection Progress
                </h3>
                <span className="text-xs font-mono text-emerald-600 font-semibold">92% Complete</span>
              </div>
              <p className="text-xs text-stone-500 mb-4">Term 2 (Lent) Tuition & Lab Levies</p>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeProgressData}
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {feeProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="text-stone-600 dark:text-stone-400">Total Paid</span>
                </div>
                <span className="font-bold font-mono">${(collectedFees || 2400).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-stone-600 dark:text-stone-400">Outstanding Balance</span>
                </div>
                <span className="font-bold font-mono text-amber-600">${(outstandingFees || 800).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: My Tasks & Announcements / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Action Items & Tasks
              </h3>
            </div>
            <Link to="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {myTasks.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No open tasks assigned.</p>
            ) : (
              myTasks.slice(0, 4).map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => handleToggleTaskStatus(task.id, task.status)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-stone-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-1">
                        <span>Due: {task.due_date}</span>
                        {task.priority && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase ${
                            task.priority === 'high' || task.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                        <span className="font-mono">{task.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements Feed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                School Announcements
              </h3>
            </div>
            <Link to="/announcements" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1">
              <span>View Feed</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No announcements published.</p>
            ) : (
              announcements.slice(0, 3).map(anc => (
                <div
                  key={anc.id}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Audience: {anc.audience}
                    </span>
                    <span>{anc.published_at ? new Date(anc.published_at).toLocaleDateString() : ''}</span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">{anc.title}</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                    {anc.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Admin Audit Logs Feed */}
      {isAdmin && (
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-500" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Institutional Audit Log & Governance
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-400">Immutable ABAC Ledger</span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
            {recentLogs.length === 0 ? (
              <p className="text-stone-500 py-4 text-center">Audit log is clean.</p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-semibold text-stone-700 dark:text-stone-300">
                      {log.action}
                    </span>
                    <span className="text-stone-800 dark:text-stone-200 font-medium">
                      {log.user_name || log.user_id}
                    </span>
                    <span className="text-stone-400 text-[11px]">
                      entity: {log.entity_type} ({log.entity_id})
                    </span>
                  </div>
                  <span className="text-stone-400 text-[11px] font-mono shrink-0">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Announcement Modal */}
      <Modal
        isOpen={quickAnnounceOpen}
        onClose={() => setQuickAnnounceOpen(false)}
        title="Publish School Announcement"
        description="Broadcast notices to faculty, students, or guardians instantly."
      >
        <form onSubmit={handlePublishAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Announcement Title
            </label>
            <input
              type="text"
              required
              value={newAnnounceTitle}
              onChange={(e) => setNewAnnounceTitle(e.target.value)}
              placeholder="e.g. Term Examination Schedule"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Target Audience
            </label>
            <select
              value={newAnnounceAudience}
              onChange={(e: any) => setNewAnnounceAudience(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            >
              <option value="all">All School Community (Staff, Students & Parents)</option>
              <option value="staff">Faculty & Staff Only</option>
              <option value="students">Students Only</option>
              <option value="guardians">Parents & Guardians Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Body Text
            </label>
            <textarea
              rows={4}
              required
              value={newAnnounceBody}
              onChange={(e) => setNewAnnounceBody(e.target.value)}
              placeholder="Provide full particulars, schedule timings, and instructions..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setQuickAnnounceOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              Publish Now
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
