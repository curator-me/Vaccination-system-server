// routers/user.js
import express from "express";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import {
  verifyToken,
  hashPassword,
  comparePassword,
} from "../middleware/middleware.js";
import transporter from "../service/nodemailer.js";
import upload from "../service/multer.js";

const router = express.Router();
let usersCollection;

// Temporary in-memory storage for pending signups
const pendingSignups = new Map();

// Function to inject MongoDB collection
export const setUsersCollection = ({ usersCollection: uc }) => {
  usersCollection = uc;
};

// 1. POST /users/signup-req
router.post("/users/signup-req", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Ensure that email is unique
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await hashPassword(password);

    // Generate a 6-digit verification code (OTP)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in temporary memory
    pendingSignups.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      password: hashedPassword,
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    });

    // Send email via nodemailer
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email.toLowerCase(),
      subject: "Your Signup Verification Code",
      text: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending verification email:", error);
      } else {
        console.log("Verification email sent:", info.response);
      }
    });

    // Print to console for easy testing locally
    console.log(`[DEV] OTP code for ${email.toLowerCase()}: ${verificationCode}`);

    res.status(200).json({ message: "A verification code has been sent to your email" });
  } catch (err) {
    console.error("Error in signup-req:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 2. POST /users/verify-signup
router.post("/users/verify-signup", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const pendingData = pendingSignups.get(email.toLowerCase());

    if (!pendingData) {
      return res.status(404).json({ message: "No pending signup found for this email" });
    }

    if (Date.now() > pendingData.expires) {
      pendingSignups.delete(email.toLowerCase());
      return res.status(400).json({ message: "Verification code has expired" });
    }

    if (pendingData.code !== code.toString()) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Insert user into actual database permanently
    const newUser = {
      email: pendingData.email,
      password: pendingData.password,
      role: "user",
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await usersCollection.insertOne(newUser);

    // Clean up from memory
    pendingSignups.delete(email.toLowerCase());

    res.status(201).json({ message: "Signup success" });
  } catch (err) {
    console.error("Error in verify-signup:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 3. POST /users/verify-user
router.post("/users/verify-user", verifyToken, upload.fields([
  { name: "nid_front_image", maxCount: 1 }, 
  { name: "nid_back_image", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      email,
      name,
      phone,
      date_of_birth,
      nid_number,
      location,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required to identify the user" });
    }

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Access uploaded files if any
    const nidFront = req.files && req.files["nid_front_image"]
      ? req.files["nid_front_image"][0].path
      : existingUser.nid_front_image;

    const nidBack = req.files && req.files["nid_back_image"]
      ? req.files["nid_back_image"][0].path
      : existingUser.nid_back_image;

    const updateFields = {
      $set: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(date_of_birth && { date_of_birth: new Date(date_of_birth) }),
        ...(nid_number && { nid_number }),
        ...(location && { location }),
        ...(nidFront && { nid_front_image: nidFront }),
        ...(nidBack && { nid_back_image: nidBack }),
        updated_at: new Date()
      }
    };

    await usersCollection.updateOne(
      { email: email.toLowerCase() },
      updateFields
    );

    res.status(200).json({ message: "User information updated successfully" });
  } catch (err) {
    console.error("Error in verify-user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
