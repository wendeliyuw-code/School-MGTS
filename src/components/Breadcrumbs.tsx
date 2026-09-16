import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  staff: 'Staff & Faculty',
  academics: 'Academics',
  classes: 'Classes & Cohorts',
  timetable: 'Timetable',
  grading: 'Mark Reporting & Grades',
  attendance: 'Attendance',
  finance: 'Finance & Invoices',
  messages: 'Communication & Messages',
  tasks: 'Task Assignment',
  announcements: 'Announcements',
  settings: 'Settings',
  users: 'User Management',
  institution: 'Institution Configuration',
  platform: 'Super Admin Platform'
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-stone-500 dark:text-stone-400 mb-4 overflow-x-auto whitespace-nowrap">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-100 transition">
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {pathSegments.map((segment, index) => {
        const routeTo = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-stone-300 dark:text-stone-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-stone-800 dark:text-stone-200">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-stone-900 dark:hover:text-stone-100 transition">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
