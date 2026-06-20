import React, { useState, useEffect } from 'react';
import { Trophy, Star, Flame, Target, Footprints, Shield, CheckCircle, ListChecks, Database, Flag, Zap, Crown, Medal, Award } from 'lucide-react';
import { Achievement, UserStats, ACHIEVEMENT_TYPES } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy, star: Star, flame: Flame, target: Target, footprints: Footprints,
  'shield-check': Shield, 'list-checks': ListChecks, database: Database, flag: Flag, crown: Crown, medal: Medal
};

export function Gamification({ totalTransactions, totalSavings }: { totalTransactions: number; totalSavings: number }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchGamification();
  }, []);

  const fetchGamification = async () => {
    const { data: achievementData } = await supabase.from('achievements').select('*').order('unlocked_at', { ascending: false });
    const { data: statsData } = await supabase.from('user_stats').select('*').limit(1);
    if (achievementData) setAchievements(achievementData as Achievement[]);
    if (statsData && statsData.length > 0) setUserStats(statsData[0] as UserStats);
  };

  useEffect(() => {
    checkAchievements();
  }, [totalTransactions, totalSavings]);

  const checkAchievements = async () => {
    let updated = false;

    for (const achievementType of ACHIEVEMENT_TYPES) {
      const existing = achievements.find(a => a.type === achievementType.type);
      if (existing?.unlocked_at) continue;

      let progress = 0;
      if (achievementType.type.startsWith('transactions_')) {
        progress = totalTransactions;
      } else if (achievementType.type === 'savings_streak_7') {
        progress = userStats?.savings_streak || 0;
      } else if (achievementType.type === 'savings_streak_30') {
        progress = userStats?.savings_streak || 0;
      }

      if (progress >= achievementType.target && existing && !existing.unlocked_at) {
        await supabase.from('achievements').update({ unlocked_at: new Date().toISOString(), progress }).eq('id', existing.id);
        showToast(`Achievement Unlocked: ${achievementType.name}!`, 'success');
        updated = true;
      } else if (existing && existing.progress !== progress) {
        await supabase.from('achievements').update({ progress }).eq('id', existing.id);
        updated = true;
      }
    }

    if (updated) fetchGamification();
  };

  const unlockedCount = achievements.filter(a => a.unlocked_at).length;
  const level = userStats?.level || 1;
  const xp = userStats?.xp || 0;
  const xpForNextLevel = level * 100;
  const xpProgress = (xp % 100) / 100 * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Achievements & Progress</h2>
        <p className="text-sm text-gray-400">Track your financial milestones</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 rounded-xl p-4 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 text-sm">Level</span>
          </div>
          <p className="text-3xl font-bold text-white mt-1">{level}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 text-sm">XP</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{xp}</p>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/30">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 text-sm">Savings Streak</span>
          </div>
          <p className="text-3xl font-bold text-white mt-1">{userStats?.savings_streak || 0}</p>
          <p className="text-xs text-gray-400">days</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 text-sm">Achievements</span>
          </div>
          <p className="text-3xl font-bold text-white mt-1">{unlockedCount}/{achievements.length || ACHIEVEMENT_TYPES.length}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENT_TYPES.map(at => {
          const existing = achievements.find(a => a.type === at.type);
          const progress = existing?.progress || 0;
          const unlocked = existing?.unlocked_at;
          const Icon = iconMap[at.icon] || Trophy;
          const progressPercent = Math.min((progress / at.target) * 100, 100);

          return (
            <div key={at.type} className={`p-4 rounded-xl border ${unlocked ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30' : 'bg-gray-800/30 border-gray-700/50'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${unlocked ? 'bg-amber-500/20' : 'bg-gray-700/50'}`}>
                  <Icon className={`w-5 h-5 ${unlocked ? 'text-amber-400' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{at.name}</p>
                    {unlocked && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{at.description}</p>
                  <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${unlocked ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${progressPercent}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{progress}/{at.target}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
