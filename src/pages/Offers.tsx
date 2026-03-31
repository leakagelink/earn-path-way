import { motion } from "framer-motion";
import { Gift, Check, Clock } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

interface Offer {
  id: number;
  amount: number;
  income: number;
  code: string;
  claimed: boolean;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([
    { id: 1, amount: 400, income: 16, code: "GW-8F3K2", claimed: false },
    { id: 2, amount: 800, income: 32, code: "GW-9A1L7", claimed: true },
    { id: 3, amount: 1200, income: 48, code: "GW-4D6M9", claimed: false },
    { id: 4, amount: 2000, income: 80, code: "GW-7B2N5", claimed: false },
  ]);

  const handleClaim = (id: number) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, claimed: true } : o));
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">Claim offers to earn income</p>
      </div>

      <div className="px-5 space-y-3">
        {offers.map((offer, i) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  offer.claimed ? "bg-muted" : "gradient-primary shadow-md shadow-primary/20"
                }`}>
                  <Gift className={`w-5 h-5 ${offer.claimed ? "text-muted-foreground" : "text-primary-foreground"}`} />
                </div>
                <div>
                  <p className="font-semibold">₹{offer.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Code: {offer.code}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-success font-bold text-sm">+₹{offer.income}</span>
                <p className="text-xs text-muted-foreground">income</p>
              </div>
            </div>
            <div className="mt-3">
              {offer.claimed ? (
                <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-muted text-muted-foreground text-sm">
                  <Check className="w-4 h-4" /> Claimed
                </div>
              ) : (
                <Button
                  onClick={() => handleClaim(offer.id)}
                  className="w-full gradient-primary text-primary-foreground font-semibold shadow-md shadow-primary/20"
                >
                  Claim Offer
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Offers;
