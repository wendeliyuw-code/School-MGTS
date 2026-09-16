import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import { ClassRoom, Student, Enrollment } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const ClassesPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { classes, gradeLevels, currentYear, refreshConfig } = useInstitution();
  const { success, error } = useToast();

  const instId = currentUser?.institution_id;
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(classes[0] || null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Modals
  const [createClassModal, setCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState(30);
  const [newClassGradeLevel, setNewClassGradeLevel] = useState('');

  // Enroll student modal
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentToEnrollId, setStudentToEnrollId] = useState('');
  const [enrollRollNo, setEnrollRollNo] = useState('');

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [classes]);

  useEffect(() => {
    if (!instId || !selectedClass) return;

    const fetchEnrollments = async () => {
      setLoadingEnrollments(true);
      try {
        const enrSnap = await getDocs(
          query(collection(db, 'enrollments'), where('institution_id', '==', instId), where('class_id', '==', selectedClass.id))
        );
        const sIds = enrSnap.docs.map(d => d.data().student_id);

        const stSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId)));
        const all = stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setAllStudents(all);

        setEnrolledStudents(all.filter(s => sIds.includes(s.id)));
      } catch (err) {
        console.warn('Enrollment load error:', err);
      } finally {
        setLoadingEnrollments(false);
      }
    };

    fetchEnrollments();
  }, [instId, selectedClass]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !newClassName.trim()) return;

    try {
      const classId = `class_${Date.now()}`;
      const payload: ClassRoom = {
        id: classId,
        institution_id: instId,
        academic_year_id: currentYear?.id || 'ay_2025_2026',
        grade_level_id: newClassGradeLevel || gradeLevels[0]?.id || 'gl_yr2',
        name: newClassName,
        capacity: Number(newClassCapacity)
      };

      await setDoc(doc(db, 'classes', classId), payload);
      await refreshConfig();
      success(`Class cohort ${newClassName} created.`);
      setCreateClassModal(false);
      setNewClassName('');
    } catch (err: any) {
      error(err.message || 'Failed to create class');
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !selectedClass || !studentToEnrollId) return;

    try {
      const enrId = `enr_${selectedClass.id}_${studentToEnrollId}`;
      const payload: Enrollment = {
        id: enrId,
        institution_id: instId,
        student_id: studentToEnrollId,
        class_id: selectedClass.id,
        academic_year_id: currentYear?.id || 'ay_2025_2026',
        roll_no: enrollRollNo || `${enrolledStudents.length + 1}`,
        enrolled_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'enrollments', enrId), payload);
      const studentObj = allStudents.find(s => s.id === studentToEnrollId);
      if (studentObj) {
        setEnrolledStudents(prev => [...prev, studentObj]);
      }
      success('Student enrolled in cohort successfully.');
      setEnrollModalOpen(false);
      setStudentToEnrollId('');
    } catch (err: any) {
      error(err.message || 'Failed to enroll student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Classes & Academic Cohorts
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Configure stream cohorts, capacity caps, and student class rosters
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEnrollModalOpen(true)}
              disabled={!selectedClass}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
            >
              <Users className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
            <button
              onClick={() => setCreateClassModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Cohort</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Classes List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Active Cohort Classes
          </h3>
          <div className="space-y-2">
            {classes.map(c => {
              const isSelected = selectedClass?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedClass(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{c.name}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Capacity: {c.capacity} Students • Max Cap
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}>
                    Active
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Enrolled Students in Selected Class */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Enrolled Roster: {selectedClass?.name || 'Class'} ({enrolledStudents.length} / {selectedClass?.capacity || 30})
            </h3>
            <span className="text-xs text-stone-400 font-mono">
              Academic Year: {currentYear?.name || '2025/2026'}
            </span>
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                    <th className="p-3.5">Roll No</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Admission No</th>
                    <th className="p-3.5">Gender</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {loadingEnrollments ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400">Loading enrollment roster...</td>
                    </tr>
                  ) : enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-500">No students enrolled in this cohort yet. Click "Enroll Student" above.</td>
                    </tr>
                  ) : (
                    enrolledStudents.map((st, i) => (
                      <tr key={st.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                        <td className="p-3.5 font-mono text-stone-500">{i + 1}</td>
                        <td className="p-3.5 font-bold text-stone-900 dark:text-stone-100">
                          {st.first_name} {st.last_name}
                        </td>
                        <td className="p-3.5 font-mono text-stone-600 dark:text-stone-400">{st.admission_no}</td>
                        <td className="p-3.5 capitalize text-stone-600 dark:text-stone-400">{st.gender}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      <Modal
        isOpen={createClassModal}
        onClose={() => setCreateClassModal(false)}
        title="Create New Cohort Class"
        description="Establish a new student stream or academic year set."
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Class / Cohort Name
            </label>
            <input
              type="text"
              required
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="e.g. Year 1 Science Alpha"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Grade Level
            </label>
            <select
              value={newClassGradeLevel}
              onChange={(e) => setNewClassGradeLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              {gradeLevels.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Maximum Student Capacity
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={newClassCapacity}
              onChange={(e) => setNewClassCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setCreateClassModal(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Create Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        title={`Enroll Student into ${selectedClass?.name}`}
        description="Select an enrolled student to assign to this cohort."
      >
        <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Choose Student
            </label>
            <select
              required
              value={studentToEnrollId}
              onChange={(e) => setStudentToEnrollId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="">Select a student...</option>
              {allStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.admission_no})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Class Roll Number (Optional)
            </label>
            <input
              type="text"
              value={enrollRollNo}
              onChange={(e) => setEnrollRollNo(e.target.value)}
              placeholder={`e.g. ${enrolledStudents.length + 1}`}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
