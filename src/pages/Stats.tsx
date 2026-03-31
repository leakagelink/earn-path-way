import { motion } from "framer-motion";
import { TrendingUp, Wallet, ArrowDownLeft, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";
import BottomNav from "@/components/BottomNav";

const weeklyData = [
  { day: "Mon", earnings: 40 },
  { day: "Tue", earnings: 65 },
  { day: "Wed", earnings: 28 },
  { day: "Thu", earnings: 80 },
  { day: "Fri", earnings: 55 },
  { day: "Sat", earnings: 90 },
  { day: "Sun", earnings: 70 },
];

const monthlyData = [
  { month: "Jan", amount: 1200 },
  { month: "Feb", amount: 1800 },
  { month: "Mar", amount: 2450 },
];

const stats = [
  { label: "Total Balance", value: "₹2,450", icon: Wallet, color: "text-success", bg: "bg-success/10" },
  { label: "Total Sales", value: "₹8,200", icon: TrendingUp, color: "text-info", bg: "bg-info/10" },
  { label: "Total Deposit", value: "₹5,000", icon: ArrowDownLeft, color: "text-warning", bg: "bg-warning/10" },
  { label: "Commission", value: "₹320", icon: Users, color: "text-primary", bg: "bg-primary/10" },
];

const Stats = () => {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Statistics</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4"
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Earnings Chart */}
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

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4">
          <h2 className="font-semibold mb-4">Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(152, 69%, 46%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(152, 69%, 46%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Area type="monotone" dataKey="amount" stroke="hsl(152, 69%, 46%)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Stats;
