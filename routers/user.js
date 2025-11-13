// routers/user.js
import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import {
  verifyToken,
  hashPassword,
  comparePassword,
} from "../middleware/middleware.js";
import multer from "multer";

const router = express.Router();
let usersCollection;

// Function to inject MongoDB collection
export const setUsersCollection = ({ usersCollection: uc }) => {
  usersCollection = uc;
};

// Configure multer for NID image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/nid_images/"); // folder to store NID images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST /signup
router.post("/users/signup", upload.fields(
  [{ name: "nid_front_image", maxCount: 1 }, { name: "nid_back_image", maxCount: 1 }]), 
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password,
        date_of_birth,
        nid_number,
        location,
      } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ message: "Name, email, and password are required" });
      }

      const existingUser = await usersCollection.findOne({
        $or: [{ email }, { phone }, { nid_number }],
      });

      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashedPassword = await hashPassword(password);

      // Access uploaded files
      const nidFront = req.files["nid_front_image"]
        ? req.files["nid_front_image"][0].path
        : null;
      const nidBack = req.files["nid_back_image"]
        ? req.files["nid_back_image"][0].path
        : null;

      const newUser = {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password: hashedPassword,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        nid_number: nid_number || null,
        location: location || null,
        nid_front_image: nidFront,
        nid_back_image: nidBack,
        role: "user",
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);

      const { password: _, ...safeUser } = newUser;

      res.status(201).json({
        message: "User created successfully",
        userId: result.insertedId,
        user: safeUser,
      });
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


// POST /users/login
router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });

    // creating token
    const payload = { id: user._id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const { password: _, ...userData } = user;

    res.json({ message: "Login successful", token, user: userData });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /users
router.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await usersCollection.find();
    if (!users) return res.status(404).json({ message: "Users not found" });

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /users/:id
router.get("/users/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
