import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token)
    return res
      .status(401)
      .json({ message: "Authentication required. Please sign in." });
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "development-secret-change-me",
    );
    req.user = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired or invalid. Please sign in again." });
  }
}
