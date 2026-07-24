"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle, AlertCircle, ShoppingBag, Copy, ExternalLink, Youtube, Instagram, MessageSquare } from "lucide-react";

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

interface ClientUser {
  username: string;
  email: string;
}

export default function ClientPortal() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeForm, setActiveForm] = useState<"login" | "register">("login");
  const [user, setUser] = useState<ClientUser | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Toast states
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "register") {
      setActiveForm("register");
    }

    const savedUser = localStorage.getItem("nova_client_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setIsLoggedIn(true);
      fetchOrders(u.email);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchOrders = async (userEmail: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/client/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/client/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", username, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("nova_client_user", JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
        triggerToast("Account registered successfully!");
        fetchOrders(data.user.email);
      } else {
        setErrorMsg(data.error || "Failed to register account.");
      }
    } catch {
      setErrorMsg("Connection error.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/client/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", emailOrUsername, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("nova_client_user", JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
        triggerToast("Logged in successfully!");
        fetchOrders(data.user.email);
      } else {
        setErrorMsg(data.error || "Invalid username or password.");
      }
    } catch {
      setErrorMsg("Connection error.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nova_client_user");
    setIsLoggedIn(false);
    setUser(null);
    setOrders([]);
    triggerToast("Logged out successfully.");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast("Delivery details copied!");
  };

  // Stats calculation
  const totalPurchases = orders.length;
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const approvedOrders = orders.filter(o => o.status === "APPROVED").length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-radial-gradient from-[#191b1e] to-[#000000] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden" style={{ background: "radial-gradient(ellipse at center, #191b1e 30%, #000000 100%)" }}>
        
        {/* Ambient Glows */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[120px] pointer-events-none z-0" />

        {/* Top Navbar */}
        <header className="w-[calc(100%-30px)] max-w-[1450px] h-[70px] bg-[#0f0f14] border border-white/5 rounded-[25px] flex items-center justify-between px-6 mt-3 z-50">
          <a href="/" className="flex items-center gap-2.5 text-white text-lg font-black tracking-wide no-underline uppercase">
            <span className="w-8 h-8 rounded-lg bg-[#ff0f0f] flex items-center justify-center text-sm shadow-[0_0_15px_rgba(255,15,15,0.4)]">⚡</span>
            X HUB HOSTINGER
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="https://discord.gg/novaxhost" target="_blank" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors no-underline">
              <MessageSquare className="w-4 h-4 text-[#ff0f0f]" /> Discord
            </a>
            <a href="https://youtube.com" target="_blank" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors no-underline">
              <Youtube className="w-4 h-4 text-[#ff0f0f]" /> YouTube
            </a>
            <a href="https://instagram.com" target="_blank" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors no-underline">
              <Instagram className="w-4 h-4 text-[#ff0f0f]" /> Instagram
            </a>
          </div>
        </header>

        {/* Center Card */}
        <main className="w-full flex-1 flex items-center justify-center px-4 py-8 z-10">
          <div className="w-[340px] max-w-[88vw] bg-[#121317]/95 border border-[#ff0f0f]/15 rounded-[18px] p-[26px_28px_24px] shadow-[0_8px_32px_rgba(0,0,0,0.35),_0_0_0_1px_rgba(255,255,255,0.03),_inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col space-y-5">
            <h2 className="text-[20px] font-bold text-center text-white tracking-wide">
              {activeForm === "login" ? "Login to Continue" : "Create an Account"}
            </h2>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeForm === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    USERNAME OR EMAIL
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full bg-[#e8f0fe] border-none rounded-lg px-3.5 py-2.5 text-black font-semibold text-sm outline-none focus:ring-2 focus:ring-[#ff0f0f]/40 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#e8f0fe] border-none rounded-lg px-3.5 py-2.5 text-black font-semibold text-sm outline-none focus:ring-2 focus:ring-[#ff0f0f]/40 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] active:scale-98 text-white font-bold py-3.5 rounded-[10px] transition-all duration-300 cursor-pointer text-sm shadow-[0_2px_12px_rgba(255,15,15,0.18)] hover:shadow-[0_6px_24px_rgba(255,15,15,0.35)] mt-2"
                >
                  Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    SELECT USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#e8f0fe] border-none rounded-lg px-3.5 py-2.5 text-black font-semibold text-sm outline-none focus:ring-2 focus:ring-[#ff0f0f]/40 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    ENTER EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#e8f0fe] border-none rounded-lg px-3.5 py-2.5 text-black font-semibold text-sm outline-none focus:ring-2 focus:ring-[#ff0f0f]/40 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    ENTER PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#e8f0fe] border-none rounded-lg px-3.5 py-2.5 text-black font-semibold text-sm outline-none focus:ring-2 focus:ring-[#ff0f0f]/40 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] active:scale-98 text-white font-bold py-3.5 rounded-[10px] transition-all duration-300 cursor-pointer text-sm shadow-[0_2px_12px_rgba(255,15,15,0.18)] hover:shadow-[0_6px_24px_rgba(255,15,15,0.35)] mt-2"
                >
                  Register
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setActiveForm(activeForm === "login" ? "register" : "login");
                  setErrorMsg("");
                }}
                className="text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider hover:underline bg-transparent border-none cursor-pointer"
              >
                {activeForm === "login" ? "CREATE AN ACCOUNT?" : "ALREADY HAVE AN ACCOUNT?"}
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full flex flex-col items-center justify-center gap-4 pb-6 z-10">
          <div className="flex items-center gap-3">
            <a href="https://youtube.com" target="_blank" className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-4 py-2 text-xs text-white/70 hover:text-white transition-colors no-underline">
              <Youtube className="w-3.5 h-3.5 text-[#ff0f0f]" /> YouTube
            </a>
            <a href="https://instagram.com" target="_blank" className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-4 py-2 text-xs text-white/70 hover:text-white transition-colors no-underline">
              <Instagram className="w-3.5 h-3.5 text-[#ff0f0f]" /> Instagram
            </a>
            <a href="https://discord.gg/novaxhost" target="_blank" className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-4 py-2 text-xs text-white/70 hover:text-white transition-colors no-underline">
              <MessageSquare className="w-3.5 h-3.5 text-[#ff0f0f]" /> Discord
            </a>
          </div>
          <span className="text-xs text-white/40 tracking-wider">
            Made with ❤️ by <span className="text-white font-semibold">X DIVYANG</span>
          </span>
        </footer>

      </div>
    );
  }

  // Dashboard layout
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background Video */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="bg-[#050505]/90 backdrop-blur-xl border-b border-[#ff0f0f]/10 py-4 px-6">
          <div className="max-w-[1200px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <a href="/" className="text-[#ff0f0f] text-2xl font-black tracking-wider uppercase font-mono">⚡ NOVA X</a>
              <span className="text-xs bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 text-[#ff0f0f] px-2 py-0.5 rounded-full font-bold uppercase">Client Portal</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </nav>

        {/* Main Content Dashboard */}
        <main className="max-w-[1200px] mx-auto w-full px-6 py-10 flex-1 space-y-8">
          
          {/* Welcome User Section */}
          <div className="bg-[#121317]/95 border border-[#ff0f0f]/15 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-wide">Welcome, {user?.username}!</h2>
              <p className="text-sm text-[#a1a1aa] flex items-center gap-1.5">⚡ {user?.email}</p>
            </div>
            <div className="flex gap-4">
              <a href="/" className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(255,15,15,0.2)]">
                Browse Products
              </a>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#121317]/90 border border-white/5 rounded-2xl p-6">
              <p className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">Total Purchases</p>
              <p className="text-3xl font-black text-white">{totalPurchases}</p>
            </div>
            <div className="bg-[#121317]/90 border border-white/5 rounded-2xl p-6">
              <p className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">Pending Processing</p>
              <p className="text-3xl font-black text-[#f59e0b]">{pendingOrders}</p>
            </div>
            <div className="bg-[#121317]/90 border border-white/5 rounded-2xl p-6">
              <p className="text-xs text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">Delivered Servers</p>
              <p className="text-3xl font-black text-[#10b981]">{approvedOrders}</p>
            </div>
          </div>

          {/* Order History Listing */}
          <div className="bg-[#121317]/95 border border-[#ff0f0f]/15 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-[#ff0f0f]" /> Order Purchase History</h3>
            
            {ordersLoading ? (
              <p className="text-sm text-[#a1a1aa]">Loading orders...</p>
            ) : orders.length > 0 ? (
              <div className="space-y-6">
                {orders.map((o) => (
                  <div key={o.orderId} className="border border-white/5 bg-black/40 rounded-2xl p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                      <div>
                        <span className="font-mono text-sm text-[#ff0f0f] font-bold">#{o.orderId}</span>
                        <h4 className="text-lg font-bold text-white mt-1">{o.product}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-xl text-white">₹{o.price}</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          o.status === "APPROVED" ? "bg-[#10b981]/15 text-[#10b981]" :
                          o.status === "PENDING" ? "bg-[#f59e0b]/15 text-[#f59e0b]" :
                          "bg-red-500/15 text-red-500"
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Transaction Ref (UTR)</p>
                        <p className="font-mono font-medium text-white">{o.utr || "---"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Order Date</p>
                        <p className="text-white font-medium">{new Date(o.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Delivery details if approved */}
                    {o.status === "APPROVED" && (
                      <div className="pt-2">
                        <div className="bg-[#10b981]/5 border border-[#10b981]/10 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase text-[#10b981] tracking-wider flex items-center gap-1.5">
                              🔑 ACCOUNT / HOSTING CREDENTIALS
                            </span>
                            {o.deliveryDetails && (
                              <button
                                onClick={() => handleCopy(o.deliveryDetails || "")}
                                className="text-xs font-bold text-white hover:text-[#10b981] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none"
                              >
                                <Copy className="w-3.5 h-3.5" /> Copy Details
                              </button>
                            )}
                          </div>
                          <pre className="font-mono text-xs text-white/90 whitespace-pre-wrap bg-black/60 p-4 border border-white/5 rounded-lg leading-relaxed">
                            {o.deliveryDetails || "Credentials have been successfully processed and sent to your email. Contact support if you haven't received them."}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#a1a1aa]">
                <p className="text-sm">You haven't made any purchases yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-[#0f0f0f]/90 backdrop-blur-xl border rounded-xl shadow-2xl transition-all duration-300 transform ${
        showToast ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      } border-[#ff0f0f]/30 shadow-[#ff0f0f]/5`}>
        <div className="p-1.5 rounded-lg bg-[#ff0f0f]/10 text-[#ff0f0f]">
          <CheckCircle className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold text-white">{toastMsg}</span>
      </div>
    </div>
  );
}
