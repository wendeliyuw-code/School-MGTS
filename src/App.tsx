import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InstitutionProvider } from './context/InstitutionContext';
import { ToastProvider } from './components/Toast';
import { AppLayout } from './components/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { StaffPage } from './pages/StaffPage';
import { ClassesPage } from './pages/ClassesPage';
import { TimetablePage } from './pages/TimetablePage';
import { AttendancePage } from './pages/AttendancePage';
import { GradingPage } from './pages/GradingPage';
import { FinancePage } from './pages/FinancePage';
import { MessagesPage } from './pages/MessagesPage';
import { TasksPage } from './pages/TasksPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlatformPage } from './pages/PlatformPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <InstitutionProvider>
            <Routes>
              {/* Public Marketing / Login Portal */}
              <Route path="/" element={<LandingPage />} />

              {/* Main Authenticated Application Layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/classes" element={<ClassesPage />} />
                <Route path="/timetable" element={<TimetablePage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/grading" element={<GradingPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/users" element={<UsersManagementPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/platform" element={<PlatformPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </InstitutionProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
