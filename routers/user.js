// routers/user.js
const express = require("express");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const router = express.Router();

let usersCollection;

const setUsersCollection = ({ usersCollection: uc }) => {
  usersCollection = uc;
};

// Password utility functions
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate random password for NID registration
const generateRandomPassword = () => {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// GET all users (for admin only - remove sensitive data)
router.get("/users/", async (req, res) => {
  try {
    const users = await usersCollection.find({}).project({ password: 0 }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - Create new user with password
router.post("/users/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      date_of_birth,
      nid_number,
      location,
      nid_front_image,
      nid_back_image,
      registration_method = "email" // "email", "phone", "nid"
    } = req.body;

    // Validation for required fields based on registration method
    if (registration_method === "email" && (!name || !email || !password)) {
      return res.status(400).json({ 
        message: "Name, email, and password are required for email registration" 
      });
    }

    if (registration_method === "phone" && (!name || !phone || !password)) {
      return res.status(400).json({ 
        message: "Name, phone, and password are required for phone registration" 
      });
    }

    if (registration_method === "nid" && (!name || !nid_number || !date_of_birth)) {
      return res.status(400).json({ 
        message: "Name, NID number, and date of birth are required for NID registration" 
      });
    }

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
    }

    // Phone number validation if provided
    if (phone) {
      const phoneRegex = /^(\+8801|01)[3-9]\d{8}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({ message: "Invalid Bangladeshi phone number format" });
      }
    }

    // NID number validation if provided
    if (nid_number) {
      const nidRegex = /^\d{10,13}$/;
      if (!nidRegex.test(nid_number.replace(/\s/g, ''))) {
        return res.status(400).json({ message: "NID number must be 10-13 digits" });
      }
    }

    // Date validation if provided
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ message: "Invalid date of birth" });
      }
    }

    // Password validation if provided
    if (password && password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check if user already exists
    const existingQuery = {};
    if (email) existingQuery.email = email;
    if (phone) existingQuery.phone = phone;
    if (nid_number) existingQuery.nid_number = nid_number;

    const existingUser = await usersCollection.findOne({
      $or: Object.keys(existingQuery).map(key => ({ [key]: existingQuery[key] }))
    });

    if (existingUser) {
      return res.status(409).json({ 
        message: "User already exists with this email, phone, or NID number" 
      });
    }

    // Hash password or generate one for NID registration
    let hashedPassword;
    let temporaryPassword = null;

    if (password) {
      hashedPassword = await hashPassword(password);
    } else if (registration_method === "nid") {
      temporaryPassword = generateRandomPassword();
      hashedPassword = await hashPassword(temporaryPassword);
    }

    // Validate location structure if provided
    if (location && (!location.division || !location.district || !location.subdistrict || !location.address)) {
      return res.status(400).json({ 
        message: "Location must include division, district, subdistrict, and address" 
      });
    }

    // Create new user object
    const newUser = {
      name: name.trim(),
      email: email ? email.toLowerCase().trim() : null,
      phone: phone ? phone.replace(/\s/g, '') : null,
      password: hashedPassword,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      nid_number: nid_number ? nid_number.replace(/\s/g, '') : null,
      location: location || {
        division: "",
        district: "",
        subdistrict: "",
        address: ""
      },
      nid_front_image: nid_front_image || "",
      nid_back_image: nid_back_image || "",
      registration_method: registration_method,
      is_verified: false,
      temporary_password: registration_method === "nid", // Flag for NID users to change password
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // Remove password from response
    const userResponse = { ...newUser };
    delete userResponse.password;

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId,
      user: userResponse,
      ...(temporaryPassword && { 
        temporary_password: temporaryPassword,
        message: "User created successfully. Please change your temporary password on first login."
      })
    });

  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST - User login
router.post("/users/login", async (req, res) => {
  try {
    const { email, phone, nid_number, password } = req.body;

    // Validate login credentials
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!email && !phone && !nid_number) {
      return res.status(400).json({ 
        message: "Email, phone, or NID number is required" 
      });
    }

    // Find user by any identifier
    const user = await usersCollection.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { phone: phone },
        { nid_number: nid_number }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    res.json({
      message: "Login successful",
      user: userResponse,
      requires_password_change: user.temporary_password
    });

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT - Change password
router.put("/users/:id/password", async (req, res) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(current_password, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(new_password);

    // Update password and remove temporary password flag
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          password: hashedNewPassword,
          temporary_password: false,
          updated_at: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Password updated successfully"
    });

  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST - Reset password request
router.post("/users/forgot-password", async (req, res) => {
  try {
    const { email, phone, nid_number } = req.body;

    if (!email && !phone && !nid_number) {
      return res.status(400).json({ 
        message: "Email, phone, or NID number is required" 
      });
    }

    const user = await usersCollection.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { phone: phone },
        { nid_number: nid_number }
      ]
    });

    if (!user) {
      // Don't reveal whether user exists for security
      return res.json({
        message: "If the account exists, a password reset email has been sent"
      });
    }

    // Generate reset token (in production, use proper token generation and email service)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          reset_token: resetToken,
          reset_token_expiry: resetTokenExpiry,
          updated_at: new Date()
        } 
      }
    );

    // In production: Send email with reset link
    // For demo, return the token (don't do this in production)
    res.json({
      message: "Password reset instructions have been sent",
      reset_token: resetToken, // Remove this in production
      expires_at: resetTokenExpiry
    });

  } catch (err) {
    console.error("Error in forgot password:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST - Reset password with token
router.post("/users/reset-password", async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;

    if (!reset_token || !new_password) {
      return res.status(400).json({ 
        message: "Reset token and new password are required" 
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    const user = await usersCollection.findOne({ 
      reset_token: reset_token,
      reset_token_expiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token" 
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(new_password);

    // Update password and clear reset token
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedNewPassword,
          temporary_password: false,
          updated_at: new Date()
        },
        $unset: {
          reset_token: "",
          reset_token_expiry: ""
        }
      }
    );

    res.json({
      message: "Password reset successfully"
    });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT - Update user profile (excluding password)
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated here
    delete updateData.password;
    delete updateData.reset_token;
    delete updateData.reset_token_expiry;
    delete updateData._id;
    delete updateData.created_at;
    
    // Add updated timestamp
    updateData.updated_at = new Date();
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get updated user without password
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );
    
    res.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET user by ID (without password)
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0, reset_token: 0, reset_token_expiry: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE user by ID
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "User deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = {
  router,
  setUsersCollection
};
