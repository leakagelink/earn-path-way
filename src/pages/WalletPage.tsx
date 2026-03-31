import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const WalletPage = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "withdraw" | "earning">("all");
  const { profile } = useAuth();

  const { data: transactions = [] } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_methods").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = activeTab === "all" ? transactions : transactions.filter(t => t.type === activeTab);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = ["all", "deposit", "withdraw", "earning"] as const;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Wallet</h1>
      </div>

      <div className="px-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-gradient">₹{(profile?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <div className="flex gap-3 mt-4">
            <button className="flex-1 h-10 gradient-primary rounded-lg text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2">
              <ArrowDownLeft className="w-4 h-4" /> Deposit
            </button>
            <button className="flex-1 h-10 bg-secondary rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </motion.div>

        {paymentMethods.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Payment Methods</h2>
            <div className="space-y-2.5">
              {paymentMethods.map(pm => (
                <div key={pm.id} className="glass-card p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-info/10 flex items-center justify-center">
                      {pm.type === "upi" ? <Smartphone className="w-4 h-4 text-info" /> : <CreditCard className="w-4 h-4 text-warning" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.details}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(pm.details)} className="text-muted-foreground">
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-semibold mb-3">Transaction History</h2>
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-2.5">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions</p>}
            {filtered.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="glass-card p-3.5 flex items-center justify-between">
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
                  <p className="text-xs text-muted-foreground capitalize">{tx.method || tx.status}</p>
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
