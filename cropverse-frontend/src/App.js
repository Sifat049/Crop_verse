import { useEffect, useState } from "react";
import FarmerLogin from "./FarmerLogin";
import BuyerLogin from "./BuyerLogin";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  // home | farmerLogin | buyerLogin | dashboard
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  const [listings, setListings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  // Farmer form state
  const [newListing, setNewListing] = useState({
    crop_id: 1,
    quantity_kg: "",
    price_per_kg: "",
  });

  const [disease, setDisease] = useState({
    crop_id: 1,
    disease_name: "",
    severity: 8,
    notes: "",
    district: "Dhaka",
  });

  const loadData = async () => {
    try {
      setError("");
      const l = await fetch("http://localhost:5000/api/listings");
      const a = await fetch("http://localhost:5000/api/alerts");

      if (!l.ok) throw new Error("Failed to load listings");
      if (!a.ok) throw new Error("Failed to load alerts");

      setListings(await l.json());
      setAlerts(await a.json());
    } catch (e) {
      setError("Failed to fetch (backend not running or wrong port).");
    }
  };

  // Load data only when dashboard is open
  useEffect(() => {
    if (page === "dashboard") {
      loadData();
      const t = setInterval(loadData, 5000);
      return () => clearInterval(t);
    }
  }, [page]);

  const logout = () => {
    setUser(null);
    setPage("home");
  };

  // ✅ Farmer: Create Listing (POST to backend -> MySQL)
  const createListing = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: user?.farmer_id || 1,
          crop_id: Number(newListing.crop_id),
          quantity_kg: Number(newListing.quantity_kg),
          price_per_kg: Number(newListing.price_per_kg),
          listed_at: todayISO(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create listing");

      setNewListing({ crop_id: 1, quantity_kg: "", price_per_kg: "" });
      await loadData();
      alert("✅ Listing created!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ✅ Farmer: Report Disease (POST -> MySQL trigger may create alert)
  const reportDisease = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/disease-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: user?.farmer_id || 1,
          crop_id: Number(disease.crop_id),
          disease_name: disease.disease_name,
          severity: Number(disease.severity),
          notes: disease.notes,
          report_date: todayISO(),
          district: disease.district,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit disease report");

      setDisease({ crop_id: 1, disease_name: "", severity: 8, notes: "", district: "Dhaka" });
      await loadData();
      alert("✅ Disease report submitted!");
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ✅ Buyer: Purchase listing (POST -> triggers reduce qty, sold out alert)
  const buyListing = async (listing_id) => {
    const qtyStr = prompt("Enter quantity to buy (kg):");
    if (!qtyStr) return;

    const qty = Number(qtyStr);
    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Invalid quantity");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id,
          buyer_id: user?.buyer_id || 1,
          quantity_bought: qty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");

      await loadData();
      alert(`✅ Purchase successful! Total price: ${data.total_price}`);
    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // -------------------------
  // HOME PAGE
  // -------------------------
  if (page === "home") {
    return (
      <div style={{ fontFamily: "Arial", padding: 40, textAlign: "center" }}>
        <h1>🌾 CropVerse</h1>
        <p>Choose how you want to log in</p>

        <div style={{ marginTop: 20 }}>
          <button style={{ padding: "10px 20px", marginRight: 10 }} onClick={() => setPage("farmerLogin")}>
            Login as Farmer
          </button>
          <button style={{ padding: "10px 20px" }} onClick={() => setPage("buyerLogin")}>
            Login as Buyer
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // FARMER LOGIN
  // -------------------------
  if (page === "farmerLogin") {
    return (
      <FarmerLogin
        onBack={() => setPage("home")}
        onLogin={(u) => {
          setUser(u);
          setPage("dashboard");
        }}
      />
    );
  }

  // -------------------------
  // BUYER LOGIN
  // -------------------------
  if (page === "buyerLogin") {
    return (
      <BuyerLogin
        onBack={() => setPage("home")}
        onLogin={(u) => {
          setUser(u);
          setPage("dashboard");
        }}
      />
    );
  }

  // -------------------------
  // DASHBOARD
  // -------------------------
  return (
    <div style={{ fontFamily: "Arial", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
      <h1>📊 CropVerse Dashboard</h1>

      <p>
        Logged in as: <b>{user?.role}</b>{" "}
        <button style={{ marginLeft: 10 }} onClick={logout}>
          Logout
        </button>
      </p>

      {error && (
        <div style={{ background: "#ffe5e5", padding: 10, marginBottom: 15 }}>
          ❌ {error} <br />
          Make sure backend is running on <b>http://localhost:5000</b>
        </div>
      )}

      {/* Farmer Panel */}
      {user?.role === "farmer" && (
        <div style={{ border: "1px solid #ddd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h2>👨‍🌾 Farmer Panel</h2>

          <h3>➕ Create Listing</h3>
          <form onSubmit={createListing}>
            <div style={{ marginBottom: 8 }}>
              <label>Crop ID (demo): </label>
              <input
                value={newListing.crop_id}
                onChange={(e) => setNewListing({ ...newListing, crop_id: e.target.value })}
                style={{ marginLeft: 10 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Quantity (kg): </label>
              <input
                value={newListing.quantity_kg}
                onChange={(e) => setNewListing({ ...newListing, quantity_kg: e.target.value })}
                style={{ marginLeft: 10 }}
                required
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Price per kg: </label>
              <input
                value={newListing.price_per_kg}
                onChange={(e) => setNewListing({ ...newListing, price_per_kg: e.target.value })}
                style={{ marginLeft: 10 }}
                required
              />
            </div>
            <button type="submit">Save Listing</button>
          </form>

          <hr style={{ margin: "20px 0" }} />

          <h3>🦠 Report Disease</h3>
          <form onSubmit={reportDisease}>
            <div style={{ marginBottom: 8 }}>
              <label>Crop ID (demo): </label>
              <input
                value={disease.crop_id}
                onChange={(e) => setDisease({ ...disease, crop_id: e.target.value })}
                style={{ marginLeft: 10 }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Disease name: </label>
              <input
                value={disease.disease_name}
                onChange={(e) => setDisease({ ...disease, disease_name: e.target.value })}
                style={{ marginLeft: 10 }}
                required
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Severity (1–10): </label>
              <input
                type="number"
                min="1"
                max="10"
                value={disease.severity}
                onChange={(e) => setDisease({ ...disease, severity: e.target.value })}
                style={{ marginLeft: 10 }}
                required
              />
              <small style={{ marginLeft: 8, color: "gray" }}>(≥8 creates alert via trigger)</small>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>District: </label>
              <input
                value={disease.district}
                onChange={(e) => setDisease({ ...disease, district: e.target.value })}
                style={{ marginLeft: 10 }}
                required
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Notes: </label>
              <input
                value={disease.notes}
                onChange={(e) => setDisease({ ...disease, notes: e.target.value })}
                style={{ marginLeft: 10 }}
              />
            </div>
            <button type="submit">Submit Disease Report</button>
          </form>
        </div>
      )}

      {/* Buyer Panel */}
      {user?.role === "buyer" && (
        <div style={{ border: "1px solid #ddd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h2>🛒 Buyer Panel</h2>
          <p>Browse listings and click Buy.</p>
        </div>
      )}

      <h2>🛒 Marketplace Listings</h2>
      {listings.length === 0 ? (
        <p>No available listings right now.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Crop</th>
              <th>Farmer</th>
              <th>District</th>
              <th>Quantity (kg)</th>
              <th>Price/kg</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((x) => (
              <tr key={x.listing_id}>
                <td>{x.listing_id}</td>
                <td>{x.crop_name}</td>
                <td>{x.farmer_name}</td>
                <td>{x.district}</td>
                <td>{x.quantity_kg}</td>
                <td>{x.price_per_kg}</td>
                <td>
                  {user?.role === "buyer" ? (
                    <button onClick={() => buyListing(x.listing_id)}>Buy</button>
                  ) : (
                    <span style={{ color: "gray" }}>Login as buyer</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: 25 }}>🚨 Alerts</h2>
      {alerts.length === 0 ? (
        <p>No alerts yet.</p>
      ) : (
        <ul>
          {alerts.map((a) => (
            <li key={a.alert_id}>
              <b>[{a.alert_type}]</b> {a.message}{" "}
              <small style={{ color: "gray" }}>({String(a.created_at).slice(0, 19)})</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
