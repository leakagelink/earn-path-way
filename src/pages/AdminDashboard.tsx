import { motion } from "framer-motion";
import { Users, ArrowDownLeft, ArrowUpRight, TrendingUp, Gift, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: userCount }, { data: txData }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("type, amount, status"),
      ]);
      const completed = (txData || []).filter(t => t.status === "completed");
      const deposits = completed.filter(t => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
      const withdrawals = completed.filter(t => t.type === "withdraw").reduce((s, t) => s + Number(t.amount), 0);
      const earnings = completed.filter(t => t.type === "earning" || t.type === "commission").reduce((s, t) => s + Number(t.amount), 0);
      return { userCount: userCount || 0, deposits, withdrawals, earnings };
    },
  });

  const adminStats = [
    { label: "Total Users", value: (stats?.userCount ?? 0).toLocaleString(), icon: Users, color: "text-info", bg: "bg-info/10" },
    { label: "Total Deposits", value: `₹${(stats?.deposits ?? 0).toLocaleString("en-IN")}`, icon: ArrowDownLeft, color: "text-success", bg: "bg-success/10" },
    { label: "Total Withdrawals", value: `₹${(stats?.withdrawals ?? 0).toLocaleString("en-IN")}`, icon: ArrowUpRight, color: "text-warning", bg: "bg-warning/10" },
    { label: "Total Earnings", value: `₹${(stats?.earnings ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  const adminMenu = [
    { label: "Manage Offers", icon: Gift, to: "/admin/offers", desc: "Create, edit, delete offers" },
    { label: "User Management", icon: Users, to: "#", desc: "View users, edit balances" },
    { label: "Transactions", icon: ArrowUpRight, to: "/admin/transactions", desc: "Approve/reject withdrawals" },
    { label: "Support Tickets", icon: MessageSquare, to: "#", desc: "Reply to user tickets" },
    { label: "Settings", icon: SettingsIcon, to: "#", desc: "Telegram link, referral rates" },
  ];

  return (
    <div className="min-h-screen pb-8">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Admin Panel</p>
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        <Link to="/dashboard" className="text-sm text-primary font-medium">User View →</Link>
      </div>

      <div className="px-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {adminStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-2.5">
            {adminMenu.map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                <Link to={item.to} className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
