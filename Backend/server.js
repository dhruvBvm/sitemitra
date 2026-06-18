const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { protect } = require("./middleware/auth");
const path = require("path");
const User = require("./modules/user/user.model");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");

// Pre-register models for populate
require("./modules/site/site.model");
require("./modules/material/material.model");

require("./modules/notification/notification.model");
require("./modules/request/request.model");
require("./modules/inventory/inventory.model");

// Routes
const authRoutes = require("./modules/auth/auth.routes");
const ownerRoutes = require("./modules/owner/owner.routes");
const userRoutes = require("./modules/user/user.routes");
const siteRoutes = require("./modules/site/site.routes");
const materialRoutes = require("./modules/material/material.routes");

const managerRoutes = require("./modules/manager/manager.routes");
const staffRoutes = require("./modules/staff/staff.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const requestRoutes = require("./modules/request/request.routes");
const inventoryRoutes = require("./modules/inventory/inventory.routes");

dotenv.config();

(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    // Seed demo owners if they do not exist
    const seedDemoOwner = async () => {
      const owner1Exists = await User.findOne({ email: "owner@example.com" });
      if (!owner1Exists) {
        const demoOwner = new User({
          name: "Demo Owner",
          email: "owner@example.com",
          mobile: "1111111111",
          password: "owner123", // will be hashed by pre‑save hook
          role: "owner",
        });
        await demoOwner.save();
      }

      const owner2Exists = await User.findOne({ email: "owner2@example.com" });
      if (!owner2Exists) {
        const secondOwner = new User({
          name: "Second Owner",
          email: "owner2@example.com",
          mobile: "2222222222",
          password: "owner123", // will be hashed by pre‑save hook
          role: "owner",
        });
        await secondOwner.save();
      }
    };
    await seedDemoOwner();

    const app = express();

    // Middleware
    app.use(express.json());
    const allowedOrigin = [
      "http://localhost:3000",
      "http://localhost:5173",
    ].concat(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []);

    app.use(
      cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    );
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // Swagger Documentation
    if (process.env.NODE_ENV !== "production") {
      app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpecs, { explorer: true }),
      );
    }

    // Route registration
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/owner", ownerRoutes);
    app.use("/api/owner/sites", siteRoutes);
    app.use("/api/owner/materials", materialRoutes);
    app.use("/api/materials", materialRoutes);

    app.use("/api/manager", managerRoutes);
    app.use("/api/staff", staffRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/requests", requestRoutes);
    app.use("/api/inventory", inventoryRoutes);

    const uploadsRoutes = require("./modules/request/uploads.routes");
    app.use("/api/uploads", uploadsRoutes);

    // Root endpoint
    app.get("/", (req, res) => {
      res.send("ERP Backend is running with Manager & Staff workflows");
    });

    // Error handling middleware
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Server running on port ${PORT}`),
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
