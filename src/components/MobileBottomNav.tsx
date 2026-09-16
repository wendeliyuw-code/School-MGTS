import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  CheckSquare,
  MessageSquare,
  Receipt,
  ListTodo,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const MobileBottomNav: React.FC = () => {
  const { role } = useAuth();
  const userRole: UserRole = role || 'ADMIN';

  // Define top 4 destinations depending on role
  let items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Students', icon: GraduationCap },
    { to: '/academics/grading', label: 'Grades', icon: Award },
    { to: '/attendance', label: 'Attendance', icon: CheckSquare }
  ];

  if (userRole === 'SUPER_ADMIN') {
    items = [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/platform', label: 'Institutions', icon: Building },
      { to: '/settings/users', label: 'Admins', icon: GraduationCap },
      { to: '/announcements', label: 'Notices', icon: MessageSquare }
    ];
  } else if (userRole === 'TEACHER') {
    items = [
      { to: '/dashboard', label: 'Classes', icon: LayoutDashboard },
      { to: '/attendance', label: 'Attendance', icon: CheckSquare },
      { to: '/academics/grading', label: 'Marks', icon: Award },
      { to: '/messages', label: 'Messages', icon: MessageSquare }
    ];
  } else if (userRole === 'STUDENT') {
    items = [
      { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/academics/grading', label: 'Scores', icon: Award },
      { to: '/attendance', label: 'Attendance', icon: CheckSquare },
      { to: '/messages', label: 'Chat', icon: MessageSquare }
    ];
  } else if (userRole === 'GUARDIAN') {
    items = [
      { to: '/dashboard', label: 'Child', icon: LayoutDashboard },
      { to: '/academics/grading', label: 'Report', icon: Award },
      { to: '/finance', label: 'Invoices', icon: Receipt },
      { to: '/messages', label: 'Teachers', icon: MessageSquare }
    ];
  } else if (userRole === 'STAFF') {
    items = [
      { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/finance', label: 'Finance', icon: Receipt },
      { to: '/tasks', label: 'Tasks', icon: ListTodo },
      { to: '/announcements', label: 'Notices', icon: MessageSquare }
    ];
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 flex items-center justify-around h-16 px-2 shadow-lg">
      {items.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 text-[11px] font-medium transition ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
