import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, unique: true },
    category: { type: String, default: "General", trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    supplier: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    reorderLevel: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true },
);
export default mongoose.model("Product", productSchema);
