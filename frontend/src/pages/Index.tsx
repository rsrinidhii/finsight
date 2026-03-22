import { useState, useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import KPICards from "@/components/dashboard/KPICards";
import PriceChart from "@/components/dashboard/PriceChart";
import AnomalyTable from "@/components/dashboard/AnomalyTable";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import MarketStatus from "@/components/dashboard/MarketStatus";
import PortfolioTracker from "@/components/dashboard/PortfolioTracker";
import MultiStockCompare from "@/components/dashboard/MultiStockCompare";
import DashboardTabs from "@/components/dashboard/DashboardTabs";

interface IndexProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

const Index = ({ user, onLogout }: IndexProps) => {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        user={user}
        onLogout={onLogout}
      />
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
              Welcome back, {user.name.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · NSE/BSE {new Date().getHours() >= 9 && new Date().getHours() < 16 ? "Open" : "Closed"}
            </p>
          </div>
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <KPICards />

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><PriceChart /></div>
              <MarketStatus />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><AnomalyTable /></div>
              <AlertsPanel />
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PriceChart ticker="AAPL" />
              <AnomalyTable />
            </div>
            <div className="space-y-6">
              <AlertsPanel />
              <MarketStatus />
            </div>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-6">
            <MultiStockCompare />
            <AnomalyTable />
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <PortfolioTracker />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceChart ticker="Portfolio" />
              <AlertsPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;