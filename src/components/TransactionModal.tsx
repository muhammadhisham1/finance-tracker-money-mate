import React, { useState, useEffect } from 'react';
import { X, Plus, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Transaction, TransactionType, Category, Currency, Bank, PaymentMethod, INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_LABELS, CURRENCIES, BANKS, PAYMENT_METHODS, CURRENCY_SYMBOLS } from '../types';
import { useToast } from '../context/ToastContext';
import { expandAbbreviation, formatNumberWithCommas, numberToWords, detectAbbreviation } from '../lib/verification';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  editingTransaction?: Transaction | null;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string;
  currency: Currency;
  bank: Bank | null;
  bank_other: string | null;
  payment_method: PaymentMethod | null;
  payment_method_other: string | null;
}

export function TransactionModal({ isOpen, onClose, onSubmit, editingTransaction }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [bank, setBank] = useState<Bank | ''>('');
  const [bankOther, setBankOther] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentMethodOther, setPaymentMethodOther] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [parsedAmount, setParsedAmount] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      const amt = editingTransaction.amount.toString();
      setAmount(amt);
      setAmountDisplay(formatNumberWithCommas(editingTransaction.amount));
      setParsedAmount(editingTransaction.amount);
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description || '');
      setDate(editingTransaction.date);
      setCurrency(editingTransaction.currency || 'USD');
      setBank(editingTransaction.bank || '');
      setBankOther(editingTransaction.bank_other || '');
      setPaymentMethod(editingTransaction.payment_method || '');
      setPaymentMethodOther(editingTransaction.payment_method_other || '');
    } else {
      setType('expense');
      setAmount('');
      setAmountDisplay('');
      setParsedAmount(null);
      setCategory('food');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCurrency('USD');
      setBank('');
      setBankOther('');
      setPaymentMethod('');
      setPaymentMethodOther('');
    }
  }, [editingTransaction, isOpen]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [type, categories, category]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const parsed = expandAbbreviation(value);
    if (parsed !== null && !isNaN(parsed) && parsed > 0) {
      setParsedAmount(parsed);
      setAmountDisplay(formatNumberWithCommas(parsed));
    } else {
      setParsedAmount(null);
      setAmountDisplay('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parsedAmount || parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      showToast('Please enter a valid amount (e.g., 100, 1M, 5L, 2Cr)', 'error');
      return;
    }
    if (bank === 'Other' && !bankOther.trim()) {
      showToast('Please describe the bank', 'error');
      return;
    }
    if (paymentMethod === 'Other' && !paymentMethodOther.trim()) {
      showToast('Please describe the payment method', 'error');
      return;
    }
    onSubmit({
      type,
      amount: amountNum,
      category,
      description,
      date,
      currency,
      bank: bank || null,
      bank_other: bank === 'Other' ? bankOther.trim() : null,
      payment_method: paymentMethod || null,
      payment_method_other: paymentMethod === 'Other' ? paymentMethodOther.trim() : null,
    });
    showToast(editingTransaction ? 'Transaction updated' : 'Transaction added', 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-900 z-10">
          <h2 className="text-xl font-semibold text-white">
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              Expense
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder="100 or 1M or 5L"
                  className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              {parsedAmount !== null && parsedAmount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="text-cyan-400 font-medium">{amountDisplay}</p>
                    <p className="text-gray-500 mt-0.5">{numberToWords(parsedAmount)}</p>
                    {detectAbbreviation(amount) && (
                      <p className="text-gray-400 mt-0.5">Detected: {detectAbbreviation(amount)}</p>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-600">Supports: K, M, B, T, L (Lakh), Cr (Crore), Ar (Arab)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c} ({CURRENCY_SYMBOLS[c]})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">Bank</label>
            <select
              value={bank}
              onChange={e => setBank(e.target.value as Bank | '')}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">Select bank (optional)</option>
              {BANKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {bank === 'Other' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-sm text-cyan-400">Please describe the bank</label>
              <input
                type="text"
                value={bankOther}
                onChange={e => setBankOther(e.target.value)}
                placeholder="Please describe..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod | '')}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="">Select method (optional)</option>
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {paymentMethod === 'Other' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-sm text-cyan-400">Please describe the payment method</label>
              <input
                type="text"
                value={paymentMethodOther}
                onChange={e => setPaymentMethodOther(e.target.value)}
                placeholder="Please describe..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-400">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/25"
          >
            <Plus className="w-5 h-5" />
            {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
