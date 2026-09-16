import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Download,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  ArrowRight
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useInstitution } from '../context/InstitutionContext';
import { StudentInvoice, PaymentRecord, Student } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

export const FinancePage: React.FC = () => {
  const { currentUser, isAdmin, isStaff, institution } = useAuth();
  const { currentTerm } = useInstitution();
  const { success, error, info } = useToast();

  const instId = currentUser?.institution_id;
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Recording Modal
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<StudentInvoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'card' | 'cash' | 'cheque'>('bank_transfer');
  const [payReference, setPayReference] = useState('');

  // Printable Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  const fetchFinance = async () => {
    if (!instId) return;
    setLoading(true);
    try {
      // 1. Invoices
      const invSnap = await getDocs(query(collection(db, 'student_invoices'), where('institution_id', '==', instId)));
      const invList = invSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentInvoice));
      setInvoices(invList);

      // 2. Students
      const stSnap = await getDocs(query(collection(db, 'students'), where('institution_id', '==', instId)));
      const sMap: Record<string, Student> = {};
      stSnap.forEach(d => {
        sMap[d.id] = { id: d.id, ...d.data() } as Student;
      });
      setStudentsMap(sMap);
    } catch (err) {
      console.warn('Finance data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, [instId]);

  // Aggregate stats
  const totalBilled = invoices.reduce((acc, i) => acc + (i.total_amount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.amount_paid || 0), 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + (i.balance || 0), 0);
  const collectionPercentage = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  const filteredInvoices = invoices.filter(inv => {
    const student = studentsMap[inv.student_id];
    const sName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
    const adm = student?.admission_no?.toLowerCase() || '';
    const matchesSearch = sName.includes(searchQuery.toLowerCase()) || adm.includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPayment = (inv: StudentInvoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.balance);
    setPayReference(`REF-${Date.now().toString().slice(-6)}`);
    setRecordPaymentModal(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instId || !selectedInvoice || payAmount <= 0) return;

    try {
      const payId = `pay_${Date.now()}`;
      const newPaid = (selectedInvoice.amount_paid || 0) + Number(payAmount);
      const newBalance = Math.max(0, selectedInvoice.total_amount - newPaid);
      const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';

      // 1. Create Payment Record
      const paymentRecord: PaymentRecord = {
        id: payId,
        institution_id: instId,
        invoice_id: selectedInvoice.id,
        amount: Number(payAmount),
        payment_method: payMethod,
        reference_no: payReference || `REF-${Date.now().toString().slice(-6)}`,
        recorded_by: currentUser?.uid || 'bursar',
        payment_date: new Date().toISOString()
      };
      await setDoc(doc(db, 'payments', payId), paymentRecord);

      // 2. Update Student Invoice
      await updateDoc(doc(db, 'student_invoices', selectedInvoice.id), {
        amount_paid: newPaid,
        balance: newBalance,
        status: newStatus
      });

      // Update state
      setInvoices(prev =>
        prev.map(i => (i.id === selectedInvoice.id ? { ...i, amount_paid: newPaid, balance: newBalance, status: newStatus } : i))
      );

      success(`Payment of $${payAmount} recorded successfully.`);
      setRecordPaymentModal(false);

      // Open printable receipt
      const student = studentsMap[selectedInvoice.student_id];
      setActiveReceipt({
        receiptNo: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString(),
        studentName: student ? `${student.first_name} ${student.last_name}` : 'Student',
        admissionNo: student?.admission_no || 'STU-2024-001',
        amount: payAmount,
        method: payMethod.replace('_', ' ').toUpperCase(),
        reference: payReference,
        remainingBalance: newBalance,
        invoiceId: selectedInvoice.id
      });
      setReceiptModalOpen(true);
    } catch (err: any) {
      error(err.message || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Finance & Fee Collection Portal
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Pre-University tuition billing, multi-item invoicing, payments and receipts
          </p>
        </div>
      </div>

      {/* Bursary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <p className="text-xs text-stone-500 font-medium">Total Term Billable</p>
          <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">
            ${totalBilled.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5">Across {invoices.length} issued invoices</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Total Collected</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ${totalCollected.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">{collectionPercentage}% collection progress</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-2xs">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Total Outstanding</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            ${totalOutstanding.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Receivable balances</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
          <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Payment Verification</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">100%</p>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">Instant ledger reconciliation</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice ID, student name, admission number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
        >
          <option value="">All Invoices</option>
          <option value="paid">Fully Paid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
                <th className="p-3.5">Invoice Ref</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Total Billed</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Balance</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">Loading billing invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-500">No invoices match selected criteria.</td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const st = studentsMap[inv.student_id];
                  return (
                    <tr key={inv.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                        #{inv.id}
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-stone-900 dark:text-stone-100">
                          {st ? `${st.first_name} ${st.last_name}` : inv.student_id}
                        </p>
                        <p className="text-[11px] font-mono text-stone-500">{st?.admission_no}</p>
                      </td>
                      <td className="p-3.5 font-mono text-stone-600 dark:text-stone-400">{inv.due_date}</td>
                      <td className="p-3.5 text-right font-mono font-semibold">${inv.total_amount.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono text-emerald-600 font-semibold">${inv.amount_paid.toLocaleString()}</td>
                      <td className="p-3.5 text-right font-mono text-amber-600 font-bold">${inv.balance.toLocaleString()}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.status === 'partially_paid'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {inv.balance > 0 ? (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordPaymentModal}
        onClose={() => setRecordPaymentModal(false)}
        title="Record Fee Settlement Payment"
        description={`Allocate incoming payment to invoice #${selectedInvoice?.id}.`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex justify-between">
            <div>
              <p className="text-stone-400">Current Outstanding Balance</p>
              <p className="text-lg font-black text-amber-600 mt-0.5 font-mono">
                ${selectedInvoice?.balance.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-stone-400">Total Billed</p>
              <p className="text-lg font-black text-stone-900 dark:text-stone-100 mt-0.5 font-mono">
                ${selectedInvoice?.total_amount.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Payment Amount ($)
            </label>
            <input
              type="number"
              min={1}
              max={selectedInvoice?.balance}
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-base font-bold font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e: any) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="bank_transfer">Electronic Bank Wire / Transfer</option>
              <option value="card">Credit / Debit Card</option>
              <option value="cheque">Certified Banker's Cheque</option>
              <option value="cash">Cash Settlement (Bursary Desk)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Bank / Gateway Reference Number
            </label>
            <input
              type="text"
              required
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-700">
            <button
              type="button"
              onClick={() => setRecordPaymentModal(false)}
              className="px-4 py-2 text-stone-500 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Confirm & Generate Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Payment Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        maxWidth="lg"
        title="Official Bursary Receipt"
      >
        {activeReceipt && (
          <div className="p-6 bg-white text-stone-900 rounded-lg space-y-6 print:p-0">
            <div className="flex items-start justify-between border-b-2 border-stone-900 pb-3">
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight text-stone-900">
                  {institution?.name || 'St. Jude Pre-University College'}
                </h3>
                <p className="text-xs text-stone-600">Bursar & Finance Directorate</p>
                <p className="text-xs font-mono text-emerald-700 font-bold mt-1">OFFICIAL RECEIPT: {activeReceipt.receiptNo}</p>
              </div>
              <div className="w-10 h-10 rounded-lg border-2 border-stone-900 flex items-center justify-center font-black">
                Ω
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Date Received:</span>
                <span className="font-semibold">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Student Name:</span>
                <span className="font-bold">{activeReceipt.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Admission No:</span>
                <span className="font-mono">{activeReceipt.admissionNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Payment Channel:</span>
                <span className="font-semibold">{activeReceipt.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-500">Transaction Reference:</span>
                <span className="font-mono">{activeReceipt.reference}</span>
              </div>
              <div className="flex justify-between py-2 border-b-2 border-stone-900 text-sm font-bold">
                <span>Amount Paid:</span>
                <span className="text-emerald-700 font-mono">${activeReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-stone-600">
                <span>Remaining Invoice Balance:</span>
                <span className="font-mono font-bold text-stone-900">${activeReceipt.remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white font-bold text-xs shadow-xs hover:bg-black"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
