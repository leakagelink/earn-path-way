import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Smartphone, CreditCard, Copy, Check, X, IndianRupee, QrCode, Gift, Clock, BadgePercent } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import SavedPaymentMethods from "@/components/wallet/SavedPaymentMethods";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FormMode = null | "deposit" | "withdraw";

const WalletPage = () => {
  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "withdraw" | "earning">("all");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  // Withdraw fields
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank">("upi");
  const [copiedUpi, setCopiedUpi] = useState(false);

  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", 1).single();
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filtered = activeTab === "all" ? transactions : transactions.filter(t => t.type === activeTab);

  // Calculate cashback stats
  const cashbackStats = useMemo(() => {
    const earnedRewards = transactions
      .filter(t => t.type === "earning" && t.method === "Cashback" && t.status === "completed")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Pending deposits × 5% = pending rewards
    const pendingRewards = transactions
      .filter(t => t.type === "deposit" && t.status === "pending")
      .reduce((sum, t) => sum + Number(t.amount) * 0.05, 0);

    const pendingRounded = Math.round(pendingRewards * 100) / 100;

    return { earnedRewards, pendingRewards: pendingRounded };
  }, [transactions]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error("Enter a valid amount");
      if (numAmount < 100) throw new Error("Minimum amount is ₹100");

      if (formMode === "withdraw") {
        const currentBalance = profile?.balance ?? 0;
        if (currentBalance <= 0) throw new Error("Insufficient balance. You have ₹0 available.");
        if (numAmount > currentBalance) throw new Error(`Insufficient balance. Available: ₹${currentBalance}`);
      }

      let method = "";
      let description = "";

      if (formMode === "deposit") {
        if (!transactionId.trim()) throw new Error("Enter your UTR / Transaction ID");
        method = "UPI";
        description = `Deposit via UPI | UTR: ${transactionId.trim()}`;
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
      queryClient.invalidateQueries({ queryKey: ["recent-transactions"] });
      toast.success(`${formMode === "deposit" ? "Deposit" : "Withdrawal"} request submitted! Awaiting admin approval.`);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setFormMode(null);
    setAmount("");
    setTransactionId("");
    setUpiId("");
    setAccountHolder("");
    setAccountNumber("");
    setIfsc("");
    setPaymentMethod("upi");
  };

  const handleCopyUpi = () => {
    const adminUpi = (appSettings as any)?.admin_upi_id || "";
    if (adminUpi) {
      navigator.clipboard.writeText(adminUpi);
      setCopiedUpi(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const tabs = ["all", "deposit", "withdraw", "earning"] as const;
  const quickAmounts = [500, 1000, 2000, 5000];
  const adminUpi = (appSettings as any)?.admin_upi_id || "Not set";
  const adminQr = (appSettings as any)?.admin_qr_url || "";

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Payment</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Cashback Reward Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <BadgePercent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">5% Cashback</p>
                <p className="text-xs text-muted-foreground">On every deposit</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 text-center border border-border/30">
                <IndianRupee className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-base font-bold text-foreground">
                  ₹{((profile?.balance ?? 0)).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">Balance</p>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 text-center border border-success/20">
                <Gift className="w-4 h-4 text-success mx-auto mb-1" />
                <p className="text-base font-bold text-success">
                  ₹{cashbackStats.earnedRewards.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">Earned</p>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-xl p-3 text-center border border-warning/20">
                <Clock className="w-4 h-4 text-warning mx-auto mb-1" />
                <p className="text-base font-bold text-warning">
                  ₹{cashbackStats.pendingRewards.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">Pending</p>
              </div>
            </div>
          </div>
        </motion.div>

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
              onClick={() => {
                if ((profile?.balance ?? 0) <= 0) {
                  toast.error("Insufficient balance. You have ₹0 available.");
                  return;
                }
                resetForm(); setFormMode("withdraw");
              }}
              variant="secondary"
              className="flex-1 h-10 font-semibold text-sm gap-2"
            >
              <ArrowUpRight className="w-4 h-4" /> Withdraw
            </Button>
          </div>
        </motion.div>

        {/* Deposit / Withdraw Form */}
        <AnimatePresence>
          {formMode === "deposit" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base">💰 Deposit</h2>
                  <button onClick={resetForm} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Step 1: Amount */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">1. Enter Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Min ₹100"
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
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        ₹{qa.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Pay to admin UPI */}
                <div className="space-y-3">
                  <label className="text-sm text-muted-foreground font-medium">2. Send payment to this UPI</label>
                  <div className="bg-muted rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">UPI ID</p>
                        <p className="text-sm font-bold">{adminUpi}</p>
                      </div>
                      <button onClick={handleCopyUpi} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                        {copiedUpi ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedUpi ? "Copied" : "Copy"}
                      </button>
                    </div>
                    {adminQr && (
                      <div className="flex flex-col items-center gap-2 pt-2 border-t border-border/50">
                        <QrCode className="w-5 h-5 text-muted-foreground" />
                        <img src={adminQr} alt="QR Code" className="w-40 h-40 rounded-lg border border-border/50 object-contain bg-white" />
                        <p className="text-xs text-muted-foreground">Scan to pay</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Enter Transaction ID */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">3. Enter UTR / Transaction ID</label>
                  <Input
                    placeholder="e.g. 412345678901"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    className="h-12 bg-muted/50 border-border/60"
                  />
                  <p className="text-xs text-muted-foreground">You'll find this in your UPI app payment history</p>
                </div>

                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base shadow-md shadow-primary/20"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Deposit Request"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your deposit will be verified & credited within minutes.
                </p>
              </div>
            </motion.div>
          )}

          {formMode === "withdraw" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-base">💸 Withdrawal</h2>
                  <button onClick={resetForm} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Min ₹100"
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
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        ₹{qa.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground font-medium">Withdraw To</label>
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

                {paymentMethod === "upi" ? (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground font-medium">Your UPI ID</label>
                    <Input placeholder="yourname@upi" value={upiId} onChange={e => setUpiId(e.target.value)} className="h-12 bg-muted/50 border-border/60" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Account Holder Name</label>
                      <Input placeholder="Full name" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="h-12 bg-muted/50 border-border/60" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Account Number</label>
                      <Input placeholder="Account number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-12 bg-muted/50 border-border/60" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">IFSC Code</label>
                      <Input placeholder="IFSC code" value={ifsc} onChange={e => setIfsc(e.target.value)} className="h-12 bg-muted/50 border-border/60" maxLength={11} />
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base shadow-md shadow-primary/20"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Withdrawals are processed within 24-48 hours.
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
