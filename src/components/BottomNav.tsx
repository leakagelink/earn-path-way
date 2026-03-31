import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Wallet, Gift, BarChart3, Settings } from "lucide-react";

const tabs = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/offers", icon: Gift, label: "Offers" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/settings", icon: Settings, label: "More" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors"
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "gradient-primary shadow-lg shadow-primary/20" : ""}`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
