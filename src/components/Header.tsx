import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Moon,
  Sun,
  LogOut,
  UserCheck,
  ChevronDown,
  RefreshCw,
  Building2,
  Bell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import { UserRole } from '../types';
import { DEMO_PERSONAS, seedDemoDatabase } from '../lib/seedDemoData';
import { useToast } from './Toast';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar, onOpenSearch }) => {
  const { currentUser, role, institution, signOut, switchPersona, darkMode, toggleDarkMode } = useAuth();
  const { currentYear, currentTerm, refreshConfig } = useInstitution();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handlePersonaChange = async (newRole: UserRole) => {
    setPersonaMenuOpen(false);
    await switchPersona(newRole);
    success(`Switched role to ${newRole}`);
    navigate('/dashboard');
  };

  const handleReseed = async () => {
    setSeeding(true);
    const res = await seedDemoDatabase(true);
    if (res.success) {
      success(res.message);
      await refreshConfig();
    } else {
      error(res.message);
    }
    setSeeding(false);
  };

  const roleColors: Record<UserRole, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    TEACHER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    STUDENT: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    GUARDIAN: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    STAFF: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Mobile Menu Button & Institution Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {institution?.code ? institution.code.slice(0, 2) : 'PU'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate max-w-[200px] xl:max-w-xs">
                  {institution?.name || 'EduSphere Multi-Tenant'}
                </span>
                {institution?.code && (
                  <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                    {institution.code}
                  </span>
                )}
              </div>
              {currentYear && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {currentYear.name} • {currentTerm?.name || 'Active Term'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-1.5 text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span>Search students, staff, classes, invoices...</span>
          </div>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 text-stone-500 dark:text-stone-300 border border-stone-200 dark:border-stone-600">
            Ctrl K
          </kbd>
        </button>

        {/* Right Side: Demo Persona Switcher, Dark Mode, Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPersonaMenuOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition ${
                role ? roleColors[role] : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title="Switch demo role instantly"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Role:</span>
              <span>{role || 'Role'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {personaMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPersonaMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 mb-1">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Switch Demo Role
                    </p>
                    <p className="text-[11px] text-stone-500">Test the entire system from any user role</p>
                  </div>
                  <div className="space-y-1">
                    {DEMO_PERSONAS.map(p => (
                      <button
                        key={p.role}
                        onClick={() => handlePersonaChange(p.role)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition flex flex-col ${
                          role === p.role
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{p.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${roleColors[p.role]}`}>
                            {p.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                          {p.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Seed / Reset Data Button */}
          <button
            onClick={handleReseed}
            disabled={seeding}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
            title="Reload / Reset Demo Data"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Public Landing Shortcut */}
          <Link
            to="/"
            className="hidden sm:flex text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            Public Site
          </Link>
        </div>
      </div>
    </header>
  );
};
