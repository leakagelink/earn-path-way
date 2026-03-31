import { motion } from "framer-motion";
import { MessageSquare, Plus, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Support = () => {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: ticket, error } = await supabase.from("tickets").insert({ subject, user_id: user!.id }).select().single();
      if (error) throw error;
      if (message) {
        await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, sender_id: user!.id, message });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setSubject("");
      setMessage("");
      setShowForm(false);
      toast.success("Ticket created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Need help? We're here.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gradient-primary text-primary-foreground gap-1">
          <Plus className="w-4 h-4" /> New
        </Button>
      </div>

      <div className="px-5 space-y-5">
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-3">
            <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="bg-secondary border-border/50 h-11" />
            <Textarea placeholder="Describe your issue..." value={message} onChange={e => setMessage(e.target.value)} className="bg-secondary border-border/50 min-h-[100px]" />
            <Button onClick={() => createTicket.mutate()} disabled={!subject || createTicket.isPending} className="w-full gradient-primary text-primary-foreground font-semibold">
              Submit Ticket
            </Button>
          </motion.div>
        )}

        <div className="space-y-2.5">
          {tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tickets yet</p>}
          {tickets.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${ticket.status === "open" ? "bg-success/10" : "bg-muted"}`}>
                    <MessageSquare className={`w-4 h-4 ${ticket.status === "open" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ticket.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                  {ticket.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Support;
