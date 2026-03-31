import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Gift, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminOffers = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [income, setIncome] = useState("");

  const { data: offers = [] } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("offers").update({ amount: Number(amount), income: Number(income) }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("offers").insert({ amount: Number(amount), income: Number(income) });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      setAmount("");
      setIncome("");
      setEditId(null);
      setShowForm(false);
      toast.success(editId ? "Offer updated!" : "Offer created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      toast.success("Offer deleted!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleEdit = (offer: any) => {
    setEditId(offer.id);
    setAmount(String(offer.amount));
    setIncome(String(offer.income));
    setShowForm(true);
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold">Manage Offers</h1>
        </div>
        <Button size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setAmount(""); setIncome(""); }} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="px-5 space-y-4">
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
            <Input type="number" placeholder="Amount (e.g. 400)" value={amount} onChange={e => setAmount(e.target.value)} className="bg-secondary border-border/50 h-11" />
            <Input type="number" placeholder="Income (e.g. 16)" value={income} onChange={e => setIncome(e.target.value)} className="bg-secondary border-border/50 h-11" />
            <Button onClick={() => saveMutation.mutate()} disabled={!amount || !income || saveMutation.isPending} className="w-full gradient-primary text-primary-foreground font-semibold">
              {editId ? "Update Offer" : "Create Offer"}
            </Button>
          </motion.div>
        )}

        <div className="space-y-2.5">
          {offers.map((offer, i) => (
            <motion.div key={offer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <Gift className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">₹{Number(offer.amount).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">{offer.code} · +₹{Number(offer.income)} income</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(offer)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteMutation.mutate(offer.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOffers;
