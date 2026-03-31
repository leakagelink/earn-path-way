import { motion } from "framer-motion";
import { User, Lock, MessageCircle, Share2, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const settingsItems = [
    { icon: User, label: "Edit Profile", to: "#", color: "text-info", bg: "bg-info/10" },
    { icon: Lock, label: "Change Password", to: "#", color: "text-warning", bg: "bg-warning/10" },
    { icon: Share2, label: "Referral Program", to: "/referral", color: "text-success", bg: "bg-success/10" },
    { icon: MessageCircle, label: "Join Telegram", to: "#", color: "text-accent", bg: "bg-accent/10" },
    { icon: HelpCircle, label: "Support", to: "/support", color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="px-5 space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div>
            <p className="font-semibold">{profile?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </motion.div>

        <div className="space-y-2">
          {settingsItems.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={item.to} className="glass-card p-3.5 flex items-center justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full glass-card p-3.5 flex items-center gap-3 text-destructive hover:border-destructive/30 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
