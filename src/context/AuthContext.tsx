import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, Institution } from '../types';
import { DEMO_PERSONAS, DEMO_INSTITUTION_ID, seedDemoDatabase } from '../lib/seedDemoData';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  institution: Institution | null;
  loading: boolean;
  role: UserRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isGuardian: boolean;
  isStaff: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role: UserRole, institutionId: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateInstitutionInfo: (updated: Partial<Institution>) => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_dark') === 'true';
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme_dark', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load user profile from firestore or local persona
  const fetchInstitution = async (instId: string) => {
    if (!instId) {
      setInstitution(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'institutions', instId));
      if (snap.exists()) {
        setInstitution(snap.data() as Institution);
      }
    } catch (err) {
      console.warn('Failed to load institution:', err);
    }
  };

  const fetchUserProfile = async (uid: string) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const u = userSnap.data() as UserProfile;
        setCurrentUser(u);
        if (u.institution_id) {
          await fetchInstitution(u.institution_id);
        }
        return u;
      }
    } catch (err) {
      console.warn('Failed to load user profile doc:', err);
    }
    return null;
  };

  // Check saved persona or Firebase auth
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check local persona storage first (for rapid testing & demo switching)
      const savedPersona = localStorage.getItem('edusphere_demo_persona');
      if (savedPersona) {
        const found = DEMO_PERSONAS.find(p => p.role === savedPersona);
        if (found) {
          const profile: UserProfile = {
            uid: found.uid,
            institution_id: found.institution_id,
            email: found.email,
            role: found.role,
            display_name: found.name,
            is_active: true,
            email_verified: true,
            last_login: new Date().toISOString()
          };
          setCurrentUser(profile);
          if (found.institution_id) {
            await fetchInstitution(found.institution_id);
          }
          setLoading(false);
          return;
        }
      }

      // 2. Otherwise listen to Firebase auth
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const u = await fetchUserProfile(fbUser.uid);
          if (!u) {
            // Default user profile if doc doesn't exist yet
            const fallback: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              role: 'ADMIN',
              institution_id: DEMO_INSTITUTION_ID,
              display_name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Administrator',
              is_active: true,
              email_verified: fbUser.emailVerified
            };
            setCurrentUser(fallback);
            await fetchInstitution(DEMO_INSTITUTION_ID);
          }
        } else {
          // If no user logged in, default to School Admin demo persona for immediate rich view
          const defaultAdmin = DEMO_PERSONAS.find(p => p.role === 'ADMIN')!;
          const profile: UserProfile = {
            uid: defaultAdmin.uid,
            institution_id: defaultAdmin.institution_id,
            email: defaultAdmin.email,
            role: defaultAdmin.role,
            display_name: defaultAdmin.name,
            is_active: true,
            email_verified: true,
            last_login: new Date().toISOString()
          };
          setCurrentUser(profile);
          localStorage.setItem('edusphere_demo_persona', 'ADMIN');
          await fetchInstitution(defaultAdmin.institution_id);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    initAuth();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      localStorage.removeItem('edusphere_demo_persona');
      await fetchUserProfile(cred.user.uid);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string, role: UserRole, institutionId: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        institution_id: institutionId,
        email,
        role,
        display_name: name,
        is_active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      setCurrentUser(newProfile);
      await fetchInstitution(institutionId);
      localStorage.removeItem('edusphere_demo_persona');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('edusphere_demo_persona');
      await fbSignOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      setInstitution(null);
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const persona = DEMO_PERSONAS.find(p => p.role === targetRole);
      if (!persona) return;

      // Ensure demo data is seeded
      await seedDemoDatabase(false);

      const profile: UserProfile = {
        uid: persona.uid,
        institution_id: persona.institution_id,
        email: persona.email,
        role: persona.role,
        display_name: persona.name,
        is_active: true,
        email_verified: true,
        last_login: new Date().toISOString()
      };

      localStorage.setItem('edusphere_demo_persona', targetRole);
      setCurrentUser(profile);
      if (persona.institution_id) {
        await fetchInstitution(persona.institution_id);
      } else {
        setInstitution(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (currentUser?.uid) {
      await fetchUserProfile(currentUser.uid);
    }
  };

  const updateInstitutionInfo = async (updated: Partial<Institution>) => {
    if (!institution?.id) return;
    const ref = doc(db, 'institutions', institution.id);
    await updateDoc(ref, { ...updated, updated_at: new Date().toISOString() });
    setInstitution(prev => (prev ? { ...prev, ...updated } : null));
  };

  const role = currentUser?.role || null;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';
  const isStudent = role === 'STUDENT';
  const isGuardian = role === 'GUARDIAN';
  const isStaff = role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        institution,
        loading,
        role,
        isSuperAdmin,
        isAdmin,
        isTeacher,
        isStudent,
        isGuardian,
        isStaff,
        signIn,
        signUp,
        signOut,
        switchPersona,
        refreshUserProfile,
        updateInstitutionInfo,
        darkMode,
        toggleDarkMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
