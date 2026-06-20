/*
# Add premium fintech features tables

This migration adds tables for card management, document storage, notifications,
bill verification, and enhanced cheque tracking.

1. New Tables
   - cards: Store debit/credit card information
   - documents: Store receipts, bills, cheques, and financial documents
   - notifications: Store user notifications and alerts
   - fraud_alerts: Store detected fraud and suspicious activity

2. Modified Tables
   - bank_accounts: Add verification_status column
   - cheques: Add verification_status column
   - bill_reminders: Add document_id reference, verification_status
   - transactions: Add card_id, document_id references

3. Security
   - All tables have user_id with DEFAULT auth.uid()
   - Owner-scoped RLS policies on all tables
*/

-- Cards table for debit/credit cards
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('debit', 'credit')),
  masked_number text NOT NULL,
  last_four text NOT NULL,
  card_brand text,
  expiry_month integer,
  expiry_year integer,
  card_holder_name text,
  bank_name text,
  credit_limit decimal(12,2),
  current_balance decimal(12,2) DEFAULT 0,
  color text DEFAULT '#06b6d4',
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table for receipts, bills, cheques
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('receipt', 'bill', 'cheque', 'invoice', 'statement', 'other')),
  title text,
  description text,
  file_url text,
  file_name text,
  file_size integer,
  mime_type text,
  extracted_data jsonb,
  is_verified boolean DEFAULT false,
  verification_notes text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('bill_due', 'card_expiry', 'cheque_due', 'verification', 'fraud_alert', 'budget_warning', 'savings_goal', 'subscription', 'system')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  action_url text,
  action_text text,
  related_entity_type text,
  related_entity_id uuid,
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Fraud alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('duplicate_transaction', 'spending_spike', 'duplicate_bill', 'suspicious_amount', 'unusual_category', 'frequency_anomaly')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  entity_type text,
  entity_id uuid,
  entity_data jsonb,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Add verification_status to bank_accounts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bank_accounts' AND column_name = 'verification_status') THEN
    ALTER TABLE bank_accounts ADD COLUMN verification_status text DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'unverified'));
  END IF;
END $$;

-- Add verification_status to cheques
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cheques' AND column_name = 'verification_status') THEN
    ALTER TABLE cheques ADD COLUMN verification_status text DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'unverified'));
  END IF;
END $$;

-- Add document reference to transactions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'document_id') THEN
    ALTER TABLE transactions ADD COLUMN document_id uuid REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add card reference to transactions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'card_id') THEN
    ALTER TABLE transactions ADD COLUMN card_id uuid REFERENCES cards(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add verification fields to bill_reminders
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_reminders' AND column_name = 'verification_status') THEN
    ALTER TABLE bill_reminders ADD COLUMN verification_status text DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'duplicate', 'disputed'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_reminders' AND column_name = 'document_id') THEN
    ALTER TABLE bill_reminders ADD COLUMN document_id uuid REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_reminders' AND column_name = 'merchant_name') THEN
    ALTER TABLE bill_reminders ADD COLUMN merchant_name text;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_reminders' AND column_name = 'bill_type') THEN
    ALTER TABLE bill_reminders ADD COLUMN bill_type text CHECK (bill_type IN ('utility', 'internet', 'phone', 'insurance', 'rent', 'subscription', 'loan', 'credit_card', 'other'));
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for cards
DROP POLICY IF EXISTS "select_own_cards" ON cards;
CREATE POLICY "select_own_cards" ON cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cards" ON cards;
CREATE POLICY "insert_own_cards" ON cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_cards" ON cards;
CREATE POLICY "update_own_cards" ON cards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cards" ON cards;
CREATE POLICY "delete_own_cards" ON cards FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for documents
DROP POLICY IF EXISTS "select_own_documents" ON documents;
CREATE POLICY "select_own_documents" ON documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_documents" ON documents;
CREATE POLICY "insert_own_documents" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_documents" ON documents;
CREATE POLICY "update_own_documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_documents" ON documents;
CREATE POLICY "delete_own_documents" ON documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for notifications
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for fraud_alerts
DROP POLICY IF EXISTS "select_own_fraud_alerts" ON fraud_alerts;
CREATE POLICY "select_own_fraud_alerts" ON fraud_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_fraud_alerts" ON fraud_alerts;
CREATE POLICY "insert_own_fraud_alerts" ON fraud_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_fraud_alerts" ON fraud_alerts;
CREATE POLICY "update_own_fraud_alerts" ON fraud_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_fraud_alerts" ON fraud_alerts;
CREATE POLICY "delete_own_fraud_alerts" ON fraud_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_document_id ON transactions(document_id);