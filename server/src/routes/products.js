import { Router } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;
    const query = {};
    if (search)
      query.$or = ["name", "sku", "supplier", "category"].map((key) => ({
        [key]: { $regex: search, $options: "i" },
      }));
    if (category && category !== "All categories") query.category = category;
    res.json(await Product.find(query).sort({ updatedAt: -1 }));
  } catch (e) {
    next(e);
  }
});
router.get("/stats", async (_req, res, next) => {
  try {
    const products = await Product.find();
    const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
    const inventoryValue = products.reduce(
      (s, p) => s + p.quantity * p.price,
      0,
    );
    res.json({
      productCount: products.length,
      totalUnits,
      inventoryValue,
      lowStock: products.filter((p) => p.quantity <= p.reorderLevel).length,
      categories: [...new Set(products.map((p) => p.category))].length,
    });
  } catch (e) {
    next(e);
  }
});
router.get("/categories", async (_req, res, next) => {
  try {
    res.json(await Product.distinct("category"));
  } catch (e) {
    next(e);
  }
});
router.post("/", async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});
router.put("/:id", async (req, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(p);
  } catch (e) {
    next(e);
  }
});
router.patch("/:id/stock", async (req, res, next) => {
  try {
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta))
      return res
        .status(400)
        .json({ message: "A valid stock adjustment is required" });
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    if (p.quantity + delta < 0)
      return res.status(400).json({ message: "Stock cannot be negative" });
    p.quantity += delta;
    await p.save();
    res.json(p);
  } catch (e) {
    next(e);
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (e) {
    next(e);
  }
});
export default router;
