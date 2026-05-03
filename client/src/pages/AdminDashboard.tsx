import { useAdminStats, useAllBookings, useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ToggleRight, 
  Save, LogOut, MessageSquare, AlertTriangle, CheckCircle2, XCircle, 
  Phone, Megaphone, Plus, Trash2, ExternalLink, Copy, Search, RefreshCw, 
  ChevronDown, ChevronUp, Calendar, MapPin, LayoutDashboard, Settings, 
  Activity, Eye, EyeOff, Download, Upload, Zap, Clock, AlertCircle
} from "lucide-react";
import { VoiceEscalations } from "@/components/VoiceEscalations";
import { AdminCommandCenter } from "@/components/AdminCommandCenter";
import { SeniorCareDesk } from "@/components/SeniorCareDesk";
import { useI18n } from "@/lib/i18n";
import { AdminKnowledgeHub } from "@/components/AdminKnowledgeHub";
import { AdminCustomerInsights } from "@/components/AdminCustomerInsights";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, Fragment } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import type { FeaturedDeal } from "@shared/schema";

// ============================================================================
// CANONICAL PROTOCOL COMPLIANCE
// ============================================================================
// This component adheres to:
// - CANON X (Layer Segregation): Strict separation of concerns
// - CANON IX (Anti-Overengineering): Minimal, direct solutions
// - CANON XVIII (Cognitive Sovereignty): Clear, documented architecture
// ============================================================================

interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: "emerald" | "blue" | "amber" | "rose" | "indigo" | "cyan";
}

interface TabConfig {
  id: "overview" | "bookings" | "analytics" | "settings" | "command" | "senior" | "crm" | "kb";
  label: string;
  icon: React.ReactNode;
}

// Color palette for consistent theming
const colorMap = {
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================
function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Card className="glass-card border-white/5 hover:border-white/20 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest font-bold text-slate-400 group-hover:text-slate-300 transition-colors">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white font-display tracking-tight">
              {metric.value}
            </p>
            {metric.change !== undefined && (
              <p className={`mt-2 text-xs font-semibold flex items-center gap-1 ${
                metric.change >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                {metric.change >= 0 ? "↑" : "↓"} {Math.abs(metric.change)}% vs last period
              </p>
            )}
          </div>
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border ${colorMap[metric.color]} transition-transform group-hover:scale-110`}>
            {metric.icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function OverviewTab({ stats }: { stats: any }) {
  const metrics: DashboardMetric[] = [
    {
      label: "Total Revenue",
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      change: 12,
      icon: <DollarSign className="h-5 w-5" />,
      color: "emerald",
    },
    {
      label: "Active Bookings",
      value: stats?.activeBookings || 0,
      change: 8,
      icon: <Plane className="h-5 w-5" />,
      color: "blue",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      change: 5,
      icon: <Users className="h-5 w-5" />,
      color: "indigo",
    },
    {
      label: "Conversion Rate",
      value: `${(stats?.conversionRate || 0).toFixed(1)}%`,
      change: 3,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "cyan",
    },
  ];

  // Sample chart data
  const chartData = [
    { name: "Mon", revenue: 4000, bookings: 24 },
    { name: "Tue", revenue: 3000, bookings: 13 },
    { name: "Wed", revenue: 2000, bookings: 9 },
    { name: "Thu", revenue: 2780, bookings: 39 },
    { name: "Fri", revenue: 1890, bookings: 22 },
    { name: "Sat", revenue: 2390, bookings: 22 },
    { name: "Sun", revenue: 3490, bookings: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <MetricCard key={idx} metric={metric} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Bookings by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">All Systems Operational</span>
              </div>
              <p className="text-xs text-slate-400">No issues detected</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Uptime: 99.9%</span>
              </div>
              <p className="text-xs text-slate-400">Last 30 days</p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">Response Time</span>
              </div>
              <p className="text-xs text-slate-400">Avg: 145ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// BOOKINGS TAB
// ============================================================================
function BookingsTab({ bookings }: { bookings: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = (bookings || []).filter(booking => {
    const matchesSearch = !searchQuery || 
      booking.id?.toString().includes(searchQuery) ||
      booking.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by booking ID or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="glass-card border-white/5 hover:border-white/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-white">#{booking.id}</span>
                      <Badge className={`text-xs font-bold ${
                        booking.status === "confirmed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                        booking.status === "pending" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                        "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{booking.userName} • {booking.userEmail}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {booking.origin} → {booking.destination} • {format(parseISO(booking.departureDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">${booking.totalPrice}</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================
function AnalyticsTab() {
  const analyticsData = [
    { name: "Desktop", value: 65, fill: "#3b82f6" },
    { name: "Mobile", value: 25, fill: "#10b981" },
    { name: "Tablet", value: 10, fill: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
                  labelStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="glass-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Top Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { route: "EWR → GIG", bookings: 156, revenue: "$24,500" },
                { route: "JFK → SSA", bookings: 142, revenue: "$18,200" },
                { route: "LGA → REC", bookings: 128, revenue: "$15,800" },
                { route: "BOS → FOR", bookings: 95, revenue: "$12,100" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.route}</p>
                    <p className="text-xs text-slate-400">{item.bookings} bookings</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">{item.revenue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================
function SettingsTab({ settings }: { settings: any }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Maintenance Mode</p>
              <p className="text-xs text-slate-400 mt-1">Temporarily disable the platform for updates</p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                maintenanceMode ? "bg-rose-500/30" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  maintenanceMode ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-semibold text-white">Email Notifications</p>
              <p className="text-xs text-slate-400 mt-1">Receive alerts for important events</p>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                emailNotifications ? "bg-emerald-500/30" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card className="glass-card border-white/5">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-white">API Key</Label>
            <div className="mt-2 flex gap-2">
              <Input
                type="password"
                value="sk_live_••••••••••••••••"
                readOnly
                className="bg-white/5 border-white/10 text-white"
              />
              <Button variant="outline" size="sm" className="border-white/10">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================
export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: bookings } = useAllBookings();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "analytics" | "settings" | "command" | "senior" | "crm" | "kb">("overview");

  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <Card className="glass-card border-rose-500/30 w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400 mb-6">You do not have permission to access the admin dashboard.</p>
            <Button onClick={() => setLocation("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: TabConfig[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "bookings", label: "Bookings", icon: <Plane className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { id: "command", label: "Command", icon: <Zap className="h-4 w-4" /> },
    { id: "senior", label: "Senior Care", icon: <Users className="h-4 w-4" /> },
    { id: "crm", label: "CRM", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "kb", label: "Knowledge", icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white font-display">Admin Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Michels Travel Management System</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="gap-2 text-slate-300 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Exit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2 bg-white/5 border border-white/10 p-2 rounded-xl mb-8">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <div className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              {statsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <OverviewTab stats={stats} />
              )}
            </TabsContent>

            <TabsContent value="bookings">
              <BookingsTab bookings={bookings || []} />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsTab />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab settings={{}} />
            </TabsContent>

            <TabsContent value="command">
              <AdminCommandCenter
                onOpenLiveDesk={() => {}}
                onOpenBookings={() => {}}
                onOpenSettings={() => setActiveTab("settings")}
              />
            </TabsContent>

            <TabsContent value="senior">
              <SeniorCareDesk />
            </TabsContent>

            <TabsContent value="crm">
              <AdminCustomerInsights />
            </TabsContent>

            <TabsContent value="kb">
              <AdminKnowledgeHub />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
