import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Smartphone, Copy, Check, X, IndianRupee } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FormMode = null | "deposit" | "withdraw";

const WalletPage = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "withdraw" | "earning">("all");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank">("upi");

  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = activeTab === "all" ? transactions : transactions.filter(t => t.type === activeTab);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error("Enter a valid amount");
      if (numAmount < 100) throw new Error("Minimum amount is ₹100");

      let method = "";
      let description = "";

      if (formMode === "deposit") {
        if (paymentMethod === "upi") {
          if (!upiId.trim()) throw new Error("Enter UPI ID");
          method = "UPI";
          description = `Deposit via UPI: ${upiId.trim()}`;
        } else {
          if (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim()) throw new Error("Fill all bank details");
          method = "Bank Transfer";
          description = `Deposit via Bank: ${accountHolder.trim()} | A/C: ${accountNumber.trim()} | IFSC: ${ifsc.trim()}`;
        }
      } else {
        if (paymentMethod === "upi") {
          if (!upiId.trim()) throw new Error("Enter UPI ID for withdrawal");
          method = "UPI";
          description = `Withdraw to UPI: ${upiId.trim()}`;
        } else {
          if (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim()) throw new Error("Fill all bank details");
          method = "Bank Transfer";
          description = `Withdraw to Bank: ${accountHolder.trim()} | A/C: ${accountNumber.trim()} | IFSC: ${ifsc.trim()}`;
        }
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: formMode!,
        amount: numAmount,
        method,
        description,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success(`${formMode === "deposit" ? "Deposit" : "Withdrawal"} request submitted! Awaiting admin approval.`);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setFormMode(null);
    setAmount("");
    setUpiId("");
    setAccountHolder("");
    setAccountNumber("");
    setIfsc("");
    setPaymentMethod("upi");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = ["all", "deposit", "withdraw", "earning"] as const;
  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Wallet</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-gradient">₹{(profile?.balance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => { resetForm(); setFormMode("deposit"); }}
              className="flex-1 h-10 gradient-primary text-primary-foreground font-semibold text-sm gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" /> Deposit
            </Button>
            <Button
              onClick={() => { resetForm(); setFormMode("withdraw"); }}
              variant="secondary"
              className="flex-1 h-10 font-semibold text-sm gap-2"
            >
              <ArrowUpRight className="w-4 h-4" /> Withdraw
            </Button>
          </div>
        </motion.div>

        {/* Deposit / Withdraw Form */}
        <AnimatePresence>
          {formMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base">
                    {formMode === "deposit" ? "💰 Deposit Request" : "💸 Withdrawal Request"}
                  </h2>
                  <button onClick={resetForm} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter amount (min ₹100)"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="pl-9 h-12 bg-muted/50 border-border/60"
                      min={100}
                    />
                  </div>
                  <div className="flex gap-2">
                    {quickAmounts.map(qa => (
                      <button
                        key={qa}
                        onClick={() => setAmount(qa.toString())}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          amount === qa.toString()
                            ? "gradient-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        ₹{qa.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Toggle */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">Payment Method</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod("upi")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        paymentMethod === "upi" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> UPI
                    </button>
                    <button
                      onClick={() => setPaymentMethod("bank")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        paymentMethod === "bank" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Bank
                    </button>
                  </div>
                </div>

                {/* Payment Details */}
                {paymentMethod === "upi" ? (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">UPI ID</label>
                    <Input
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="h-12 bg-muted/50 border-border/60"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Account Holder Name</label>
                      <Input
                        placeholder="Full name"
                        value={accountHolder}
                        onChange={e => setAccountHolder(e.target.value)}
                        className="h-12 bg-muted/50 border-border/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Account Number</label>
                      <Input
                        placeholder="Account number"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        className="h-12 bg-muted/50 border-border/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">IFSC Code</label>
                      <Input
                        placeholder="IFSC code"
                        value={ifsc}
                        onChange={e => setIfsc(e.target.value)}
                        className="h-12 bg-muted/50 border-border/60"
                        maxLength={11}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base shadow-md shadow-primary/20"
                >
                  {submitMutation.isPending
                    ? "Submitting..."
                    : `Submit ${formMode === "deposit" ? "Deposit" : "Withdrawal"} Request`}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {formMode === "deposit"
                    ? "Your deposit will be credited after admin verification."
                    : "Withdrawals are processed within 24-48 hours."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction History */}
        <div>
          <h2 className="font-semibold mb-3">Transaction History</h2>
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
                  <p className={`text-xs capitalize ${
                    tx.status === "completed" ? "text-success" : tx.status === "rejected" ? "text-destructive" : "text-muted-foreground"
                  }`}>{tx.status}</p>
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
