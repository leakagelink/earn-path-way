import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Copy, Check } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const WalletPage = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "withdraw" | "earnings">("all");

  const transactions = [
    { type: "deposit", amount: "+₹500", date: "31 Mar, 2:30 PM", status: "Completed", method: "UPI" },
    { type: "earnings", amount: "+₹16", date: "31 Mar, 1:15 PM", status: "Credited", method: "Offer" },
    { type: "withdraw", amount: "-₹200", date: "30 Mar, 5:00 PM", status: "Pending", method: "Bank" },
    { type: "deposit", amount: "+₹1,000", date: "29 Mar, 10:00 AM", status: "Completed", method: "UPI" },
    { type: "earnings", amount: "+₹32", date: "28 Mar, 3:00 PM", status: "Credited", method: "Referral" },
    { type: "withdraw", amount: "-₹350", date: "27 Mar, 12:00 PM", status: "Completed", method: "Bank" },
  ];

  const filtered = activeTab === "all" ? transactions : transactions.filter(t => t.type === activeTab);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = ["all", "deposit", "withdraw", "earnings"] as const;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Wallet</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-gradient">₹2,450.00</p>
          <div className="flex gap-3 mt-4">
            <button className="flex-1 h-10 gradient-primary rounded-lg text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
              <ArrowDownLeft className="w-4 h-4" /> Deposit
            </button>
            <button className="flex-1 h-10 bg-secondary rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <div>
          <h2 className="font-semibold mb-3">Payment Methods</h2>
          <div className="space-y-2.5">
            <div className="glass-card p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-info/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-sm font-medium">UPI ID</p>
                  <p className="text-xs text-muted-foreground">john@paytm</p>
                </div>
              </div>
              <button onClick={handleCopy} className="text-muted-foreground">
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="glass-card p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">Bank Account</p>
                <p className="text-xs text-muted-foreground">HDFC •••• 4521</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="font-semibold mb-3">Transaction History</h2>
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-2.5">
            {filtered.map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    tx.type === "deposit" ? "bg-success/10" : tx.type === "earnings" ? "bg-info/10" : "bg-warning/10"
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
                  <p className="text-xs text-muted-foreground">{tx.method}</p>
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

export default WalletPage;
