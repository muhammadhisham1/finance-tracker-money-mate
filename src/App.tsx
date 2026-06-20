import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, LayoutDashboard, List, PiggyBank, Plus, Moon, Trash2, X, Target, RefreshCw, Bell, Building2, FileText, Tv, Trophy, Scan as ScanIcon, LogOut, ChevronDown, CreditCard, FolderOpen, Shield, BellRing } from 'lucide-react';
import { supabase } from './lib/supabase';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionModal, TransactionFormData } from './components/TransactionModal';
import { BudgetTracker } from './components/BudgetTracker';
import { SavingsGoals } from './components/SavingsGoals';
import { RecurringTransactions } from './components/RecurringTransactions';
import { BillReminders } from './components/BillReminders';
import { BankAccounts } from './components/BankAccounts';
import { ChequeManagement } from './components/ChequeManagement';
import { SubscriptionsTracker } from './components/SubscriptionsTracker';
import { Gamification } from './components/Gamification';
import { SmartScanner } from './components/SmartScanner';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { CardManagement } from './components/CardManagement';
import { DocumentCenter } from './components/DocumentCenter';
import { Notifications } from './components/Notifications';
import { FraudDetection } from './components/FraudDetection';
import { Transaction, Budget, Category } from './types';

type Tab = 'dashboard' | 'transactions' | 'budget' | 'savings' | 'recurring' | 'bills' | 'accounts' | 'cheques' | 'subscriptions' | 'achievements' | 'cards' | 'documents' | 'notifications' | 'security';

