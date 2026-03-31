import { motion } from "framer-motion";
import { MessageSquare, ArrowLeft, Send, User, Shield } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "closed";
  created_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  message_count?: number;
}

interface TicketMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
  is_admin: boolean;
}

const AdminSupport = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!ticketData) return [];

      const userIds = [...new Set(ticketData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return ticketData.map(t => ({
        ...t,
        user_name: profileMap.get(t.user_id)?.full_name || "Unknown",
        user_email: profileMap.get(t.user_id)?.email || "",
      })) as Ticket[];
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

      // Check which senders are admins
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

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply.trim() || !selectedTicket) return;
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user!.id,
        message: reply.trim(),
      });
      if (error) throw error;

      // Send notification to user
      await supabase.from("notifications").insert({
        user_id: selectedTicket.user_id,
        title: "Support Reply",
        message: `Admin replied to your ticket: "${selectedTicket.subject}"`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", selectedTicket?.id] });
      setReply("");
      toast.success("Reply sent!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async (ticket: Ticket) => {
      const newStatus = ticket.status === "open" ? "closed" : "open";
      const { error } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: ticket.user_id,
        title: `Ticket ${newStatus === "closed" ? "Closed" : "Reopened"}`,
        message: `Your ticket "${ticket.subject}" has been ${newStatus === "closed" ? "closed" : "reopened"}.`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      if (selectedTicket) {
        setSelectedTicket(prev => prev ? { ...prev, status: prev.status === "open" ? "closed" : "open" } : null);
      }
      toast.success("Status updated!");
    },
  });

  const filteredTickets = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  // Conversation view
  if (selectedTicket) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="px-5 pt-12 pb-3 flex items-center gap-3 border-b border-border/50">
          <button onClick={() => setSelectedTicket(null)} className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{selectedTicket.subject}</p>
            <p className="text-xs text-muted-foreground">{selectedTicket.user_name} • {selectedTicket.user_email}</p>
          </div>
          <Button
            size="sm"
            variant={selectedTicket.status === "open" ? "destructive" : "default"}
            onClick={() => toggleStatus.mutate(selectedTicket)}
            className="text-xs"
          >
            {selectedTicket.status === "open" ? "Close" : "Reopen"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.is_admin
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary rounded-bl-md"
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.is_admin ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  <span className="text-[10px] font-medium opacity-70">
                    {msg.is_admin ? "Admin" : selectedTicket.user_name}
                  </span>
                </div>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.is_admin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </p>
              </div>
            </motion.div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Send a reply below.</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/50 flex gap-2">
          <Input
            placeholder="Type your reply..."
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
      </div>
    );
  }

  // Ticket list view
  return (
    <div className="min-h-screen pb-8">
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-1"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <p className="text-muted-foreground text-sm">Admin Panel</p>
            <h1 className="text-xl font-bold">Support Tickets</h1>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        <div className="flex gap-2">
          {(["all", "open", "closed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && ` (${tickets.filter(t => t.status === f).length})`}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filteredTickets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No tickets found</p>
          )}
          {filteredTickets.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setSelectedTicket(ticket)}
              className="glass-card p-4 cursor-pointer hover:border-primary/30 transition-colors"
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
                    <p className="text-xs text-muted-foreground">{ticket.user_name} • {ticket.user_email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(ticket.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ticket.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  {ticket.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
