import React, { useState, useEffect } from 'react';
import { Plus, X, Target, Home, Car, Plane, GraduationCap, Laptop, Gift, Heart, Star, Rocket, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { SavingsGoal, SAVINGS_GOAL_ICONS, SAVINGS_GOAL_COLORS, CURRENCIES, CURRENCY_SYMBOLS, Currency } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target, home: Home, car: Car, plane: Plane, graduation: GraduationCap,
  laptop: Laptop, gift: Gift, heart: Heart, star: Star, rocket: Rocket
};

interface SavingsGoalsProps {
  onProgress?: () => void;
}

export function SavingsGoals({ onProgress }: SavingsGoalsProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [selectedColor, setSelectedColor] = useState('#06b6d4');
  const [addAmount, setAddAmount] = useState('');
  const [addingToGoal, setAddingToGoal] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false });
    if (data) setGoals(data as SavingsGoal[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    const goalData = {
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      target_date: targetDate || null,
      icon: selectedIcon,
      color: selectedColor,
    };

    if (editingGoal) {
      await supabase.from('savings_goals').update({ ...goalData, updated_at: new Date().toISOString() }).eq('id', editingGoal.id);
      showToast('Goal updated', 'success');
    } else {
      await supabase.from('savings_goals').insert([goalData]);
      showToast('Goal created', 'success');
    }

    setIsModalOpen(false);
    resetForm();
    fetchGoals();
    onProgress?.();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id);
    showToast('Goal deleted', 'success');
    fetchGoals();
  };

  const handleAddToGoal = async () => {
    if (!addingToGoal || !addAmount) return;
    const goal = goals.find(g => g.id === addingToGoal);
    if (!goal) return;

    const newAmount = goal.current_amount + parseFloat(addAmount);
    await supabase.from('savings_goals').update({ current_amount: newAmount, updated_at: new Date().toISOString() }).eq('id', addingToGoal);

    if (newAmount >= goal.target_amount) {
      showToast('Congratulations! Goal achieved!', 'success');
    } else {
      showToast('Progress saved', 'success');
    }

    setAddingToGoal(null);
    setAddAmount('');
    fetchGoals();
    onProgress?.();
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setSelectedIcon('target');
    setSelectedColor('#06b6d4');
    setEditingGoal(null);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setTargetDate(goal.target_date || '');
    setSelectedIcon(goal.icon);
    setSelectedColor(goal.color);
    setIsModalOpen(true);
  };

  const getProgress = (goal: SavingsGoal) => Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const getRemaining = (goal: SavingsGoal) => Math.max(goal.target_amount - goal.current_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Savings Goals</h2>
          <p className="text-sm text-gray-400">Track your progress towards financial goals</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No savings goals yet</p>
          <p className="text-sm text-gray-500 mt-1">Create a goal to start saving</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map(goal => {
            const Icon = iconMap[goal.icon] || Target;
            const progress = getProgress(goal);
            const isComplete = progress >= 100;

            return (
              <div key={goal.id} className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-5 hover:bg-gray-800/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${goal.color}20` }}>
                      <Icon className="w-6 h-6" style={{ color: goal.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{goal.name}</h3>
                      {goal.target_date && (
                        <p className="text-xs text-gray-400">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(goal)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, backgroundColor: isComplete ? '#10b981' : goal.color }}
                    />
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-400">Saved</p>
                      <p className="text-lg font-bold text-white">${goal.current_amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Target</p>
                      <p className="text-lg font-bold text-gray-300">${goal.target_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  {!isComplete && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <span className="text-sm text-gray-400">
                        ${getRemaining(goal).toFixed(2)} more needed
                      </span>
                      <button
                        onClick={() => setAddingToGoal(goal.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Add Funds
                      </button>
                    </div>
                  )}
                  {isComplete && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-emerald-500/20 rounded-lg">
                      <Star className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Goal Achieved!</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Funds Modal */}
      {addingToGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddingToGoal(null)} />
          <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add to Savings</h3>
            <div className="space-y-4">
              <input
                type="number"
                step="0.01"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                placeholder="Amount to add"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex gap-3">
                <button onClick={() => setAddingToGoal(null)} className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700">
                  Cancel
                </button>
                <button onClick={handleAddToGoal} className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600">
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-700/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Goal Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., New Phone, Vacation"
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Target Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Current Saved</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Target Date (optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full mt-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {SAVINGS_GOAL_ICONS.map(icon => {
                    const I = iconMap[icon] || Target;
                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={`p-3 rounded-xl border transition-colors ${selectedIcon === icon ? 'border-cyan-500 bg-cyan-500/20' : 'border-gray-700 hover:border-gray-600'}`}
                      >
                        <I className="w-5 h-5 text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {SAVINGS_GOAL_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-cyan-500">
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
