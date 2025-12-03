import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import MyMongoDB from "../db/myMongoDB.js";

const router = express.Router();
const SALT_ROUNDS = 10;

// Initialize MongoDB for users collection
const usersDB = MyMongoDB({
  dbName: "levelupDB",
  collectionName: "secureUsers",
});

// Signup route - POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await usersDB.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const userDoc = {
      name,
      email,
      password: hashedPassword,
      profileImage: profileImage || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersDB.insertDocument(userDoc);

    const { password: _pw, ...userWithoutPassword } = userDoc;
    userWithoutPassword._id = result.insertedId;

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
});

// Login route - POST /api/auth/login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid email or password",
      });
    }

    // user here is already without password (we removed it in the strategy)
    return res.json({
      success: true,
      message: "Login successful",
      user,
    });
  })(req, res, next);
});

// Delete user account - DELETE /api/auth/delete
router.delete("/delete", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user to make sure they exist
    const user = await usersDB.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the user
    const result = await usersDB.deleteDocument({ email });

    if (result.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete user",
      });
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
});

// Update user profile - PUT /api/auth/update
router.put("/update", async (req, res) => {
  try {
    const { name, email, password, currentEmail, profileImage } = req.body;

    // Find user by current email
    const user = await usersDB.findOne({ email: currentEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if new email is already taken
    if (email !== currentEmail) {
      const emailExists = await usersDB.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    // Prepare update object
    const updateData = {
      name,
      email,
      profileImage,
      updatedAt: new Date(),
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Update user
    const result = await usersDB.updateDocument(
      { email: currentEmail },
      updateData,
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes were made",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

export default router;
