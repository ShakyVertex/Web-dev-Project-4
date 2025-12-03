import express from "express";
import { ObjectId } from "mongodb";
import MyMongoDB from "../db/myMongoDB.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize MongoDB for levels collection
const levelsDB = MyMongoDB({
  dbName: "levelupDB",
  collectionName: "levels",
});

// Get current level for a journey
router.get("/current/:journeyId", async (req, res) => {
  try {
    const { journeyId } = req.params;

    // Get all levels for this journey
    const levels = await levelsDB.getDocuments({ journeyId });

    if (!levels || levels.length === 0) {
      // No levels exist yet, generate the first one
      return res.json({
        success: true,
        currentLevel: null,
        needsNewLevel: true,
      });
    }

    // Sort by levelNumber to get the latest (highest number)
    levels.sort((a, b) => (b.levelNumber || 0) - (a.levelNumber || 0));
    const currentLevel = levels[0];

    // Check if current level is completed
    if (currentLevel.completed) {
      return res.json({
        success: true,
        currentLevel: currentLevel,
        needsNewLevel: true,
      });
    }

    return res.json({
      success: true,
      currentLevel: currentLevel,
      needsNewLevel: false,
    });
  } catch (error) {
    console.error("Get current level error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get current level",
      error: error.message,
    });
  }
});

// Generate new level with AI (idempotent/race-safe)
router.post("/generate", async (req, res) => {
  try {
    const { journeyId, skill, level, timeCommitment, goal } = req.body;

    if (!journeyId || !skill || !level) {
      return res.status(400).json({
        success: false,
        message: "Journey ID, skill, and level are required",
      });
    }

    // Get previous levels to understand progression and to avoid duplicates
    const previousLevels = await levelsDB.getDocuments({ journeyId });
    previousLevels.sort((a, b) => (b.levelNumber || 0) - (a.levelNumber || 0));
    const latest = previousLevels[0];

    // If a latest level exists and is NOT completed, return it (avoid duplicates
    // from StrictMode double-calls or concurrent clicks)
    if (latest && !latest.completed) {
      return res.json({
        success: true,
        level: latest,
      });
    }

    // Determine next levelNumber from the latest level (not just length+1)
    const levelNumber = latest
      ? (latest.levelNumber || previousLevels.length) + 1
      : 1;

    // Get the last level's difficulty if it exists (to adjust next difficulty)
    let lastDifficulty = latest ? latest.difficultyRating : null;

    // Build context of a few previous tasks (optional)
    const previousTasks = previousLevels
      .slice(0, 3)
      .map(
        (l) =>
          `Level ${l.levelNumber}: ${l.task} (Difficulty: ${l.difficultyRating || "Not rated"})`,
      )
      .join("\n");

    // Prepare AI prompt
    const difficultyAdjustment =
      lastDifficulty === 1
        ? "Make this next task more challenging than the previous one."
        : lastDifficulty === 2
          ? "Make this next task slightly more challenging."
          : lastDifficulty === 3
            ? "Keep a similar difficulty level."
            : lastDifficulty === 4
              ? "Make this next task slightly easier."
              : lastDifficulty === 5
                ? "Make this next task significantly easier."
                : "Start with a beginner-friendly task.";

    const prompt = `You are a skill learning coach creating personalized challenges for someone learning ${skill}.

    User Details:
    - Current Level: ${level}
    - Time Available: ${timeCommitment || "15 mins"}
    - Personal Goal: ${goal || "Master this skill"}
    - This is Level ${levelNumber} of their journey

    ${previousTasks ? `Previous Tasks Completed:\n${previousTasks}\n` : "This is their first task."}

    ${difficultyAdjustment}

    Generate ONE specific, actionable task that:
    1. Can be completed in ${timeCommitment || "15 minutes"}
    2. Is appropriate for a ${level} level learner
    3. Builds on previous tasks (if any)
    4. Is concrete and measurable (the user should know when they've completed it)

    Respond with ONLY the task description in 1-2 sentences. Be specific and actionable. Do not include level numbers, greetings, or explanations.

    Examples of good tasks:
    - "Cook scrambled eggs with three ingredients and serve with toast"
    - "Practice speaking for 60 seconds about your day without using filler words"
    - "Build a simple paper airplane that can fly at least 10 feet"`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const task = response.text().trim();

    // Create new level document
    const newLevel = {
      journeyId,
      levelNumber,
      task,
      completed: false,
      difficultyRating: null,
      createdAt: new Date(),
      completedAt: null,
    };

    const insertResult = await levelsDB.insertDocument(newLevel);

    res.json({
      success: true,
      level: { ...newLevel, _id: insertResult.insertedId },
    });
  } catch (error) {
    console.error("Generate level error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate new level",
      error: error.message,
    });
  }
});

// Complete a level and mark difficulty
router.post("/complete/:levelId", async (req, res) => {
  try {
    const { levelId } = req.params;
    const { difficultyRating } = req.body;

    if (!difficultyRating || difficultyRating < 1 || difficultyRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Difficulty rating must be between 1 and 5",
      });
    }

    const objectId = new ObjectId(levelId);

    const updateResult = await levelsDB.updateDocument(
      { _id: objectId },
      {
        completed: true,
        difficultyRating: parseInt(difficultyRating),
        completedAt: new Date(),
      },
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    res.json({
      success: true,
      message: "Level completed successfully",
    });
  } catch (error) {
    console.error("Complete level error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete level",
      error: error.message,
    });
  }
});

// Get level history for a journey
router.get("/history/:journeyId", async (req, res) => {
  try {
    const { journeyId } = req.params;

    const levels = await levelsDB.getDocuments({ journeyId });

    // Sort by level number
    levels.sort((a, b) => (a.levelNumber || 0) - (b.levelNumber || 0));

    res.json({
      success: true,
      levels,
      totalLevels: levels.length,
      completedLevels: levels.filter((l) => l.completed).length,
    });
  } catch (error) {
    console.error("Get level history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get level history",
      error: error.message,
    });
  }
});

export const getTotalLevelCount = async () => {
  const { client, collection } = await levelsDB.connect();
  try {
    const count = await collection.countDocuments({});
    return count;
  } finally {
    await client.close();
  }
};

router.get("/count", async (req, res) => {
  try {
    const total = await getTotalLevelCount();
    res.json({
      success: true,
      message: "Total levels count fetched successfully",
      count: total,
    });
  } catch (error) {
    console.error("Error fetching levels count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch levels count",
      error: error.message,
    });
  }
});

export default router;
