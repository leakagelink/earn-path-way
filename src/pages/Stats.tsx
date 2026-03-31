import { motion } from "framer-motion";
import { TrendingUp, Wallet, ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Stats = () => {
  const { profile } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "all">("30d");

  const { data: txData = [] } = useQuery({
    queryKey: ["stats-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("type, amount, status, created_at").order("created_at");
      return data || [];
    },
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["stats-referrals"],
    queryFn: async () => {
      const { data } = await supabase.from("referrals").select("level, created_at").order("created_at");
      return data || [];
    },
  });

  const completed = txData.filter(t => t.status === "completed");
  const deposit = completed.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
  const withdraw = completed.filter(t => t.type === "withdraw").reduce((s, t) => s + Number(t.amount), 0);
  const earnings = completed.filter(t => t.type === "earning").reduce((s, t) => s + Number(t.amount), 0);
  const commission = completed.filter(t => t.type === "commission").reduce((s, t) => s + Number(t.amount), 0);

  const stats = [
    { label: "Balance", value: `₹${(profile?.balance ?? 0).toLocaleString("en-IN")}`, icon: Wallet, color: "text-success", bg: "bg-success/10" },
    { label: "Earnings", value: `₹${earnings.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-info", bg: "bg-info/10" },
    { label: "Deposits", value: `₹${deposit.toLocaleString("en-IN")}`, icon: ArrowDownLeft, color: "text-warning", bg: "bg-warning/10" },
    { label: "Commission", value: `₹${commission.toLocaleString("en-IN")}`, icon: Users, color: "text-primary", bg: "bg-primary/10" },
  ];

  // Filter by period
  const now = new Date();
  const filterByPeriod = <T extends { created_at: string }>(data: T[]) => {
    if (chartPeriod === "all") return data;
    const days = chartPeriod === "7d" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return data.filter(d => new Date(d.created_at) >= cutoff);
  };

  // Transaction history grouped by date
  const periodTx = filterByPeriod(completed);
  const txByDate: Record<string, { deposit: number; withdraw: number; earning: number }> = {};
  periodTx.forEach(t => {
    const date = new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (!txByDate[date]) txByDate[date] = { deposit: 0, withdraw: 0, earning: 0 };
    if (t.type === "deposit") txByDate[date].deposit += Number(t.amount);
    else if (t.type === "withdraw") txByDate[date].withdraw += Number(t.amount);
    else txByDate[date].earning += Number(t.amount);
  });
  const txChartData = Object.entries(txByDate).map(([date, vals]) => ({ date, ...vals }));

  // Cumulative earnings over time
  const earningTx = filterByPeriod(completed.filter(t => t.type === "earning" || t.type === "commission"));
  let cumulative = 0;
  const earningsOverTime: { date: string; total: number }[] = [];
  const earningsByDate: Record<string, number> = {};
  earningTx.forEach(t => {
    const date = new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    earningsByDate[date] = (earningsByDate[date] || 0) + Number(t.amount);
  });
  Object.entries(earningsByDate).forEach(([date, amt]) => {
    cumulative += amt;
    earningsOverTime.push({ date, total: cumulative });
  });

  // Referrals over time
  const periodRefs = filterByPeriod(referrals);
  const refsByDate: Record<string, { l1: number; l2: number; l3: number }> = {};
  periodRefs.forEach(r => {
    const date = new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (!refsByDate[date]) refsByDate[date] = { l1: 0, l2: 0, l3: 0 };
    if (r.level === 1) refsByDate[date].l1++;
    else if (r.level === 2) refsByDate[date].l2++;
    else refsByDate[date].l3++;
  });
  const refChartData = Object.entries(refsByDate).map(([date, vals]) => ({ date, ...vals }));

  // Pie chart for transaction type breakdown
  const pieData = [
    { name: "Deposits", value: deposit, color: "hsl(145, 65%, 38%)" },
    { name: "Withdrawals", value: withdraw, color: "hsl(42, 92%, 50%)" },
    { name: "Earnings", value: earnings, color: "hsl(210, 75%, 50%)" },
    { name: "Commission", value: commission, color: "hsl(280, 60%, 55%)" },
  ].filter(d => d.value > 0);

  const chartColors = {
    grid: "hsl(210, 20%, 88%)",
    text: "hsl(215, 15%, 50%)",
    green: "hsl(145, 65%, 38%)",
    blue: "hsl(210, 75%, 50%)",
    gold: "hsl(42, 92%, 50%)",
    purple: "hsl(280, 60%, 55%)",
  };

  const periods = ["7d", "30d", "all"] as const;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Statistics</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your earnings & activity</p>
      </div>

      <div className="px-5 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p}
              onClick={() => setChartPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chartPeriod === p ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
        </div>

        {/* Cumulative Earnings Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <h2 className="font-semibold mb-1">Earnings Growth</h2>
          <p className="text-xs text-muted-foreground mb-4">Cumulative earnings over time</p>
          {earningsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={earningsOverTime}>
                <defs>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(210, 20%, 88%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Total"]}
                />
                <Area type="monotone" dataKey="total" stroke={chartColors.green} fill="url(#earningsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No earnings data yet</p>
          )}
        </motion.div>

        {/* Transaction History Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4">
          <h2 className="font-semibold mb-1">Transaction History</h2>
          <p className="text-xs text-muted-foreground mb-4">Deposits, withdrawals & earnings by date</p>
          {txChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={txChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(210, 20%, 88%)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [`₹${value.toLocaleString("en-IN")}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Bar dataKey="deposit" fill={chartColors.green} radius={[3, 3, 0, 0]} name="Deposit" />
                <Bar dataKey="withdraw" fill={chartColors.gold} radius={[3, 3, 0, 0]} name="Withdraw" />
                <Bar dataKey="earning" fill={chartColors.blue} radius={[3, 3, 0, 0]} name="Earning" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No transaction data yet</p>
          )}
        </motion.div>

        {/* Referrals Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4">
          <h2 className="font-semibold mb-1">Referrals</h2>
          <p className="text-xs text-muted-foreground mb-4">New referrals by level over time</p>
          {refChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={refChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="date" tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartColors.text, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(210, 20%, 88%)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="l1" fill={chartColors.green} radius={[3, 3, 0, 0]} name="Level 1" stackId="a" />
                <Bar dataKey="l2" fill={chartColors.blue} radius={[0, 0, 0, 0]} name="Level 2" stackId="a" />
                <Bar dataKey="l3" fill={chartColors.purple} radius={[3, 3, 0, 0]} name="Level 3" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No referral data yet</p>
          )}
        </motion.div>

        {/* Breakdown Pie Chart */}
        {pieData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-4">
            <h2 className="font-semibold mb-1">Transaction Breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4">Distribution by type</p>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                    <div className="flex-1">
                      <p className="text-xs font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">₹{d.value.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Stats;
