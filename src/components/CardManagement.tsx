import React, { useState, useEffect } from 'react';
import { Plus, X, CreditCard, Trash2, Edit2, Eye, EyeOff, AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown, Shield, AlertCircle } from 'lucide-react';
import { Card, CARD_BRANDS, CARD_COLORS, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { luhnCheck, getCardType, validateCardExpiry, getVerificationStatusColor, maskCardNumber } from '../lib/verification';

export function CardManagement() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [name, setName] = useState('');
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [cardNumber, setCardNumber] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [notes, setNotes] = useState('');
  const [showNumber, setShowNumber] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
    if (data) setCards(data as Card[]);
  };

  const formatCardNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (formatted.replace(/\s/g, '').length >= 4) {
      setLastFour(formatted.replace(/\s/g, '').slice(-4));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cardNumber) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const digits = cardNumber.replace(/\s/g, '');
    setValidationError(null);

    // Luhn validation
    if (!luhnCheck(digits)) {
      setValidationError('Invalid card number - Luhn check failed');
      showToast('Invalid card number', 'error');
      return;
    }

    // Expiry validation
    if (expiryMonth && expiryYear) {
      const expiryResult = validateCardExpiry(parseInt(expiryMonth), parseInt(expiryYear));
      if (!expiryResult.valid) {
        setValidationError(expiryResult.error || 'Invalid expiry date');
        showToast(expiryResult.error || 'Invalid expiry date', 'error');
        return;
      }
    }

    // Detect card brand if not set
    const detectedBrand = cardBrand || getCardType(digits);
    const masked = maskCardNumber(digits);

    const data = {
      name,
      card_type: cardType,
      masked_number: masked,
      last_four: digits.slice(-4),
      card_brand: detectedBrand || null,
      expiry_month: expiryMonth ? parseInt(expiryMonth) : null,
      expiry_year: expiryYear ? parseInt(expiryYear) : null,
      card_holder_name: cardHolderName || null,
      bank_name: bankName || null,
      credit_limit: cardType === 'credit' && creditLimit ? parseFloat(creditLimit) : null,
      current_balance: parseFloat(currentBalance) || 0,
      color,
      notes: notes || null,
    };

    if (editing) {
      await supabase.from('cards').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editing.id);
      showToast('Card updated', 'success');
    } else {
      await supabase.from('cards').insert([data]);
      showToast('Card added', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchCards();
  };

  const resetForm = () => {
    setName('');
    setCardType('debit');
    setCardNumber('');
    setLastFour('');
    setCardBrand('');
    setExpiryMonth('');
    setExpiryYear('');
    setCardHolderName('');
    setBankName('');
    setCreditLimit('');
    setCurrentBalance('');
    setColor('#06b6d4');
    setNotes('');
    setEditing(null);
    setValidationError(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('cards').delete().eq('id', id);
    showToast('Card deleted', 'success');
    fetchCards();
  };

  const handleToggleActive = async (card: Card) => {
    await supabase.from('cards').update({ is_active: !card.is_active }).eq('id', card.id);
    showToast(card.is_active ? 'Card deactivated' : 'Card activated', 'success');
    fetchCards();
  };

  const getExpiryStatus = (card: Card) => {
    if (!card.expiry_month || !card.expiry_year) return null;
    const now = new Date();
    const expiry = new Date(card.expiry_year, card.expiry_month);
    const monthsUntilExpiry = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (monthsUntilExpiry < 0) return 'expired';
    if (monthsUntilExpiry <= 3) return 'expiring_soon';
    return 'valid';
  };

  const totalBalance = cards.filter(c => c.is_active).reduce((sum, c) => sum + c.current_balance, 0);
  const totalCreditUsed = cards.filter(c => c.card_type === 'credit' && c.is_active).reduce((sum, c) => {
    if (c.credit_limit) return sum + c.current_balance;
    return sum;
  }, 0);
  const totalCreditAvailable = cards.filter(c => c.card_type === 'credit' && c.is_active).reduce((sum, c) => {
    if (c.credit_limit) return sum + (c.credit_limit - c.current_balance);
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Card Management</h2>
          <p className="text-sm text-gray-400">Track your debit and credit cards</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all">
          <Plus className="w-5 h-5" />
          Add Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No cards added</p>
          <p className="text-sm text-gray-500 mt-1">Add your cards to track spending</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/30">
              <p className="text-sm text-cyan-400">Total Cards</p>
              <p className="text-2xl font-bold text-white mt-1">{cards.filter(c => c.is_active).length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30">
              <p className="text-sm text-emerald-400">Total Balance</p>
              <p className="text-2xl font-bold text-white mt-1">${totalBalance.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 rounded-xl p-4 border border-rose-500/30">
              <p className="text-sm text-rose-400">Credit Used</p>
              <p className="text-2xl font-bold text-white mt-1">${totalCreditUsed.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
              <p className="text-sm text-amber-400">Credit Available</p>
              <p className="text-2xl font-bold text-white mt-1">${totalCreditAvailable.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(card => {
              const expiryStatus = getExpiryStatus(card);
              const creditUsage = card.credit_limit ? (card.current_balance / card.credit_limit) * 100 : 0;

              return (
                <div key={card.id} className={`relative rounded-2xl p-5 ${card.is_active ? '' : 'opacity-60'}`} style={{ background: `linear-gradient(135deg, ${card.color}dd, ${card.color}88)` }}>
                  {!card.is_active && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/30 rounded text-xs text-white">Inactive</div>
                  )}
                  {expiryStatus === 'expired' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-rose-500/80 rounded text-xs text-white flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Expired
                    </div>
                  )}
                  {expiryStatus === 'expiring_soon' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500/80 rounded text-xs text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expiring Soon
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-white/80 text-sm">{card.bank_name || 'Bank'}</p>
                      <p className="text-white font-medium text-lg">{card.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/80 bg-white/20 px-2 py-1 rounded">{card.card_type}</span>
                      {card.card_brand && <span className="text-white text-xs">{card.card_brand}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-white/50" />
                      <span className="text-white tracking-wider font-mono">{card.masked_number}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-xs">CARD HOLDER</p>
                      <p className="text-white font-medium">{card.card_holder_name || 'Not set'}</p>
                    </div>
                    {card.expiry_month && card.expiry_year && (
                      <div className="text-right">
                        <p className="text-white/60 text-xs">EXPIRES</p>
                        <p className="text-white font-medium">{String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}</p>
                      </div>
                    )}
                  </div>

                  {card.card_type === 'credit' && card.credit_limit && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex justify-between text-sm text-white/80 mb-1">
                        <span>Credit Used</span>
                        <span>${card.current_balance.toFixed(2)} / ${card.credit_limit.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(creditUsage, 100)}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
                    <button onClick={() => handleToggleActive(card)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                      {card.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditing(card); setName(card.name); setCardType(card.card_type); setCardNumber(card.masked_number.replace(/\*/g, '0')); setLastFour(card.last_four); setCardBrand(card.card_brand || ''); setExpiryMonth(card.expiry_month?.toString() || ''); setExpiryYear(card.expiry_year?.toString() || ''); setCardHolderName(card.card_holder_name || ''); setBankName(card.bank_name || ''); setCreditLimit(card.credit_limit?.toString() || ''); setCurrentBalance(card.current_balance.toString()); setColor(card.color); setNotes(card.notes || ''); setIsModalOpen(true); }} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(card.id)} className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/50 text-white">
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
              <h3 className="text-lg font-semibold text-white">{editing ? 'Edit' : 'Add'} Card</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setCardType('debit')} className={`py-3 rounded-xl border transition-all ${cardType === 'debit' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-gray-800/50 border-gray-700/50 text-gray-400'}`}>
                  Debit Card
                </button>
                <button type="button" onClick={() => setCardType('credit')} className={`py-3 rounded-xl border transition-all ${cardType === 'credit' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-gray-800/50 border-gray-700/50 text-gray-400'}`}>
                  Credit Card
                </button>
              </div>

              <div>
                <label className="text-sm text-gray-400">Card Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Main Card" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" required />
              </div>

              <div>
                <label className="text-sm text-gray-400">Card Number *</label>
                <div className="relative">
                  <input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="1234 5678 9012 3456" maxLength={19} className={`w-full mt-1 px-4 py-3 bg-gray-800 rounded-xl text-white font-mono focus:outline-none ${validationError ? 'border border-rose-500' : 'border border-gray-700 focus:border-cyan-500'}`} required />
                  <button type="button" onClick={() => setShowNumber(!showNumber)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showNumber ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {cardNumber.replace(/\s/g, '').length >= 13 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Detected: <span className="text-cyan-400">{getCardType(cardNumber.replace(/\s/g, ''))}</span>
                    {luhnCheck(cardNumber.replace(/\s/g, '')) ? (
                      <span className="ml-2 text-emerald-400 flex items-center gap-1 inline"><CheckCircle className="w-3 h-3" /> Valid</span>
                    ) : (
                      <span className="ml-2 text-rose-400 flex items-center gap-1 inline"><AlertCircle className="w-3 h-3" /> Invalid</span>
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Card Brand</label>
                  <select value={cardBrand} onChange={e => setCardBrand(e.target.value)} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    <option value="">Select</option>
                    {CARD_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Bank Name</label>
                  <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Card Holder Name</label>
                <input type="text" value={cardHolderName} onChange={e => setCardHolderName(e.target.value)} placeholder="JOHN DOE" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white uppercase focus:outline-none focus:border-cyan-500" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Expiry Month</label>
                  <input type="number" value={expiryMonth} onChange={e => setExpiryMonth(e.target.value)} placeholder="01" min={1} max={12} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Expiry Year</label>
                  <input type="number" value={expiryYear} onChange={e => setExpiryYear(e.target.value)} placeholder="25" min={24} max={99} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">CVV</label>
                  <input type="password" placeholder="***" maxLength={4} className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
              </div>

              {cardType === 'credit' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Credit Limit</label>
                    <input type="number" step="0.01" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="0.00" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Current Balance</label>
                    <input type="number" step="0.01" value={currentBalance} onChange={e => setCurrentBalance(e.target.value)} placeholder="0.00" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Card Color</label>
                <div className="flex gap-2">
                  {CARD_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Notes</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
              </div>

              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editing ? 'Update' : 'Add'} Card
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
