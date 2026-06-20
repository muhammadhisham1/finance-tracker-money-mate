import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, PiggyBank, Building2, CreditCard, BarChart3, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, Legend, LineChart, Line, ComposedChart } from 'recharts';
import { Transaction, CATEGORY_COLORS, CATEGORY_LABELS, Category } from '../types';
import { useMemo } from 'react';

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    return { totalIncome, totalExpenses, balance, savingsRate };
  }, [transactions]);

  const pieData = useMemo(() => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {} as Record<Category, number>);
    return Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ name: CATEGORY_LABELS[category as Category], value: amount, color: CATEGORY_COLORS[category as Category] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const topCategories = useMemo(() => pieData.slice(0, 5), [pieData]);

  const barData = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const dailyData = transactions
      .filter(t => new Date(t.date) >= last30Days)
      .reduce((acc, t) => { const date = t.date; if (!acc[date]) acc[date] = { income: 0, expense: 0 }; acc[date][t.type] += Number(t.amount); return acc; }, {} as Record<string, { income: number; expense: number }>);
    return Object.entries(dailyData)
      .map(([date, values]) => ({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), income: values.income, expense: values.expense }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-14);
  }, [transactions]);

  const areaData = useMemo(() => {
    const monthlyData = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!acc[month]) acc[month] = { income: 0, expense: 0 };
      acc[month][t.type] += Number(t.amount);
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);
    let runningBalance = 0;
    return Object.entries(monthlyData)
      .map(([month, values]) => { runningBalance += values.income - values.expense; return { month, income: values.income, expense: values.expense, balance: runningBalance }; })
      .slice(-6);
  }, [transactions]);

  const insights = useMemo(() => {
    const result: { type: 'success' | 'warning' | 'info'; icon: React.ElementType; text: string }[] = [];
    const thisMonth = new Date().getMonth();
    const lastMonth = thisMonth - 1 < 0 ? 11 : thisMonth - 1;
    const thisMonthExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === thisMonth).reduce((s, t) => s + Number(t.amount), 0);
    const lastMonthExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === lastMonth).reduce((s, t) => s + Number(t.amount), 0);

    if (lastMonthExpenses > 0) {
      const change = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (change < -10) result.push({ type: 'success', icon: CheckCircle, text: `Spending decreased ${Math.abs(change).toFixed(0)}% from last month!` });
      else if (change > 10) result.push({ type: 'warning', icon: AlertTriangle, text: `Spending increased ${change.toFixed(0)}% from last month.` });
    }

    if (stats.savingsRate > 20) result.push({ type: 'success', icon: PiggyBank, text: `Great savings rate of ${stats.savingsRate.toFixed(0)}%!` });
    else if (stats.savingsRate < 0) result.push({ type: 'warning', icon: TrendingDown, text: 'You are spending more than you earn.' });

    if (topCategories[0]) result.push({ type: 'info', icon: BarChart3, text: `Top spending: ${topCategories[0].name} ($${topCategories[0].value.toFixed(2)})` });

    if (stats.balance > 0) result.push({ type: 'success', icon: Wallet, text: `Positive net balance of $${stats.balance.toFixed(2)}. Keep it up!` });

    return result;
  }, [transactions, stats, topCategories]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Net Worth" value={stats.balance} icon={Wallet} trend={stats.balance >= 0 ? 'up' : 'down'} color="cyan" />
        <SummaryCard title="Total Income" value={stats.totalIncome} icon={TrendingUp} trend="up" color="emerald" />
        <SummaryCard title="Total Expenses" value={stats.totalExpenses} icon={TrendingDown} trend="down" color="rose" />
        <SummaryCard title="Savings Rate" value={stats.savingsRate} icon={PiggyBank} trend={stats.savingsRate > 0 ? 'up' : 'down'} color="purple" suffix="%" />
      </div>

      {insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
              <insight.icon className={`w-5 h-5 ${insight.type === 'success' ? 'text-emerald-400' : insight.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'}`} />
              <p className="text-sm text-white">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Expense Breakdown">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[300px] flex items-center justify-center text-gray-500">No expense data yet</div>}
        </ChartCard>

        <ChartCard title="Top Spending Categories">
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-300">{cat.name}</span>
                      <span className="text-sm text-white font-medium">${cat.value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(cat.value / topCategories[0].value) * 100}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="h-[200px] flex items-center justify-center text-gray-500">No data yet</div>}
        </ChartCard>

        <ChartCard title="Monthly Trend">
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={areaData}>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                <Legend formatter={(value) => <span className="text-gray-300 capitalize">{value}</span>} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="balance" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-gray-500">No data yet</div>}
        </ChartCard>

        <ChartCard title="Recent Activity">
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px' }} formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Legend formatter={(value) => <span className="text-gray-300 capitalize">{value}</span>} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[280px] flex items-center justify-center text-gray-500">No recent activity</div>}
        </ChartCard>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  trend: 'up' | 'down';
  color: 'cyan' | 'emerald' | 'rose' | 'purple';
  suffix?: string;
}

function SummaryCard({ title, value, icon: Icon, trend, color, suffix = '' }: SummaryCardProps) {
  const colorStyles = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
  };
  const iconBg = { cyan: 'bg-cyan-500/20', emerald: 'bg-emerald-500/20', rose: 'bg-rose-500/20', purple: 'bg-purple-500/20' };

  const displayValue = suffix === '%' ? value.toFixed(1) : Math.abs(value).toFixed(2);

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg ${colorStyles[color]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">
            {suffix !== '%' && value < 0 ? '-' : ''}{suffix === '$' ? suffix : ''}{displayValue}{suffix !== '$' ? suffix : ''}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
        <span className={`text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>{trend === 'up' ? 'Positive' : 'Negative'}</span>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-gray-700/50 bg-gray-800/50 p-5 backdrop-blur-sm ${className}`}>
      <h3 className="text-base font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
