import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, CreditCard, Plus, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SavedPaymentMethods = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [label, setLabel] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const { data: methods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      let details = "";
      let type = "";
      if (addType === "upi") {
        if (!upiId.trim()) throw new Error("UPI ID दर्ज करें");
        type = "UPI";
        details = upiId.trim();
      } else {
        if (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim())
          throw new Error("सभी bank details भरें");
        type = "Bank";
        details = JSON.stringify({
          holder: accountHolder.trim(),
          account: accountNumber.trim(),
          ifsc: ifsc.trim(),
        });
      }
      const { error } = await supabase.from("payment_methods").insert({
        user_id: user.id,
        type,
        label: label.trim() || (addType === "upi" ? `UPI - ${upiId.trim()}` : `Bank - ${accountHolder.trim()}`),
        details,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method saved!");
      resetAddForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Payment method removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetAddForm = () => {
    setShowAddForm(false);
    setUpiId("");
    setLabel("");
    setAccountHolder("");
    setAccountNumber("");
    setIfsc("");
    setAddType("upi");
  };

  const getDisplayDetails = (method: typeof methods[0]) => {
    if (method.type === "UPI") return method.details;
    try {
      const d = JSON.parse(method.details);
      return `A/C: ****${d.account.slice(-4)} | ${d.ifsc}`;
    } catch {
      return method.details;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Saved Payment Methods</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"
        >
          {showAddForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAddForm ? "Cancel" : "Add"}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="glass-card p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddType("upi")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    addType === "upi" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> UPI
                </button>
                <button
                  onClick={() => setAddType("bank")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    addType === "bank" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Bank
                </button>
              </div>

              <Input
                placeholder="Label (optional) e.g. My PhonePe"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-11 bg-muted/50 border-border/60"
                maxLength={50}
              />

              {addType === "upi" ? (
                <Input
                  placeholder="UPI ID e.g. name@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="h-11 bg-muted/50 border-border/60"
                  maxLength={100}
                />
              ) : (
                <div className="space-y-2">
                  <Input placeholder="Account Holder Name" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="h-11 bg-muted/50 border-border/60" maxLength={100} />
                  <Input placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="h-11 bg-muted/50 border-border/60" maxLength={20} />
                  <Input placeholder="IFSC Code" value={ifsc} onChange={(e) => setIfsc(e.target.value)} className="h-11 bg-muted/50 border-border/60" maxLength={11} />
                </div>
              )}

              <Button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending}
                className="w-full h-10 gradient-primary text-primary-foreground font-semibold"
              >
                {addMutation.isPending ? "Saving..." : "Save Payment Method"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {methods.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground text-center py-4 glass-card rounded-xl">
            No saved methods. Tap "Add" to save UPI or Bank account.
          </p>
        )}
        {methods.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                m.type === "UPI" ? "bg-info/10" : "bg-accent/10"
              }`}>
                {m.type === "UPI" ? (
                  <Smartphone className="w-4 h-4 text-info" />
                ) : (
                  <CreditCard className="w-4 h-4 text-accent-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{getDisplayDetails(m)}</p>
              </div>
            </div>
            <button
              onClick={() => deleteMutation.mutate(m.id)}
              disabled={deleteMutation.isPending}
              className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SavedPaymentMethods;
