import React, { useState, useEffect } from 'react';
import { Plus, X, Tv, Trash2, Edit2, Bell, ToggleLeft, ToggleRight, Calendar, DollarSign } from 'lucide-react';
import { Subscription, SUBSCRIPTION_CATEGORIES, BillingCycle, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function SubscriptionsTracker() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [category, setCategory] = useState('Streaming');
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('next_billing_date', { ascending: true });
    if (data) setSubscriptions(data as Subscription[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !nextBillingDate) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const data = {
      name,
      amount: parseFloat(amount),
      currency,
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate,
      category,
      reminder_days: parseInt(reminderDays) || 3,
      notes: notes || null,
    };

    if (editing) {
      await supabase.from('subscriptions').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
      showToast('Subscription updated', 'success');
    } else {
      await supabase.from('subscriptions').insert([data]);
      showToast('Subscription added', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchSubscriptions();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setCurrency('USD');
    setBillingCycle('monthly');
    setNextBillingDate('');
    setCategory('Streaming');
    setReminderDays('3');
    setNotes('');
    setEditing(null);
  };

  const handleToggle = async (sub: Subscription) => {
    await supabase.from('subscriptions').update({ is_active: !sub.is_active }).eq('id', sub.id);
    showToast(sub.is_active ? 'Paused' : 'Resumed', 'success');
    fetchSubscriptions();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('subscriptions').delete().eq('id', id);
    showToast('Deleted', 'success');
    fetchSubscriptions();
  };

  const monthlyCost = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => {
      if (s.billing_cycle === 'monthly') return sum + s.amount;
      if (s.billing_cycle === 'yearly') return sum + s.amount / 12;
      if (s.billing_cycle === 'weekly') return sum + s.amount * 4.33;
      return sum;
    }, 0);

  const yearlyCost = subscriptions
    .filter(s => s.is_active)
    .reduce((sum, s) => {
      if (s.billing_cycle === 'monthly') return sum + s.amount * 12;
      if (s.billing_cycle === 'yearly') return sum + s.amount;
      if (s.billing_cycle === 'weekly') return sum + s.amount * 52;
      return sum;
    }, 0);

  const cycleLabels: Record<BillingCycle, string> = { weekly: '/week', monthly: '/mo', yearly: '/yr' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Subscriptions</h2>
          <p className="text-sm text-gray-400">Track recurring subscriptions and memberships</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all">
          <Plus className="w-5 h-5" />
          Add Subscription
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <Tv className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No subscriptions tracked</p>
          <p className="text-sm text-gray-500 mt-1">Add subscriptions to see your recurring costs</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/30">
              <p className="text-sm text-cyan-400">Monthly Cost</p>
              <p className="text-2xl font-bold text-white mt-1">${monthlyCost.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
              <p className="text-sm text-purple-400">Yearly Cost</p>
              <p className="text-2xl font-bold text-white mt-1">${yearlyCost.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold text-white mt-1">{subscriptions.filter(s => s.is_active).length}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <p className="text-sm text-gray-400">Paused</p>
              <p className="text-2xl font-bold text-white mt-1">{subscriptions.filter(s => !s.is_active).length}</p>
            </div>
          </div>

          <div className="space-y-2">
            {subscriptions.map(sub => (
              <div key={sub.id} className={`flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border ${sub.is_active ? 'border-gray-700/50' : 'border-gray-700/30 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-gray-700/50">
                    <Tv className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{sub.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-400">
                      <span className="px-2 py-0.5 rounded bg-gray-700/50">{sub.category}</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(sub.next_billing_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">{CURRENCY_SYMBOLS[sub.currency] || '$'}{sub.amount.toFixed(2)}<span className="text-sm text-gray-400">{cycleLabels[sub.billing_cycle]}</span></p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(sub)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400">
                      {sub.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => { setEditing(sub); setName(sub.name); setAmount(sub.amount.toString()); setCurrency(sub.currency || 'USD'); setBillingCycle(sub.billing_cycle); setNextBillingDate(sub.next_billing_date); setCategory(sub.category); setReminderDays(sub.reminder_days?.toString() || '3'); setNotes(sub.notes || ''); setIsModalOpen(true); }} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(sub.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'Add'} Subscription</h3>
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
                <label className="text-sm text-gray-400">Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Netflix, Spotify" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Billing Cycle *</label>
                  <select value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    {SUBSCRIPTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Next Billing *</label>
                  <input type="date" value={nextBillingDate} onChange={e => setNextBillingDate(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Remind (days before)</label>
                  <input type="number" value={reminderDays} onChange={e => setReminderDays(e.target.value)} placeholder="3" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editing ? 'Update' : 'Add'} Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
