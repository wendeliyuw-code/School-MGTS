import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Users,
  Receipt,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  School,
  FileSpreadsheet,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_PERSONAS } from '../lib/seedDemoData';
import { UserRole } from '../types';

export const LandingPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { switchPersona, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  const handleQuickEnter = async (role: UserRole) => {
    await switchPersona(role);
    navigate('/dashboard');
  };

  const features = [
    {
      title: 'Real-Time Attendance & Biometrics',
      desc: 'Mobile-first attendance tracking with one-tap statuses, swipe gestures, medical excuses, and instant guardian notifications.',
      icon: CheckCircle2
    },
    {
      title: 'Spreadsheet Mark Reporting',
      desc: 'Rapid keyboard-driven score entry (Tab/Enter), automated weighted GPA calculation, class rankings, and one-click printable report cards.',
      icon: FileSpreadsheet
    },
    {
      title: 'Bi-Directional Parent Communication',
      desc: 'Contextual message threads linked to specific students, file attachments for medical notes, read receipts, and escalation controls.',
      icon: MessageSquare
    },
    {
      title: 'Tuition Billing & Invoicing',
      desc: 'Per-term fee structures, student invoice tracking, partial payment receipts, and balance reporting for bursars.',
      icon: Receipt
    },
    {
      title: 'Multi-Tenant Architecture',
      desc: 'Isolated institution scoping, custom grade scales, academic year management, and rigorous Firestore security rules.',
      icon: ShieldCheck
    },
    {
      title: 'Executive Analytics & KPIs',
      desc: 'Longitudinal enrollment trends, daily attendance averages, and fee collection milestones in high-contrast data visualizers.',
      icon: BarChart3
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Register School & Academic Cycles',
      desc: 'Define your institution code, terms, grading scales, assessment weightings, and custom student fields.'
    },
    {
      step: '02',
      title: 'Enroll Students & Assign Faculty',
      desc: 'Bulk import or invite staff and student rosters. Link guardians and map teachers to specific cohort subjects.'
    },
    {
      step: '03',
      title: 'Record Marks & Daily Attendance',
      desc: 'Faculty manage attendance and assessment scores on desktop or tablet with automated grade computations.'
    },
    {
      step: '04',
      title: 'Empower Parents & Administration',
      desc: 'Guardians monitor performance and settle fees via self-service portals, while admins review audit logs.'
    }
  ];

  const testimonials = [
    {
      quote: "EduSphere revolutionized our sixth-form reporting cycle. Teachers enter examination marks in half the time, and our parents appreciate direct, transparent communication.",
      author: "Dr. Eleanor Vance",
      role: "Principal, St. Jude Pre-University College"
    },
    {
      quote: "The multi-tenant isolation and strict role permissions give our governors total confidence in data compliance and student safety.",
      author: "Julian Thorne",
      role: "Director of Academics, Clarendon Collegiate"
    }
  ];

  const pricingPlans = [
    {
      name: 'Community College',
      price: '$0',
      period: 'Forever free for single cohorts',
      features: ['Up to 150 enrolled students', 'Attendance tracking', 'Basic term reports', 'Standard email support'],
      cta: 'Get Started Free'
    },
    {
      name: 'Pre-University Standard',
      price: '$180',
      period: 'per month / institution',
      popular: true,
      features: ['Unlimited students & cohorts', 'Spreadsheet mark reporting', 'Parent-teacher messaging', 'Custom fields & branding', 'Invoice & payment logging', 'Priority faculty onboarding'],
      cta: 'Start 30-Day Trial'
    },
    {
      name: 'Multi-Campus Enterprise',
      price: 'Custom',
      period: 'Bespoke district licensing',
      features: ['Multi-institution governance', 'Custom API & SIS sync', 'Dedicated database instance', 'SLA 99.95% uptime guarantee', 'On-premise deployment options'],
      cta: 'Contact Sales'
    }
  ];

  const faqs = [
    {
      q: 'How does the multi-tenant architecture ensure data privacy?',
      a: 'Each institution operates under a strict, isolated institution_id. Firestore security rules enforce attribute-based access control (ABAC) on every document read and write, ensuring students, teachers, and admins only access their own school records.'
    },
    {
      q: 'Can our institution customize grading scales and assessment weightings?',
      a: 'Yes. Administrators can configure custom grade levels, letter grades (e.g. A*, A, B...), passing thresholds, and weighted continuous assessment types (e.g. 15% Homework, 25% Midterm, 60% Finals).'
    },
    {
      q: 'Is EduSphere mobile-friendly for teachers marking attendance in class?',
      a: 'EduSphere is engineered mobile-first. Teachers can easily mark attendance, record student observations, or respond to guardian messages on any mobile smartphone or tablet.'
    },
    {
      q: 'Can parents monitor multiple enrolled children under a single login?',
      a: 'Yes. Guardians with multiple children enrolled in the institution can toggle between their children seamlessly using the child selector on their portal dashboard.'
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              Ω
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-stone-900 dark:text-white">
                EduSphere
              </span>
              <span className="hidden sm:inline-block text-[11px] ml-2 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium">
                Pre-University SIS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">How It Works</a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition"
            >
              Enter Portal
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>

            <button
              onClick={() => setMobileNavOpen(prev => !prev)}
              className="md:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Collapse */}
        {mobileNavOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 py-1"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 py-1"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 py-1"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileNavOpen(false)}
              className="block text-sm font-medium text-stone-700 dark:text-stone-300 py-1"
            >
              FAQ
            </a>
            <Link
              to="/dashboard"
              onClick={() => setMobileNavOpen(false)}
              className="block w-full text-center py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm"
            >
              Launch College Portal
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Multi-Tenant Architecture for Pre-University & Sixth-Form Colleges</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Unified Academic Operations, Mark Reporting & Parent Engagement
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Engineered specifically for pre-university sixth forms, A-Level institutes, and preparatory academies. Complete data isolation, instant score entry, automated GPA calculations, and audit-grade financial controls.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Launch Demo Institution</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-base transition"
            >
              Request an Institution Demo
            </a>
          </div>

          {/* Quick Role Tester Bar */}
          <div className="mt-12 max-w-3xl mx-auto p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl text-left">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Instant Role Experience
                </p>
                <p className="text-[11px] text-stone-500">
                  Click any role to test its specific views, permissions, and dashboards immediately
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold">
                6 Roles Ready
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PERSONAS.map(p => (
                <button
                  key={p.role}
                  onClick={() => handleQuickEnter(p.role)}
                  className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-left transition group"
                >
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    {p.role}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-white dark:bg-stone-900/60 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              End-To-End Capability
            </h2>
            <p className="text-3xl font-extrabold text-stone-900 dark:text-white">
              Tailored for Rigorous Pre-University Education
            </p>
            <p className="mt-4 text-base text-stone-600 dark:text-stone-400">
              Every workflow has been crafted to match the demanding assessment schedules, multi-subject enrollments, and parent accountability required in pre-tertiary education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-900 transition duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Implementation Pathway
            </h2>
            <p className="text-3xl font-extrabold text-stone-900 dark:text-white">
              From School Registration to Live Term Reporting in Four Steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs relative"
              >
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400/80 font-mono">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-3 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-stone-100 dark:bg-stone-900/40 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
                <p className="text-base italic text-stone-700 dark:text-stone-300 leading-relaxed mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{t.author}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Plans */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Transparent Pricing
            </h2>
            <p className="text-3xl font-extrabold text-stone-900 dark:text-white">
              Predictable Plans for Single Colleges and Multi-Academy Trusts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-2xl border flex flex-col justify-between ${
                  plan.popular
                    ? 'bg-white dark:bg-stone-900 border-indigo-600 dark:border-indigo-500 shadow-xl relative ring-1 ring-indigo-600 dark:ring-indigo-500'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold px-3 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-stone-900 dark:text-white">{plan.price}</span>
                    <span className="text-xs text-stone-500">{plan.period}</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-stone-600 dark:text-stone-300">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Link
                    to="/dashboard"
                    className={`block w-full py-2.5 rounded-lg text-center text-xs font-semibold transition ${
                      plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-16 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-2xl font-extrabold text-stone-900 dark:text-white">
              Everything You Need to Know About EduSphere
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between font-semibold text-sm text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed border-t border-stone-100 dark:border-stone-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-12 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs">Ω</div>
              <span>EduSphere Pre-University SIS</span>
            </div>
            <p className="text-stone-400 text-xs max-w-md leading-relaxed">
              A complete multi-tenant School Management System designed for sixth form colleges, pre-university academies, and high-performance secondary institutions worldwide.
            </p>
            <p className="text-stone-500 text-[11px]">
              Cambridge Academic District • Tel: +44 1223 908123 • info@edusphere.io
            </p>
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Product</p>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition">Features & Modules</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">Workflow & Onboarding</a></li>
              <li><a href="#pricing" className="hover:text-white transition">Plans & Licensing</a></li>
              <li><Link to="/dashboard" className="hover:text-white transition">Live Demo Sandbox</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-white text-xs mb-3 uppercase tracking-wider">Legal & Compliance</p>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">FERPA & GDPR Compliance</a></li>
              <li><a href="#" className="hover:text-white transition">Security Architecture</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-stone-800 text-center text-stone-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} EduSphere Multi-Tenant Systems. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Powered by Firebase & Google Cloud Run</span>
            <span>•</span>
            <button onClick={toggleDarkMode} className="hover:text-white">
              {darkMode ? 'Light Theme' : 'Dark Theme'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
