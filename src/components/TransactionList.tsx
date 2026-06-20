import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Edit2, Trash2, X, Building2, CreditCard, Coins } from 'lucide-react';
import { Transaction, CATEGORY_LABELS, CATEGORY_COLORS, Category, TransactionType, CURRENCY_SYMBOLS, Currency } from '../types';
import { useToast } from '../context/ToastContext';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast } = useToast();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
        CATEGORY_LABELS[t.category].toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, search, typeFilter, categoryFilter]);

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
    showToast('Transaction deleted', 'success');
  };

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredTransactions]);

  const formatAmount = (transaction: Transaction) => {
    const symbol = CURRENCY_SYMBOLS[transaction.currency as Currency] || '$';
    return `${symbol}${Number(transaction.amount).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
            showFilters
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-gray-600'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filters</span>
          {(typeFilter !== 'all' || categoryFilter !== 'all') && (
            <span className="flex items-center justify-center w-5 h-5 text-xs bg-cyan-500 rounded-full text-gray-900">
              !
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 animate-fade-in">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TransactionType | 'all')}
              className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as Category | 'all')}
              className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          {(typeFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
              }}
              className="flex items-center gap-1 px-3 py-2 mt-5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No transactions found</p>
            <p className="text-sm mt-1">Add your first transaction to get started</p>
          </div>
        ) : (
          sortedTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="group flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2.5 rounded-lg ${
                    transaction.type === 'income' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                  }`}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-rose-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{transaction.description || CATEGORY_LABELS[transaction.category]}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[transaction.category]}20`,
                          color: CATEGORY_COLORS[transaction.category],
                        }}
                      >
                        {CATEGORY_LABELS[transaction.category]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {transaction.currency && (
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {transaction.currency}
                        </span>
                      )}
                      {transaction.bank && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {transaction.bank === 'Other' ? transaction.bank_other : transaction.bank}
                        </span>
                      )}
                      {transaction.payment_method && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {transaction.payment_method === 'Other' ? transaction.payment_method_other : transaction.payment_method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-lg font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatAmount(transaction)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {deleteConfirm === transaction.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="px-2 py-1 text-xs bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs bg-gray-700/50 text-gray-400 rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(transaction.id)}
                      className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
