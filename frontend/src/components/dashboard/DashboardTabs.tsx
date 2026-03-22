import { motion } from "framer-motion";

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "Stock Analysis" },
  { id: "compare", label: "Compare" },
  { id: "portfolio", label: "Portfolio" },
];

const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => (
  <div className="flex items-center gap-0.5 bg-secondary/40 rounded-lg p-1 w-fit">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className="relative px-4 py-1.5 text-xs font-body font-medium rounded-md transition-colors"
      >
        {activeTab === tab.id && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-card shadow-card rounded-md border border-border"
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          />
        )}
        <span className={`relative z-10 ${activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {tab.label}
        </span>
      </button>
    ))}
  </div>
);

export default DashboardTabs;
