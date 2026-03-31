import { motion } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [adminUpiId, setAdminUpiId] = useState("");
  const [adminQrUrl, setAdminQrUrl] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [l1Rate, setL1Rate] = useState("");
  const [l2Rate, setL2Rate] = useState("");
  const [l3Rate, setL3Rate] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["admin-app-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", 1).single();
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setAdminUpiId((settings as any).admin_upi_id || "");
      setAdminQrUrl((settings as any).admin_qr_url || "");
      setTelegramLink(settings.telegram_link || "");
      setL1Rate(String(settings.referral_level1_rate ?? 5));
      setL2Rate(String(settings.referral_level2_rate ?? 3));
      setL3Rate(String(settings.referral_level3_rate ?? 1));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("app_settings").update({
        admin_upi_id: adminUpiId,
        admin_qr_url: adminQrUrl,
        telegram_link: telegramLink,
        referral_level1_rate: parseFloat(l1Rate) || 5,
        referral_level2_rate: parseFloat(l2Rate) || 3,
        referral_level3_rate: parseFloat(l3Rate) || 1,
      } as any).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-app-settings"] });
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("Settings saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen pb-8">
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <Link to="/admin" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <h1 className="text-xl font-bold">App Settings</h1>
      </div>

      <div className="px-5 space-y-5">
        {/* Payment Settings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-4">
          <h2 className="font-semibold">💳 Payment Settings</h2>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium">Admin UPI ID (shown to users for deposits)</label>
            <Input value={adminUpiId} onChange={e => setAdminUpiId(e.target.value)} placeholder="admin@upi" className="h-11 bg-muted/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium">QR Code Image URL (optional)</label>
            <Input value={adminQrUrl} onChange={e => setAdminQrUrl(e.target.value)} placeholder="https://..." className="h-11 bg-muted/50" />
            {adminQrUrl && (
              <img src={adminQrUrl} alt="QR Preview" className="w-32 h-32 rounded-lg border border-border/50 object-contain bg-white mx-auto" />
            )}
          </div>
        </motion.div>

        {/* Telegram */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 space-y-4">
          <h2 className="font-semibold">📱 Telegram</h2>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground font-medium">Telegram Group Link</label>
            <Input value={telegramLink} onChange={e => setTelegramLink(e.target.value)} placeholder="https://t.me/..." className="h-11 bg-muted/50" />
          </div>
        </motion.div>

        {/* Referral Rates */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 space-y-4">
          <h2 className="font-semibold">🤝 Referral Commission Rates (%)</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Level 1</label>
              <Input type="number" value={l1Rate} onChange={e => setL1Rate(e.target.value)} className="h-11 bg-muted/50 text-center" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Level 2</label>
              <Input type="number" value={l2Rate} onChange={e => setL2Rate(e.target.value)} className="h-11 bg-muted/50 text-center" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Level 3</label>
              <Input type="number" value={l3Rate} onChange={e => setL3Rate(e.target.value)} className="h-11 bg-muted/50 text-center" />
            </div>
          </div>
        </motion.div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base gap-2"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
