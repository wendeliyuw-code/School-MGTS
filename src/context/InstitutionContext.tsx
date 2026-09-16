import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  AcademicYear,
  Term,
  GradeLevel,
  Subject,
  ClassRoom,
  AssessmentType
} from '../types';

interface InstitutionContextType {
  academicYears: AcademicYear[];
  currentYear: AcademicYear | null;
  terms: Term[];
  currentTerm: Term | null;
  gradeLevels: GradeLevel[];
  subjects: Subject[];
  classes: ClassRoom[];
  assessmentTypes: AssessmentType[];
  refreshConfig: () => Promise<void>;
  loading: boolean;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export const InstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const instId = currentUser?.institution_id;

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAll = async () => {
    if (!instId) {
      setAcademicYears([]);
      setCurrentYear(null);
      setTerms([]);
      setCurrentTerm(null);
      setGradeLevels([]);
      setSubjects([]);
      setClasses([]);
      setAssessmentTypes([]);
      setLoading(false);
      return;
    }

    try {
      // Academic Years
      const aySnap = await getDocs(query(collection(db, 'academic_years'), where('institution_id', '==', instId)));
      const ays = aySnap.docs.map(d => ({ id: d.id, ...d.data() } as AcademicYear));
      setAcademicYears(ays);
      const currY = ays.find(y => y.is_current) || ays[0] || null;
      setCurrentYear(currY);

      // Terms
      const termSnap = await getDocs(query(collection(db, 'terms'), where('institution_id', '==', instId)));
      const ts = termSnap.docs.map(d => ({ id: d.id, ...d.data() } as Term));
      setTerms(ts);
      const currT = ts.find(t => t.is_current) || ts[0] || null;
      setCurrentTerm(currT);

      // Grade Levels
      const glSnap = await getDocs(query(collection(db, 'grade_levels'), where('institution_id', '==', instId)));
      const gls = glSnap.docs.map(d => ({ id: d.id, ...d.data() } as GradeLevel));
      gls.sort((a, b) => a.sort_order - b.sort_order);
      setGradeLevels(gls);

      // Subjects
      const subjSnap = await getDocs(query(collection(db, 'subjects'), where('institution_id', '==', instId)));
      const subjs = subjSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
      setSubjects(subjs);

      // Classes
      const clsSnap = await getDocs(query(collection(db, 'classes'), where('institution_id', '==', instId)));
      const cls = clsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassRoom));
      setClasses(cls);

      // Assessment Types
      const atSnap = await getDocs(query(collection(db, 'assessment_types'), where('institution_id', '==', instId)));
      const ats = atSnap.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentType));
      setAssessmentTypes(ats);
    } catch (err) {
      console.warn('Failed to load institution config collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [instId]);

  return (
    <InstitutionContext.Provider
      value={{
        academicYears,
        currentYear,
        terms,
        currentTerm,
        gradeLevels,
        subjects,
        classes,
        assessmentTypes,
        refreshConfig: fetchAll,
        loading
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = (): InstitutionContextType => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
};
