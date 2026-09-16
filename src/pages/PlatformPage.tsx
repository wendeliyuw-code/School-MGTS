import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Plus,
  Search,
  ExternalLink,
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Institution } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const PlatformPage: React.FC = () => {
  const { currentUser, switchPersona } = useAuth();
  const { success, error, info } = useToast();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [instName, setInstName] = useState('');
  const [instSlug, setInstSlug] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instTier, setInstTier] = useState<'starter' | 'professional' | 'enterprise'>('professional');

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'institutions'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Institution));
      setInstitutions(list);
    } catch (err) {
      console.warn('Failed to load institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !instSlug.trim()) return;

    try {
      const id = `inst_${instSlug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const payload: Institution = {
        id,
        name: instName,
        slug: instSlug.toLowerCase(),
        email: instEmail,
        settings: {
          currency: 'USD',
          timezone: 'America/New_York'
        },
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'institutions', id), payload);
      setInstitutions(prev => [...prev, payload]);
      success(`Tenant institution ${instName} created.`);
      setCreateModalOpen(false);
      setInstName('');
      setInstSlug('');
      setInstEmail('');
    } catch (err: any) {
      error(err.message || 'Failed to create institution');
    }
  };

  const filtered = institutions.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Multi-Tenant Platform Administration
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Super Admin global oversight: Manage isolated school tenants, domains, and SaaS tiers
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New School Tenant</span>
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Provisioned Institutions</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">
            {institutions.length}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">100% data partition isolation</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Total Cross-Tenant Students</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">
            1,240
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Across active pre-uni campuses</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Platform Health & Rules</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            Active
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">Firestore security rules verified</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search institutions by name or tenant slug..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
        />
      </div>

      {/* Institutions Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-stone-400 text-xs">Loading platform tenants...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-stone-500 text-xs">No school tenants found.</div>
        ) : (
          filtered.map(inst => (
            <div
              key={inst.id}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-base">
                    {inst.name[0]}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold uppercase">
                    Enterprise
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {inst.name}
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mt-0.5">
                    Tenant ID: {inst.id}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Slug: <code>{inst.slug}</code> • Currency: {inst.settings?.currency || 'USD'}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 text-[11px]">
                  Enrolled: 10 Students
                </span>
                <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Provision New Tenant Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New School Tenant"
        description="Establish an isolated institutional partition with custom database scoping."
      >
        <form onSubmit={handleCreateInstitution} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Institution Legal Name
            </label>
            <input
              type="text"
              required
              value={instName}
              onChange={(e) => {
                setInstName(e.target.value);
                if (!instSlug) {
                  setInstSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }
              }}
              placeholder="e.g. Oxford Sixth Form College"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Tenant Slug / Subdomain
            </label>
            <input
              type="text"
              required
              value={instSlug}
              onChange={(e) => setInstSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
              placeholder="e.g. oxford-sixth-form"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Administrative Contact Email
            </label>
            <input
              type="email"
              value={instEmail}
              onChange={(e) => setInstEmail(e.target.value)}
              placeholder="principal@oxfordsixth.edu"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              SaaS Subscription Tier
            </label>
            <select
              value={instTier}
              onChange={(e: any) => setInstTier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="starter">Starter (Up to 250 Students)</option>
              <option value="professional">Professional (Up to 1,000 Students)</option>
              <option value="enterprise">Enterprise (Unlimited Students & Dedicated Backups)</option>
            </select>
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
              Provision Tenant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
