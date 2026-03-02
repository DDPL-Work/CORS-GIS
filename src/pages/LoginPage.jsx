import { useState } from 'react';
import { useApp } from '../context/AppContext';
// import { MOCK_USERS } from "../data/mockUsers";
import { loginUser, signupUser } from "../api/authApi";
import soiLogo from "../assets/survey-logo2.png";
import { ROLES, ALL_ZONES } from "../config/roleConfig";
const LoginPage = () => {
  const { dispatch } = useApp();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ username: "", password: "", name: "", email: "", mobile: "", role: "SURVEYOR", zone: "NORTH" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  // const handleLogin = async () => {
  //   setLoading(true); setError("");
  //   await new Promise(r => setTimeout(r, 600));
  //   const user = MOCK_USERS.find(u => u.username === form.username && u.password === form.password);
  //   if (!user) { setError("Invalid credentials. Try: admin/admin123, director1/123, supervisor1/123, surveyor1/123"); setLoading(false); return; }
  //   dispatch({ type: "LOGIN", payload: { user, token: `jwt_${Date.now()}`, role: user.role, zone: user.zone } });
  //   setLoading(false);
  // };
const handleLogin = async () => {
  if (!form.username || !form.password) {
    setError("Username and password required");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const data = await loginUser({
      username: form.username,
      password: form.password,
    });

    const authPayload = {
      user: {
        id: data.user_id,
        username: data.username,
      },
      token: data.token,
      role: data.role,
      zone: form.zone || "NORTH", // zone not returned from API yet
    };

    localStorage.setItem("rekhans_auth", JSON.stringify(authPayload));

    dispatch({ type: "LOGIN", payload: authPayload });

  } catch (err) {
    setError(err.message || "Invalid username or password");
  } finally {
    setLoading(false);
  }
};
  // const handleRegister = async () => {
  //   if (!form.username || !form.password || !form.name) { setError("Please fill required fields."); return; }
  //   setLoading(true);
  //   await new Promise(r => setTimeout(r, 600));
  //   dispatch({ type: "REGISTER_USER", payload: { id: Date.now(), ...form } });
  //   setTab("login"); setError("Registration successful! Please log in."); setLoading(false);
  // };

const handleRegister = async () => {
 if (!form.username || !form.password || !form.name || !form.email) {
  setError("All required fields must be filled.");
  return;
}

if (!/^\S+@\S+\.\S+$/.test(form.email)) {
  setError("Invalid email format.");
  return;
}

if (!/^\d{10}$/.test(form.mobile)) {
  setError("Mobile must be 10 digits.");
  return;
}

  try {
    setLoading(true);
    setError("");

    const data = await signupUser({
      username: form.username,
      password: form.password,
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      role: form.role,
      zone: form.zone,
    });

  setForm({
  username: "",
  password: "",
  name: "",
  email: "",
  mobile: "",
  role: "SURVEYOR",
  zone: "NORTH"
});
setTab("login");
setError("Registration successful! Please login.");

  } catch (err) {
    setError(err.message || "Signup failed");
  } finally {
    setLoading(false);
  }
};

const set = (k, v) => {
  setForm(f => {
    const updated = { ...f, [k]: v };

    // If role changes, reset zone
    if (k === "role") {
      const roleConfig = ROLES.find(r => r.value === v);
      updated.zone =
        roleConfig?.zones?.length > 0
          ? roleConfig.zones[0]
          : "NORTH";
    }

    return updated;
  });
};
  const inputStyle = { width: "100%", background: "#0d1b2a", border: "1px solid #00e5ff33", color: "#e0f7fa", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontFamily: "monospace", boxSizing: "border-box", outline: "none" };
  const labelStyle = { color: "#4dd0e1", fontSize: 11, fontFamily: "monospace", letterSpacing: 1, display: "block", marginBottom: 5 };
const selectedRoleConfig = ROLES.find(r => r.value === form.role);
const availableZones =
  selectedRoleConfig?.zones?.length > 0
    ? selectedRoleConfig.zones
    : ALL_ZONES;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#060d1a", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      fontFamily: "monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.05)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes glow {
          0% { filter: drop-shadow(0 0 20px rgba(0,229,255,0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(0,229,255,0.6)); }
          100% { filter: drop-shadow(0 0 20px rgba(0,229,255,0.3)); }
        }
      `}</style>
      
      {/* Background Effects */}
      <div style={{ 
        position: "fixed", 
        inset: 0, 
        backgroundImage: "linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)", 
        backgroundSize: "40px 40px", 
        pointerEvents: "none" 
      }} />
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: 2, 
        background: "linear-gradient(90deg, transparent, #00e5ff, transparent)", 
        animation: "scanline 4s linear infinite", 
        pointerEvents: "none", 
        opacity: 0.3 
      }} />

      {/* Main Container - Two Column Layout */}
      <div style={{
        display: "flex",
        width: "1000px",
        maxWidth: "90%",
        background: "rgba(8,15,26,0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid #00e5ff33",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,229,255,0.1) inset",
        position: "relative",
        zIndex: 10
      }}>
        {/* Left Side - Survey of India Branding */}
        <div style={{
          flex: 1,
          background: "linear-gradient(135deg, #0a1a2f 0%, #0d1b2a 100%)",
          padding: "48px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRight: "1px solid #00e5ff22",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decorative Elements */}
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle at 30% 30%, rgba(0,229,255,0.05) 0%, transparent 50%)",
            pointerEvents: "none"
          }} />
          
          {/* Survey of India Logo */}
         <div style={{
  width: 224,
  height: 245,
  borderRadius: "50%",
  background: "rgba(245 254 255  / 75%)",
  border: "2px solid #00e5ff",
  boxShadow: "0 0 40px rgba(0,229,255,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 32,
  // animation: "float 6s ease-in-out infinite, glow 3s ease-in-out infinite"
}}>
  <img
    src={soiLogo}
    alt="Survey of India Logo"
    style={{
      width: "70%",
      objectFit: "contain"
    }}
  />
</div>

          {/* Survey of India Text */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              color: "#00e5ff",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 4,
              marginBottom: 8,
              textShadow: "0 0 10px #00e5ff66"
            }}>
             भारतीय सर्वेक्षण विभाग
            </div>
            <div style={{
              color: "#4dd0e1",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 4
            }}>
              SURVEY OF INDIA
            </div>
            <div style={{
              color: "#1e5f74",
              fontSize: 12,
              letterSpacing: 1,
              borderTop: "1px solid #00e5ff33",
              borderBottom: "1px solid #00e5ff33",
              padding: "8px 0",
              marginTop: 8
            }}>
              GEODETIC & RESEARCH BRANCH
            </div>
          </div>

          {/* CORS Network Stats */}
          <div style={{
            display: "flex",
            gap: 24,
            marginTop: 24,
            padding: "16px 24px",
            background: "#00e5ff11",
            borderRadius: 12,
            border: "1px solid #00e5ff22"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00e5ff", fontSize: 20, fontWeight: 900 }}>150+</div>
              <div style={{ color: "#80deea", fontSize: 10 }}>CORS Stations</div>
            </div>
            <div style={{ width: 1, background: "#00e5ff33" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00e5ff", fontSize: 20, fontWeight: 900 }}>24/7</div>
              <div style={{ color: "#80deea", fontSize: 10 }}>Monitoring</div>
            </div>
            <div style={{ width: 1, background: "#00e5ff33" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00e5ff", fontSize: 20, fontWeight: 900 }}>cm</div>
              <div style={{ color: "#80deea", fontSize: 10 }}>Accuracy</div>
            </div>
          </div>

          {/* Footer Text */}
          <div style={{
            marginTop: "auto",
            color: "#1e5f74",
            fontSize: 10,
            textAlign: "center",
            lineHeight: 1.6
          }}>
            <div>भारत सरकार • GOVERNMENT OF INDIA</div>
            <div>Ministry of Science & Technology</div>
            <div style={{ marginTop: 8 }}>© 2024 All Rights Reserved</div>
          </div>
        </div>

        {/* Right Side - Login/Register Form */}
        <div style={{
          flex: 1,
          padding: "48px 40px",
          background: "#0a1220"
        }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 32, animation: "pulse 3s ease-in-out infinite", textAlign: "center" }}>🛰</div>
            <div style={{ color: "#00e5ff", fontSize: 28, fontWeight: 900, letterSpacing: 4, textAlign: "center", marginTop: 8 }}>ReKHAnS</div>
            <div style={{ color: "#4dd0e1", fontSize: 10, letterSpacing: 2, textAlign: "center", marginTop: 4 }}>
              REFERENCE STATION KEY HEALTH ATTRIBUTE ANALYSIS SYSTEM
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#0d1b2a", borderRadius: 8, padding: 4 }}>
            {["login", "register"].map(t => (
              <button key={t} onClick={() => { setTab(t); setError(""); }}
                style={{ flex: 1, padding: "8px", borderRadius: 6, background: tab === t ? "#00e5ff22" : "transparent", border: tab === t ? "1px solid #00e5ff44" : "1px solid transparent", color: tab === t ? "#00e5ff" : "#4dd0e1", cursor: "pointer", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                {t}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ 
              background: error.includes("successful") ? "#00e67622" : "#ff444422", 
              border: `1px solid ${error.includes("successful") ? "#00e676" : "#ff4444"}44`, 
              color: error.includes("successful") ? "#00e676" : "#ff6b6b", 
              borderRadius: 6, 
              padding: "8px 12px", 
              marginBottom: 16, 
              fontSize: 11 
            }}>
              {error}
            </div>
          )}

          {tab === "login" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>USERNAME</label>
                <input value={form.username} onChange={e => set("username", e.target.value)} placeholder="Enter username" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              </div>
             <div style={{ position: "relative" }}>
  <label style={labelStyle}>PASSWORD</label>

  <input
    type={showPassword ? "text" : "password"}
    value={form.password}
    onChange={e => set("password", e.target.value)}
    placeholder="Enter password"
    style={{ ...inputStyle, paddingRight: 45 }}
    onKeyDown={e => e.key === "Enter" && handleLogin()}
  />

  {/* Eye Toggle */}
  <button
    type="button"
    onClick={() => setShowPassword(prev => !prev)}
    style={{
      position: "absolute",
      right: 10,
      top: 25,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#4dd0e1",
      fontSize: 16
    }}
  >
    {showPassword ? "🙈" : "👁"}
  </button>
</div>
              <button onClick={handleLogin} disabled={loading} 
                style={{ 
                  background: "linear-gradient(135deg, #00e5ff22, #006064)", 
                  border: "1px solid #00e5ff", 
                  color: "#00e5ff", 
                  borderRadius: 8, 
                  padding: "12px", 
                  cursor: "pointer", 
                  fontSize: 13, 
                  fontWeight: 700, 
                  letterSpacing: 2, 
                  marginTop: 4, 
                  opacity: loading ? 0.7 : 1,
                  transition: "all 0.3s"
                }}>
                {loading ? "AUTHENTICATING..." : "LOGIN TO SYSTEM"}
              </button>
             
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["name", "FULL NAME", "text"], ["username", "USERNAME", "text"], ["email", "EMAIL", "email"], ["mobile", "MOBILE", "tel"], ["password", "PASSWORD", "password"]].map(([k, l, t]) => (
                <div key={k}>
                  <label style={labelStyle}>{l}</label>
                  <input type={t} value={form[k]} onChange={e => set(k, e.target.value)} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>ROLE</label>
                  <select value={form.role} onChange={e => set("role", e.target.value)} style={{ ...inputStyle, padding: "9px 12px" }}>
{ROLES.map(role => (
  <option key={role.value} value={role.value}>
    {role.label}
  </option>
))}                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ZONE</label>
                 <select
  value={form.zone}
  onChange={e => set("zone", e.target.value)}
  style={{ ...inputStyle, padding: "9px 12px" }}
  disabled={selectedRoleConfig?.zones?.length === 0}
>
  {availableZones.map(z => (
    <option key={z} value={z}>{z}</option>
  ))}
</select>
                </div>
              </div>
              <button onClick={handleRegister} disabled={loading} 
                style={{ 
                  background: "linear-gradient(135deg, #00e67622, #1b5e20)", 
                  border: "1px solid #00e676", 
                  color: "#00e676", 
                  borderRadius: 8, 
                  padding: "12px", 
                  cursor: "pointer", 
                  fontSize: 13, 
                  fontWeight: 700, 
                  letterSpacing: 2, 
                  marginTop: 4,
                  transition: "all 0.3s"
                }}>
                {loading ? "REGISTERING..." : "REGISTER"}
              </button>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 24, color: "#1e5f74", fontSize: 10, letterSpacing: 1 }}>
            Secure GIS Platform • v2.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;