require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const Client = require("./src/models/Client");
const authRoutes = require("./src/routes/auth");
const clientsRoutes = require("./src/routes/clients");
const usersRoutes = require("./src/routes/users");
const formsRoutes = require("./src/routes/forms");

const responseRoutes = require("./src/routes/responseRoutes");

const path = require("path");
const fs = require("fs");

const app = express();

app.use(helmet());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigin = process.env.CLIENT_URL || "https://safetynet-tech.vercel.app";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "https://safetynet-tech.vercel.app", // Main frontend
        "https://safetynet-tech-7qme.vercel.app", // Backend itself (sometimes helpful)
        "http://localhost:5173",             // Local dev
        "http://localhost:3000",             // Alternative local dev
      ];

      // Also allow Vercel preview deployments
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

app.options('*', cors()); // Enable pre-flight for all routes

app.use((req, res, next) => {
  next();
});

app.use(express.json());

// Middleware to ensure DB connection (Crucial for Vercel Serverless)
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 0) { // Disconnected
    try {
      console.log('Connecting to MongoDB...');
      await connectDB();
    } catch (err) {
      console.error('Failed to connect to MongoDB in middleware', err);
      return res.status(500).json({ error: 'Database connection failed' });
    }
  }
  next();
});
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static((process.env.NODE_ENV === 'production' || process.env.VERCEL) ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/forms", formsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/responses", responseRoutes);

app.use((err, req, res, next) => {
  console.error("Error Handler:", err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ') || 'Validation Error',
      errors: err.errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`
    });
  }

  res
    .status(err.status || 500)
    .json({
      success: false,
      message: err.message || "Server error",
      debug_stack: process.env.NODE_ENV === 'production' ? undefined : err.stack // Expose stack for debug
    });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState; // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const dbStatusMap = { 0: "Disconnected", 1: "Connected", 2: "Connecting", 3: "Disconnecting" };

  res.json({
    success: true,
    message: "Health check",
    serverTime: new Date().toISOString(),
    dbStatus: dbStatusMap[dbStatus] || "Unknown",
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMongoUri: !!process.env.MONGO_URI,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

const start = async () => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  const uploadsDir = isProduction ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created uploads dir: ${uploadsDir}`);
    } catch (err) {
      console.warn(`Failed to create uploads dir at startup: ${uploadsDir}. Will attempt lazy creation on upload.`, err);
    }
  }

  try {
    await connectDB();

    // Seed 'Safetynett' client if it doesn't exist
    const clientName = "Safetynett";
    const existingClient = await Client.findOne({ name: clientName });
    if (!existingClient) {
      await Client.create({ name: clientName });
      console.log(`Client '${clientName}' created successfully.`);
    } else {
      console.log(`Client '${clientName}' already exists.`);
    }

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`Allowed origin: ${allowedOrigin}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB, exiting.", err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
