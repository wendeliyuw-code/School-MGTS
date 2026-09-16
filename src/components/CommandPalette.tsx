import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, GraduationCap, Users, BookOpen, Receipt, MessageSquare, ArrowRight, X } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface SearchResult {
  id: string;
  type: 'student' | 'staff' | 'class' | 'invoice' | 'thread';
  title: string;
  subtitle: string;
  url: string;
}

export const CommandPalette: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const instId = currentUser?.institution_id;

  const [term, setTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTerm('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !term.trim() || !instId) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const lowerTerm = term.toLowerCase();
        const found: SearchResult[] = [];

        // 1. Search students
        const stSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId), limit(15)));
        stSnap.forEach(d => {
          const s = d.data();
          const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
          const adm = (s.admission_no || '').toLowerCase();
          if (fullName.includes(lowerTerm) || adm.includes(lowerTerm)) {
            found.push({
              id: d.id,
              type: 'student',
              title: `${s.first_name} ${s.last_name}`,
              subtitle: `Admission: ${s.admission_no} • Student`,
              url: `/students?id=${d.id}`
            });
          }
        });

        // 2. Search staff
        const staffSnap = await getDocs(query(collection(db, 'staff'), where('institution_id', '==', instId), limit(15)));
        staffSnap.forEach(d => {
          const st = d.data();
          const fullName = `${st.first_name || ''} ${st.last_name || ''}`.toLowerCase();
          const no = (st.staff_no || '').toLowerCase();
          if (fullName.includes(lowerTerm) || no.includes(lowerTerm) || (st.designation || '').toLowerCase().includes(lowerTerm)) {
            found.push({
              id: d.id,
              type: 'staff',
              title: `${st.first_name} ${st.last_name}`,
              subtitle: `${st.designation || 'Staff'} • ${st.staff_no}`,
              url: `/staff?id=${d.id}`
            });
          }
        });

        // 3. Search classes
        const clsSnap = await getDocs(query(collection(db, 'classes'), where('institution_id', '==', instId), limit(15)));
        clsSnap.forEach(d => {
          const c = d.data();
          if ((c.name || '').toLowerCase().includes(lowerTerm)) {
            found.push({
              id: d.id,
              type: 'class',
              title: c.name,
              subtitle: `Capacity: ${c.capacity} students • Class cohort`,
              url: `/academics/classes?id=${d.id}`
            });
          }
        });

        // 4. Search threads
        const msgSnap = await getDocs(query(collection(db, 'message_threads'), where('institution_id', '==', instId), limit(15)));
        msgSnap.forEach(d => {
          const m = d.data();
          if ((m.subject || '').toLowerCase().includes(lowerTerm)) {
            found.push({
              id: d.id,
              type: 'thread',
              title: m.subject,
              subtitle: `Message Thread • ${m.status}`,
              url: `/messages?threadId=${d.id}`
            });
          }
        });

        setResults(found.slice(0, 10));
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [term, isOpen, instId]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl rounded-xl overflow-hidden z-10"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200 dark:border-stone-800">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search students, staff, cohorts, invoices, messages... (Press Esc to close)"
            className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none text-base"
            autoFocus
          />
          {term && (
            <button onClick={() => setTerm('')} className="p-1 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs px-2 py-1 font-mono rounded bg-stone-100 dark:bg-stone-800 text-stone-500 shrink-0">ESC</span>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
          {loading && (
            <div className="p-8 text-center text-stone-400 text-sm">Searching records...</div>
          )}

          {!loading && term.trim() && results.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-sm">
              No matching records found for "{term}".
            </div>
          )}

          {!loading && !term.trim() && (
            <div className="p-6 text-xs text-stone-400 space-y-2">
              <p className="font-semibold text-stone-600 dark:text-stone-300">Quick Navigation Shortcuts</p>
              <div className="grid grid-cols-2 gap-2 text-stone-500">
                <div><span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">G</span> then <span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">D</span> : Dashboard</div>
                <div><span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">G</span> then <span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">S</span> : Students</div>
                <div><span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">G</span> then <span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">A</span> : Attendance</div>
                <div><span className="font-mono px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">/</span> : Quick Focus Search</div>
              </div>
            </div>
          )}

          {!loading && results.map((r, i) => (
            <div
              key={r.id + r.type}
              onClick={() => handleSelect(r)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition ${
                selectedIndex === i ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100' : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {r.type === 'student' && <GraduationCap className="w-4 h-4" />}
                  {r.type === 'staff' && <Users className="w-4 h-4" />}
                  {r.type === 'class' && <BookOpen className="w-4 h-4" />}
                  {r.type === 'invoice' && <Receipt className="w-4 h-4" />}
                  {r.type === 'thread' && <MessageSquare className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium text-sm text-stone-900 dark:text-stone-100">{r.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{r.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
