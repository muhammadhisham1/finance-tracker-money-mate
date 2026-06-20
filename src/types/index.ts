// Core Transaction Types
export type TransactionType = 'income' | 'expense';

export type Category =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'food'
  | 'rent'
  | 'gaming'
  | 'shopping'
  | 'transport'
  | 'entertainment'
  | 'utilities'
  | 'healthcare'
  | 'subscriptions'
  | 'education'
  | 'savings'
  | 'loan'
  | 'insurance'
  | 'other';

export type Currency = 'USD' | 'PKR' | 'EUR' | 'GBP' | 'AED' | 'SAR' | 'INR' | 'CNY' | 'JPY' | 'AUD' | 'CAD' | 'CHF';

export type Bank = 'HBL' | 'Meezan Bank' | 'Bank Alfalah' | 'Standard Chartered' | 'Bank of America' | 'Chase' | 'Wells Fargo' | 'HSBC' | 'Citibank' | 'Barclays' | 'Deutsche Bank' | 'ING' | 'BNP Paribas' | 'UBS' | 'Mizuho' | 'SMBC' | 'Other';
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Card' | 'UPI' | 'PayPal' | 'Venmo' | 'Apple Pay' | 'Google Pay' | 'Crypto' | 'Other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  date: string;
  currency?: Currency;
  bank?: Bank | null;
  bank_other?: string | null;
  payment_method?: PaymentMethod | null;
  payment_method_other?: string | null;
  receipt_data?: string | null;
  account_id?: string | null;
  card_id?: string | null;
  document_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category: Category;
  limit_amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

// Savings Goals Types
export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export const SAVINGS_GOAL_ICONS = ['target', 'home', 'car', 'plane', 'graduation', 'laptop', 'gift', 'heart', 'star', 'rocket'];
export const SAVINGS_GOAL_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#f97316', '#6366f1'];

// Recurring Transactions Types
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: Category;
  description: string;
  currency: Currency;
  bank: Bank | null;
  bank_other: string | null;
  payment_method: PaymentMethod | null;
  payment_method_other: string | null;
  frequency: Frequency;
  next_date: string;
  last_generated: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Bill Reminders Types
export interface BillReminder {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  due_date: string;
  category: string;
  is_paid: boolean;
  reminder_days: number;
  notes: string;
  recurring: boolean;
  recurring_frequency: Frequency | null;
  verification_status?: 'verified' | 'pending' | 'duplicate' | 'disputed';
  document_id?: string;
  merchant_name?: string;
  bill_type?: 'utility' | 'internet' | 'phone' | 'insurance' | 'rent' | 'subscription' | 'loan' | 'credit_card' | 'other';
  created_at: string;
  updated_at: string;
}

// Bank Account Types
export type BankAccountType = 'cash' | 'checking' | 'savings' | 'credit' | 'investment' | 'other';
export type VerificationStatus = 'verified' | 'pending' | 'unverified';

export interface BankAccount {
  id: string;
  name: string;
  bank_type: BankAccountType;
  bank_other?: string;
  account_number?: string;
  balance: number;
  currency: Currency;
  color: string;
  icon: string;
  is_default: boolean;
  verification_status?: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export const BANK_ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: 'cash', label: 'Cash Wallet' },
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'other', label: 'Other' },
];

// Cheque Types
export type ChequeStatus = 'pending' | 'cleared' | 'cancelled' | 'bounced';

export interface Cheque {
  id: string;
  cheque_number: string;
  amount: number;
  currency: Currency;
  bank_account_id?: string;
  bank_name?: string;
  issue_date: string;
  due_date?: string;
  status: ChequeStatus;
  payee_name?: string;
  notes?: string;
  transaction_id?: string;
  verification_status?: VerificationStatus;
  created_at: string;
  updated_at: string;
}

// Subscription Types
export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  category: string;
  is_active: boolean;
  reminder_days: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const SUBSCRIPTION_CATEGORIES = [
  'Streaming', 'Music', 'Gaming', 'Software', 'Cloud Storage', 'News', 'Fitness', 'Education', 'Other'
];

// Gamification Types
export interface Achievement {
  id: string;
  type: string;
  name: string;
  description?: string;
  unlocked_at?: string;
  progress: number;
  target: number;
  icon: string;
  created_at: string;
}

export interface UserStats {
  id: string;
  total_savings: number;
  savings_streak: number;
  last_savings_date?: string;
  total_transactions: number;
  budget_goals_met: number;
  achievements_earned: number;
  level: number;
  xp: number;
  created_at: string;
  updated_at: string;
}

