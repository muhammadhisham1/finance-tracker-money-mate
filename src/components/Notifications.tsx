import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, CreditCard, FileText, DollarSign, Target, TrendingUp, Shield, Clock } from 'lucide-react';
import { AppNotification, NotificationType, NotificationPriority } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetchNotifications();
    generateNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setNotifications(data as AppNotification[]);
  };

  const generateNotifications = async () => {
    // Check for bills due soon
    const { data: bills } = await supabase.from('bill_reminders').select('*').eq('is_paid', false);
    if (bills) {
      for (const bill of bills) {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= bill.reminder_days && daysUntilDue >= 0) {
          const existing = await supabase.from('notifications').select('id').eq('related_entity_id', bill.id).eq('notification_type', 'bill_due');
          if (!existing.data?.length) {
            await supabase.from('notifications').insert([{
              title: 'Bill Due Soon',
              message: `${bill.name} of $${bill.amount.toFixed(2)} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
              notification_type: 'bill_due',
              priority: daysUntilDue <= 1 ? 'urgent' : 'high',
              related_entity_type: 'bill_reminder',
              related_entity_id: bill.id,
            }]);
          }
        } else if (daysUntilDue < 0) {
          const existing = await supabase.from('notifications').select('id').eq('related_entity_id', bill.id).eq('notification_type', 'bill_due').eq('is_read', false);
          if (!existing.data?.length) {
            await supabase.from('notifications').insert([{
              title: 'Bill Overdue!',
              message: `${bill.name} of $${bill.amount.toFixed(2)} was due ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} ago`,
              notification_type: 'bill_due',
              priority: 'urgent',
              related_entity_type: 'bill_reminder',
              related_entity_id: bill.id,
            }]);
          }
        }
      }
    }

    // Check for card expiry
    const { data: cards } = await supabase.from('cards').select('*').eq('is_active', true);
    if (cards) {
      for (const card of cards) {
        if (card.expiry_month && card.expiry_year) {
          const expiry = new Date(card.expiry_year + 2000, card.expiry_month);
          const today = new Date();
          const monthsUntilExpiry = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());

          if (monthsUntilExpiry <= 3 && monthsUntilExpiry >= 0) {
            const existing = await supabase.from('notifications').select('id').eq('related_entity_id', card.id).eq('notification_type', 'card_expiry').eq('is_read', false);
            if (!existing.data?.length) {
              await supabase.from('notifications').insert([{
                title: 'Card Expiring Soon',
                message: `Your ${card.name} card expires in ${monthsUntilExpiry} month${monthsUntilExpiry !== 1 ? 's' : ''}`,
                notification_type: 'card_expiry',
                priority: 'high',
                related_entity_type: 'card',
                related_entity_id: card.id,
              }]);
            }
          }
        }
      }
    }

    fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    showToast('All notifications marked as read', 'success');
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    fetchNotifications();
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'bill_due': return DollarSign;
      case 'card_expiry': return CreditCard;
      case 'cheque_due': return FileText;
      case 'verification': return Shield;
      case 'fraud_alert': return AlertTriangle;
      case 'budget_warning': return TrendingUp;
      case 'savings_goal': return Target;
      case 'subscription': return Clock;
      default: return Bell;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'bill_due': return 'bg-amber-500/20';
      case 'card_expiry': return 'bg-rose-500/20';
      case 'fraud_alert': return 'bg-rose-600/20';
      case 'verification': return 'bg-emerald-500/20';
      case 'savings_goal': return 'bg-cyan-500/20';
      default: return 'bg-gray-500/20';
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case 'bill_due': return 'text-amber-400';
      case 'card_expiry': return 'text-rose-400';
      case 'fraud_alert': return 'text-rose-500';
      case 'verification': return 'text-emerald-400';
      case 'savings_goal': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBg = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent': return 'border-l-rose-500';
      case 'high': return 'border-l-amber-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-cyan-500';
    }
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.is_read);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="text-sm text-gray-400">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${filter === 'unread' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}>
            <Bell className="w-5 h-5" />
            {filter === 'all' ? 'All' : 'Unread Only'}
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-400 hover:text-white rounded-xl transition-colors">
              <CheckCheck className="w-5 h-5" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-700/50">
          <Bell className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No notifications</p>
          <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const Icon = getIcon(n.notification_type);
            return (
              <div key={n.id} className={`flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:bg-gray-800/50 transition-all border-l-4 ${getPriorityBg(n.priority)} ${n.is_read ? 'opacity-60' : ''}`}>
                <div className={`p-2.5 rounded-lg ${getIconBg(n.notification_type)}`}>
                  <Icon className={`w-5 h-5 ${getIconColor(n.notification_type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{n.title}</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${n.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : n.priority === 'high' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>{n.priority}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-cyan-400">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
