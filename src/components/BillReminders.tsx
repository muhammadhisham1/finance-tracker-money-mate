import React, { useState, useEffect } from 'react';
import { Plus, X, Bell, BellRing, Trash2, Edit2, Check, AlertTriangle, Calendar } from 'lucide-react';
import { BillReminder, Frequency, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function BillReminders() {
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BillReminder | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [category, setCategory] = useState('');
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<Frequency>('monthly');
  const { showToast } = useToast();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    const { data } = await supabase.from('bill_reminders').select('*').order('due_date', { ascending: true });
    if (data) setBills(data as BillReminder[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const data = {
      name,
      amount: parseFloat(amount),
      due_date: dueDate,
      currency,
      category,
      reminder_days: parseInt(reminderDays) || 3,
      notes,
      recurring,
      recurring_frequency: recurring ? recurringFrequency : null,
    };

    if (editing) {
      await supabase.from('bill_reminders').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
      showToast('Bill updated', 'success');
    } else {
      await supabase.from('bill_reminders').insert([data]);
      showToast('Bill added', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchBills();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setDueDate('');
    setCurrency('USD');
    setCategory('');
    setReminderDays('3');
    setNotes('');
    setRecurring(false);
    setRecurringFrequency('monthly');
    setEditing(null);
  };

  const handleMarkPaid = async (bill: BillReminder) => {
    await supabase.from('bill_reminders').update({ is_paid: true }).eq('id', bill.id);
    showToast('Marked as paid', 'success');
    fetchBills();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('bill_reminders').delete().eq('id', id);
    showToast('Deleted', 'success');
    fetchBills();
  };

  const getBillStatus = (bill: BillReminder) => {
    if (bill.is_paid) return 'paid';
    const today = new Date();
    const due = new Date(bill.due_date);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff <= bill.reminder_days) return 'due-soon';
    return 'upcoming';
  };

  const statusColors = {
    paid: 'bg-emerald-500/20 text-emerald-400',
    overdue: 'bg-rose-500/20 text-rose-400',
    'due-soon': 'bg-amber-500/20 text-amber-400',
    upcoming: 'bg-gray-500/20 text-gray-400'
  };

  const statusLabels = {
    paid: 'Paid',
    overdue: 'Overdue',
    'due-soon': 'Due Soon',
    upcoming: 'Upcoming'
  };

  const upcoming = bills.filter(b => !b.is_paid && getBillStatus(b) !== 'overdue');
  const overdue = bills.filter(b => getBillStatus(b) === 'overdue');
  const paid = bills.filter(b => b.is_paid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bill Reminders</h2>
          <p className="text-sm text-gray-400">Track your bills and payments</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Bill
        </button>
      </div>

      {overdue.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span className="font-semibold text-rose-400">Overdue Payments</span>
          </div>
          <div className="space-y-2">
            {overdue.map(bill => (
              <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{bill.name}</p>
                  <p className="text-sm text-gray-400">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 font-semibold">{CURRENCY_SYMBOLS[bill.currency] || '$'}{bill.amount.toFixed(2)}</span>
                  <button onClick={() => handleMarkPaid(bill)} className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No bill reminders</p>
          <p className="text-sm text-gray-500 mt-1">Add bills to track payments</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {[{ label: 'Upcoming', bills: upcoming }, { label: 'Paid', bills: paid }].map(section => (
            section.bills.length > 0 && (
              <div key={section.label}>
                <h3 className="text-sm font-medium text-gray-400 mb-2">{section.label}</h3>
                <div className="space-y-2">
                  {section.bills.map(bill => {
                    const status = getBillStatus(bill);
                    return (
                      <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${status === 'paid' ? 'bg-emerald-500/20' : status === 'due-soon' ? 'bg-amber-500/20' : 'bg-gray-700/50'}`}>
                            {status === 'due-soon' ? <BellRing className="w-5 h-5 text-amber-400" /> : <Bell className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="font-medium text-white">{bill.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-400">
                              <span className={`px-2 py-0.5 rounded ${statusColors[status]}`}>{statusLabels[status]}</span>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(bill.due_date).toLocaleDateString()}</span>
                              {bill.recurring && <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-xs">Recurring</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-white">{CURRENCY_SYMBOLS[bill.currency] || '$'}{bill.amount.toFixed(2)}</span>
                          {!bill.is_paid && (
                            <button onClick={() => handleMarkPaid(bill)} className="p-2 rounded-lg hover:bg-emerald-500/20 text-emerald-400">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => { setEditing(bill); setName(bill.name); setAmount(bill.amount.toString()); setDueDate(bill.due_date); setCurrency(bill.currency || 'USD'); setCategory(bill.category || ''); setReminderDays(bill.reminder_days.toString()); setNotes(bill.notes || ''); setRecurring(bill.recurring || false); setRecurringFrequency(bill.recurring_frequency || 'monthly'); setIsModalOpen(true); }} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(bill.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'Add'} Bill Reminder</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Amount *</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Bill Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Electricity, Rent" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Due Date *</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Remind Days Before</label>
                  <input type="number" value={reminderDays} onChange={e => setReminderDays(e.target.value)} placeholder="3" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <input type="checkbox" id="recurring" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-gray-700" />
                <label htmlFor="recurring" className="text-sm text-gray-300">Recurring bill</label>
                {recurring && (
                  <select value={recurringFrequency} onChange={e => setRecurringFrequency(e.target.value as Frequency)} className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editing ? 'Update' : 'Add'} Reminder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
