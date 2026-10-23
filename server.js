const express = require("express");
const cors = require("cors");

const connectDB = require("./models/db");

const robotRoutes = require("./routes/robotRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

const PORT = 5001;

// Connect MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "RoboLAN Manager Backend is running!"
  });
});

// Robot routes
app.use("/api/robots", robotRoutes);

// Activity routes
app.use("/api/activities", activityRoutes);

// Start server
app.listen(PORT, () => {
  console.log(
    `RoboLAN Manager server running on http://localhost:${PORT}`
  );
});