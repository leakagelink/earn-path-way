import { motion } from "framer-motion";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminTransactions = () => {
  const [filter, setFilter] = useState<"pending" | "completed" | "rejected" | "all">("pending");
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch user profiles for display
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, balance");
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, userId, amount, type }: { id: string; status: "completed" | "rejected"; userId: string; amount: number; type: string }) => {
      // Update transaction status
      const { error } = await supabase.from("transactions").update({ status }).eq("id", id);
      if (error) throw error;

      // If approving a deposit, add to user balance
      if (status === "completed" && type === "deposit") {
        const profile = profiles.find(p => p.user_id === userId);
        if (profile) {
          const { error: balErr } = await supabase
            .from("profiles")
            .update({ balance: Number(profile.balance) + amount })
            .eq("user_id", userId);
          if (balErr) throw balErr;
        }
      }

      // If approving a withdrawal, deduct from user balance
      if (status === "completed" && type === "withdraw") {
        const profile = profiles.find(p => p.user_id === userId);
        if (profile) {
          if (Number(profile.balance) < amount) throw new Error("User has insufficient balance");
          const { error: balErr } = await supabase
            .from("profiles")
            .update({ balance: Number(profile.balance) - amount })
            .eq("user_id", userId);
          if (balErr) throw balErr;
        }
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`Transaction ${vars.status}!`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = filter === "all" ? transactions : transactions.filter(t => t.status === filter);
  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);
  const tabs = ["pending", "completed", "rejected", "all"] as const;

  const pendingCount = transactions.filter(t => t.status === "pending").length;

  return (
    <div className="min-h-screen pb-8">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <Link to="/admin" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{pendingCount} pending requests</p>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                filter === tab ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {tab} {tab === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No {filter} transactions</p>
          )}
          {filtered.map((tx, i) => {
            const userProfile = getProfile(tx.user_id);
            const isPending = tx.status === "pending";
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === "deposit" ? "bg-success/10" : tx.type === "withdraw" ? "bg-warning/10" : "bg-info/10"
                    }`}>
                      {tx.type === "withdraw"
                        ? <ArrowUpRight className="w-5 h-5 text-warning" />
                        : <ArrowDownLeft className="w-5 h-5 text-success" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize">{tx.type}</p>
                      <p className="text-xs text-muted-foreground">{userProfile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{userProfile?.email || ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${tx.type === "withdraw" ? "text-warning" : "text-success"}`}>
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${
                      tx.status === "completed" ? "bg-success/10 text-success"
                      : tx.status === "rejected" ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                {tx.description && (
                  <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">{tx.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Method: {tx.method || "N/A"}</span>
                  <span>{new Date(tx.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                {/* Action Buttons */}
                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({
                        id: tx.id,
                        status: "completed",
                        userId: tx.user_id,
                        amount: Number(tx.amount),
                        type: tx.type,
                      })}
                      disabled={updateMutation.isPending}
                      className="flex-1 h-9 gradient-primary text-primary-foreground font-semibold gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateMutation.mutate({
                        id: tx.id,
                        status: "rejected",
                        userId: tx.user_id,
                        amount: Number(tx.amount),
                        type: tx.type,
                      })}
                      disabled={updateMutation.isPending}
                      className="flex-1 h-9 font-semibold gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
