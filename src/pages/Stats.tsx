import { motion } from "framer-motion";
import { TrendingUp, Wallet, ArrowDownLeft, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useQuery } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Stats = () => {
  const { profile } = useAuth();

  const { data: txData = [] } = useQuery({
    queryKey: ["stats-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("type, amount, status, created_at");
      return data || [];
    },
  });

  const completed = txData.filter(t => t.status === "completed");
  const deposit = completed.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
  const withdraw = completed.filter(t => t.type === "withdraw").reduce((s, t) => s + Number(t.amount), 0);
  const earnings = completed.filter(t => t.type === "earning").reduce((s, t) => s + Number(t.amount), 0);
  const commission = completed.filter(t => t.type === "commission").reduce((s, t) => s + Number(t.amount), 0);

  const stats = [
    { label: "Total Balance", value: `₹${(profile?.balance ?? 0).toLocaleString("en-IN")}`, icon: Wallet, color: "text-success", bg: "bg-success/10" },
    { label: "Total Earnings", value: `₹${earnings.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-info", bg: "bg-info/10" },
    { label: "Total Deposit", value: `₹${deposit.toLocaleString("en-IN")}`, icon: ArrowDownLeft, color: "text-warning", bg: "bg-warning/10" },
    { label: "Commission", value: `₹${commission.toLocaleString("en-IN")}`, icon: Users, color: "text-primary", bg: "bg-primary/10" },
  ];

  // Group by day of week for chart
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyMap: Record<string, number> = {};
  dayNames.forEach(d => (weeklyMap[d] = 0));
  completed.filter(t => t.type === "earning" || t.type === "commission").forEach(t => {
    const day = dayNames[new Date(t.created_at).getDay()];
    weeklyMap[day] += Number(t.amount);
  });
  const weeklyData = dayNames.map(day => ({ day, earnings: weeklyMap[day] }));

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Statistics</h1>
      </div>

      <div className="px-5 space-y-5">
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

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4">
          <h2 className="font-semibold mb-4">Weekly Earnings</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Bar dataKey="earnings" fill="hsl(152, 69%, 46%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Stats;
