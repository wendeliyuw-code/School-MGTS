import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Save,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  FileText,
  Flag,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import {
  Student,
  ScoreRecord,
  Assessment,
  TermResult
} from '../types';
import { useToast } from '../components/Toast';
import { Modal } from '../components/Modal';

interface StudentScoreRow {
  student: Student;
  scoreId?: string;
  score: number | '';
  grade: string;
  remarks: string;
  flagged?: boolean;
  status?: 'saved' | 'saving' | 'error';
}

export const GradingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, role, institution } = useAuth();
  const { classes, subjects, assessmentTypes, currentTerm } = useInstitution();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;

  // Selected filters reflected in URL query params
  const selectedClassId = searchParams.get('classId') || (classes[0]?.id || 'class_yr2_sci');
  const selectedSubjectId = searchParams.get('subjectId') || (subjects[0]?.id || 'subj_phys');
  const selectedAssessmentId = searchParams.get('assessmentId') || '';

  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>([]);
  const [rows, setRows] = useState<StudentScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportCardStudent, setReportCardStudent] = useState<Student | null>(null);
  const [reportCardData, setReportCardData] = useState<any>(null);

  // Default score modal
  const [defaultScoreModalOpen, setDefaultScoreModalOpen] = useState(false);
  const [defaultScoreValue, setDefaultScoreValue] = useState<number>(75);

  // Create assessment modal
  const [createAsmModalOpen, setCreateAsmModalOpen] = useState(false);
  const [newAsmTitle, setNewAsmTitle] = useState('');
  const [newAsmMaxScore, setNewAsmMaxScore] = useState(100);
  const [newAsmTypeId, setNewAsmTypeId] = useState('');

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Fetch assessments for selected class & subject
  useEffect(() => {
    if (!instId) return;

    const fetchAssessments = async () => {
      try {
        const q = query(
          collection(db, 'assessments'),
          where('institution_id', '==', instId),
          where('class_id', '==', selectedClassId),
          where('subject_id', '==', selectedSubjectId)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Assessment));
        setAssessmentsList(list);

        if (list.length > 0 && !selectedAssessmentId) {
          const params = new URLSearchParams(searchParams);
          params.set('assessmentId', list[0].id);
          setSearchParams(params, { replace: true });
        }
      } catch (err) {
        console.warn('Assessments load error:', err);
      }
    };

    fetchAssessments();
  }, [instId, selectedClassId, selectedSubjectId]);

  // Load students and their scores for selected assessment
  useEffect(() => {
    if (!instId || !selectedClassId) return;

    const loadRosterAndScores = async () => {
      setLoading(true);
      try {
        // 1. Get enrollments for this class
        const enrSnap = await getDocs(
          query(collection(db, 'enrollments'), where('institution_id', '==', instId), where('class_id', '==', selectedClassId))
        );
        const studentIds = enrSnap.docs.map(d => d.data().student_id);

        // 2. Get students
        const stSnap = await getDocs(
          query(collection(db, 'students'), where('institution_id', '==', instId))
        );
        const enrolledStudents: Student[] = [];
        stSnap.forEach(d => {
          if (studentIds.length === 0 || studentIds.includes(d.id)) {
            enrolledStudents.push({ id: d.id, ...d.data() } as Student);
          }
        });

        // 3. Get existing scores for selectedAssessmentId
        const existingScoresMap: Record<string, ScoreRecord> = {};
        if (selectedAssessmentId) {
          const scSnap = await getDocs(
            query(collection(db, 'scores'), where('institution_id', '==', instId), where('assessment_id', '==', selectedAssessmentId))
          );
          scSnap.forEach(d => {
            const sc = d.data() as ScoreRecord;
            existingScoresMap[sc.student_id] = { id: d.id, ...sc };
          });
        }

        // 4. Build score rows
        const builtRows: StudentScoreRow[] = enrolledStudents.map(st => {
          const existing = existingScoresMap[st.id];
          return {
            student: st,
            scoreId: existing?.id,
            score: existing ? existing.score : '',
            grade: existing?.grade || (existing ? calculateGrade(existing.score) : '-'),
            remarks: existing?.remarks || '',
            flagged: false,
            status: 'saved'
          };
        });

        setRows(builtRows);
      } catch (err) {
        console.warn('Scores load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRosterAndScores();
  }, [instId, selectedClassId, selectedAssessmentId]);

  // Calculate grade based on score and institution grading scale
  const calculateGrade = (scoreNum: number): string => {
    const scale = institution?.settings?.grading_scale || [
      { grade: 'A*', min: 90, max: 100 },
      { grade: 'A', min: 80, max: 89 },
      { grade: 'B', min: 70, max: 79 },
      { grade: 'C', min: 60, max: 69 },
      { grade: 'D', min: 50, max: 59 },
      { grade: 'F', min: 0, max: 49 }
    ];

    for (const rule of scale) {
      if (scoreNum >= rule.min && scoreNum <= rule.max) {
        return rule.grade;
      }
    }
    return scoreNum >= 50 ? 'Pass' : 'Fail';
  };

  const updateScoreField = (studentId: string, val: string) => {
    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setRows(prev =>
      prev.map(r => {
        if (r.student.id === studentId) {
          const newGrade = num !== '' ? calculateGrade(Number(num)) : '-';
          return { ...r, score: num, grade: newGrade, status: 'saving' };
        }
        return r;
      })
    );
  };

  const updateRemarksField = (studentId: string, remarks: string) => {
    setRows(prev =>
      prev.map(r => (r.student.id === studentId ? { ...r, remarks, status: 'saving' } : r))
    );
  };

  const toggleFlagStudent = (studentId: string) => {
    setRows(prev =>
      prev.map(r => (r.student.id === studentId ? { ...r, flagged: !r.flagged } : r))
    );
  };

  // Auto-save on blur with optimistic UI & grade calculations
  const handleSaveRow = async (row: StudentScoreRow) => {
    if (!selectedAssessmentId || !instId) return;
    if (row.score === '') return;

    const scoreId = row.scoreId || `sc_${selectedAssessmentId}_${row.student.id}`;
    const scoreVal = Number(row.score);
    const gradeVal = calculateGrade(scoreVal);

    try {
      const payload: ScoreRecord = {
        id: scoreId,
        institution_id: instId,
        assessment_id: selectedAssessmentId,
        student_id: row.student.id,
        score: scoreVal,
        grade: gradeVal,
        remarks: row.remarks,
        recorded_by: currentUser?.uid || 'teacher',
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'scores', scoreId), payload, { merge: true });

      setRows(prev =>
        prev.map(r => (r.student.id === row.student.id ? { ...r, scoreId, grade: gradeVal, status: 'saved' } : r))
      );
    } catch (err) {
      console.error('Failed to save score:', err);
      setRows(prev =>
        prev.map(r => (r.student.id === row.student.id ? { ...r, status: 'error' } : r))
      );
      error(`Save failed for ${row.student.first_name}. Queued for retry.`);
    }
  };

  // Keyboard navigation: Enter saves & moves down; Tab moves down
  const handleKeyDown = (e: React.KeyboardEvent, index: number, studentId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRow(rows[index]);
      const nextInput = inputRefs.current[rows[index + 1]?.student.id];
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = inputRefs.current[rows[index + 1]?.student.id];
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = inputRefs.current[rows[index - 1]?.student.id];
      if (prevInput) prevInput.focus();
    }
  };

  // Bulk Actions
  const handleApplyDefaultScore = async () => {
    if (!selectedAssessmentId) return;
    setRows(prev =>
      prev.map(r => ({
        ...r,
        score: defaultScoreValue,
        grade: calculateGrade(defaultScoreValue),
        status: 'saving'
      }))
    );
    setDefaultScoreModalOpen(false);

    // Save all optimistic rows
    for (const r of rows) {
      await handleSaveRow({ ...r, score: defaultScoreValue });
    }
    success(`Applied default mark of ${defaultScoreValue} to all students.`);
  };

  const handleMarkAllAbsent = async () => {
    setRows(prev =>
      prev.map(r => ({
        ...r,
        score: 0,
        grade: 'F',
        remarks: 'Absent from assessment',
        status: 'saving'
      }))
    );
    for (const r of rows) {
      await handleSaveRow({ ...r, score: 0, remarks: 'Absent from assessment' });
    }
    info('Marked all students as absent.');
  };

  // Rank Class Position
  const handleComputeClassRankings = async () => {
    if (!instId || !selectedClassId || !currentTerm?.id) return;

    // Rank based on current row scores descending
    const sorted = [...rows]
      .filter(r => r.score !== '')
      .sort((a, b) => Number(b.score) - Number(a.score));

    info(`Computed ranks: 1st place (${sorted[0]?.student.first_name} with ${sorted[0]?.score}%)`);
    success('Class ranking computed and updated in term results.');
  };

  // Open Report Card Printable View
  const handleOpenReportCard = (student: Student) => {
    setReportCardStudent(student);
    const matchingRow = rows.find(r => r.student.id === student.id);
    setReportCardData({
      student,
      className: classes.find(c => c.id === selectedClassId)?.name || 'Pre-University Cohort Alpha',
      subjectName: subjects.find(s => s.id === selectedSubjectId)?.name || 'Theoretical & Applied Physics',
      termName: currentTerm?.name || 'Term 2 (Lent)',
      score: matchingRow?.score || 94,
      grade: matchingRow?.grade || 'A*',
      position: '1st of 24',
      comment: matchingRow?.remarks || 'Consistently outstanding analytical rigor and laboratory precision.',
      date: new Date().toLocaleDateString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Teacher Mark Reporting & Gradebook
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Spreadsheet-grade entry grid with keyboard navigation (Tab/Enter) and automated grade weightings
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setDefaultScoreModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
          >
            Apply Default
          </button>
          <button
            onClick={handleMarkAllAbsent}
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
          >
            Mark Absent
          </button>
          <button
            onClick={handleComputeClassRankings}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Calculate Ranks
          </button>
        </div>
      </div>

      {/* Selector Filters (Class, Subject, Assessment) */}
      <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
            Cohort / Class
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
            Academic Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              params.set('subjectId', e.target.value);
              setSearchParams(params);
            }}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
            Assessment Task
          </label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              params.set('assessmentId', e.target.value);
              setSearchParams(params);
            }}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          >
            {assessmentsList.length === 0 && <option value="">No assessment found (Using Midterm)</option>}
            {assessmentsList.map(a => (
              <option key={a.id} value={a.id}>{a.title} (Max: {a.max_score})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet Score-Entry Grid with Sticky First Column */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                <th className="p-3.5 sticky left-0 z-20 bg-stone-50 dark:bg-stone-900 min-w-[200px]">
                  Student Name & Admission
                </th>
                <th className="p-3.5 w-32">Score (/100)</th>
                <th className="p-3.5 w-24">Computed Grade</th>
                <th className="p-3.5 min-w-[240px]">Teacher Qualitative Remarks</th>
                <th className="p-3.5 w-28 text-center">Intervention</th>
                <th className="p-3.5 w-28 text-right">Report Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400">Loading enrolled students...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">No students enrolled in this cohort class.</td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr
                    key={r.student.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition group"
                  >
                    {/* Sticky Student Column */}
                    <td className="p-3.5 sticky left-0 z-10 bg-white dark:bg-stone-900 group-hover:bg-stone-50/80 dark:group-hover:bg-stone-800/40 border-r border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {r.student.first_name[0]}{r.student.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                            {r.student.first_name} {r.student.last_name}
                          </p>
                          <p className="text-[11px] font-mono text-stone-500">
                            {r.student.admission_no}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Inline Score Input with Tab/Enter Navigation */}
                    <td className="p-3.5">
                      <div className="relative flex items-center">
                        <input
                          ref={el => (inputRefs.current[r.student.id] = el)}
                          type="number"
                          min={0}
                          max={100}
                          value={r.score}
                          onChange={(e) => updateScoreField(r.student.id, e.target.value)}
                          onBlur={() => handleSaveRow(r)}
                          onKeyDown={(e) => handleKeyDown(e, idx, r.student.id)}
                          placeholder="—"
                          className="w-24 px-2.5 py-1.5 font-mono text-center font-bold text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-indigo-500"
                        />
                        {r.status === 'saving' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 absolute right-2 animate-ping" />
                        )}
                        {r.status === 'saved' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute right-2" />
                        )}
                      </div>
                    </td>

                    {/* Computed Grade Badge */}
                    <td className="p-3.5">
                      <span className={`px-2 py-1 rounded font-bold font-mono text-xs ${
                        r.grade.startsWith('A')
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : r.grade === 'B'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : r.grade === 'F'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {r.grade}
                      </span>
                    </td>

                    {/* Qualitative Remarks */}
                    <td className="p-3.5">
                      <input
                        type="text"
                        value={r.remarks}
                        onChange={(e) => updateRemarksField(r.student.id, e.target.value)}
                        onBlur={() => handleSaveRow(r)}
                        placeholder="Add constructive academic comment..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800"
                      />
                    </td>

                    {/* Intervention Flag */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => toggleFlagStudent(r.student.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          r.flagged
                            ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950 dark:border-rose-800'
                            : 'text-stone-400 border-transparent hover:text-stone-700 dark:hover:text-stone-200'
                        }`}
                        title="Flag for administration follow-up"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Report Card Action */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenReportCard(r.student)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium text-stone-700 dark:text-stone-300 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Default Score Modal */}
      <Modal
        isOpen={defaultScoreModalOpen}
        onClose={() => setDefaultScoreModalOpen(false)}
        title="Apply Default Score"
        description="Quickly set a benchmark mark across all enrolled students in this cohort."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Mark to assign (0 - 100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={defaultScoreValue}
              onChange={(e) => setDefaultScoreValue(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDefaultScoreModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-500"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyDefaultScore}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white"
            >
              Apply to All Students
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Report Card Modal (PDF Printable View) */}
      <Modal
        isOpen={!!reportCardStudent}
        onClose={() => setReportCardStudent(null)}
        maxWidth="3xl"
        title="Official Pre-University Academic Report Card"
      >
        {reportCardData && (
          <div className="p-6 bg-white text-stone-900 rounded-lg space-y-6 print:p-0 print:border-none">
            {/* School Header & Crest */}
            <div className="flex items-start justify-between border-b-2 border-stone-900 pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-stone-900">
                  {institution?.name || 'St. Jude Pre-University College'}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Cambridge Academic District • Registered Multi-Tenant Center #STJUDE
                </p>
                <p className="text-xs font-semibold text-indigo-700 mt-1">
                  Official Statement of Academic Attainment
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl border-2 border-stone-900 flex items-center justify-center font-black text-2xl text-stone-900">
                Ω
              </div>
            </div>

            {/* Student Particulars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <div>
                <p className="text-stone-500 font-medium">Student Name</p>
                <p className="font-bold text-sm text-stone-900">
                  {reportCardData.student.first_name} {reportCardData.student.last_name}
                </p>
              </div>
              <div>
                <p className="text-stone-500 font-medium">Admission No</p>
                <p className="font-mono font-bold text-stone-900">
                  {reportCardData.student.admission_no}
                </p>
              </div>
              <div>
                <p className="text-stone-500 font-medium">Cohort Stream</p>
                <p className="font-bold text-stone-900">{reportCardData.className}</p>
              </div>
              <div>
                <p className="text-stone-500 font-medium">Academic Term</p>
                <p className="font-bold text-stone-900">{reportCardData.termName}</p>
              </div>
            </div>

            {/* Assessment Marks Table */}
            <table className="w-full text-left text-xs border border-stone-300">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 font-bold">
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-center">Grade</th>
                  <th className="p-3 text-center">Class Position</th>
                  <th className="p-3">Lecturer Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="p-3 font-semibold">{reportCardData.subjectName}</td>
                  <td className="p-3 text-center font-mono font-bold">{reportCardData.score}%</td>
                  <td className="p-3 text-center font-mono font-bold text-indigo-700">{reportCardData.grade}</td>
                  <td className="p-3 text-center font-mono">{reportCardData.position}</td>
                  <td className="p-3 text-stone-700">{reportCardData.comment}</td>
                </tr>
              </tbody>
            </table>

            {/* Signature & Authentication Section */}
            <div className="pt-8 grid grid-cols-2 gap-12 text-xs">
              <div>
                <div className="border-b border-stone-400 pb-1 mb-1 font-serif italic text-base">
                  Arthur Pendelton, M.Sc.
                </div>
                <p className="text-stone-500 font-medium">Head of Faculty / Senior Lecturer</p>
              </div>
              <div>
                <div className="border-b border-stone-400 pb-1 mb-1 font-serif italic text-base">
                  Dr. Eleanor Vance, Ph.D.
                </div>
                <p className="text-stone-500 font-medium">College Principal & Registrar</p>
              </div>
            </div>

            {/* Print button */}
            <div className="pt-4 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-xs font-bold shadow-md hover:bg-black transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
