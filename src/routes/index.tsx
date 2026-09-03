import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  LineChart,
  Users,
  Wallet,
  Settings,
  LifeBuoy,
  Zap,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Percent,
  CreditCard,
  UserPlus,
  AlertCircle,
  Star,
  Clock,
} from "lucide-react";
import avatar from "@/assets/avatar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Workspace Overview" },
      {
        name: "description",
        content:
          "Lumen workspace dashboard: revenue, active users, orders and recent activity at a glance.",
      },
      { property: "og:title", content: "Lumen — Workspace Overview" },
      {
        property: "og:description",
        content:
          "Lumen workspace dashboard: revenue, active users, orders and recent activity at a glance.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  key: string;
};

const workspaceNav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, key: "overview" },
  { label: "Analytics", icon: LineChart, key: "analytics" },
  { label: "Users", icon: Users, key: "users" },
  { label: "Billing", icon: Wallet, key: "billing" },
];

const generalNav: NavItem[] = [
  { label: "Settings", icon: Settings, key: "settings" },
  { label: "Support", icon: LifeBuoy, key: "support" },
];

type Kpi = {
  label: string;
  value: string;
  icon: typeof Wallet;
  iconBg: string;
  iconColor: string;
  delta: string;
  up: boolean;
  delay: string;
};

const kpis: Kpi[] = [
  {
    label: "Total revenue",
    value: "$48,290",
    icon: Wallet,
    iconBg: "bg-accent-soft",
    iconColor: "text-accent",
    delta: "12.4%",
    up: true,
    delay: "0s",
  },
  {
    label: "Active users",
    value: "3,942",
    icon: Users,
    iconBg: "bg-[#e7f0ec]",
    iconColor: "text-emerald-700",
    delta: "8.1%",
    up: true,
    delay: "0.06s",
  },
  {
    label: "Orders",
    value: "1,204",
    icon: ShoppingCart,
    iconBg: "bg-[#efe9f0]",
    iconColor: "text-[#8a5a86]",
    delta: "2.3%",
    up: false,
    delay: "0.12s",
  },
  {
    label: "Conversion",
    value: "4.28%",
    icon: Percent,
    iconBg: "bg-[#e9eef5]",
    iconColor: "text-[#4a6b8f]",
    delta: "1.7%",
    up: true,
    delay: "0.18s",
  },
];

const revenueMonths = [
  { month: "Jan", height: "46%", tone: "bg-accent/30" },
  { month: "Feb", height: "55%", tone: "bg-accent/40" },
  { month: "Mar", height: "42%", tone: "bg-accent/35" },
  { month: "Apr", height: "68%", tone: "bg-accent/55" },
  { month: "May", height: "60%", tone: "bg-accent/50" },
  { month: "Jun", height: "82%", tone: "bg-accent/75" },
  { month: "Jul", height: "74%", tone: "bg-accent/70" },
  { month: "Aug", height: "92%", tone: "bg-accent" },
];

type Activity = {
  text: string;
  meta: string;
  icon: typeof CreditCard;
  iconBg: string;
  iconColor: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
};

const activities: Activity[] = [
  {
    text: "New invoice paid",
    meta: "Acme Co · 2m ago",
    icon: CreditCard,
    iconBg: "bg-accent-soft",
    iconColor: "text-accent",
    badge: "Paid",
    badgeBg: "bg-emerald-50",
    badgeColor: "text-emerald-700",
  },
  {
    text: "New user joined",
    meta: "Leo Brandt · 18m ago",
    icon: UserPlus,
    iconBg: "bg-[#e9eef5]",
    iconColor: "text-[#4a6b8f]",
    badge: "New",
    badgeBg: "bg-[#e9eef5]",
    badgeColor: "text-[#4a6b8f]",
  },
  {
    text: "Payment failed",
    meta: "Northwind · 1h ago",
    icon: AlertCircle,
    iconBg: "bg-[#efe9f0]",
    iconColor: "text-[#8a5a86]",
    badge: "Failed",
    badgeBg: "bg-red-50",
    badgeColor: "text-red-700",
  },
  {
    text: "Subscription upgraded",
    meta: "Bloom Labs · 3h ago",
    icon: Star,
    iconBg: "bg-[#e7f0ec]",
    iconColor: "text-emerald-700",
    badge: "Done",
    badgeBg: "bg-emerald-50",
    badgeColor: "text-emerald-700",
  },
  {
    text: "Trial started",
    meta: "Cedar & Co · 5h ago",
    icon: Clock,
    iconBg: "bg-[#f1ebe1]",
    iconColor: "text-muted",
    badge: "Pending",
    badgeBg: "bg-[#f1ebe1]",
    badgeColor: "text-muted",
  },
];

