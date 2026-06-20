-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  limit_amount DECIMAL(10,2) NOT NULL CHECK (limit_amount > 0),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions (public access for demo)
CREATE POLICY "select_transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "insert_transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "update_transactions" ON transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete_transactions" ON transactions FOR DELETE USING (true);

-- RLS policies for budgets (public access for demo)
CREATE POLICY "select_budgets" ON budgets FOR SELECT USING (true);
CREATE POLICY "insert_budgets" ON budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "update_budgets" ON budgets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete_budgets" ON budgets FOR DELETE USING (true);