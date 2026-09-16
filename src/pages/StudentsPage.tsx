import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  Award,
  CalendarCheck,
  Phone,
  Mail,
  Shield,
  Clock
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
import { Student, Guardian } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const StudentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, institution, isAdmin } = useAuth();
  const { classes } = useInstitution();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;
  const initialStudentId = searchParams.get('id');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('active');

  // Modal states
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [editStudentModal, setEditStudentModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({
    first_name: '',
    last_name: '',
    admission_no: '',
    gender: 'male',
    dob: '2007-04-15',
    status: 'active',
    custom_fields: {}
  });

  // Guardians
  const [guardians, setGuardians] = useState<Guardian[]>([]);

  const fetchStudents = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'students'), where('institution_id', '==', instId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setStudents(list);

      // Guardians
      const gSnap = await getDocs(query(collection(db, 'guardians'), where('institution_id', '==', instId)));
      setGuardians(gSnap.docs.map(d => ({ id: d.id, ...d.data() } as Guardian)));

      // If initial student ID in URL
      if (initialStudentId) {
        const target = list.find(s => s.id === initialStudentId);
        if (target) setViewStudent(target);
      }
    } catch (err) {
      console.warn('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [instId]);

  // Filtering
  const filteredStudents = students.filter(st => {
    const fullName = `${st.first_name} ${st.last_name}`.toLowerCase();
    const adm = (st.admission_no || '').toLowerCase();
    const matchesQuery = fullName.includes(searchQuery.toLowerCase()) || adm.includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatusFilter || st.status === selectedStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    const newAdm = `STU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    setEditingStudent({
      id: `stud_${Date.now()}`,
      first_name: '',
      last_name: '',
      admission_no: newAdm,
      gender: 'female',
      dob: '2007-06-12',
      status: 'active',
      custom_fields: {
        'Medical Conditions': 'None recorded',
        'Scholarship Tier': 'Merit Scholar'
      }
    });
    setEditStudentModal(true);
  };

  const handleOpenEditModal = (st: Student) => {
    setEditingStudent(st);
    setEditStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !editingStudent.first_name || !editingStudent.last_name) return;

    try {
      const studentId = editingStudent.id || `stud_${Date.now()}`;
      const payload: Student = {
        id: studentId,
        institution_id: instId,
        admission_no: editingStudent.admission_no || `STU-${Date.now()}`,
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        dob: editingStudent.dob || '2007-01-01',
        gender: (editingStudent.gender as any) || 'male',
        status: (editingStudent.status as any) || 'active',
        custom_fields: editingStudent.custom_fields || {}
      };

      await setDoc(doc(db, 'students', studentId), payload, { merge: true });

      setStudents(prev => {
        const idx = prev.findIndex(s => s.id === studentId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        }
        return [payload, ...prev];
      });

      success(`Student record for ${payload.first_name} ${payload.last_name} saved.`);
      setEditStudentModal(false);
    } catch (err: any) {
      error(err.message || 'Failed to save student record');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate or remove ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      setStudents(prev => prev.filter(s => s.id !== id));
      if (viewStudent?.id === id) setViewStudent(null);
      success(`Student ${name} deleted successfully.`);
    } catch (err: any) {
      error(err.message || 'Failed to delete student');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Admission No', 'First Name', 'Last Name', 'Gender', 'Date of Birth', 'Status'];
    const rows = filteredStudents.map(s => [
      s.admission_no,
      s.first_name,
      s.last_name,
      s.gender,
      s.dob,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edusphere_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    info('Exported student directory CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Student Cohort Directory
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Total {students.length} registered pre-university students across all streams
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name or admission number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Admission No</th>
                <th className="p-3.5">Gender</th>
                <th className="p-3.5">Date of Birth</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">Loading student directory...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">No students match current search filter.</td>
                </tr>
              ) : (
                filteredStudents.map(st => (
                  <tr key={st.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition">
                    <td className="p-3.5 font-medium text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {st.first_name[0]}{st.last_name[0]}
                        </div>
                        <span>{st.first_name} {st.last_name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-stone-600 dark:text-stone-400">{st.admission_no}</td>
                    <td className="p-3.5 capitalize text-stone-600 dark:text-stone-400">{st.gender}</td>
                    <td className="p-3.5 font-mono text-stone-600 dark:text-stone-400">{st.dob}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        st.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewStudent(st)}
                          className="p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition rounded"
                          title="View detailed student record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(st)}
                              className="p-1.5 text-stone-400 hover:text-indigo-600 transition rounded"
                              title="Edit student record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st.id, `${st.first_name} ${st.last_name}`)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 transition rounded"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Profile Modal */}
      <Modal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title="Student Permanent Record"
        description="Comprehensive personal particulars, guardian links, and custom institution fields."
        maxWidth="2xl"
      >
        {viewStudent && (
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                {viewStudent.first_name[0]}{viewStudent.last_name[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {viewStudent.first_name} {viewStudent.last_name}
                </h3>
                <p className="font-mono text-stone-500">
                  Admission: {viewStudent.admission_no} • Status: {viewStudent.status.toUpperCase()}
                </p>
                <p className="text-stone-400 mt-0.5">
                  Gender: {viewStudent.gender} • Born: {viewStudent.dob}
                </p>
              </div>
            </div>

            {/* Linked Guardians */}
            <div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                Linked Guardians & Emergency Contacts
              </h4>
              <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-900 dark:text-stone-100">Sarah Chen</p>
                    <p className="text-stone-500">Relationship: Mother • Authorized Primary Contact</p>
                  </div>
                  <div className="text-right font-mono text-stone-600 dark:text-stone-400">
                    <p>+44 7700 900123</p>
                    <p>sarah.chen@example.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields */}
            <div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-2">
                Institution Custom Metadata Fields
              </h4>
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
                <div>
                  <p className="text-stone-400 font-medium">Medical / Dietary Notes</p>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                    {viewStudent.custom_fields?.['Medical Conditions'] || 'Mild pollen allergy (epipen in nurse office)'}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 font-medium">Scholarship / Bursary</p>
                  <p className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                    {viewStudent.custom_fields?.['Scholarship Tier'] || 'Cambridge STEM Merit Bursary (25%)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewStudent(null)}
                className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
              >
                Close Record
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Student Modal */}
      <Modal
        isOpen={editStudentModal}
        onClose={() => setEditStudentModal(false)}
        title={editingStudent.id ? 'Edit Student Particulars' : 'Enroll New Student'}
        description="Register or modify student enrollment record."
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={editingStudent.first_name}
                onChange={(e) => setEditingStudent(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={editingStudent.last_name}
                onChange={(e) => setEditingStudent(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Admission Number
              </label>
              <input
                type="text"
                required
                value={editingStudent.admission_no}
                onChange={(e) => setEditingStudent(prev => ({ ...prev, admission_no: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Gender
              </label>
              <select
                value={editingStudent.gender}
                onChange={(e: any) => setEditingStudent(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={editingStudent.dob}
                onChange={(e) => setEditingStudent(prev => ({ ...prev, dob: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Enrollment Status
              </label>
              <select
                value={editingStudent.status}
                onChange={(e: any) => setEditingStudent(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                <option value="active">Active</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setEditStudentModal(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Save Student
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
