"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, LogOut, CheckCircle, XCircle, Search, Server, DollarSign, ListOrdered, Mail, Settings, Tag, Plus, Trash2, Save, Globe } from "lucide-react";

interface Order {
  orderId: string;
  product: string;
  price: number;
  user: { email: string };
  status: string;
  utr?: string;
  deliveryDetails?: string;
  timestamp: number;
}

interface Coupon {
  code: string;
  discount: number;
  maxUses: number;
  uses: number;
}

interface SettingsData {
  upiId?: string;
  payeeName?: string;
  gatewayUrl?: string;
  gatewaySecret?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  coupons?: Coupon[];
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "settings">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  
  // Settings & Coupons state
  const [settings, setSettings] = useState<SettingsData>({});
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewaySecret, setGatewaySecret] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("");
  const [newCouponMaxUses, setNewCouponMaxUses] = useState("");

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Premium Alerts & Confirmations state
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [showToast, setShowToast] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  const showNotification = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    const savedPass = localStorage.getItem("nova_admin_pass");
    if (savedPass) {
      verifyPass(savedPass);
    }
  }, []);

  async function verifyPass(passToVerify: string) {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password: passToVerify })
      });
      if (res.ok) {
        setPassword(passToVerify);
        localStorage.setItem("nova_admin_pass", passToVerify);
        setIsAuthenticated(true);
        fetchOrders(passToVerify);
        fetchSettings(passToVerify);
      } else {
        localStorage.removeItem("nova_admin_pass");
        setLoginError("Invalid password. Please try again.");
      }
    } catch {
      setLoginError("Connection error.");
    }
  }

  async function fetchOrders(pass = password) {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchSettings(pass = password) {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_settings", password: pass })
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.settings || {};
        setSettings(s);
        setUpiId(s.upiId || "novaxsto@slc");
        setPayeeName(s.payeeName || "NOVA X Web Services");
        setGatewayUrl(s.gatewayUrl || "https://slice-upi-gateway.novaxsmp-upi.workers.dev");
        setGatewaySecret(s.gatewaySecret || "testsecret123");
        setMaintenanceMode(s.maintenanceMode || false);
        setMaintenanceMessage(s.maintenanceMessage || "We are currently performing maintenance. Please check back soon!");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPass(password);
  };

  const handleLogout = () => {
    localStorage.removeItem("nova_admin_pass");
    setIsAuthenticated(false);
    setPassword("");
    setOrders([]);
    setSettings({});
  };

  const openApproveModal = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryDetails("");
    setIsApproving(true);
  };

  const submitApprove = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          password,
          orderId: selectedOrder.orderId,
          deliveryDetails
        })
      });
      if (res.ok) {
        setIsApproving(false);
        setSelectedOrder(null);
        showNotification(`Order #${selectedOrder.orderId} approved successfully and email sent!`, "success");
        fetchOrders();
      } else {
        showNotification("Failed to approve order.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error approving order.", "error");
    }
  };

  const handleReject = async (orderId: string) => {
    setConfirmModal({
      title: `Reject Order #${orderId}`,
      message: `Are you sure you want to REJECT order #${orderId}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject", password, orderId })
          });
          if (res.ok) {
            showNotification(`Order #${orderId} rejected.`, "success");
            fetchOrders();
          } else {
            showNotification("Failed to reject order.", "error");
          }
        } catch (err) {
          console.error(err);
          showNotification("Error rejecting order.", "error");
        }
      }
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          password,
          settingsData: { upiId, payeeName, gatewayUrl, gatewaySecret, maintenanceMode, maintenanceMessage }
        })
      });
      if (res.ok) {
        showNotification("Settings saved successfully!", "success");
        fetchSettings();
      } else {
        showNotification("Failed to save settings.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error saving settings.", "error");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponDiscount) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_coupon",
          password,
          coupon: {
            code: newCouponCode,
            discount: newCouponDiscount,
            maxUses: newCouponMaxUses
          }
        })
      });
      if (res.ok) {
        setNewCouponCode("");
        setNewCouponDiscount("");
        setNewCouponMaxUses("");
        showNotification("Coupon created successfully!", "success");
        fetchSettings();
      } else {
        showNotification("Failed to create coupon.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error creating coupon.", "error");
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    setConfirmModal({
      title: `Delete Coupon "${code}"`,
      message: `Are you sure you want to delete coupon code "${code}"? Active users won't be able to use it.`,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete_coupon",
              password,
              code
            })
          });
          if (res.ok) {
            showNotification(`Coupon "${code}" deleted.`, "success");
            fetchSettings();
          } else {
            showNotification("Failed to delete coupon.", "error");
          }
        } catch (err) {
          console.error(err);
          showNotification("Error deleting coupon.", "error");
        }
      }
    });
  };

  // Stats calculation
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const approvedOrders = orders.filter(o => o.status === "APPROVED").length;
  const totalRevenue = orders.filter(o => o.status === "APPROVED").reduce((sum, o) => sum + (o.price || 0), 0);

  const filteredOrders = orders.filter(o => 
    o.orderId.toLowerCase().includes(search.toLowerCase()) ||
    o.product.toLowerCase().includes(search.toLowerCase()) ||
    o.user.email.toLowerCase().includes(search.toLowerCase()) ||
    (o.utr && o.utr.includes(search))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-sans relative overflow-hidden">
        {/* Background Video */}
        <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
          <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
        </video>
        <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

        <div className="relative z-20 w-full max-w-md p-8 bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl shadow-2xl text-center">
          <ShieldAlert className="w-16 h-16 text-[#ff0f0f] mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-black mb-2 tracking-wide">ADMIN PORTAL</h1>
          <p className="text-[#a1a1aa] text-sm mb-8">Authorized personnel only</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-black/30 border border-[#1f1f1f] rounded-xl px-4 py-3 text-center text-white font-mono placeholder-[#a1a1aa] focus:border-[#ff0f0f] focus:shadow-[0_0_10px_rgba(255,15,15,0.2)] transition-all outline-none"
              />
              {loginError && <p className="text-xs text-red-500 mt-2 font-semibold">{loginError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff0f0f] hover:bg-[#cc0000] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(255,15,15,0.2)]"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background Video */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Admin Navbar */}
        <nav className="bg-[#050505]/90 backdrop-blur-xl border-b border-[#ff0f0f]/10 py-4 px-6 relative z-10">
          <div className="max-w-[1200px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <span className="text-[#ff0f0f] text-2xl font-black">⚙️ ADMIN PANEL</span>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`text-sm font-bold tracking-wide uppercase transition-colors px-3 py-1.5 rounded-lg ${
                    activeTab === "orders" ? "bg-[#ff0f0f]/10 text-[#ff0f0f] border border-[#ff0f0f]/20" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  Transactions
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`text-sm font-bold tracking-wide uppercase transition-colors px-3 py-1.5 rounded-lg ${
                    activeTab === "settings" ? "bg-[#ff0f0f]/10 text-[#ff0f0f] border border-[#ff0f0f]/20" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  Settings & Coupons
                </button>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors font-semibold text-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </nav>

        {/* Main Content Wrapper */}
        <main className="max-w-[1200px] mx-auto w-full px-6 py-10 flex-1 space-y-8">
          {activeTab === "orders" ? (
            <>
              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-6 relative overflow-hidden">
                  <div className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><ListOrdered className="w-4 h-4 text-[#ff0f0f]" /> Total Orders</div>
                  <div className="text-3xl font-black text-white">{totalOrders}</div>
                </div>
                <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-6 relative overflow-hidden">
                  <div className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><Server className="w-4 h-4 text-[#f59e0b]" /> Pending</div>
                  <div className="text-3xl font-black text-[#f59e0b]">{pendingOrders}</div>
                </div>
                <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-6 relative overflow-hidden">
                  <div className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-[#10b981]" /> Approved</div>
                  <div className="text-3xl font-black text-[#10b981]">{approvedOrders}</div>
                </div>
                <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-6 relative overflow-hidden">
                  <div className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#ff0f0f]" /> Total Revenue</div>
                  <div className="text-3xl font-black text-[#ff0f0f]">₹{totalRevenue}</div>
                </div>
              </div>

              {/* Orders Table Section */}
              <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-white tracking-wide">Manage Transactions</h2>
                  
                  {/* Search Box */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search by ID, Product, Email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#a1a1aa] focus:border-[#ff0f0f] transition-all outline-none"
                    />
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#a1a1aa]" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[#a1a1aa] text-xs uppercase tracking-wider">
                        <th className="py-4 px-2">Order ID</th>
                        <th className="py-4 px-2">Product</th>
                        <th className="py-4 px-2">User Email</th>
                        <th className="py-4 px-2">Amount</th>
                        <th className="py-4 px-2">Status</th>
                        <th className="py-4 px-2">UTR/REF</th>
                        <th className="py-4 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((o) => (
                          <tr key={o.orderId} className="text-sm font-medium hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-2 font-mono text-[#ff0f0f]">#{o.orderId}</td>
                            <td className="py-4 px-2">{o.product}</td>
                            <td className="py-4 px-2">{o.user.email}</td>
                            <td className="py-4 px-2 font-black text-[#ff0f0f]">₹{o.price}</td>
                            <td className="py-4 px-2">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                o.status === "APPROVED" ? "bg-[#10b981]/15 text-[#10b981]" :
                                o.status === "PENDING" ? "bg-[#f59e0b]/15 text-[#f59e0b]" :
                                "bg-red-500/15 text-red-500"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-4 px-2 font-mono text-xs">{o.utr || "---"}</td>
                            <td className="py-4 px-2 text-right space-x-2">
                              {o.status === "PENDING" && (
                                <>
                                  <button
                                    onClick={() => openApproveModal(o)}
                                    className="bg-[#10b981] hover:bg-[#059669] text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(o.orderId)}
                                    className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {o.status !== "PENDING" && (
                                <span className="text-[#a1a1aa] text-xs font-normal">No actions</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#a1a1aa] text-sm">No orders found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 items-start">
              
              {/* Settings Card */}
              <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-white/5">
                  <Globe className="w-5 h-5 text-[#ff0f0f]" /> General Configurations
                </h3>
                
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-3 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Payee Name</label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-3 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Gateway URL</label>
                    <input
                      type="text"
                      value={gatewayUrl}
                      onChange={(e) => setGatewayUrl(e.target.value)}
                      className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-3 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Gateway Authorization Secret</label>
                    <input
                      type="password"
                      value={gatewaySecret}
                      onChange={(e) => setGatewaySecret(e.target.value)}
                      className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-3 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none font-mono"
                    />
                  </div>
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Enable Maintenance Mode</label>
                        <p className="text-xs text-[#a1a1aa]/80 mt-1">Block public store access with custom message</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="w-5 h-5 accent-[#ff0f0f] rounded border-[#1f1f1f] bg-black/40 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </div>
                    {maintenanceMode && (
                      <div>
                        <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Maintenance Message</label>
                        <textarea
                          value={maintenanceMessage}
                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                          placeholder="We are currently performing maintenance. Please check back soon!"
                          className="w-full min-h-[80px] bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-3 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none resize-none"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#ff0f0f] hover:bg-[#cc0000] text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(255,15,15,0.2)]"
                  >
                    <Save className="w-5 h-5" /> Save Configurations
                  </button>
                </form>
              </div>

              {/* Coupon Management Card */}
              <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-white/5">
                    <Plus className="w-5 h-5 text-[#ff0f0f]" /> Create Discount Coupon
                  </h3>
                  
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Coupon Code</label>
                        <input
                          type="text"
                          required
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          placeholder="e.g. NOVA50"
                          className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none uppercase tracking-wider font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Discount %</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="100"
                          value={newCouponDiscount}
                          onChange={(e) => setNewCouponDiscount(e.target.value)}
                          placeholder="1-100"
                          className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Max Uses (Optional)</label>
                      <input
                        type="number"
                        value={newCouponMaxUses}
                        onChange={(e) => setNewCouponMaxUses(e.target.value)}
                        placeholder="Unlimited if empty"
                        className="w-full bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#ff0f0f] transition-all outline-none font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-transparent hover:bg-white/5 border border-[#1f1f1f] text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Tag className="w-4 h-4 text-[#ff0f0f]" /> Add Coupon
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-white/5">
                    <Tag className="w-5 h-5 text-[#ff0f0f]" /> Active Coupons List
                  </h3>
                  
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                    {settings.coupons && settings.coupons.length > 0 ? (
                      settings.coupons.map((c) => (
                        <div key={c.code} className="flex justify-between items-center p-4 bg-black/40 border border-[#1f1f1f] rounded-xl">
                          <div>
                            <span className="font-mono font-bold text-[#ff0f0f] text-base">{c.code}</span>
                            <div className="text-xs text-[#a1a1aa] mt-1">
                              Discount: <span className="text-[#10b981] font-semibold">{c.discount}%</span> | Used: <span className="text-white">{c.uses}</span> / {c.maxUses || "∞"}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="text-red-500 hover:text-white p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#a1a1aa] text-center py-4">No coupons configured yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delivery Details Approval Modal */}
      {isApproving && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0f0f0f]/90 border border-[#1f1f1f] rounded-2xl p-8 relative shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <Mail className="w-6 h-6 text-[#ff0f0f]" />
              <h3 className="text-xl font-bold text-white">Approve Order #{selectedOrder.orderId}</h3>
            </div>
            
            <div>
              <p className="text-sm text-[#a1a1aa] leading-relaxed mb-4">
                Verify this payment manually. You can optional specify delivery details (e.g., VPS IP address, discord user details, or custom passwords) that will be sent via receipt email directly to the buyer's inbox.
              </p>
              
              <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Delivery Details</label>
              <textarea
                value={deliveryDetails}
                onChange={(e) => setDeliveryDetails(e.target.value)}
                placeholder="Enter server IP, login details, and instruction notes..."
                className="w-full min-h-[120px] bg-black/40 border border-[#1f1f1f] rounded-xl px-4 py-3 text-white text-sm placeholder-[#a1a1aa] focus:border-[#ff0f0f] transition-all outline-none resize-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => {
                  setIsApproving(false);
                  setSelectedOrder(null);
                }}
                className="bg-transparent hover:bg-white/5 border border-[#1f1f1f] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitApprove}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
              >
                Approve & Deliver Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-[#0f0f0f]/90 backdrop-blur-xl border rounded-xl shadow-2xl transition-all duration-300 transform ${
        showToast ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      } ${
        toastType === "success" ? "border-[#10b981]/30 shadow-[#10b981]/5" :
        toastType === "error" ? "border-[#ff0f0f]/30 shadow-[#ff0f0f]/5" :
        "border-[#3b82f6]/30 shadow-[#3b82f6]/5"
      }`}>
        <div className={`p-1.5 rounded-lg ${
          toastType === "success" ? "bg-[#10b981]/10 text-[#10b981]" :
          toastType === "error" ? "bg-[#ff0f0f]/10 text-[#ff0f0f]" :
          "bg-[#3b82f6]/10 text-[#3b82f6]"
        }`}>
          {toastType === "success" ? <CheckCircle className="w-5 h-5" /> :
           toastType === "error" ? <XCircle className="w-5 h-5" /> :
           <Mail className="w-5 h-5" />}
        </div>
        <span className="text-sm font-semibold text-white">{toastMsg}</span>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0f0f0f]/90 border border-[#1f1f1f] rounded-2xl p-8 relative shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2.5">
              ⚠️ {confirmModal.title}
            </h3>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="bg-transparent hover:bg-white/5 border border-[#1f1f1f] text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white px-6 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
