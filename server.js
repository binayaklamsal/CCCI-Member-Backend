import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Debug: Log all environment variables (mask sensitive data)
console.log('📋 Loaded environment variables:');
console.log('API_URL:', process.env.API_URL ? '✓ Set' : '✗ Missing');
console.log('API_PAYMENT:', process.env.API_PAYMENT ? '✓ Set' : '✗ Missing');
console.log('API_TOKEN:', process.env.API_TOKEN ? '✓ Set' : '✗ Missing');
console.log('PORT:', process.env.PORT || '5000 (default)');

const app = express();
app.use(cors());
app.use(express.json());

// Use API_PAYMENT or fallback to API_PAYMET (if you have a typo)
const API_URL = process.env.API_URL;
const API_PAYMENT = process.env.API_PAYMENT || process.env.API_PAYMET;
const API_TOKEN = process.env.API_TOKEN;

// Validate environment variables with better error messages
if (!API_URL) {
  console.error("❌ Missing API_URL environment variable");
  process.exit(1);
}

if (!API_PAYMENT) {
  console.error("❌ Missing API_PAYMENT environment variable");
  console.error("💡 Check if you have API_PAYMET (with typo) in your .env file");
  process.exit(1);
}

if (!API_TOKEN) {
  console.error("❌ Missing API_TOKEN environment variable");
  process.exit(1);
}

console.log('✅ All environment variables loaded successfully!');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: {
      API_URL: API_URL ? "Set" : "Missing",
      API_PAYMENT: API_PAYMENT ? "Set" : "Missing",
      API_TOKEN: API_TOKEN ? "Set" : "Missing"
    }
  });
});

// Get show data
app.get("/api/show/data", async (req, res) => {
  try {
    console.log(`🔗 Fetching from: ${API_URL}`);
    
    const response = await fetch(API_URL, {
      headers: { 
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      console.error(`❌ API responded with status: ${response.status}`);
      return res.status(response.status).json({ 
        error: "Failed to fetch external API",
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log("✅ Successfully fetched show data");
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching API:", error.message);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
});

// Get payment data by ID
app.get("/api/show/data/payment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: "Payment ID is required" 
      });
    }

    // Replace {id} in the API_PAYMENT URL with actual ID
    const paymentUrl = API_PAYMENT.replace('{id}', id);
    console.log(`🔗 Fetching payment data from: ${paymentUrl}`);
    
    const response = await fetch(paymentUrl, {
      headers: { 
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      console.error(`❌ Payment API responded with status: ${response.status}`);
      return res.status(response.status).json({ 
        error: "Failed to fetch payment data",
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched payment data for ID: ${id}`);
    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching payment API:", error.message);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
});

// Create new payment
app.post("/api/payment", async (req, res) => {
  try {
    const paymentData = req.body;
    
    if (!paymentData) {
      return res.status(400).json({ 
        error: "Payment data is required" 
      });
    }

    // For POST, we might need a different endpoint without {id}
    const paymentEndpoint = API_PAYMENT.includes('{id}') 
      ? API_PAYMENT.replace('/{id}', '') 
      : API_PAYMENT;
    
    console.log(`🔗 Creating payment at: ${paymentEndpoint}`);
    console.log(`📦 Payment data:`, JSON.stringify(paymentData, null, 2));
    
    const response = await fetch(paymentEndpoint, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      console.error(`❌ Payment creation failed with status: ${response.status}`);
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to create payment",
        status: response.status,
        statusText: response.statusText,
        details: errorText
      });
    }

    const data = await response.json();
    console.log("✅ Successfully created payment");
    res.status(201).json(data);
  } catch (error) {
    console.error("❌ Error creating payment:", error.message);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
});

// Update payment by ID
app.put("/api/payment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        error: "Payment ID is required" 
      });
    }

    if (!paymentData) {
      return res.status(400).json({ 
        error: "Payment data is required" 
      });
    }

    const paymentUrl = API_PAYMENT.replace('{id}', id);
    console.log(`🔗 Updating payment at: ${paymentUrl}`);
    console.log(`📦 Update data:`, JSON.stringify(paymentData, null, 2));
    
    const response = await fetch(paymentUrl, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      console.error(`❌ Payment update failed with status: ${response.status}`);
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to update payment",
        status: response.status,
        statusText: response.statusText,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`✅ Successfully updated payment for ID: ${id}`);
    res.json(data);
  } catch (error) {
    console.error("❌ Error updating payment:", error.message);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
});

// Delete payment by ID
app.delete("/api/payment/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        error: "Payment ID is required" 
      });
    }

    const paymentUrl = API_PAYMENT.replace('{id}', id);
    console.log(`🔗 Deleting payment at: ${paymentUrl}`);
    
    const response = await fetch(paymentUrl, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      console.error(`❌ Payment deletion failed with status: ${response.status}`);
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to delete payment",
        status: response.status,
        statusText: response.statusText,
        details: errorText
      });
    }

    console.log(`✅ Successfully deleted payment for ID: ${id}`);
    res.json({ 
      message: "Payment deleted successfully",
      id: id
    });
  } catch (error) {
    console.error("❌ Error deleting payment:", error.message);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
});

// Test connection endpoint
app.get("/api/test-connection", async (req, res) => {
  try {
    const response = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });
    
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: API_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      url: API_URL,
      timestamp: new Date().toISOString()
    });
  }
});

// FIXED: 404 handler - use proper express syntax
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "GET /health",
      "GET /api/show/data",
      "GET /api/payment/:id",
      "POST /api/payment",
      "PUT /api/payment/:id",
      "DELETE /api/payment/:id",
      "GET /api/test-connection"
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("🚨 Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Show data API: http://localhost:${PORT}/api/show/data`);
  console.log(`🔗 Payment API: http://localhost:${PORT}/api/show/data/payment/{id}`);
  console.log(`🔗 Test connection: http://localhost:${PORT}/api/test-connection`);
  console.log('\n📚 Available endpoints:');
  console.log('   GET  /health');
  console.log('   GET  /api/show/data');
  console.log('   GET  /api/payment/:id');
  console.log('   POST /api/payment');
  console.log('   PUT  /api/payment/:id');
  console.log('   DELETE /api/payment/:id');
  console.log('   GET  /api/test-connection');
});