import React, { useState, useEffect } from 'react';
import { Plus, X, RefreshCw, Trash2, Edit2, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import { RecurringTransaction, Frequency, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_LABELS, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function RecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [nextDate, setNextDate] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    const { data } = await supabase.from('recurring_transactions').select('*').order('next_date', { ascending: true });
    if (data) setRecurring(data as RecurringTransaction[]);
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !nextDate || !category) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const data = {
      name,
      amount: parseFloat(amount),
      type,
      category,
      description,
      currency,
      frequency,
      next_date: nextDate,
    };

    if (editing) {
      await supabase.from('recurring_transactions').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
      showToast('Recurring transaction updated', 'success');
    } else {
      await supabase.from('recurring_transactions').insert([data]);
      showToast('Recurring transaction created', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchRecurring();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setType('expense');
    setCategory('');
    setDescription('');
    setCurrency('USD');
    setFrequency('monthly');
    setNextDate('');
    setEditing(null);
  };

  const handleToggle = async (item: RecurringTransaction) => {
    await supabase.from('recurring_transactions').update({ is_active: !item.is_active }).eq('id', item.id);
    showToast(item.is_active ? 'Paused' : 'Resumed', 'success');
    fetchRecurring();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('recurring_transactions').delete().eq('id', id);
    showToast('Deleted', 'success');
    fetchRecurring();
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditing(item);
    setName(item.name);
    setAmount(item.amount.toString());
    setType(item.type);
    setCategory(item.category);
    setDescription(item.description || '');
    setCurrency(item.currency || 'USD');
    setFrequency(item.frequency);
    setNextDate(item.next_date);
    setIsModalOpen(true);
  };

  const frequencyLabels: Record<Frequency, string> = {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Recurring Transactions</h2>
          <p className="text-sm text-gray-400">Automate your regular income and expenses</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Recurring
        </button>
      </div>

      {recurring.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <RefreshCw className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No recurring transactions</p>
          <p className="text-sm text-gray-500 mt-1">Add recurring income or expenses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurring.map(item => (
            <div key={item.id} className={`flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border ${item.is_active ? 'border-gray-700/50' : 'border-gray-700/30 opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${item.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                  <RefreshCw className={`w-5 h-5 ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`} />
                </div>
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-gray-700/50">{frequencyLabels[item.frequency]}</span>
                    <span>•</span>
                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.next_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-semibold ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.type === 'income' ? '+' : '-'}{CURRENCY_SYMBOLS[item.currency] || '$'}{item.amount.toFixed(2)}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(item)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400">
                    {item.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'New'} Recurring Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setType('income')} className={`py-3 rounded-xl border transition-all ${type === 'income' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-gray-800/50 border-gray-700/50 text-gray-400'}`}>
                  Income
                </button>
                <button type="button" onClick={() => setType('expense')} className={`py-3 rounded-xl border transition-all ${type === 'expense' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-gray-800/50 border-gray-700/50 text-gray-400'}`}>
                  Expense
                </button>
              </div>

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
                <label className="text-sm text-gray-400">Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Rent, Salary" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Category *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required>
                    <option value="">Select</option>
                    {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Frequency *</label>
                  <select value={frequency} onChange={e => setFrequency(e.target.value as Frequency)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    {Object.entries(frequencyLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Next Date *</label>
                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
              </div>

              <div>
                <label className="text-sm text-gray-400">Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional note" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editing ? 'Update' : 'Create'} Recurring
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
