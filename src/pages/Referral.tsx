import { motion } from "framer-motion";
import { Copy, Check, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const levels = [
  { level: 1, rate: "5%", referrals: 12, earnings: "₹180" },
  { level: 2, rate: "3%", referrals: 8, earnings: "₹96" },
  { level: 3, rate: "1%", referrals: 3, earnings: "₹24" },
];

const Referral = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://goodwallet.app/ref/JOHN2024";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Referral Program</h1>
        <p className="text-sm text-muted-foreground mt-1">Invite friends, earn rewards</p>
      </div>

      <div className="px-5 space-y-5">
        {/* Stats */}
        <div className="flex gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 glass-card p-4 text-center">
            <Users className="w-5 h-5 text-info mx-auto mb-1" />
            <p className="text-lg font-bold">23</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 glass-card p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-lg font-bold">₹300</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </motion.div>
        </div>

        {/* Referral Link */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
          <p className="text-sm font-medium mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2.5">
            <p className="text-xs text-muted-foreground flex-1 truncate">{referralLink}</p>
            <button onClick={handleCopy} className="text-primary shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Levels */}
        <div>
          <h2 className="font-semibold mb-3">Earnings by Level</h2>
          <div className="space-y-2.5">
            {levels.map((l, i) => (
              <motion.div
                key={l.level}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    L{l.level}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Level {l.level} ({l.rate})</p>
                    <p className="text-xs text-muted-foreground">{l.referrals} referrals</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-success">{l.earnings}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Referral;
