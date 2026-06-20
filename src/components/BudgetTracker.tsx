import React, { useState, useMemo } from 'react';
import { Edit2, X } from 'lucide-react';
import { Transaction, Budget, Category, CATEGORY_COLORS, CATEGORY_LABELS, EXPENSE_CATEGORIES } from '../types';
import { useToast } from '../context/ToastContext';

interface BudgetTrackerProps {
  transactions: Transaction[];
  budgets: Budget[];
  onUpdateBudget: (category: Category, amount: number) => void;
}

export function BudgetTracker({ transactions, budgets, onUpdateBudget }: BudgetTrackerProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const { showToast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const spendingByCategory = useMemo(() => {
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return (
        t.type === 'expense' &&
        date.getMonth() + 1 === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

    return currentMonthTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<Category, number>);
  }, [transactions, currentMonth, currentYear]);

  const budgetMap = useMemo(() => {
    return budgets.reduce((acc, b) => {
      acc[b.category] = b.limit_amount;
      return acc;
    }, {} as Record<Category, number>);
  }, [budgets]);

  const handleSaveBudget = (category: Category) => {
    const amount = parseFloat(editAmount);
    if (amount <= 0 || isNaN(amount)) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    onUpdateBudget(category, amount);
    setEditingCategory(null);
    setEditAmount('');
    showToast('Budget updated', 'success');
  };

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4">
        Monthly Budgets - {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
      </h3>
      <div className="space-y-4">
        {EXPENSE_CATEGORIES.map(category => {
          const spent = spendingByCategory[category] || 0;
          const budget = budgetMap[category] || 500;
          const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const isOverBudget = spent > budget;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[category] }}
                  />
                  <span className="text-sm text-gray-300">{CATEGORY_LABELS[category]}</span>
                </div>
                {editingCategory === category ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      placeholder={budget.toString()}
                      className="w-24 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveBudget(category)}
                      className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1 hover:bg-gray-700 rounded text-gray-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${isOverBudget ? 'text-rose-400' : 'text-gray-400'}`}>
                      ${spent.toFixed(0)} / ${budget}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setEditAmount(budget.toString());
                      }}
                      className="p-1 opacity-0 hover:opacity-100 hover:bg-gray-700 rounded text-gray-400 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {isOverBudget && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  Over budget by ${(spent - budget).toFixed(2)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
