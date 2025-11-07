import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "our_super_secret_key";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach decoded user info
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
