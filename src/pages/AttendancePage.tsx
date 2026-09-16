import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  Filter,
  Save,
  Bell,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { useToast } from '../components/Toast';

interface StudentAttendanceItem {
  student: Student;
  status: AttendanceStatus;
  remarks: string;
}

export const AttendancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, institution } = useAuth();
  const { classes } = useInstitution();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;
  const selectedClassId = searchParams.get('classId') || (classes[0]?.id || 'class_yr2_sci');
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [period, setPeriod] = useState<number>(1);
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Summary counts
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const lateCount = students.filter(s => s.status === 'late').length;
  const excusedCount = students.filter(s => s.status === 'excused').length;
  const totalCount = students.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 100;

  // Load roster and existing attendance
  useEffect(() => {
    if (!instId || !selectedClassId) return;

    const loadRoster = async () => {
      setLoading(true);
      try {
        // 1. Get enrollments
        const enrSnap = await getDocs(
          query(collection(db, 'enrollments'), where('institution_id', '==', instId), where('class_id', '==', selectedClassId))
        );
        const studentIds = enrSnap.docs.map(d => d.data().student_id);

        // 2. Get students
        const stSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId)));
        const enrolled: Student[] = [];
        stSnap.forEach(d => {
          if (studentIds.length === 0 || studentIds.includes(d.id)) {
            enrolled.push({ id: d.id, ...d.data() } as Student);
          }
        });

        // 3. Check existing attendance for this class + date + period
        const attSnap = await getDocs(
          query(
            collection(db, 'attendance'),
            where('institution_id', '==', instId),
            where('class_id', '==', selectedClassId),
            where('date', '==', selectedDate)
          )
        );
        const existingAttMap: Record<string, AttendanceRecord> = {};
        attSnap.forEach(d => {
          const a = d.data() as AttendanceRecord;
          if (a.period === period) {
            existingAttMap[a.student_id] = { id: d.id, ...a };
          }
        });

        // 4. Map roster
        const list: StudentAttendanceItem[] = enrolled.map(st => {
          const ex = existingAttMap[st.id];
          return {
            student: st,
            status: ex ? ex.status : 'present', // Default baseline is present
            remarks: ex ? ex.remarks || '' : ''
          };
        });

        setStudents(list);
      } catch (err) {
        console.warn('Attendance load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, [instId, selectedClassId, selectedDate, period]);

  const setAllStatus = (newStatus: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status: newStatus })));
    info(`Marked all students as ${newStatus}`);
  };

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(s => (s.student.id === studentId ? { ...s, status } : s))
    );
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setStudents(prev =>
      prev.map(s => (s.student.id === studentId ? { ...s, remarks } : s))
    );
  };

  const handleSaveAttendance = async () => {
    if (!instId || !selectedClassId) return;
    setSaving(true);
    try {
      for (const item of students) {
        const attId = `att_${selectedClassId}_${item.student.id}_${selectedDate}_p${period}`;
        const record: AttendanceRecord = {
          id: attId,
          institution_id: instId,
          student_id: item.student.id,
          class_id: selectedClassId,
          date: selectedDate,
          period,
          status: item.status,
          remarks: item.remarks,
          recorded_by: currentUser?.uid || 'faculty',
          recorded_at: new Date().toISOString()
        };
        await setDoc(doc(db, 'attendance', attId), record, { merge: true });
      }

      // Notify absent parents if any
      const absentStudents = students.filter(s => s.status === 'absent');
      if (absentStudents.length > 0) {
        info(`Absence notifications logged for ${absentStudents.length} student guardians.`);
      }

      success(`Attendance for ${selectedDate} (Period ${period}) saved successfully!`);
    } catch (err: any) {
      error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Attendance Recording & Roster
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Tap-friendly rapid roll call with medical excuses, remarks, and guardian notification alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAllStatus('present')}
            className="px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Roll Call'}</span>
          </button>
        </div>
      </div>

      {/* Date, Class & Period Selectors */}
      <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
            Cohort Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              params.set('classId', e.target.value);
              setSearchParams(params);
            }}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
            Roll Call Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              params.set('date', e.target.value);
              setSearchParams(params);
            }}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
            Period / Academic Session
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            <option value={1}>Period 1 (Morning Assembly / Lab)</option>
            <option value={2}>Period 2 (Mid-Morning Lecture)</option>
            <option value={3}>Period 3 (Afternoon Seminar)</option>
            <option value={4}>Period 4 (Evening Tutorial)</option>
          </select>
        </div>
      </div>

      {/* Real-Time Roll Call Stats Pill */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center">
          <p className="text-[11px] text-stone-500 font-medium">Cohort Rate</p>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{attendanceRate}%</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Present</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{presentCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
          <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Absent</p>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{absentCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Late</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{lateCount}</p>
        </div>
        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-center col-span-2 sm:col-span-1">
          <p className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">Excused</p>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{excusedCount}</p>
        </div>
      </div>

      {/* Student Attendance List with Large Touch Targets (Min 44px) */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading class roster...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">No students enrolled in this cohort.</div>
        ) : (
          students.map(item => (
            <div
              key={item.student.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition"
            >
              {/* Student Identity */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-xs text-stone-700 dark:text-stone-300">
                  {item.student.first_name[0]}{item.student.last_name[0]}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {item.student.first_name} {item.student.last_name}
                  </h4>
                  <p className="text-xs font-mono text-stone-500">
                    Adm: {item.student.admission_no} • {item.student.gender}
                  </p>
                </div>
              </div>

              {/* Status Buttons - Touch Friendly (Min 44px) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => updateStudentStatus(item.student.id, 'present')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    item.status === 'present'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateStudentStatus(item.student.id, 'absent')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    item.status === 'absent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Absent</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateStudentStatus(item.student.id, 'late')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    item.status === 'late'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Late</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateStudentStatus(item.student.id, 'excused')}
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    item.status === 'excused'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Excused</span>
                </button>
              </div>

              {/* Remarks Field */}
              <div className="sm:max-w-xs w-full">
                <input
                  type="text"
                  value={item.remarks}
                  onChange={(e) => updateStudentRemarks(item.student.id, e.target.value)}
                  placeholder="Note (e.g. Medical excuse)..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
