import { motion } from "framer-motion";
import { MessageSquare, Plus, ArrowLeft, Send, User, Shield } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  user_id: string;
}

interface TicketMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_admin: boolean;
}

const Support = () => {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      return (data || []) as Ticket[];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ticket-messages", selectedTicket?.id],
    enabled: !!selectedTicket,
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", selectedTicket!.id)
        .order("created_at", { ascending: true });

      const senderIds = [...new Set((data || []).map(m => m.sender_id))];
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", senderIds)
        .eq("role", "admin");

      const adminSet = new Set((roles || []).map(r => r.user_id));

      return (data || []).map(m => ({
        ...m,
        is_admin: adminSet.has(m.sender_id),
      })) as TicketMessage[];
    },
    refetchInterval: 5000,
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

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply.trim() || !selectedTicket) return;
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user!.id,
        message: reply.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", selectedTicket?.id] });
      setReply("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Conversation view
  if (selectedTicket) {
    return (
      <div className="min-h-screen flex flex-col pb-24">
        <div className="px-5 pt-12 pb-3 flex items-center gap-3 border-b border-border/50">
          <button onClick={() => setSelectedTicket(null)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{selectedTicket.subject}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              selectedTicket.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            }`}>
              {selectedTicket.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.is_admin
                  ? "bg-secondary rounded-bl-md"
                  : "bg-primary text-primary-foreground rounded-br-md"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.is_admin ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  <span className="text-[10px] font-medium opacity-70">
                    {msg.is_admin ? "Support" : "You"}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.is_admin ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                  {new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </p>
              </div>
            </motion.div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation below.</p>
          )}
        </div>

        {selectedTicket.status === "open" && (
          <div className="px-5 py-3 border-t border-border/50 flex gap-2 mb-16">
            <Input
              placeholder="Type a message..."
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && reply.trim() && sendReply.mutate()}
              className="bg-secondary border-border/50 h-11"
            />
            <Button
              onClick={() => sendReply.mutate()}
              disabled={!reply.trim() || sendReply.isPending}
              className="gradient-primary text-primary-foreground h-11 px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        <BottomNav />
      </div>
    );
  }

  // Ticket list view
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
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedTicket(ticket)}
              className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-colors"
            >
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
