const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("CropVerse backend is running ✅"));

// ✅ listings
app.get("/api/listings", (req, res) => {
  const q = `
    SELECT cl.listing_id, f.name AS farmer_name, f.district, c.crop_name,
           cl.quantity_kg, cl.price_per_kg, cl.status, cl.listed_at
    FROM CropListing cl
    JOIN Farmer f ON cl.farmer_id = f.farmer_id
    JOIN Crop c ON cl.crop_id = c.crop_id
    WHERE cl.status = 'Available'
    ORDER BY cl.listed_at DESC;
  `;
  db.query(q, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/listings", (req, res) => {
  const { farmer_id, crop_id, quantity_kg, price_per_kg, listed_at } = req.body;
  if (!farmer_id || !crop_id || !quantity_kg || !price_per_kg || !listed_at) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const q = `
    INSERT INTO CropListing(farmer_id, crop_id, quantity_kg, price_per_kg, listed_at)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(q, [farmer_id, crop_id, quantity_kg, price_per_kg, listed_at], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, listing_id: result.insertId });
  });
});

// ✅ alerts
app.get("/api/alerts", (req, res) => {
  db.query("SELECT * FROM Alert ORDER BY created_at DESC LIMIT 50", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ disease reports (trigger creates alerts if severity >= 8)
app.post("/api/disease-reports", (req, res) => {
  const { farmer_id, crop_id, disease_name, severity, notes, report_date, district } = req.body;

  if (!farmer_id || !crop_id || !disease_name || !severity || !report_date || !district) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const q = `
    INSERT INTO DiseaseReport(farmer_id, crop_id, disease_name, severity, notes, report_date, district)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(q, [farmer_id, crop_id, disease_name, severity, notes || "", report_date, district], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, report_id: result.insertId });
  });
});

// ✅ purchase (trigger reduces qty + sold out alert)
app.post("/api/purchase", (req, res) => {
  const { listing_id, buyer_id, quantity_bought } = req.body;

  if (!listing_id || !buyer_id || !quantity_bought) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.query("SELECT price_per_kg, quantity_kg, status FROM CropListing WHERE listing_id=?", [listing_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Listing not found" });
    if (rows[0].status !== "Available") return res.status(400).json({ error: "Listing not available" });

    const available = Number(rows[0].quantity_kg);
    const qty = Number(quantity_bought);

    if (qty <= 0) return res.status(400).json({ error: "Quantity must be > 0" });
    if (qty > available) return res.status(400).json({ error: `Only ${available} kg available` });

    const total = Number(rows[0].price_per_kg) * qty;

    const q = `
      INSERT INTO Transaction(listing_id, buyer_id, quantity_bought, total_price, transaction_date)
      VALUES (?, ?, ?, ?, CURDATE())
    `;
    db.query(q, [listing_id, buyer_id, qty, total], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ok: true, transaction_id: result2.insertId, total_price: total });
    });
  });
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));

