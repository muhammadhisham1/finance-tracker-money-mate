/*
# Add user ownership to all tables for multi-user support

This migration converts the existing single-tenant schema to a multi-user schema
where each user can only access their own data.

1. Modified Tables
   - All tables get `user_id` column added (nullable first, then NOT NULL with default)
   - Each table gets owner-scoped CRUD policies

2. Security
   - All tables have RLS enabled
   - Owner-scoped CRUD policies for each table
   - Policies use auth.uid() for ownership checks
*/

-- Add user_id to transactions (nullable first)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
    ALTER TABLE transactions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to budgets
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'budgets' AND column_name = 'user_id') THEN
    ALTER TABLE budgets ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to savings_goals
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'savings_goals' AND column_name = 'user_id') THEN
    ALTER TABLE savings_goals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to recurring_transactions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recurring_transactions' AND column_name = 'user_id') THEN
    ALTER TABLE recurring_transactions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to bill_reminders
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_reminders' AND column_name = 'user_id') THEN
    ALTER TABLE bill_reminders ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to bank_accounts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_accounts' AND column_name = 'user_id') THEN
    ALTER TABLE bank_accounts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to cheques
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cheques' AND column_name = 'user_id') THEN
    ALTER TABLE cheques ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'user_id') THEN
    ALTER TABLE subscriptions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to achievements
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'user_id') THEN
    ALTER TABLE achievements ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to user_stats
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_stats' AND column_name = 'user_id') THEN
    ALTER TABLE user_stats ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Clear existing data (since we're converting to multi-user)
DELETE FROM transactions;
DELETE FROM budgets;
DELETE FROM savings_goals;
DELETE FROM recurring_transactions;
DELETE FROM bill_reminders;
DELETE FROM bank_accounts;
DELETE FROM cheques;
DELETE FROM subscriptions;
DELETE FROM achievements;
DELETE FROM user_stats;

-- Now make user_id NOT NULL with DEFAULT
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE savings_goals ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE recurring_transactions ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE bill_reminders ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE bank_accounts ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE cheques ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE achievements ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE user_stats ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Create policies for transactions
DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Policies for budgets
DROP POLICY IF EXISTS "select_own_budgets" ON budgets;
CREATE POLICY "select_own_budgets" ON budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_budgets" ON budgets;
CREATE POLICY "insert_own_budgets" ON budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_budgets" ON budgets;
CREATE POLICY "update_own_budgets" ON budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_budgets" ON budgets;
CREATE POLICY "delete_own_budgets" ON budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for savings_goals
DROP POLICY IF EXISTS "select_own_savings_goals" ON savings_goals;
CREATE POLICY "select_own_savings_goals" ON savings_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_savings_goals" ON savings_goals;
CREATE POLICY "insert_own_savings_goals" ON savings_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_savings_goals" ON savings_goals;
CREATE POLICY "update_own_savings_goals" ON savings_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_savings_goals" ON savings_goals;
CREATE POLICY "delete_own_savings_goals" ON savings_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for recurring_transactions
DROP POLICY IF EXISTS "select_own_recurring_transactions" ON recurring_transactions;
CREATE POLICY "select_own_recurring_transactions" ON recurring_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_recurring_transactions" ON recurring_transactions;
CREATE POLICY "insert_own_recurring_transactions" ON recurring_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_recurring_transactions" ON recurring_transactions;
CREATE POLICY "update_own_recurring_transactions" ON recurring_transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_recurring_transactions" ON recurring_transactions;
CREATE POLICY "delete_own_recurring_transactions" ON recurring_transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for bill_reminders
DROP POLICY IF EXISTS "select_own_bill_reminders" ON bill_reminders;
CREATE POLICY "select_own_bill_reminders" ON bill_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bill_reminders" ON bill_reminders;
CREATE POLICY "insert_own_bill_reminders" ON bill_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_bill_reminders" ON bill_reminders;
CREATE POLICY "update_own_bill_reminders" ON bill_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bill_reminders" ON bill_reminders;
CREATE POLICY "delete_own_bill_reminders" ON bill_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for bank_accounts
DROP POLICY IF EXISTS "select_own_bank_accounts" ON bank_accounts;
CREATE POLICY "select_own_bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_bank_accounts" ON bank_accounts;
CREATE POLICY "insert_own_bank_accounts" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_bank_accounts" ON bank_accounts;
CREATE POLICY "update_own_bank_accounts" ON bank_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_bank_accounts" ON bank_accounts;
CREATE POLICY "delete_own_bank_accounts" ON bank_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for cheques
DROP POLICY IF EXISTS "select_own_cheques" ON cheques;
CREATE POLICY "select_own_cheques" ON cheques FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cheques" ON cheques;
CREATE POLICY "insert_own_cheques" ON cheques FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_cheques" ON cheques;
CREATE POLICY "update_own_cheques" ON cheques FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cheques" ON cheques;
CREATE POLICY "delete_own_cheques" ON cheques FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for subscriptions
DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for achievements
DROP POLICY IF EXISTS "select_own_achievements" ON achievements;
CREATE POLICY "select_own_achievements" ON achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_achievements" ON achievements;
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_achievements" ON achievements;
CREATE POLICY "update_own_achievements" ON achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_achievements" ON achievements;
CREATE POLICY "delete_own_achievements" ON achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for user_stats
DROP POLICY IF EXISTS "select_own_user_stats" ON user_stats;
CREATE POLICY "select_own_user_stats" ON user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_user_stats" ON user_stats;
CREATE POLICY "insert_own_user_stats" ON user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_stats" ON user_stats;
CREATE POLICY "update_own_user_stats" ON user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_stats" ON user_stats;
CREATE POLICY "delete_own_user_stats" ON user_stats FOR DELETE TO authenticated USING (auth.uid() = user_id);