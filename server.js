import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_URL = process.env.API_URL;
const API_TOKEN = process.env.API_TOKEN;

app.get("/api/show/data", async (req, res) => {
  try {
    const response = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch external API" });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching API:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
