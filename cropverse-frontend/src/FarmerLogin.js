import { useState } from "react";

export default function FarmerLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Demo farmer login
    if (email === "farmer@demo.com" && password === "1234") {
      setMsg("");
      onLogin({ role: "farmer", name: "Demo Farmer", farmer_id: 1, district: "Dhaka" });
    } else {
      setMsg("Wrong email or password (try farmer@demo.com / 1234)");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", fontFamily: "Arial" }}>
      <h2>🌾 Farmer Login</h2>

      {msg && <div style={{ background: "#8b4545", padding: 10, marginBottom: 10 }}>{msg}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input
            style={{ width: "100%", padding: 8 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="farmer@demo.com"
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input
            style={{ width: "100%", padding: 8 }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="1234"
          />
        </div>

        <button style={{ padding: "8px 14px", marginRight: 10 }} type="submit">
          Login
        </button>
        <button type="button" style={{ padding: "8px 14px" }} onClick={onBack}>
          Back
        </button>
      </form>

      <p style={{ color: "gray", marginTop: 10 }}>
        Demo: <b>farmer@demo.com</b> / <b>1234</b>
      </p>
    </div>
  );
}
