import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product from "../models/Product.js";
dotenv.config();
const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@stockwise.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
const demoProducts = [
  {
    name: "Wireless Mouse",
    sku: "ELE-MOU-001",
    category: "Electronics",
    quantity: 46,
    price: 799,
    supplier: "TechSource India",
    reorderLevel: 12,
    description: "Wireless optical mouse",
  },
  {
    name: "Mechanical Keyboard",
    sku: "ELE-KEY-002",
    category: "Electronics",
    quantity: 18,
    price: 2499,
    supplier: "TechSource India",
    reorderLevel: 8,
    description: "Compact mechanical keyboard",
  },
  {
    name: "USB-C Hub 7-in-1",
    sku: "ELE-HUB-003",
    category: "Electronics",
    quantity: 9,
    price: 1899,
    supplier: "Connectify Supplies",
    reorderLevel: 10,
    description: "Multiport USB-C adapter",
  },
  {
    name: "A4 Printer Paper",
    sku: "OFF-PAP-001",
    category: "Office Supplies",
    quantity: 120,
    price: 285,
    supplier: "PaperTrail",
    reorderLevel: 25,
    description: "500-sheet A4 paper ream",
  },
  {
    name: "Notebook - Ruled",
    sku: "OFF-NOT-002",
    category: "Office Supplies",
    quantity: 75,
    price: 65,
    supplier: "PaperTrail",
    reorderLevel: 20,
    description: "A5 ruled notebook",
  },
  {
    name: "Desk Organizer",
    sku: "OFF-ORG-003",
    category: "Office Supplies",
    quantity: 14,
    price: 349,
    supplier: "Workspace Co.",
    reorderLevel: 10,
    description: "Desktop stationery organizer",
  },
  {
    name: "Packing Tape",
    sku: "PKG-TAP-001",
    category: "Packaging",
    quantity: 6,
    price: 89,
    supplier: "PackRight",
    reorderLevel: 10,
    description: "Clear packing tape roll",
  },
  {
    name: "Shipping Box - Medium",
    sku: "PKG-BOX-002",
    category: "Packaging",
    quantity: 210,
    price: 32,
    supplier: "PackRight",
    reorderLevel: 50,
    description: "Corrugated shipping box",
  },
  {
    name: "Barcode Labels",
    sku: "PKG-LBL-003",
    category: "Packaging",
    quantity: 32,
    price: 160,
    supplier: "LabelWorks",
    reorderLevel: 15,
    description: "Thermal barcode labels",
  },
  {
    name: "Safety Gloves",
    sku: "SAF-GLV-001",
    category: "Safety",
    quantity: 4,
    price: 125,
    supplier: "SafeHands",
    reorderLevel: 10,
    description: "Protective work gloves",
  },
];
try {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/inventory_management",
  );
  const hashed = await bcrypt.hash(adminPassword, 12);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: "Stockwise Admin",
      email: adminEmail,
      password: hashed,
      role: "admin",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  let inserted = 0;
  for (const product of demoProducts) {
    const result = await Product.updateOne(
      { sku: product.sku },
      { $setOnInsert: product },
      { upsert: true },
    );
    if (result.upsertedCount) inserted++;
  }
  console.log(
    `Seed complete. Admin: ${adminEmail} | Seeded ${inserted} new product(s). Existing SKUs were left unchanged.`,
  );
  console.log("Demo password:", adminPassword);
  await mongoose.disconnect();
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
  try {
    await mongoose.disconnect();
  } catch {}
}
