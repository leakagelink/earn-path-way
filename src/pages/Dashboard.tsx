import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Wallet, Bell, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);

  const quickActions = [
    { icon: ArrowDownLeft, label: "Deposit", color: "text-success", to: "/wallet" },
    { icon: ArrowUpRight, label: "Withdraw", color: "text-warning", to: "/wallet" },
  ];

  const recentTx = [
    { type: "deposit", amount: "+₹500", date: "Today, 2:30 PM", status: "Completed" },
    { type: "earning", amount: "+₹16", date: "Today, 1:15 PM", status: "Credited" },
    { type: "withdraw", amount: "-₹200", date: "Yesterday", status: "Pending" },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back</p>
          <h1 className="text-xl font-bold">John Doe</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-card" />
        </button>
      </div>

      <div className="px-5 space-y-5">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary rounded-2xl p-5 shadow-xl shadow-primary/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80 font-medium">Available Balance</span>
            </div>
            <button onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? (
                <Eye className="w-5 h-5 text-primary-foreground/70" />
              ) : (
                <EyeOff className="w-5 h-5 text-primary-foreground/70" />
              )}
            </button>
          </div>
          <p className="text-3xl font-bold text-primary-foreground">
            {showBalance ? "₹2,450.00" : "••••••"}
          </p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-primary-foreground/60">Total Deposit</p>
              <p className="text-sm font-semibold text-primary-foreground">₹5,000</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/60">Total Withdraw</p>
              <p className="text-sm font-semibold text-primary-foreground">₹2,550</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          {quickActions.map(({ icon: Icon, label, color, to }) => (
            <Link
              key={label}
              to={to}
              className="flex-1 glass-card p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent Activity</h2>
            <Link to="/wallet" className="text-sm text-primary">View All</Link>
          </div>
          <div className="space-y-2.5">
            {recentTx.map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === "deposit" ? "bg-success/10" : tx.type === "earning" ? "bg-info/10" : "bg-warning/10"
                  }`}>
                    {tx.type === "withdraw" ? (
                      <ArrowUpRight className="w-4 h-4 text-warning" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${tx.amount.startsWith("+") ? "text-success" : "text-warning"}`}>
                    {tx.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.status}</p>
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
