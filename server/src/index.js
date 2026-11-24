import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "Inventory API" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use((err, _req, res, _next) => {
  if (err.code === 11000)
    return res
      .status(409)
      .json({ message: "SKU already exists. Use a unique SKU." });
  console.error(err);
  res
    .status(err.name === "ValidationError" ? 400 : 500)
    .json({ message: err.message || "Server error" });
});
const port = process.env.PORT || 5000;
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory_management",
  )
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => console.log(`API listening on ${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