function Index() {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen bg-surface text-ink font-sans antialiased">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#faf7f2] border-r border-line flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-line">
          <div className="size-8 rounded-lg bg-accent grid place-items-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="font-display font-medium text-[17px] text-balance">
            Lumen
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-6">
          <div>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
              Workspace
            </p>
            <div className="space-y-1">
              {workspaceNav.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-white hover:text-ink"
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
              General
            </p>
            <div className="space-y-1">
              {generalNav.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-white hover:text-ink"
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-xl bg-[#f1ebe1] ring-1 ring-black/5 p-4">
            <div className="flex items-center gap-2 text-ink font-medium text-sm">
              <Zap className="size-4 text-accent shrink-0" />
              Storage
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-[#e2d9cb] overflow-hidden">
              <div className="h-full w-[68%] rounded-full bg-accent"></div>
            </div>
            <p className="mt-2 text-xs text-muted">6.8 of 10 GB used</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur border-b border-line">
          <div className="h-16 flex items-center gap-4 px-8">
            <div className="relative w-80 max-w-full">
              <Search className="size-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search metrics, users…"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white ring-1 ring-line text-sm placeholder:text-muted/70 focus:ring-2 focus:ring-accent/40 focus:outline-none"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button className="relative size-10 grid place-items-center rounded-lg ring-1 ring-line bg-white text-muted hover:text-ink transition-colors">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-accent ring-2 ring-white"></span>
              </button>
              <div className="flex items-center gap-2.5 pl-2 border-l border-line">
                <img
                  src={avatar}
                  alt="Mara Voss avatar"
                  width={36}
                  height={36}
                  loading="lazy"
                  className="size-9 rounded-full object-cover ring-1 ring-black/5"
                />
                <div className="leading-tight">
                  <p className="text-sm font-medium text-ink">Mara Voss</p>
                  <p className="text-xs text-muted">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-8 py-8">
          {/* Page header */}
          <div className="mb-7 flex items-end justify-between fade-up">
            <div>
              <h1 className="font-display font-medium text-[28px] leading-tight text-ink text-balance">
                Good morning, Mara
              </h1>
              <p className="mt-1 text-sm text-muted text-pretty">
                Here's what's flowing through your workspace today.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 px-3.5 rounded-lg bg-white ring-1 ring-line text-sm font-medium text-ink hover:bg-[#f6f1e8] transition-colors">
                Last 30 days
              </button>
              <button className="h-9 px-3.5 rounded-lg bg-accent text-white text-sm font-medium ring-1 ring-accent hover:bg-[#9a4608] transition-colors">
                Export
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="fade-up bg-card rounded-2xl ring-1 ring-line p-5 hover:-translate-y-0.5 transition-transform"
                style={{ animationDelay: kpi.delay }}
              >
                <div className="flex items-start justify-between">
                  <div className={`size-10 rounded-xl grid place-items-center ${kpi.iconBg}`}>
                    <kpi.icon className={`size-5 ${kpi.iconColor}`} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                      kpi.up
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-red-600 bg-red-50"
                    }`}
                  >
                    {kpi.up ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    {kpi.delta}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted">{kpi.label}</p>
                <p className="mt-1 font-display text-[26px] font-medium text-ink leading-none">
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Two column */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Chart */}
            <div
              className="col-span-1 fade-up bg-card rounded-2xl ring-1 ring-line p-6 lg:col-span-2"
              style={{ animationDelay: "0.24s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-medium text-[19px] text-ink text-balance">
                    Revenue overview
                  </h2>
                  <p className="text-sm text-muted">
                    Monthly recurring revenue, last 8 months
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-accent"></span>
                    This year
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#d9cfc0]"></span>
                    Last year
                  </span>
                </div>
              </div>
              <div className="mt-6 h-[248px] relative">
                <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-muted/60 pl-1">
                  <span>$12k</span>
                  <span>$9k</span>
                  <span>$6k</span>
                  <span>$3k</span>
                  <span>$0</span>
                </div>
                <div className="absolute inset-0 w-full h-full">
                  <div
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      background:
                        "linear-gradient(to top, color-mix(in oklch, var(--accent) 16%, transparent), transparent)",
                    }}
                  ></div>
                  <div className="absolute bottom-0 left-0 right-0 h-[4px] rounded-full bg-accent/20"></div>
                  <div className="absolute flex items-end gap-3 px-7 h-[200px]">
                    {revenueMonths.map((m) => (
                      <div
                        key={m.month}
                        className={`flex-1 rounded-t-md ${m.tone}`}
                        style={{ height: m.height }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-0 inset-x-0 flex justify-between pl-7 pr-1 text-[10px] text-muted/60">
                  {revenueMonths.map((m) => (
                    <span key={m.month}>{m.month}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div
              className="fade-up bg-card rounded-2xl ring-1 ring-line p-6"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-medium text-[19px] text-ink text-balance">
                  Recent activity
                </h2>
                <button className="text-xs font-medium text-accent hover:underline">
                  View all
                </button>
              </div>
              <ul className="mt-5 divide-y divide-line">
                {activities.map((a) => (
                  <li key={a.text} className="py-3.5 flex items-center gap-3">
                    <div
                      className={`size-9 rounded-lg grid place-items-center shrink-0 ${a.iconBg}`}
                    >
                      <a.icon className={`size-4 ${a.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink text-pretty">{a.text}</p>
                      <p className="text-xs text-muted truncate">{a.meta}</p>
                    </div>
                    <span
                      className={`text-[11px] font-medium rounded-full px-2 py-0.5 shrink-0 ${a.badgeBg} ${a.badgeColor}`}
                    >
                      {a.badge}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
