import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Calendar,
  Users,
  Eye,
  Trash2,
  Sparkles
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
import { Announcement } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const AnnouncementsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { success, error } = useToast();

  const instId = currentUser?.institution_id;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState('');

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'staff' | 'students' | 'guardians'>('all');

  const fetchAnnouncements = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      const aSnap = await getDocs(query(collection(db, 'announcements'), where('institution_id', '==', instId)));
      const list = aSnap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      setAnnouncements(list);
    } catch (err) {
      console.warn('Announcements load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [instId]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !title.trim() || !body.trim()) return;

    try {
      const ancId = `anc_${Date.now()}`;
      const payload: Announcement = {
        id: ancId,
        institution_id: instId,
        title,
        body,
        audience,
        published_by: currentUser?.uid || 'admin',
        published_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'announcements', ancId), payload);
      setAnnouncements(prev => [payload, ...prev]);
      success('Announcement published to the school community.');
      setCreateModalOpen(false);
      setTitle('');
      setBody('');
    } catch (err: any) {
      error(err.message || 'Failed to publish announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      success('Announcement removed.');
    } catch (err: any) {
      error('Failed to remove notice');
    }
  };

  const filtered = announcements.filter(a => !audienceFilter || a.audience === audienceFilter || a.audience === 'all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            School Notices & Bulletins
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Official announcements broadcast to students, parents, and faculty
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Audience Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setAudienceFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            !audienceFilter
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          All Audiences
        </button>
        <button
          onClick={() => setAudienceFilter('guardians')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            audienceFilter === 'guardians'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Parents & Guardians
        </button>
        <button
          onClick={() => setAudienceFilter('students')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            audienceFilter === 'students'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Students
        </button>
        <button
          onClick={() => setAudienceFilter('staff')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            audienceFilter === 'staff'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
          }`}
        >
          Faculty & Staff
        </button>
      </div>

      {/* Announcements Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-xs">Loading announcements...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">No announcements in this category.</div>
        ) : (
          filtered.map(anc => (
            <div
              key={anc.id}
              className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Audience: {anc.audience}
                  </span>
                  <span className="text-stone-400 text-xs">•</span>
                  <span className="text-xs text-stone-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {anc.published_at ? new Date(anc.published_at).toLocaleDateString() : ''}
                  </span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(anc.id)}
                    className="text-stone-400 hover:text-rose-600 transition"
                    title="Remove bulletin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {anc.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {anc.body}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Broadcast Announcement"
        description="Publish official institutional notices to target communities."
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cambridge A-Level Practical Lab Timings"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e: any) => setAudience(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="all">Entire College Community</option>
              <option value="guardians">Parents & Guardians Only</option>
              <option value="students">Students Only</option>
              <option value="staff">Faculty & Staff Only</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Announcement Body
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Full text of notice, contact details, and dates..."
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
