import { motion } from "framer-motion";
import { MessageSquare, Plus, ChevronRight } from "lucide-react";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "closed";
  date: string;
  lastMessage: string;
}

const Support = () => {
  const [showForm, setShowForm] = useState(false);
  const [tickets] = useState<Ticket[]>([
    { id: "T-1001", subject: "Withdrawal not received", status: "open", date: "31 Mar", lastMessage: "We are looking into this..." },
    { id: "T-1000", subject: "Referral not credited", status: "closed", date: "28 Mar", lastMessage: "Issue has been resolved." },
  ]);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Need help? We're here.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-primary-foreground gap-1"
        >
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>

      <div className="px-5 space-y-5">
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
            <Input placeholder="Subject" className="bg-secondary border-border/50 h-11" />
            <Textarea placeholder="Describe your issue..." className="bg-secondary border-border/50 min-h-[100px]" />
            <Button className="w-full gradient-primary text-primary-foreground font-semibold">Submit Ticket</Button>
          </motion.div>
        )}

        <div className="space-y-2.5">
          {tickets.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    ticket.status === "open" ? "bg-success/10" : "bg-muted"
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${ticket.status === "open" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{ticket.id} · {ticket.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ticket.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {ticket.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 pl-12">{ticket.lastMessage}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Support;
