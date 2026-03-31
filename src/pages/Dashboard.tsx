import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Wallet, Bell, Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const { profile } = useAuth();

  const { data: transactions = [] } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: totals } = useQuery({
    queryKey: ["transaction-totals"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("type, amount, status");
      const completed = (data || []).filter(t => t.status === "completed");
      const deposit = completed.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
      const withdraw = completed.filter(t => t.type === "withdraw").reduce((s, t) => s + Number(t.amount), 0);
      return { deposit, withdraw };
    },
  });

  const quickActions = [
    { icon: ArrowDownLeft, label: "Deposit", color: "text-success", to: "/wallet" },
    { icon: ArrowUpRight, label: "Withdraw", color: "text-warning", to: "/wallet" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-xl font-bold">{profile?.full_name || "User"}</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="gradient-primary rounded-2xl p-5 shadow-xl shadow-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80 font-medium">Available Balance</span>
            </div>
            <button onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <Eye className="w-5 h-5 text-primary-foreground/70" /> : <EyeOff className="w-5 h-5 text-primary-foreground/70" />}
            </button>
          </div>
          <p className="text-3xl font-bold text-primary-foreground">
            {showBalance ? `₹${(profile?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "••••••"}
          </p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-primary-foreground/60">Total Deposit</p>
              <p className="text-sm font-semibold text-primary-foreground">₹{(totals?.deposit ?? 0).toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/60">Total Withdraw</p>
              <p className="text-sm font-semibold text-primary-foreground">₹{(totals?.withdraw ?? 0).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-3">
          {quickActions.map(({ icon: Icon, label, color, to }) => (
            <Link key={label} to={to} className="flex-1 glass-card p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link to="/wallet" className="text-sm text-primary">View All</Link>
          </div>
          <div className="space-y-2.5">
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            )}
            {transactions.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === "deposit" ? "bg-success/10" : tx.type === "earning" || tx.type === "commission" ? "bg-info/10" : "bg-warning/10"
                  }`}>
                    {tx.type === "withdraw" ? <ArrowUpRight className="w-4 h-4 text-warning" /> : <ArrowDownLeft className="w-4 h-4 text-success" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.type === "withdraw" ? "text-warning" : "text-success"}`}>
                    {tx.type === "withdraw" ? "-" : "+"}₹{Number(tx.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
