import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Gift, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Offer {
  id: number;
  amount: number;
  income: number;
  code: string;
}

const generateCode = () => `GW-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

const AdminOffers = () => {
  const [offers, setOffers] = useState<Offer[]>([
    { id: 1, amount: 400, income: 16, code: "GW-8F3K2" },
    { id: 2, amount: 800, income: 32, code: "GW-9A1L7" },
    { id: 3, amount: 1200, income: 48, code: "GW-4D6M9" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [income, setIncome] = useState("");

  const handleSave = () => {
    if (!amount || !income) return;
    if (editId !== null) {
      setOffers(prev => prev.map(o => o.id === editId ? { ...o, amount: Number(amount), income: Number(income) } : o));
      setEditId(null);
    } else {
      setOffers(prev => [...prev, { id: Date.now(), amount: Number(amount), income: Number(income), code: generateCode() }]);
    }
    setAmount("");
    setIncome("");
    setShowForm(false);
  };

  const handleEdit = (offer: Offer) => {
    setEditId(offer.id);
    setAmount(String(offer.amount));
    setIncome(String(offer.income));
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setOffers(prev => prev.filter(o => o.id !== id));
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
            <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground font-semibold">
              {editId ? "Update Offer" : "Create Offer"}
            </Button>
          </motion.div>
        )}

        <div className="space-y-2.5">
          {offers.map((offer, i) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <Gift className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold">₹{offer.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{offer.code} · +₹{offer.income} income</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(offer)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(offer.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
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
