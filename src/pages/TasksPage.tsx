import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Filter,
  Check
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
import { TaskItem, Staff } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const TasksPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Create Task Modal
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const fetchTasks = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      const tSnap = await getDocs(query(collection(db, 'tasks'), where('institution_id', '==', instId)));
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskItem)));

      const sSnap = await getDocs(query(collection(db, 'staff'), where('institution_id', '==', instId)));
      setStaffList(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    } catch (err) {
      console.warn('Tasks load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [instId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !newTitle.trim()) return;

    try {
      const taskId = `task_${Date.now()}`;
      const payload: TaskItem = {
        id: taskId,
        institution_id: instId,
        title: newTitle,
        description: newDesc,
        assigned_to: newAssignedTo || currentUser?.uid || 'staff',
        created_by: currentUser?.uid || 'admin',
        due_date: newDueDate,
        status: 'pending',
        priority: newPriority
      };

      await setDoc(doc(db, 'tasks', taskId), payload);
      setTasks(prev => [payload, ...prev]);
      success(`Task "${newTitle}" assigned.`);
      setCreateTaskModal(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err: any) {
      error(err.message || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'done') => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      info(`Task updated to ${newStatus}.`);
    } catch (err: any) {
      error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(t => !statusFilter || t.status === statusFilter);

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Institutional Task Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Operational action items, exam prep deadlines, and faculty responsibilities
          </p>
        </div>

        <button
          onClick={() => setCreateTaskModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task Item</span>
        </button>
      </div>

      {/* Task Status Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            !statusFilter
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'pending'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'in_progress'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setStatusFilter('done')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            statusFilter === 'done'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Completed ({doneCount})
        </button>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading operational tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">No tasks in this category.</div>
        ) : (
          filteredTasks.map(task => {
            const assignedStaff = staffList.find(s => s.id === task.assigned_to);

            return (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleUpdateStatus(task.id, task.status === 'done' ? 'pending' : 'done')}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      task.status === 'done'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-stone-300 dark:border-stone-700 hover:border-indigo-500'
                    }`}
                  >
                    {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <h3 className={`font-bold text-sm ${task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {task.due_date}</span>
                      </span>
                      {assignedStaff && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{assignedStaff.first_name} {assignedStaff.last_name}</span>
                        </span>
                      )}
                      <span className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        task.priority === 'urgent' || task.priority === 'high'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e: any) => handleUpdateStatus(task.id, e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={createTaskModal}
        onClose={() => setCreateTaskModal(false)}
        title="Create Action Item"
        description="Assign a duty to faculty or administrative staff."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Verify Cambridge Exam Hall Roster"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Provide procedural instructions or checklists..."
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Assign To Staff Member
              </label>
              <select
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                <option value="">Myself</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.designation})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Priority Level
            </label>
            <select
              value={newPriority}
              onChange={(e: any) => setNewPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent / Critical</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setCreateTaskModal(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Assign Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
