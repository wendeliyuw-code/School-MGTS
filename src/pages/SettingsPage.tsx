import React, { useState } from 'react';
import {
  Settings,
  Building,
  GraduationCap,
  Sparkles,
  Save,
  RotateCcw,
  Palette,
  Sliders,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import { seedDemoData } from '../lib/seedDemoData';
import { useToast } from '../components/Toast';

const DEFAULT_GRADING_SCALES = [
  { id: 'gs_1', letter_grade: 'A*', min_score: 90, max_score: 100, gpa_point: 4.0, description: 'Distinction / Exceptional Mastery' },
  { id: 'gs_2', letter_grade: 'A', min_score: 80, max_score: 89, gpa_point: 3.8, description: 'Excellent Academic Competence' },
  { id: 'gs_3', letter_grade: 'B', min_score: 70, max_score: 79, gpa_point: 3.0, description: 'Above Average Standard' },
  { id: 'gs_4', letter_grade: 'C', min_score: 60, max_score: 69, gpa_point: 2.0, description: 'Satisfactory / University Qualifying' },
  { id: 'gs_5', letter_grade: 'D', min_score: 50, max_score: 59, gpa_point: 1.0, description: 'Minimum Pass Threshold' },
  { id: 'gs_6', letter_grade: 'F', min_score: 0, max_score: 49, gpa_point: 0.0, description: 'Unclassified / Re-sit Required' }
];

export const SettingsPage: React.FC = () => {
  const { institution, currentUser, isAdmin } = useAuth();
  const { currentYear, currentTerm, refreshConfig } = useInstitution();
  const [gradingScales] = useState(DEFAULT_GRADING_SCALES);
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'grading' | 'custom_fields' | 'demo'>('profile');
  const [saving, setSaving] = useState(false);

  // Form states for Institution Profile
  const [schoolName, setSchoolName] = useState(institution?.name || 'St. Jude Pre-University College');
  const [schoolAddress, setSchoolAddress] = useState(institution?.address || '14 Cambridge Academic Way, Education District');
  const [schoolPhone, setSchoolPhone] = useState(institution?.phone || '+44 20 7946 0912');
  const [schoolEmail, setSchoolEmail] = useState(institution?.email || 'admissions@stjude-college.edu');
  const [schoolCurrency, setSchoolCurrency] = useState(institution?.settings?.currency || 'USD');
  const [schoolTimezone, setSchoolTimezone] = useState(institution?.settings?.timezone || 'Europe/London');

  // Custom Fields state
  const [customFields, setCustomFields] = useState<Array<{ name: string; type: string; required: boolean }>>([
    { name: 'Medical Conditions & Allergies', type: 'text', required: false },
    { name: 'Scholarship / Bursary Tier', type: 'select', required: false },
    { name: 'Emergency Contact Passport No', type: 'text', required: true }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldReq, setNewFieldReq] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'institutions', institution.id), {
        name: schoolName,
        address: schoolAddress,
        phone: schoolPhone,
        email: schoolEmail,
        settings: {
          ...institution.settings,
          currency: schoolCurrency,
          timezone: schoolTimezone
        }
      });
      success('School profile configuration updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    setCustomFields(prev => [...prev, { name: newFieldName.trim(), type: newFieldType, required: newFieldReq }]);
    setNewFieldName('');
    success('Custom field definition added.');
  };

  const handleRemoveField = (idx: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== idx));
  };

  const handleReseed = async () => {
    if (!confirm('Re-seed fresh demo data for all personas, grades, invoices, and timetables?')) return;
    try {
      await seedDemoData();
      await refreshConfig();
      success('Demo data refreshed and initialized successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to seed demo data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Institutional Settings & Configuration
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Configure academic years, grading schemes, dynamic metadata fields, and school profile
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          School Identity & Contact
        </button>
        <button
          onClick={() => setActiveTab('grading')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'grading'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Grading Scale Matrix
        </button>
        <button
          onClick={() => setActiveTab('custom_fields')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'custom_fields'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          Custom Metadata Fields
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'demo'
              ? 'bg-rose-600 text-white'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          Data & Testing Tools
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            Institution Information
          </h3>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Institution Legal Name
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Campus Address
            </label>
            <input
              type="text"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Official Contact Phone
              </label>
              <input
                type="text"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Admissions Email
              </label>
              <input
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Billing Currency
              </label>
              <select
                value={schoolCurrency}
                onChange={(e) => setSchoolCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
              >
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Academic Timezone
              </label>
              <select
                value={schoolTimezone}
                onChange={(e) => setSchoolTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
              >
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Grading Scale Matrix */}
      {activeTab === 'grading' && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Institution Grading Standard (Cambridge A-Level System)
            </h3>
            <p className="text-stone-500 mt-0.5">
              Grade thresholds used for auto-computing marks, GPA points, and transcripts
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
                  <th className="p-3">Grade</th>
                  <th className="p-3">Score Range</th>
                  <th className="p-3">GPA Equivalent</th>
                  <th className="p-3">Academic Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {gradingScales.map(scale => (
                  <tr key={scale.id} className="hover:bg-stone-50/50">
                    <td className="p-3 font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                      {scale.letter_grade}
                    </td>
                    <td className="p-3 font-mono">{scale.min_score}% – {scale.max_score}%</td>
                    <td className="p-3 font-mono font-semibold">{scale.gpa_point.toFixed(1)}</td>
                    <td className="p-3 text-stone-600 dark:text-stone-400">{scale.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Custom Metadata Fields */}
      {activeTab === 'custom_fields' && (
        <div className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-6 text-xs max-w-2xl">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Student & Faculty Dynamic Field Schema
            </h3>
            <p className="text-stone-500 mt-0.5">
              Extend records with institution-specific metadata without modifying database schemas
            </p>
          </div>

          <div className="space-y-2">
            {customFields.map((cf, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50"
              >
                <div>
                  <p className="font-bold text-stone-900 dark:text-stone-100">{cf.name}</p>
                  <p className="text-[11px] text-stone-500 font-mono capitalize">
                    Type: {cf.type} • {cf.required ? 'Mandatory' : 'Optional'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveField(i)}
                  className="text-stone-400 hover:text-rose-600 transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add field box */}
          <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 space-y-3">
            <h4 className="font-bold text-stone-900 dark:text-stone-100">Add New Dynamic Field</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-500 mb-1">Field Label</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. Cambridge Candidate Index"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>
              <div>
                <label className="block text-stone-500 mb-1">Data Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                >
                  <option value="text">Text / String</option>
                  <option value="number">Numeric</option>
                  <option value="select">Dropdown Select</option>
                  <option value="date">Date</option>
                  <option value="boolean">Yes / No Toggle</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFieldReq}
                  onChange={(e) => setNewFieldReq(e.target.checked)}
                  className="rounded border-stone-300 text-indigo-600"
                />
                <span className="font-medium text-stone-700 dark:text-stone-300">Required field</span>
              </label>

              <button
                type="button"
                onClick={handleAddField}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Demo / Testing Data Tools */}
      {activeTab === 'demo' && (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 shadow-2xs space-y-4 text-xs max-w-2xl">
          <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            Testing Environment & Demo Data Reset
          </h3>
          <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
            Quickly re-populate the Firestore database with realistic mock data for St. Jude Pre-University College (Cambridge A-Level and Foundation classes, 10 enrolled students, sample attendance records, grade marks, tuition invoices, announcements, and timetables).
          </p>

          <button
            onClick={handleReseed}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset & Re-Seed Pre-University Demo Data</span>
          </button>
        </div>
      )}
    </div>
  );
};
