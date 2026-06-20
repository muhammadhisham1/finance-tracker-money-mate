-- Savings Goals Table
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  target_date DATE,
  category TEXT DEFAULT 'general',
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT '#06b6d4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring Transactions Table
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'USD',
  bank TEXT,
  bank_other TEXT,
  payment_method TEXT,
  payment_method_other TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date DATE NOT NULL,
  last_generated DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill Reminders Table
CREATE TABLE bill_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  due_date DATE NOT NULL,
  category TEXT,
  is_paid BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 3,
  notes TEXT,
  recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts Table
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_type TEXT NOT NULL,
  bank_other TEXT,
  account_number TEXT,
  balance DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT DEFAULT '#06b6d4',
  icon TEXT DEFAULT 'building',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cheques Table
CREATE TABLE cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cheque_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  bank_account_id UUID REFERENCES bank_accounts(id),
  bank_name TEXT,
  issue_date DATE NOT NULL,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'cleared', 'cancelled', 'bounced')),
  payee_name TEXT,
  notes TEXT,
  transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')),
  next_billing_date DATE NOT NULL,
  category TEXT DEFAULT 'entertainment',
  is_active BOOLEAN DEFAULT true,
  reminder_days INTEGER DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification/Achievements Table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  icon TEXT DEFAULT 'trophy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Stats Table (for gamification)
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_savings DECIMAL(12,2) DEFAULT 0,
  savings_streak INTEGER DEFAULT 0,
  last_savings_date DATE,
  total_transactions INTEGER DEFAULT 0,
  budget_goals_met INTEGER DEFAULT 0,
  achievements_earned INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;