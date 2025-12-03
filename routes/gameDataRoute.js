import express from "express";
import { ObjectId } from "mongodb";
import MyMongoDB from "../db/myMongoDB.js";

/*
 * gameData routes
 *
 * This router exposes CRUD operations for the "gameData" collection. A
 * gameData document represents a learning journey a user creates, including
 * the skill they want to work on, their experience level, time commitment
 * and personal goal. Each document is associated with a userId so
 * journeys can be filtered per user. All timestamps are recorded in UTC.
 */

const router = express.Router();

// Initialize MongoDB for the gameData collection. We default the database name
// to "levelupDB" to align with the authentication collection.
const gameDataDB = MyMongoDB({
  dbName: "levelupDB",
  collectionName: "gameData",
});

/**
 * Create a new gameData document
 *
 * Expects a JSON body with:
 * - userId: string (required) – the identifier of the user creating the journey
 * - skill: string (required) – the skill category
 * - level: string (required) – the experience level
 * - timeCommitment: string (optional) – the time commitment
 * - goal: string (optional) – a short personal goal description
 *
 * Returns the inserted document ID so the frontend can navigate to the game
 * screen via `/game?id=<id>`.
 */
router.post("/", async (req, res) => {
  try {
    const { userId, skill, level, timeCommitment, goal } = req.body;

    // Basic validation
    if (!userId || !skill || !level) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: userId, skill and level are mandatory",
      });
    }

    const newGameData = {
      userId,
      skill,
      level,
      timeCommitment: timeCommitment || null,
      goal: goal || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await gameDataDB.insertDocument(newGameData);

    return res.json({
      success: true,
      message: "Game data created successfully",
      gameDataId: result.insertedId,
    });
  } catch (error) {
    console.error("Create gameData error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create game data",
      error: error.message,
    });
  }
});

/**
 * Get all gameData documents
 *
 * Optional query param `userId` will filter gameData belonging to a specific user.
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const docs = await gameDataDB.getDocuments(filter);
    return res.json({
      success: true,
      data: docs,
    });
  } catch (error) {
    console.error("Fetch gameData error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch game data",
      error: error.message,
    });
  }
});

/**
 * Get a single gameData document by its ObjectId
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Invalid gameData ID ${err}`,
      });
    }

    const doc = await gameDataDB.findOne({ _id: objectId });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Game data not found",
      });
    }

    return res.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("Fetch gameData error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch game data",
      error: error.message,
    });
  }
});

/**
 * Update a gameData document by its ID
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Invalid gameData ID ${err}`,
      });
    }

    const updateData = { ...req.body };
    delete updateData.userId;
    delete updateData.createdAt;
    updateData.updatedAt = new Date();

    const result = await gameDataDB.updateDocument(
      { _id: objectId },
      updateData,
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Game data not found or no changes were made",
      });
    }

    return res.json({
      success: true,
      message: "Game data updated successfully",
    });
  } catch (error) {
    console.error("Update gameData error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update game data",
      error: error.message,
    });
  }
});

/**
 * Delete a gameData document by its ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Invalid gameData ID ${err}`,
      });
    }
    const result = await gameDataDB.deleteDocument({ _id: objectId });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Game data not found or already deleted",
      });
    }
    return res.json({
      success: true,
      message: "Game data deleted successfully",
    });
  } catch (error) {
    console.error("Delete gameData error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete game data",
      error: error.message,
    });
  }
});

export default router;
