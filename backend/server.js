require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const clientsRoutes = require("./src/routes/clients");
const usersRoutes = require("./src/routes/users");
const formsRoutes = require("./src/routes/forms");

const responseRoutes = require("./src/routes/responseRoutes");

const path = require("path");
const fs = require("fs");      

const start = async () => {

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads dir: ${uploadsDir}`);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB, exiting.", err);
    process.exit(1);
  }

  const app = express();

  app.use(helmet());
  app.use(
    helmet({

      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );


  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

  app.use(
    cors({
      origin: allowedOrigin,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );

  app.use((req, res, next) => {

    next();
  });

  app.use(express.json());
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.join(process.cwd(), 'uploads')));
  app.use("/api/auth", authRoutes);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/forms", formsRoutes);
  app.use("/api/users", usersRoutes);

  app.use("/api/responses", responseRoutes);


  app.use((err, req, res, next) => {
    console.error("Error:", err);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message || "Server error" });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Allowed origin: ${allowedOrigin}`);
  });
};

start();
