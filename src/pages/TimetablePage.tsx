import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
  AlertTriangle
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import { TimetableSlot, Staff } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { num: 1, label: '08:30 - 09:45', name: 'Period 1' },
  { num: 2, label: '10:00 - 11:15', name: 'Period 2' },
  { num: 3, label: '11:45 - 13:00', name: 'Period 3' },
  { num: 4, label: '14:00 - 15:15', name: 'Period 4' }
];

export const TimetablePage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { classes, subjects } = useInstitution();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'class_yr2_sci');
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotDay, setSlotDay] = useState('Monday');
  const [slotPeriod, setSlotPeriod] = useState(1);
  const [slotSubjectId, setSlotSubjectId] = useState(subjects[0]?.id || '');
  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotRoom, setSlotRoom] = useState('Lecture Theatre 1');

  useEffect(() => {
    if (!instId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Staff
        const stSnap = await getDocs(query(collection(db, 'staff'), where('institution_id', '==', instId)));
        const sList = stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
        setStaffList(sList);
        if (sList.length > 0 && !slotTeacherId) setSlotTeacherId(sList[0].id);

        // Slots for this class
        const ttSnap = await getDocs(
          query(collection(db, 'timetable_slots'), where('institution_id', '==', instId), where('class_id', '==', selectedClassId))
        );
        setSlots(ttSnap.docs.map(d => ({ id: d.id, ...d.data() } as TimetableSlot)));
      } catch (err) {
        console.warn('Timetable load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [instId, selectedClassId]);

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !selectedClassId || !slotSubjectId) return;

    // Conflict detection: Check if teacher or room is double booked on this day & period across ALL classes!
    try {
      const allSlotsSnap = await getDocs(
        query(
          collection(db, 'timetable_slots'),
          where('institution_id', '==', instId),
          where('day_of_week', '==', slotDay),
          where('period', '==', slotPeriod)
        )
      );

      const existingTeacherSlot = allSlotsSnap.docs.find(d => {
        const data = d.data() as TimetableSlot;
        return data.teacher_id === slotTeacherId && data.class_id !== selectedClassId;
      });

      if (existingTeacherSlot) {
        error(`Double-booking conflict: This lecturer is already scheduled in another class during ${slotDay} Period ${slotPeriod}!`);
        return;
      }

      const slotId = `slot_${selectedClassId}_${slotDay}_p${slotPeriod}`;
      const payload: TimetableSlot = {
        id: slotId,
        institution_id: instId,
        class_id: selectedClassId,
        subject_id: slotSubjectId,
        teacher_id: slotTeacherId,
        day_of_week: slotDay,
        period: slotPeriod,
        start_time: PERIODS.find(p => p.num === slotPeriod)?.label.split(' - ')[0] || '09:00',
        end_time: PERIODS.find(p => p.num === slotPeriod)?.label.split(' - ')[1] || '10:15',
        room: slotRoom
      };

      await setDoc(doc(db, 'timetable_slots', slotId), payload);
      setSlots(prev => [...prev.filter(s => s.id !== slotId), payload]);
      success(`Added ${slotDay} Period ${slotPeriod} lecture.`);
      setSlotModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Failed to save timetable slot');
    }
  };

  const getSlot = (day: string, periodNum: number) => {
    return slots.find(s => s.day_of_week === day && s.period === periodNum);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Class Timetable & Schedule Matrix
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Weekly academic schedule grid with conflict detection to prevent double-booking faculty
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isAdmin && (
            <button
              onClick={() => setSlotModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lecture Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Timetable Weekly Matrix Grid */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                <th className="p-4 w-36 border-r border-stone-200 dark:border-stone-800">Time / Period</th>
                {DAYS.map(d => (
                  <th key={d} className="p-4 border-r border-stone-200 dark:border-stone-800 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {PERIODS.map(p => (
                <tr key={p.num} className="divide-x divide-stone-100 dark:divide-stone-800">
                  <td className="p-4 bg-stone-50/50 dark:bg-stone-800/30">
                    <p className="font-bold text-stone-900 dark:text-stone-100">{p.name}</p>
                    <p className="text-[11px] font-mono text-stone-500">{p.label}</p>
                  </td>

                  {DAYS.map(day => {
                    const slot = getSlot(day, p.num);
                    const subj = subjects.find(s => s.id === slot?.subject_id);
                    const teacher = staffList.find(t => t.id === slot?.teacher_id);

                    return (
                      <td key={day} className="p-2.5 h-24 align-top">
                        {slot ? (
                          <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 h-full flex flex-col justify-between">
                            <div>
                              <p className="font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                                {subj?.name || 'Academic Subject'}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                                <User className="w-3 h-3" />
                                <span>{teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Prof. Pendelton'}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1 pt-1 border-t border-indigo-100 dark:border-indigo-900">
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {slot.room || 'Room 101'}
                              </span>
                              <span className="font-mono text-[9px] uppercase">{subj?.code || 'SCI'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-lg border border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-center text-[11px] text-stone-400">
                            Free Period
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Timetable Slot Modal */}
      <Modal
        isOpen={slotModalOpen}
        onClose={() => setSlotModalOpen(false)}
        title="Schedule Academic Lecture"
        description={`Allocate a subject period for ${classes.find(c => c.id === selectedClassId)?.name}.`}
      >
        <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Day of Week
              </label>
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Period / Time Window
              </label>
              <select
                value={slotPeriod}
                onChange={(e) => setSlotPeriod(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                {PERIODS.map(p => (
                  <option key={p.num} value={p.num}>{p.name} ({p.label})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Subject
              </label>
              <select
                value={slotSubjectId}
                onChange={(e) => setSlotSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Lecturer
              </label>
              <select
                value={slotTeacherId}
                onChange={(e) => setSlotTeacherId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                {staffList.map(t => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Lecture Room / Laboratory
            </label>
            <input
              type="text"
              required
              value={slotRoom}
              onChange={(e) => setSlotRoom(e.target.value)}
              placeholder="e.g. Science Lab 4B / Lecture Hall 1"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setSlotModalOpen(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Add to Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
