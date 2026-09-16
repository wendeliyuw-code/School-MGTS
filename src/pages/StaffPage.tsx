import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Award,
  CalendarCheck,
  CheckCircle,
  Briefcase
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
import { Staff, TeacherAssignment } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const StaffPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { classes, subjects } = useInstitution();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [editStaffModal, setEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff>>({
    first_name: '',
    last_name: '',
    staff_no: '',
    designation: 'Senior Lecturer',
    qualifications: ['M.Sc. Physics (Oxon)'],
    status: 'active'
  });

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedStaffForAssign, setSelectedStaffForAssign] = useState<Staff | null>(null);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignRole, setAssignRole] = useState<'lead_teacher' | 'assistant' | 'homeroom'>('lead_teacher');

  const fetchStaffAndAssignments = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      const sSnap = await getDocs(query(collection(db, 'staff'), where('institution_id', '==', instId)));
      setStaffList(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));

      const aSnap = await getDocs(query(collection(db, 'teacher_assignments'), where('institution_id', '==', instId)));
      setAssignments(aSnap.docs.map(d => ({ id: d.id, ...d.data() } as TeacherAssignment)));
    } catch (err) {
      console.warn('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndAssignments();
  }, [instId]);

  const filteredStaff = staffList.filter(st => {
    const name = `${st.first_name} ${st.last_name}`.toLowerCase();
    const des = (st.designation || '').toLowerCase();
    const no = (st.staff_no || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || des.includes(searchQuery.toLowerCase()) || no.includes(searchQuery.toLowerCase());
  });

  const handleOpenCreateModal = () => {
    setEditingStaff({
      id: `staff_${Date.now()}`,
      first_name: '',
      last_name: '',
      staff_no: `STAFF-${Math.floor(100 + Math.random() * 900)}`,
      designation: 'Senior Lecturer',
      qualifications: ['M.A. Education'],
      status: 'active'
    });
    setEditStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !editingStaff.first_name || !editingStaff.last_name) return;

    try {
      const staffId = editingStaff.id || `staff_${Date.now()}`;
      const payload: Staff = {
        id: staffId,
        institution_id: instId,
        staff_no: editingStaff.staff_no || `STAFF-${Date.now()}`,
        first_name: editingStaff.first_name,
        last_name: editingStaff.last_name,
        designation: editingStaff.designation || 'Lecturer',
        qualifications: editingStaff.qualifications || [],
        status: (editingStaff.status as any) || 'active'
      };

      await setDoc(doc(db, 'staff', staffId), payload, { merge: true });

      setStaffList(prev => {
        const idx = prev.findIndex(s => s.id === staffId);
        if (idx >= 0) {
          const up = [...prev];
          up[idx] = payload;
          return up;
        }
        return [payload, ...prev];
      });

      success(`Staff member ${payload.first_name} ${payload.last_name} saved.`);
      setEditStaffModal(false);
    } catch (err: any) {
      error(err.message || 'Failed to save staff record');
    }
  };

  const handleOpenAssignModal = (staff: Staff) => {
    setSelectedStaffForAssign(staff);
    setAssignClassId(classes[0]?.id || '');
    setAssignSubjectId(subjects[0]?.id || '');
    setAssignRole('lead_teacher');
    setAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !selectedStaffForAssign || !assignClassId || !assignSubjectId) return;

    try {
      const assignId = `ta_${selectedStaffForAssign.id}_${assignClassId}_${assignSubjectId}`;
      const payload: TeacherAssignment = {
        id: assignId,
        institution_id: instId,
        teacher_id: selectedStaffForAssign.id,
        class_id: assignClassId,
        subject_id: assignSubjectId,
        role: assignRole
      };

      await setDoc(doc(db, 'teacher_assignments', assignId), payload, { merge: true });
      setAssignments(prev => [...prev.filter(a => a.id !== assignId), payload]);

      success(`Assigned ${selectedStaffForAssign.first_name} as ${assignRole.replace('_', ' ')}.`);
      setAssignModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to assign teacher');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Faculty & Academic Staff Directory
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Manage academic lecturers, tutor assignments, and cohort subject allocations
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by faculty name, designation, or staff ID..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
        />
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-stone-400 text-xs">Loading faculty roster...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-stone-500 text-xs">No faculty members found.</div>
        ) : (
          filteredStaff.map(st => {
            const myAssignments = assignments.filter(a => a.teacher_id === st.id);

            return (
              <div
                key={st.id}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                        {st.first_name[0]}{st.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          {st.first_name} {st.last_name}
                        </h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {st.designation}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                      {st.staff_no}
                    </span>
                  </div>

                  {/* Qualifications */}
                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs space-y-1">
                    <p className="text-stone-400 font-medium text-[11px]">Academic Credentials</p>
                    <p className="text-stone-700 dark:text-stone-300">
                      {st.qualifications?.join(', ') || 'B.Sc. / B.Ed. Certified'}
                    </p>
                  </div>

                  {/* Teaching Allocations */}
                  <div className="mt-3 text-xs space-y-1">
                    <p className="text-stone-400 font-medium text-[11px]">Assigned Cohorts & Subjects</p>
                    {myAssignments.length === 0 ? (
                      <p className="text-stone-400 italic text-[11px]">No active subject allocations</p>
                    ) : (
                      <div className="space-y-1">
                        {myAssignments.map(a => {
                          const c = classes.find(cls => cls.id === a.class_id);
                          const s = subjects.find(sub => sub.id === a.subject_id);
                          return (
                            <div key={a.id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/60 px-2.5 py-1 rounded text-[11px]">
                              <span className="font-medium text-stone-800 dark:text-stone-200">
                                {s?.name || 'Subject'} • {c?.name || 'Class'}
                              </span>
                              <span className="text-[10px] font-mono capitalize text-stone-500">
                                {a.role.replace('_', ' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenAssignModal(st)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    + Assign Cohort
                  </button>
                  <button
                    onClick={() => {
                      setEditingStaff(st);
                      setEditStaffModal(true);
                    }}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={editStaffModal}
        onClose={() => setEditStaffModal(false)}
        title="Faculty Member Particulars"
        description="Register or modify lecturer profile and designation."
      >
        <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={editingStaff.first_name}
                onChange={(e) => setEditingStaff(prev => ({ ...prev, first_name: e.target.value }))}
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
                value={editingStaff.last_name}
                onChange={(e) => setEditingStaff(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Staff ID Number
              </label>
              <input
                type="text"
                required
                value={editingStaff.staff_no}
                onChange={(e) => setEditingStaff(prev => ({ ...prev, staff_no: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Academic Designation
              </label>
              <input
                type="text"
                required
                value={editingStaff.designation}
                onChange={(e) => setEditingStaff(prev => ({ ...prev, designation: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setEditStaffModal(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Save Faculty Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher to Cohort Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Lecturer to Cohort Subject"
        description={`Allocate ${selectedStaffForAssign?.first_name} ${selectedStaffForAssign?.last_name} to a class and academic discipline.`}
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Class Cohort
            </label>
            <select
              value={assignClassId}
              onChange={(e) => setAssignClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Subject Discipline
            </label>
            <select
              value={assignSubjectId}
              onChange={(e) => setAssignSubjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Role in Cohort
            </label>
            <select
              value={assignRole}
              onChange={(e: any) => setAssignRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="lead_teacher">Lead Lecturer (Full Grading Authority)</option>
              <option value="assistant">Assistant Lecturer / Demonstrator</option>
              <option value="homeroom">Homeroom Personal Tutor</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