export const ACHIEVEMENT_TYPES = [
  { type: 'first_transaction', name: 'First Step', description: 'Add your first transaction', icon: 'footprints', target: 1 },
  { type: 'budget_master', name: 'Budget Master', description: 'Stay within budget for a month', icon: 'shield-check', target: 1 },
  { type: 'savings_streak_7', name: 'Week Warrior', description: 'Save money for 7 days straight', icon: 'flame', target: 7 },
  { type: 'savings_streak_30', name: 'Monthly Master', description: 'Save money for 30 days straight', icon: 'trophy', target: 30 },
  { type: 'transactions_10', name: 'Getting Started', description: 'Add 10 transactions', icon: 'list-checks', target: 10 },
  { type: 'transactions_50', name: 'Transaction Pro', description: 'Add 50 transactions', icon: 'database', target: 50 },
  { type: 'transactions_100', name: 'Century', description: 'Add 100 transactions', icon: 'star', target: 100 },
  { type: 'savings_goal_first', name: 'Dream Chaser', description: 'Create your first savings goal', icon: 'target', target: 1 },
  { type: 'savings_goal_complete', name: 'Goal Achiever', description: 'Complete a savings goal', icon: 'flag', target: 1 },
];

// Card Types
export type CardType = 'debit' | 'credit';

export interface Card {
  id: string;
  name: string;
  card_type: CardType;
  masked_number: string;
  last_four: string;
  card_brand?: string;
  expiry_month?: number;
  expiry_year?: number;
  card_holder_name?: string;
  bank_name?: string;
  credit_limit?: number;
  current_balance: number;
  color: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const CARD_BRANDS = ['Visa', 'Mastercard', 'American Express', 'Discover', 'UnionPay', 'JCB', 'Other'];
export const CARD_COLORS = ['#06b6d4', '#1e40af', '#7c3aed', '#db2777', '#059669', '#d97706', '#dc2626', '#475569'];

// Document Types
export type DocumentType = 'receipt' | 'bill' | 'cheque' | 'invoice' | 'statement' | 'other';

export interface Document {
  id: string;
  document_type: DocumentType;
  title?: string;
  description?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  extracted_data?: Record<string, unknown>;
  is_verified: boolean;
  verification_notes?: string;
  transaction_id?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'bill', label: 'Bill' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'statement', label: 'Statement' },
  { value: 'other', label: 'Other' },
];

// Notification Types
export type NotificationType = 'bill_due' | 'card_expiry' | 'cheque_due' | 'verification' | 'fraud_alert' | 'budget_warning' | 'savings_goal' | 'subscription' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

// Fraud Alert Types
export type AlertType = 'duplicate_transaction' | 'spending_spike' | 'duplicate_bill' | 'suspicious_amount' | 'unusual_category' | 'frequency_anomaly';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FraudAlert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  description?: string;
  entity_type?: string;
  entity_id?: string;
  entity_data?: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

// Currency Constants
export const CURRENCIES: Currency[] = ['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'CNY', 'JPY', 'AUD', 'CAD', 'CHF'];
export const BANKS: Bank[] = ['HBL', 'Meezan Bank', 'Bank Alfalah', 'Standard Chartered', 'Bank of America', 'Chase', 'Wells Fargo', 'HSBC', 'Citibank', 'Barclays', 'Deutsche Bank', 'ING', 'BNP Paribas', 'UBS', 'Mizuho', 'SMBC', 'Other'];
export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'UPI', 'PayPal', 'Venmo', 'Apple Pay', 'Google Pay', 'Crypto', 'Other'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$', PKR: 'Rs', EUR: '€', GBP: '£', AED: 'AED', SAR: 'SAR',
  INR: '₹', CNY: '¥', JPY: '¥', AUD: 'A$', CAD: 'C$', CHF: 'CHF'
};

export const INCOME_CATEGORIES: Category[] = ['salary', 'freelance', 'investment', 'other'];
export const EXPENSE_CATEGORIES: Category[] = ['food', 'rent', 'gaming', 'shopping', 'transport', 'entertainment', 'utilities', 'healthcare', 'subscriptions', 'education', 'savings', 'loan', 'insurance', 'other'];

export const CATEGORY_LABELS: Record<Category, string> = {
  salary: 'Salary', freelance: 'Freelance', investment: 'Investment',
  food: 'Food & Dining', rent: 'Rent & Housing', gaming: 'Gaming',
  shopping: 'Shopping', transport: 'Transportation', entertainment: 'Entertainment',
  utilities: 'Utilities', healthcare: 'Healthcare', subscriptions: 'Subscriptions',
  education: 'Education', savings: 'Savings', loan: 'Loan', insurance: 'Insurance', other: 'Other'
};

export const CATEGORY_COLORS: Record<Category, string> = {
  salary: '#10b981', freelance: '#06b6d4', investment: '#8b5cf6',
  food: '#f59e0b', rent: '#ef4444', gaming: '#ec4899',
  shopping: '#3b82f6', transport: '#14b8a6', entertainment: '#f97316',
  utilities: '#6366f1', healthcare: '#22c55e', subscriptions: '#c084fc',
  education: '#0ea5e9', savings: '#84cc16', loan: '#f43f5e', insurance: '#8b5cf6', other: '#6b7280'
};

export const BILL_TYPES: { value: string; label: string }[] = [
  { value: 'utility', label: 'Utility' },
  { value: 'internet', label: 'Internet' },
  { value: 'phone', label: 'Phone' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'rent', label: 'Rent' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'loan', label: 'Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
];