function AppContent() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('signup');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [transactionsRes, budgetsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('budgets').select('*'),
      ]);
      if (transactionsRes.data) setTransactions(transactionsRes.data as Transaction[]);
      if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchNotificationCount();
    }
  }, [user, fetchData]);

  const fetchNotificationCount = async () => {
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false);
    setUnreadNotifications(count || 0);
  };

  const handleAddTransaction = async (data: TransactionFormData) => {
    const { error } = await supabase.from('transactions').insert([data]);
    if (error) console.error('Error adding transaction:', error);
    await fetchData();
  };

  const handleUpdateTransaction = async (data: TransactionFormData) => {
    if (!editingTransaction) return;
    const { error } = await supabase.from('transactions').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingTransaction.id);
    if (error) console.error('Error updating transaction:', error);
    setEditingTransaction(null);
    await fetchData();
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction:', error);
    await fetchData();
  };

  const handleDeleteAllTransactions = async () => {
    const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error('Error deleting all transactions:', error);
    setShowDeleteAll(false);
    await fetchData();
  };

  const handleUpdateBudget = async (category: Category, amount: number) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const existing = budgets.find(b => b.category === category);
    try {
      if (existing) {
        await supabase.from('budgets').update({ limit_amount: amount, updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('budgets').insert([{ category, limit_amount: amount, month: currentMonth, year: currentYear }]);
      }
      await fetchData();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleOpenModal = () => { setEditingTransaction(null); setIsModalOpen(true); };
  const handleEditTransaction = (transaction: Transaction) => { setEditingTransaction(transaction); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingTransaction(null); };
  const handleSubmit = (data: TransactionFormData) => editingTransaction ? handleUpdateTransaction(data) : handleAddTransaction(data);

  const handleScanComplete = async (scannedTransactions: Partial<Transaction>[]) => {
    for (const t of scannedTransactions) {
      if (t.amount && t.category) {
        await supabase.from('transactions').insert([{
          ...t,
          type: t.type || 'expense',
          amount: t.amount,
          category: t.category,
          description: t.description || '',
          date: t.date || new Date().toISOString().split('T')[0],
          currency: t.currency || 'USD',
        }]);
      }
    }
    await fetchData();
  };

  const handleSignOut = async () => {
    await signOut();
    setTransactions([]);
    setBudgets([]);
    setShowUserMenu(false);
  };

  const tabs: { id: Tab; icon: React.ElementType; label: string; badge?: number }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'transactions', icon: List, label: 'Transactions' },
    { id: 'budget', icon: PiggyBank, label: 'Budgets' },
    { id: 'savings', icon: Target, label: 'Savings' },
    { id: 'recurring', icon: RefreshCw, label: 'Recurring' },
    { id: 'bills', icon: Bell, label: 'Bills' },
    { id: 'accounts', icon: Building2, label: 'Accounts' },
    { id: 'cheques', icon: FileText, label: 'Cheques' },
    { id: 'cards', icon: CreditCard, label: 'Cards' },
    { id: 'subscriptions', icon: Tv, label: 'Subs' },
    { id: 'documents', icon: FolderOpen, label: 'Docs' },
    { id: 'notifications', icon: BellRing, label: 'Alerts', badge: unreadNotifications },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'achievements', icon: Trophy, label: 'Progress' },
  ];

  const totalSavings = transactions.filter(t => t.category === 'savings').reduce((s, t) => s + Number(t.amount), 0);

  // Show landing page for unauthenticated users
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage
          onGetStarted={() => { setAuthModalMode('signup'); setShowAuthModal(true); }}
          onLogin={() => { setAuthModalMode('login'); setShowAuthModal(true); }}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-gray-950 to-purple-500/5 pointer-events-none" />
      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">MoneyMate</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Personal Finance Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors">
                  <ScanIcon className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">Scan</span>
                </button>
                {transactions.length > 0 && (
                  <button onClick={() => setShowDeleteAll(true)} className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                    <span className="hidden sm:inline text-sm">Clear</span>
                  </button>
                )}
                <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-500/25">
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add</span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-xl border border-gray-700 shadow-xl z-50 animate-scale-in">
                        <div className="p-4 border-b border-gray-700">
                          <p className="text-sm text-gray-400">Signed in as</p>
                          <p className="text-white font-medium truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="border-b border-gray-800/50 bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto scrollbar-invisible py-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-400 hover:text-gray-200'}`}>
                  <div className="relative">
                    <tab.icon className="w-5 h-5" />
                    {tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">{tab.badge > 9 ? '9+' : tab.badge}</span>
                    )}
                  </div>
                  <span className="hidden md:inline">{tab.label}</span>
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-t" />}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard transactions={transactions} />}
              {activeTab === 'transactions' && <TransactionList transactions={transactions} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />}
              {activeTab === 'budget' && <BudgetTracker transactions={transactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} />}
              {activeTab === 'savings' && <SavingsGoals />}
              {activeTab === 'recurring' && <RecurringTransactions />}
              {activeTab === 'bills' && <BillReminders />}
              {activeTab === 'accounts' && <BankAccounts />}
              {activeTab === 'cheques' && <ChequeManagement />}
              {activeTab === 'subscriptions' && <SubscriptionsTracker />}
              {activeTab === 'cards' && <CardManagement />}
              {activeTab === 'documents' && <DocumentCenter />}
              {activeTab === 'notifications' && <Notifications />}
              {activeTab === 'security' && <FraudDetection />}
              {activeTab === 'achievements' && <Gamification totalTransactions={transactions.length} totalSavings={totalSavings} />}
            </>
          )}
        </main>

        <footer className="border-t border-gray-800/50 bg-gray-900/50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Built with React, TypeScript & Supabase</p>
              <div className="flex items-center gap-2 text-gray-500"><Moon className="w-4 h-4" /><span className="text-sm">Dark Mode</span></div>
            </div>
          </div>
        </footer>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmit} editingTransaction={editingTransaction} />
      <SmartScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScanComplete={handleScanComplete} />

      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteAll(false)} />
          <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-700/50 shadow-2xl animate-scale-in p-6">
            <div className="flex items-center justify-center mb-4"><div className="p-3 rounded-full bg-rose-500/20"><Trash2 className="w-8 h-8 text-rose-400" /></div></div>
            <h3 className="text-xl font-semibold text-white text-center mb-2">Delete All Transactions?</h3>
            <p className="text-gray-400 text-center text-sm mb-6">This will permanently remove all {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAll(false)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"><X className="w-5 h-5" />Cancel</button>
              <button onClick={handleDeleteAllTransactions} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors"><Trash2 className="w-5 h-5" />Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
