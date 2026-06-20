import React, { useState, useEffect } from 'react';
import { Plus, X, Building2, Wallet, CreditCard, PiggyBank, TrendingUp, Trash2, Edit2, Star, StarOff, ArrowUpDown, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { BankAccount, BANK_ACCOUNT_TYPES, CURRENCIES, CURRENCY_SYMBOLS, Currency, VerificationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { validateIBAN, validateAccountNumber, getVerificationStatusColor } from '../lib/verification';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  building: Building2, wallet: Wallet, card: CreditCard, piggy: PiggyBank, trending: TrendingUp
};

export function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [name, setName] = useState('');
  const [bankType, setBankType] = useState<string>('checking');
  const [bankOther, setBankOther] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [color, setColor] = useState('#06b6d4');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateDetected, setDuplicateDetected] = useState(false);
  const { showToast } = useToast();

  const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#f97316', '#6366f1'];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('bank_accounts').select('*').order('is_default', { ascending: false });
    if (data) setAccounts(data as BankAccount[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bankType) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setValidationError(null);

    // Validate account number if provided
    if (accountNumber) {
      const accountValidation = validateAccountNumber(accountNumber);
      if (!accountValidation.valid) {
        setValidationError(accountValidation.error || 'Invalid account number');
        showToast(accountValidation.error || 'Invalid account number', 'error');
        return;
      }

      // Check for duplicate
      const isDuplicate = accounts.some(a => a.account_number === accountNumber && a.id !== editing?.id);
      if (isDuplicate) {
        setValidationError('Account number already exists');
        setDuplicateDetected(true);
        showToast('Deplicate account number detected', 'warning');
      }
    }

    const data = {
      name,
      bank_type: bankType,
      bank_other: bankType === 'other' ? bankOther : null,
      account_number: accountNumber || null,
      balance: parseFloat(balance) || 0,
      currency,
      color,
      verification_status: duplicateDetected ? 'pending' : 'verified',
    };

    if (editing) {
      await supabase.from('bank_accounts').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
      showToast('Account updated', 'success');
    } else {
      await supabase.from('bank_accounts').insert([data]);
      showToast('Account added', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchAccounts();
  };

  const resetForm = () => {
    setName('');
    setBankType('checking');
    setBankOther('');
    setAccountNumber('');
    setBalance('');
    setCurrency('USD');
    setColor('#06b6d4');
    setEditing(null);
    setValidationError(null);
    setDuplicateDetected(false);
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from('bank_accounts').update({ is_default: false }).neq('id', id);
    await supabase.from('bank_accounts').update({ is_default: true }).eq('id', id);
    showToast('Default account set', 'success');
    fetchAccounts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('bank_accounts').delete().eq('id', id);
    showToast('Account deleted', 'success');
    fetchAccounts();
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const defaultAccount = accounts.find(a => a.is_default);
  const bankTypeLabel = (type: string) => BANK_ACCOUNT_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bank Accounts</h2>
          <p className="text-sm text-gray-400">Manage your accounts and wallets</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all">
          <Plus className="w-5 h-5" />
          Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No accounts added</p>
          <p className="text-sm text-gray-500 mt-1">Add your bank accounts to track balances</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/30">
              <p className="text-sm text-cyan-400">Total Balance</p>
              <p className="text-2xl font-bold text-white mt-1">{CURRENCY_SYMBOLS[defaultAccount?.currency || 'USD']}{totalBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map(account => {
              const Icon = iconMap[account.icon] || Building2;
              return (
                <div key={account.id} className={`relative p-4 bg-gray-800/30 rounded-xl border ${account.is_default ? 'border-cyan-500/50' : 'border-gray-700/50'} hover:bg-gray-800/50 transition-all`}>
                  {account.is_default && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-cyan-400">
                      <Star className="w-3 h-3" /> Default
                    </div>
                  )}
                  {account.verification_status && (
                    <div className={`absolute top-2 ${account.is_default ? 'right-20' : 'right-2'} px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getVerificationStatusColor(account.verification_status as VerificationStatus)}`}>
                      {account.verification_status === 'verified' && <CheckCircle className="w-3 h-3" />}
                      {account.verification_status === 'pending' && <Clock className="w-3 h-3" />}
                      {account.verification_status === 'unverified' && <AlertTriangle className="w-3 h-3" />}
                      {account.verification_status}
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${account.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: account.color }} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="text-xs text-gray-400">{bankTypeLabel(account.bank_type)}{account.bank_type === 'other' && ` (${account.bank_other})`}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white mb-2">
                    {CURRENCY_SYMBOLS[account.currency as Currency] || '$'}{account.balance.toFixed(2)}
                  </p>
                  {account.account_number && (
                    <p className="text-xs text-gray-500 mb-2">••••{account.account_number.slice(-4)}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
                    {!account.is_default && (
                      <button onClick={() => handleSetDefault(account.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400" title="Set as default">
                        <StarOff className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { setEditing(account); setName(account.name); setBankType(account.bank_type); setBankOther(account.bank_other || ''); setAccountNumber(account.account_number || ''); setBalance(account.balance.toString()); setCurrency(account.currency as Currency || 'USD'); setColor(account.color); setIsModalOpen(true); }} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(account.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'Add'} Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Account Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Checking" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Account Type *</label>
                  <select value={bankType} onChange={e => setBankType(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required>
                    {BANK_ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {bankType === 'other' && (
                <div>
                  <label className="text-sm text-gray-400">Please describe...</label>
                  <input type="text" value={bankOther} onChange={e => setBankOther(e.target.value)} placeholder="Please describe..." className="w-full mt-1 px-4 py-3 bg-gray-800 border border-cyan-500/50 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Current Balance</label>
                  <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Account Number</label>
                  <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Optional" className={`w-full mt-1 px-4 py-3 bg-gray-800 rounded-xl text-white focus:outline-none ${validationError ? 'border border-rose-500' : 'border border-gray-700 focus:border-cyan-500'}`} />
                  {accountNumber && (
                    <p className="text-xs mt-1">
                      {(() => {
                        const result = validateAccountNumber(accountNumber);
                        return result.valid ? (
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Valid format</span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {result.error}</span>
                        );
                      })()}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editing ? 'Update' : 'Add'} Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
