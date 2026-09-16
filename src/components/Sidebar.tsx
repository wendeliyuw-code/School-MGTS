import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Award,
  CheckSquare,
  Receipt,
  MessageSquare,
  ListTodo,
  Megaphone,
  Settings,
  ShieldAlert,
  Building,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'STAFF']
  },
  {
    to: '/platform',
    label: 'Platform Institutions',
    icon: Building,
    allowedRoles: ['SUPER_ADMIN']
  },
  {
    to: '/students',
    label: 'Students',
    icon: GraduationCap,
    allowedRoles: ['ADMIN', 'TEACHER', 'STAFF', 'SUPER_ADMIN']
  },
  {
    to: '/staff',
    label: 'Staff & Faculty',
    icon: Users,
    allowedRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    to: '/academics/classes',
    label: 'Classes & Cohorts',
    icon: BookOpen,
    allowedRoles: ['ADMIN', 'TEACHER', 'SUPER_ADMIN']
  },
  {
    to: '/academics/timetable',
    label: 'Timetable',
    icon: CalendarDays,
    allowedRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'SUPER_ADMIN']
  },
  {
    to: '/academics/grading',
    label: 'Mark Entry & Scores',
    icon: Award,
    allowedRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'SUPER_ADMIN']
  },
  {
    to: '/attendance',
    label: 'Attendance',
    icon: CheckSquare,
    allowedRoles: ['ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'GUARDIAN', 'SUPER_ADMIN']
  },
  {
    to: '/finance',
    label: 'Finance & Fees',
    icon: Receipt,
    allowedRoles: ['ADMIN', 'STAFF', 'STUDENT', 'GUARDIAN', 'SUPER_ADMIN']
  },
  {
    to: '/messages',
    label: 'Communication',
    icon: MessageSquare,
    allowedRoles: ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'SUPER_ADMIN']
  },
  {
    to: '/tasks',
    label: 'Task Assignment',
    icon: ListTodo,
    allowedRoles: ['ADMIN', 'TEACHER', 'STAFF', 'SUPER_ADMIN']
  },
  {
    to: '/announcements',
    label: 'Announcements',
    icon: Megaphone,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'STAFF']
  },
  {
    to: '/settings/users',
    label: 'User Management',
    icon: ShieldAlert,
    allowedRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    to: '/settings/institution',
    label: 'School Settings',
    icon: Settings,
    allowedRoles: ['ADMIN', 'SUPER_ADMIN']
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { currentUser, role, signOut, institution } = useAuth();
  const location = useLocation();

  const userRole = role || 'ADMIN';
  const filteredNav = navItems.filter(item => item.allowedRoles.includes(userRole));

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar (Desktop) / Slide-in Drawer (Mobile) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-stone-900 text-stone-200 border-r border-stone-800 transition-transform duration-200 ease-in-out flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              Ω
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">
                EduSphere Pre-U
              </span>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                {userRole === 'SUPER_ADMIN' ? 'Platform HQ' : 'College Portal'}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="p-3 mx-3 my-2.5 rounded-xl bg-stone-800/80 border border-stone-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser?.display_name ? currentUser.display_name.slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.display_name || 'User'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-stone-400 font-mono">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info & sign out */}
        <div className="p-3 border-t border-stone-800 text-xs text-stone-400 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-stone-500">
              v2.5 • Multi-Tenant
            </span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition"
              title="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
