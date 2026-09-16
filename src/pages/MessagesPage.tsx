import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Plus,
  Paperclip,
  CheckCircle2,
  Clock,
  User,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
  FileText
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
import { MessageThread, MessageItem, Student } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, role } = useAuth();
  const { success, error } = useToast();

  const instId = currentUser?.institution_id;
  const urlThreadId = searchParams.get('threadId');

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  // New Thread Modal
  const [newThreadModal, setNewThreadModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');

  const fetchThreads = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      // 1. Threads
      const tSnap = await getDocs(query(collection(db, 'message_threads'), where('institution_id', '==', instId)));
      const list = tSnap.docs.map(d => ({ id: d.id, ...d.data() } as MessageThread));
      setThreads(list);

      // 2. Students
      const sSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId)));
      const stList = sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
      setStudents(stList);

      const target = urlThreadId ? list.find(t => t.id === urlThreadId) : list[0];
      if (target) {
        setActiveThread(target);
      }
    } catch (err) {
      console.warn('Threads load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [instId]);

  // Load messages for activeThread
  useEffect(() => {
    if (!instId || !activeThread) return;

    const loadMessages = async () => {
      try {
        const mSnap = await getDocs(
          query(collection(db, 'messages'), where('institution_id', '==', instId), where('thread_id', '==', activeThread.id))
        );
        const mList = mSnap.docs.map(d => ({ id: d.id, ...d.data() } as MessageItem));
        mList.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
        setMessages(mList);
      } catch (err) {
        console.warn('Messages load error:', err);
      }
    };

    loadMessages();
  }, [instId, activeThread]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !activeThread || !replyText.trim()) return;

    try {
      const msgId = `msg_${Date.now()}`;
      const payload: MessageItem = {
        id: msgId,
        institution_id: instId,
        thread_id: activeThread.id,
        sender_id: currentUser?.uid || 'user',
        sender_name: currentUser?.display_name || 'Guardian / Faculty',
        body: replyText,
        sent_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'messages', msgId), payload);
      setMessages(prev => [...prev, payload]);
      setReplyText('');

      // Update thread timestamp
      await setDoc(doc(db, 'message_threads', activeThread.id), {
        ...activeThread,
        updated_at: new Date().toISOString()
      });
    } catch (err: any) {
      error(err.message || 'Failed to send message');
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !newSubject.trim() || !newInitialMsg.trim()) return;

    try {
      const threadId = `thread_${Date.now()}`;
      const threadPayload: MessageThread = {
        id: threadId,
        institution_id: instId,
        subject: newSubject,
        participant_ids: [currentUser?.uid || 'current_user', 'user_faculty_001'],
        student_id: newStudentId || undefined,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'message_threads', threadId), threadPayload);

      // Initial message
      const msgId = `msg_${Date.now()}`;
      const msgPayload: MessageItem = {
        id: msgId,
        institution_id: instId,
        thread_id: threadId,
        sender_id: currentUser?.uid || 'current_user',
        sender_name: currentUser?.display_name || 'Academic Contact',
        body: newInitialMsg,
        sent_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'messages', msgId), msgPayload);

      setThreads(prev => [threadPayload, ...prev]);
      setActiveThread(threadPayload);
      setMessages([msgPayload]);

      success('New conversation initiated.');
      setNewThreadModal(false);
      setNewSubject('');
      setNewInitialMsg('');
    } catch (err: any) {
      error(err.message || 'Failed to start thread');
    }
  };

  const handleToggleStatus = async () => {
    if (!activeThread || !instId) return;
    const nextStatus = activeThread.status === 'open' ? 'closed' : 'open';
    try {
      await setDoc(doc(db, 'message_threads', activeThread.id), {
        ...activeThread,
        status: nextStatus
      });
      setActiveThread(prev => prev ? { ...prev, status: nextStatus } : null);
      setThreads(prev => prev.map(t => t.id === activeThread.id ? { ...t, status: nextStatus } : t));
      success(`Thread marked as ${nextStatus}.`);
    } catch (err: any) {
      error('Failed to change status');
    }
  };

  const activeStudent = students.find(s => s.id === activeThread?.student_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Guardian & Academic Communication
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Two-way contextual communication linking messages to specific students with read receipts
          </p>
        </div>

        <button
          onClick={() => setNewThreadModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Compose New Message</span>
        </button>
      </div>

      {/* Main Two-Pane Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[560px]">
        {/* Left Pane: Threads List */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col">
          <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
            <span className="font-bold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Conversations ({threads.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {loading ? (
              <div className="p-8 text-center text-stone-400 text-xs">Loading message threads...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">No conversations yet.</div>
            ) : (
              threads.map(t => {
                const isSelected = activeThread?.id === t.id;
                const stud = students.find(s => s.id === t.student_id);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveThread(t);
                      const p = new URLSearchParams(searchParams);
                      p.set('threadId', t.id);
                      setSearchParams(p);
                    }}
                    className={`p-4 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-l-4 border-indigo-600'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                        t.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                      {t.subject}
                    </h4>

                    {stud && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1 font-medium">
                        <GraduationCap className="w-3 h-3" />
                        <span>Re: {stud.first_name} {stud.last_name}</span>
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread Chat View */}
        <div className="lg:col-span-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col">
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {activeThread.subject}
                  </h3>
                  {activeStudent && (
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Associated Student: <strong>{activeStudent.first_name} {activeStudent.last_name}</strong> ({activeStudent.admission_no})</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={handleToggleStatus}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 transition"
                >
                  {activeThread.status === 'open' ? 'Mark Resolved / Close' : 'Re-Open Thread'}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[420px]">
                {messages.map(m => {
                  const isMe = m.sender_id === currentUser?.uid;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-1">
                        <span className="font-semibold text-stone-600 dark:text-stone-300">{m.sender_name}</span>
                        <span>•</span>
                        <span>{new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-tl-xs'
                        }`}
                      >
                        <p>{m.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response to faculty or guardian..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-stone-400 text-xs">
              Select a conversation thread on the left to view messages.
            </div>
          )}
        </div>
      </div>

      {/* Compose Thread Modal */}
      <Modal
        isOpen={newThreadModal}
        onClose={() => setNewThreadModal(false)}
        title="Compose Academic Message"
        description="Initiate a formal thread with student guardians or faculty members."
      >
        <form onSubmit={handleCreateThread} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Conversation Subject
            </label>
            <input
              type="text"
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Leave of Absence Request / Physics Progress"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Link to Student (Optional)
            </label>
            <select
              value={newStudentId}
              onChange={(e) => setNewStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="">No specific student linked</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} ({s.admission_no})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Initial Message Content
            </label>
            <textarea
              rows={4}
              required
              value={newInitialMsg}
              onChange={(e) => setNewInitialMsg(e.target.value)}
              placeholder="Provide details regarding the inquiry..."
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setNewThreadModal(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Send Message
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
