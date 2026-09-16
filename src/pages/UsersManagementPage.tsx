import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Plus,
  Filter,
  UserCheck,
  UserX,
  Mail,
  Download,
  Link as LinkIcon,
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
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole, Student, Guardian } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const UsersManagementPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;
  const [users, setUsers] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('TEACHER');

  // Change Role Modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [userToModify, setUserToModify] = useState<AppUser | null>(null);
  const [newRoleVal, setNewRoleVal] = useState<UserRole>('TEACHER');

  // Link Guardian Modal
  const [linkGuardianModalOpen, setLinkGuardianModalOpen] = useState(false);
  const [selectedGuardianUser, setSelectedGuardianUser] = useState<AppUser | null>(null);
  const [childStudentId, setChildStudentId] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Mother');

  const fetchUsers = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      const uSnap = await getDocs(query(collection(db, 'users'), where('institution_id', '==', instId)));
      setUsers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)));

      const sSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId)));
      setStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
    } catch (err) {
      console.warn('Users load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [instId]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !inviteEmail.trim() || !inviteName.trim()) return;

    try {
      const newUid = `user_${Date.now()}`;
      const payload: AppUser = {
        uid: newUid,
        email: inviteEmail.toLowerCase().trim(),
        display_name: inviteName.trim(),
        role: inviteRole,
        institution_id: instId,
        is_active: true,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', newUid), payload);
      setUsers(prev => [payload, ...prev]);

      success(`Invitation issued to ${inviteEmail} as ${inviteRole}.`);
      setInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
    } catch (err: any) {
      error(err.message || 'Failed to invite user');
    }
  };

  const handleChangeRole = async () => {
    if (!userToModify) return;
    try {
      await updateDoc(doc(db, 'users', userToModify.uid), { role: newRoleVal });
      setUsers(prev => prev.map(u => u.uid === userToModify.uid ? { ...u, role: newRoleVal } : u));
      success(`Updated ${userToModify.display_name}'s role to ${newRoleVal}.`);
      setRoleModalOpen(false);
    } catch (err: any) {
      error('Failed to change user role');
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    const nextActive = !user.is_active;
    try {
      await updateDoc(doc(db, 'users', user.uid), { is_active: nextActive });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, is_active: nextActive } : u));
      info(`User account ${nextActive ? 'reactivated' : 'suspended'}.`);
    } catch (err: any) {
      error('Failed to toggle status');
    }
  };

  const handleSaveGuardianLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !selectedGuardianUser || !childStudentId) return;

    try {
      const gId = `g_${selectedGuardianUser.uid}`;
      const payload: Guardian = {
        id: gId,
        institution_id: instId,
        user_id: selectedGuardianUser.uid,
        student_ids: [childStudentId],
        relationship: guardianRelationship,
        is_primary: true
      };

      await setDoc(doc(db, 'guardians', gId), payload, { merge: true });
      success(`Linked ${selectedGuardianUser.display_name} to student record.`);
      setLinkGuardianModalOpen(false);
    } catch (err: any) {
      error('Failed to link guardian');
    }
  };

  const filteredUsers = users.filter(u => {
    const name = (u.display_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? u.is_active : !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            User Access & Role Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Manage authenticated users, roles (ADMIN, TEACHER, STUDENT, GUARDIAN, STAFF), and guardian mappings
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Invite New User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by display name or email address..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="TEACHER">TEACHER</option>
          <option value="STUDENT">STUDENT</option>
          <option value="GUARDIAN">GUARDIAN</option>
          <option value="STAFF">STAFF</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                <th className="p-3.5">User Profile</th>
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Registered</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">Loading user accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">No users match filter criteria.</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {user.display_name ? user.display_name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {user.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-stone-600 dark:text-stone-400">{user.email}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        user.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-stone-500 text-[11px]">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.role === 'GUARDIAN' && (
                          <button
                            onClick={() => {
                              setSelectedGuardianUser(user);
                              setChildStudentId(students[0]?.id || '');
                              setLinkGuardianModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded"
                            title="Link to student child"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setUserToModify(user);
                            setNewRoleVal(user.role);
                            setRoleModalOpen(true);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                          title="Change user role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded transition ${
                            user.is_active ? 'text-stone-400 hover:text-rose-600' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.is_active ? 'Suspend account' : 'Reactivate account'}
                        >
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite User to Institution"
        description="Provision an authorized user login mapped to your institution."
      >
        <form onSubmit={handleInviteUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Full Display Name
            </label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. Dr. Arthur Pendelton"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="lecturer@institution.edu"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Assigned Role
            </label>
            <select
              value={inviteRole}
              onChange={(e: any) => setInviteRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="TEACHER">TEACHER (Faculty Lecturer & Grading Authority)</option>
              <option value="STUDENT">STUDENT (Access to Personal Scores & Timetable)</option>
              <option value="GUARDIAN">GUARDIAN (Parent & Emergency Contact)</option>
              <option value="STAFF">STAFF (Bursary, Finance & Administrative Support)</option>
              <option value="ADMIN">ADMIN (Full School Institutional Authority)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setInviteModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Modify Role Permissions"
        description={`Update system permissions for ${userToModify?.display_name}.`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Select New Role
            </label>
            <select
              value={newRoleVal}
              onChange={(e: any) => setNewRoleVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="TEACHER">TEACHER</option>
              <option value="STUDENT">STUDENT</option>
              <option value="GUARDIAN">GUARDIAN</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setRoleModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeRole}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Apply Role Change
            </button>
          </div>
        </div>
      </Modal>

      {/* Guardian Linking Modal */}
      <Modal
        isOpen={linkGuardianModalOpen}
        onClose={() => setLinkGuardianModalOpen(false)}
        title="Link Guardian to Student Record"
        description={`Establish parental link for ${selectedGuardianUser?.display_name}.`}
      >
        <form onSubmit={handleSaveGuardianLink} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Enrolled Student
            </label>
            <select
              required
              value={childStudentId}
              onChange={(e) => setChildStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Relationship to Student
            </label>
            <select
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Legal Guardian">Legal Guardian</option>
              <option value="Foster Parent">Foster Parent</option>
              <option value="Grandparent">Grandparent</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setLinkGuardianModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Save Guardian Mapping
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
