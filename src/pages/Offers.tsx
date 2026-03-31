import { motion } from "framer-motion";
import { Gift, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Offers = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Offers</h1>
        <p className="text-sm text-muted-foreground mt-1">Claim offers to earn income</p>
      </div>

      <div className="px-5 space-y-3">
        {offers.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No offers available</p>}
        {offers.map((offer, i) => {
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
                  <Button onClick={() => navigate("/wallet")} className="w-full gradient-primary text-primary-foreground font-semibold shadow-md shadow-primary/20">
                    Claim Offer
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

export default Offers;
