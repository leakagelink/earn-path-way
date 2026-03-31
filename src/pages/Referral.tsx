import { motion } from "framer-motion";
import { Copy, Check, Users, TrendingUp, Share2, UserPlus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Referral = () => {
  const [copied, setCopied] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: referrals = [] } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const { data } = await supabase.from("referrals").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch referred user profiles
  const { data: referredProfiles = [] } = useQuery({
    queryKey: ["referred-profiles", referrals],
    enabled: referrals.length > 0,
    queryFn: async () => {
      const referredIds = [...new Set(referrals.map(r => r.referred_id))];
      if (referredIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name, email, created_at").in("user_id", referredIds);
      return data || [];
    },
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ["commission-transactions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount, description, created_at, status")
        .eq("type", "commission")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", 1).single();
      return data;
    },
  });

  const totalEarned = commissions.filter(c => c.status === "completed").reduce((s, t) => s + Number(t.amount), 0);
  const pendingEarnings = commissions.filter(c => c.status === "pending").reduce((s, t) => s + Number(t.amount), 0);
  const referralCode = profile?.referral_code || "";
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : "";

  const l1Rate = appSettings?.referral_level1_rate ?? 5;
  const l2Rate = appSettings?.referral_level2_rate ?? 3;
  const l3Rate = appSettings?.referral_level3_rate ?? 1;

  const levels = [
    { level: 1, rate: `${l1Rate}%`, referrals: referrals.filter(r => r.level === 1) },
    { level: 2, rate: `${l2Rate}%`, referrals: referrals.filter(r => r.level === 2) },
    { level: 3, rate: `${l3Rate}%`, referrals: referrals.filter(r => r.level === 3) },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `Join Good Wallet and start earning! Use my referral code: ${referralCode}\n\nSign up here: ${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Good Wallet Referral", text: shareText });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const getProfileForUser = (userId: string) => referredProfiles.find(p => p.user_id === userId);
  const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Referral Program</h1>
          <p className="text-sm text-muted-foreground">Invite friends, earn rewards</p>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-3 text-center">
            <Users className="w-5 h-5 text-info mx-auto mb-1" />
            <p className="text-lg font-bold">{referrals.length}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-3 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold">₹{totalEarned.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card p-3 text-center">
            <TrendingUp className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold">₹{pendingEarnings.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </motion.div>
        </div>

        {/* Referral Code & Share */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 space-y-3">
          <p className="text-sm font-semibold">Your Referral Code</p>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
            <p className="text-base font-bold tracking-widest flex-1">{referralCode || "..."}</p>
            <button onClick={handleCopy} className="text-primary shrink-0">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <Button onClick={handleShare} className="w-full h-11 gradient-primary text-primary-foreground font-semibold gap-2">
            <Share2 className="w-4 h-4" /> Share Referral Link
          </Button>
        </motion.div>

        {/* Commission Levels */}
        <div>
          <h2 className="font-semibold mb-3">Commission Levels</h2>
          <div className="space-y-2.5">
            {levels.map((l, i) => (
              <motion.div
                key={l.level}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground ${
                    l.level === 1 ? "gradient-primary" : l.level === 2 ? "bg-info" : "bg-warning"
                  }`}>
                    L{l.level}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Level {l.level}</p>
                    <p className="text-xs text-muted-foreground">{l.rate} commission</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{l.referrals.length}</p>
                  <p className="text-xs text-muted-foreground">users</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Referred Users List */}
        <div>
          <h2 className="font-semibold mb-3">Referred Users</h2>
          <div className="space-y-2.5">
            {referrals.length === 0 && (
              <div className="glass-card p-6 text-center">
                <UserPlus className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No referrals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your code to start earning!</p>
              </div>
            )}
            {referrals.map((ref, i) => {
              const refProfile = getProfileForUser(ref.referred_id);
              const name = refProfile?.full_name || "User";
              const email = refProfile?.email || "";
              const date = new Date(ref.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              return (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="glass-card p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {getInitials(name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    ref.level === 1 ? "bg-primary/10 text-primary" : ref.level === 2 ? "bg-info/10 text-info" : "bg-warning/10 text-warning"
                  }`}>
                    Level {ref.level}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Commissions */}
        {commissions.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Recent Commissions</h2>
            <div className="space-y-2.5">
              {commissions.slice(0, 10).map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{c.description || "Commission"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success">+₹{Number(c.amount).toLocaleString("en-IN")}</p>
                    <p className={`text-xs capitalize ${c.status === "completed" ? "text-success" : "text-muted-foreground"}`}>{c.status}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Referral;
