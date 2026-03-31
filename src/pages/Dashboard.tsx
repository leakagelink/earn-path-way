import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Wallet, Bell, Eye, EyeOff, Shield, X, CheckCircle, XCircle, Clock, Gift, Check } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: offers = [] } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data } = await supabase.from("offers").select("*").eq("is_active", true).order("amount");
      return data || [];
    },
  });

  const { data: claimedIds = [] } = useQuery({
    queryKey: ["claimed-offers"],
    queryFn: async () => {
      const { data } = await supabase.from("claimed_offers").select("offer_id");
      return (data || []).map(c => c.offer_id);
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n: any) => !n.is_read).map((n: any) => n.id);
      if (unreadIds.length === 0) return;
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleClaimOffer = (offer: any) => {
    navigate("/wallet");
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markReadMutation.mutate();
    }
  };

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </Link>
          )}
          <button
            onClick={handleOpenNotifications}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-5 mb-4"
          >
            <div className="glass-card p-4 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button onClick={() => setShowNotifications(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No notifications yet</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div key={n.id} className={`p-3 rounded-lg ${n.is_read ? "bg-muted/50" : "bg-primary/5 border border-primary/10"}`}>
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {n.title.includes("Approved") ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : n.title.includes("Rejected") ? (
                            <XCircle className="w-4 h-4 text-destructive" />
                          ) : (
                            <Clock className="w-4 h-4 text-info" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* Offers Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Available Offers</h2>
            <Link to="/offers" className="text-sm text-primary">View All</Link>
          </div>
          <div className="space-y-2.5">
            {offers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No offers available</p>
            )}
            {offers.slice(0, 4).map((offer, i) => {
              const claimed = claimedIds.includes(offer.id);
              return (
                <motion.div key={offer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${claimed ? "bg-muted" : "gradient-primary shadow-md shadow-primary/20"}`}>
                        <Gift className={`w-5 h-5 ${claimed ? "text-muted-foreground" : "text-primary-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold">₹{Number(offer.amount).toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">Code: {offer.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-success font-bold text-sm">+₹{Number(offer.income)}</span>
                      <p className="text-xs text-muted-foreground">income</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    {claimed ? (
                      <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
                        <Check className="w-4 h-4" /> Claimed
                      </div>
                    ) : (
                      <Button onClick={() => handleClaimOffer(offer)} className="w-full gradient-primary text-primary-foreground font-semibold shadow-md shadow-primary/20">
                        Claim Offer
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
