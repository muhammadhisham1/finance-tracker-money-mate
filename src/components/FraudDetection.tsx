import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, Shield, TrendingUp, Copy, DollarSign, Clock, Trash2 } from 'lucide-react';
import { FraudAlert, AlertType, AlertSeverity } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function FraudDetection() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('all');
  const [viewingAlert, setViewingAlert] = useState<FraudAlert | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAlerts();
    runDetection();
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase.from('fraud_alerts').select('*').order('created_at', { ascending: false });
    if (data) setAlerts(data as FraudAlert[]);
  };

  const runDetection = async () => {
    // Check for duplicate transactions
    const { data: transactions } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (transactions) {
      const seen = new Map<string, string>();
      for (const t of transactions) {
        const key = `${t.amount}-${t.category}-${t.date}`;
        if (seen.has(key)) {
          const existing = await supabase.from('fraud_alerts').select('id').eq('entity_id', t.id).eq('alert_type', 'duplicate_transaction').eq('is_resolved', false);
          if (!existing.data?.length) {
            await supabase.from('fraud_alerts').insert([{
              alert_type: 'duplicate_transaction',
              severity: 'medium',
              description: `Potential duplicate transaction: $${t.amount} on ${t.date} in category ${t.category}`,
              entity_type: 'transaction',
              entity_id: t.id,
              entity_data: { amount: t.amount, category: t.category, date: t.date },
            }]);
          }
        }
        seen.set(key, t.id);
      }
    }

    // Check for spending spikes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentExpenses = transactions?.filter(t => t.type === 'expense' && new Date(t.created_at) >= thirtyDaysAgo).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const previousExpenses = transactions?.filter(t => t.type === 'expense' && new Date(t.created_at) >= sixtyDaysAgo && new Date(t.created_at) < thirtyDaysAgo).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    if (previousExpenses > 0 && recentExpenses > previousExpenses * 1.5) {
      const existing = await supabase.from('fraud_alerts').select('id').eq('alert_type', 'spending_spike').eq('is_resolved', false).order('created_at', { ascending: false }).limit(1);
      if (!existing.data?.length || (existing.data[0] && Date.now() - new Date(existing.data[0].created_at).getTime() > 7 * 24 * 60 * 60 * 1000)) {
        await supabase.from('fraud_alerts').insert([{
          alert_type: 'spending_spike',
          severity: 'high',
          description: `Spending increased ${((recentExpenses / previousExpenses - 1) * 100).toFixed(0)}% compared to previous period`,
          entity_data: { recent: recentExpenses, previous: previousExpenses },
        }]);
      }
    }

    fetchAlerts();
  };

  const handleResolve = async (alert: FraudAlert, notes?: string) => {
    await supabase.from('fraud_alerts').update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes || 'Marked as false positive',
    }).eq('id', alert.id);
    showToast('Alert resolved', 'success');
    fetchAlerts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('fraud_alerts').delete().eq('id', id);
    showToast('Alert deleted', 'success');
    fetchAlerts();
  };

  const getIcon = (type: AlertType) => {
    switch (type) {
      case 'duplicate_transaction': return Copy;
      case 'spending_spike': return TrendingUp;
      case 'duplicate_bill': return DollarSign;
      case 'suspicious_amount': return AlertTriangle;
      case 'frequency_anomaly': return Clock;
      default: return Shield;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'medium': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => !a.is_resolved);
  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            Fraud & Error Detection
          </h2>
          <p className="text-sm text-gray-400">{unresolvedCount} unresolved alert{unresolvedCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter(filter === 'all' ? 'unresolved' : 'all')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${filter === 'unresolved' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            {filter === 'all' ? 'All Alerts' : 'Unresolved Only'}
          </button>
          <button onClick={runDetection} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-medium rounded-xl transition-all">
            Run Scan
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-400">No alerts detected</p>
          <p className="text-sm text-gray-500 mt-1">Your transactions look clean!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const Icon = getIcon(alert.alert_type);
            const severityStyle = getSeverityColor(alert.severity);
            return (
              <div key={alert.id} className={`flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl border ${alert.is_resolved ? 'border-gray-700/30 opacity-60' : 'border-gray-700/50'}`}>
                <div className={`p-2.5 rounded-lg ${severityStyle}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white capitalize">{alert.alert_type.replace(/_/g, ' ')}</p>
                    <span className={`px-2 py-0.5 rounded text-xs border ${severityStyle}`}>{alert.severity}</span>
                    {alert.is_resolved && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{alert.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!alert.is_resolved && (
                    <button onClick={() => handleResolve(alert)} className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm">
                      Resolve
                    </button>
                  )}
                  <button onClick={() => handleDelete(alert.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detection Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Total Alerts</p>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Unresolved</p>
          <p className="text-2xl font-bold text-amber-400">{unresolvedCount}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">High Severity</p>
          <p className="text-2xl font-bold text-rose-400">{alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length}</p>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <p className="text-sm text-gray-400">Duplicates Found</p>
          <p className="text-2xl font-bold text-cyan-400">{alerts.filter(a => a.alert_type === 'duplicate_transaction').length}</p>
        </div>
      </div>
    </div>
  );
}
