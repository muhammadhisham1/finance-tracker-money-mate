import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, Trash2, Edit2, CheckCircle, XCircle, Clock, AlertTriangle, Shield } from 'lucide-react';
import { Cheque, ChequeStatus, CURRENCIES, CURRENCY_SYMBOLS, Currency, VerificationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { validateChequeNumber, validateAmount, getVerificationStatusColor } from '../lib/verification';

export function ChequeManagement() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cheque | null>(null);
  const [chequeNumber, setChequeNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [bankName, setBankName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<ChequeStatus>('pending');
  const [payeeName, setPayeeName] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateDetected, setDuplicateDetected] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCheques();
  }, []);

  const fetchCheques = async () => {
    const { data } = await supabase.from('cheques').select('*').order('issue_date', { ascending: false });
    if (data) setCheques(data as Cheque[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chequeNumber || !amount || !issueDate) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setValidationError(null);
    setDuplicateDetected(false);

    // Validate cheque number
    const numberValidation = validateChequeNumber(chequeNumber);
    if (!numberValidation.valid) {
      setValidationError(numberValidation.error || 'Invalid cheque number');
      showToast(numberValidation.error || 'Invalid cheque number', 'error');
      return;
    }

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      setValidationError(amountValidation.error || 'Invalid amount');
      showToast(amountValidation.error || 'Invalid amount', 'error');
      return;
    }

    // Check for duplicate cheque number
    const isDuplicate = cheques.some(c => c.cheque_number === chequeNumber && c.id !== editing?.id);
    if (isDuplicate) {
      setDuplicateDetected(true);
      setValidationError('Duplicate cheque number detected');
      showToast('Warning: Duplicate cheque number', 'warning');
      // Still allow user to proceed but mark as unverified
    }

    const data = {
      cheque_number: chequeNumber,
      amount: parseFloat(amount),
      currency,
      bank_name: bankName || null,
      issue_date: issueDate,
      due_date: dueDate || null,
      status,
      payee_name: payeeName || null,
      notes: notes || null,
      verification_status: isDuplicate ? 'unverified' : 'verified',
    };

    if (editing) {
      await supabase.from('cheques').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
      showToast('Cheque updated', 'success');
    } else {
      await supabase.from('cheques').insert([data]);
      showToast('Cheque added', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchCheques();
  };

  const resetForm = () => {
    setChequeNumber('');
    setAmount('');
    setCurrency('USD');
    setBankName('');
    setIssueDate('');
    setDueDate('');
    setStatus('pending');
    setPayeeName('');
    setNotes('');
    setEditing(null);
    setValidationError(null);
    setDuplicateDetected(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cheques').delete().eq('id', id);
    showToast('Cheque deleted', 'success');
    fetchCheques();
  };

  const handleStatusChange = async (id: string, newStatus: ChequeStatus) => {
    await supabase.from('cheques').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    showToast('Status updated', 'success');
    fetchCheques();
  };

  const statusConfig: Record<ChequeStatus, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
    pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    cleared: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    bounced: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/20' },
  };

  const statuses: ChequeStatus[] = ['pending', 'cleared', 'cancelled', 'bounced'];
  const groupedCheques = statuses.reduce((acc, s) => {
    acc[s] = cheques.filter(c => c.status === s);
    return acc;
  }, {} as Record<ChequeStatus, Cheque[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Cheque Management</h2>
          <p className="text-sm text-gray-400">Track issued and received cheques</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all">
          <Plus className="w-5 h-5" />
          Add Cheque
        </button>
      </div>

      {cheques.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No cheques tracked</p>
          <p className="text-sm text-gray-500 mt-1">Add cheques to manage them</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {statuses.map(s => {
            const config = statusConfig[s];
            const chequesInGroup = groupedCheques[s];
            if (chequesInGroup.length === 0) return null;
            const Icon = config.icon;

            return (
              <div key={s} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <h3 className="font-medium text-white capitalize">{s} ({chequesInGroup.length})</h3>
                </div>
                {chequesInGroup.map(cheque => (
                  <div key={cheque.id} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 relative">
                    {cheque.verification_status && (
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getVerificationStatusColor(cheque.verification_status as VerificationStatus)}`}>
                        <Shield className="w-3 h-3" />
                        {cheque.verification_status}
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Cheque #{cheque.cheque_number}</p>
                        <p className="font-semibold text-white">{CURRENCY_SYMBOLS[cheque.currency] || '$'}{cheque.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditing(cheque); setChequeNumber(cheque.cheque_number); setAmount(cheque.amount.toString()); setCurrency(cheque.currency || 'USD'); setBankName(cheque.bank_name || ''); setIssueDate(cheque.issue_date); setDueDate(cheque.due_date || ''); setStatus(cheque.status); setPayeeName(cheque.payee_name || ''); setNotes(cheque.notes || ''); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cheque.id)} className="p-1.5 rounded hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>Issued: {new Date(cheque.issue_date).toLocaleDateString()}</span>
                      {cheque.due_date && <span>Due: {new Date(cheque.due_date).toLocaleDateString()}</span>}
                      {cheque.bank_name && <span>Bank: {cheque.bank_name}</span>}
                      {cheque.payee_name && <span>Payee: {cheque.payee_name}</span>}
                    </div>
                    {s === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-700/50">
                        <button onClick={() => handleStatusChange(cheque.id, 'cleared')} className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30">
                          Mark Cleared
                        </button>
                        <button onClick={() => handleStatusChange(cheque.id, 'bounced')} className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30">
                          Mark Bounced
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'Add'} Cheque</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Cheque Number *</label>
                  <input type="text" value={chequeNumber} onChange={e => setChequeNumber(e.target.value)} placeholder="001234" className={`w-full mt-1 px-4 py-3 bg-gray-800 rounded-xl text-white focus:outline-none ${validationError && !chequeNumber ? 'border border-rose-500' : 'border border-gray-700 focus:border-cyan-500'}`} required />
                  {chequeNumber && (
                    <p className="text-xs mt-1">
                      {(() => {
                        const result = validateChequeNumber(chequeNumber);
                        return result.valid ? (
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid format</span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {result.error}</span>
                        );
                      })()}
                    </p>
                  )}
                  {duplicateDetected && (
                    <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Duplicate detected
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-400">Amount *</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value as ChequeStatus)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    {statuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Bank Name</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Optional" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Issue Date *</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Payee Name</label>
                <input type="text" value={payeeName} onChange={e => setPayeeName(e.target.value)} placeholder="Who is this cheque for?" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label className="text-sm text-gray-400">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editing ? 'Update' : 'Add'} Cheque
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
