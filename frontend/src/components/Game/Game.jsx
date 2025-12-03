import { useRef, useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "../../styles/game.module.css";

// Standardize env var (Vite)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Game() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const journeyId = searchParams.get("id");

  const [journey, setJourney] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [levelNumber, setLevelNumber] = useState(1);

  // StrictMode double-invoke guard
  const initRef = useRef(false);

  const generateNewLevel = useCallback(
    async (journeyData) => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/levels/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journeyId: journeyId,
            skill: journeyData.skill,
            level: journeyData.level,
            timeCommitment: journeyData.timeCommitment,
            goal: journeyData.goal,
          }),
        });

        const data = await response.json();
        if (!data.success)
          throw new Error(data.message || "Failed to generate level");

        setCurrentLevel(data.level);
        setLevelNumber(data.level.levelNumber || 1);
      } catch (err) {
        console.error("Error generating level:", err);
        setError(err.message || "Failed to generate new level");
      } finally {
        setLoading(false);
      }
    },
    [journeyId],
  );

  const loadJourneyAndLevel = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const journeyResponse = await fetch(
        `${API_URL}/api/gameData/${journeyId}`,
      );
      const journeyData = await journeyResponse.json();
      if (!journeyData.success) throw new Error("Failed to load journey");

      setJourney(journeyData.data);

      const levelResponse = await fetch(
        `${API_URL}/api/levels/current/${journeyId}`,
      );
      const levelData = await levelResponse.json();
      if (!levelData.success) throw new Error("Failed to load level");

      if (levelData.needsNewLevel) {
        await generateNewLevel(journeyData.data);
      } else {
        setCurrentLevel(levelData.currentLevel);
        setLevelNumber(levelData.currentLevel.levelNumber || 1);
      }
    } catch (err) {
      console.error("Error loading game:", err);
      setError(err.message || "Failed to load game");
    } finally {
      setLoading(false);
    }
  }, [journeyId, generateNewLevel]);

  useEffect(() => {
    // Prevent StrictMode's double effect in dev
    if (initRef.current) return;
    initRef.current = true;
    if (journeyId) loadJourneyAndLevel();
  }, [journeyId, loadJourneyAndLevel]);

  const handleCompleteLevel = async () => {
    if (!selectedDifficulty) {
      setError("Please select a difficulty rating");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const completeResponse = await fetch(
        `${API_URL}/api/levels/complete/${currentLevel._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficultyRating: selectedDifficulty }),
        },
      );

      const completeData = await completeResponse.json();
      if (!completeData.success) throw new Error("Failed to complete level");

      await generateNewLevel(journey);
      setSelectedDifficulty(null);
    } catch (err) {
      console.error("Error completing level:", err);
      setError(err.message || "Failed to complete level");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const difficultyOptions = [
    { value: 1, label: "Very Easy", emoji: "😴" },
    { value: 2, label: "Easy", emoji: "😊" },
    { value: 3, label: "Just Right", emoji: "💪" },
    { value: 4, label: "Hard", emoji: "😤" },
    { value: 5, label: "Very Hard", emoji: "🔥" },
  ];

  if (!journeyId) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>No Journey Selected</h2>
          <p>Please select a journey from your dashboard.</p>
          <button onClick={handleBackToDashboard} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Loading your challenge...</p>
        </div>
      </div>
    );
  }

  if (error && !currentLevel) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToDashboard} className={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameCard}>
        <div className={styles.header}>
          <button onClick={handleBackToDashboard} className={styles.backLink}>
            ← Back
          </button>
          <div className={styles.levelInfo}>
            <span className={styles.levelNumber}>Level {levelNumber}</span>
            <span className={styles.skillName}>{journey?.skill}</span>
          </div>
        </div>

        <div className={styles.taskSection}>
          <div className={styles.taskCard}>
            <h2 className={styles.taskTitle}>Your Challenge:</h2>
            <p className={styles.taskDescription}>
              {currentLevel?.task || "Loading task..."}
            </p>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.completionSection}>
          <h3 className={styles.completionTitle}>
            How difficult was this task?
          </h3>
          <div className={styles.difficultyButtons}>
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDifficulty(option.value)}
                className={`${styles.difficultyButton} ${
                  selectedDifficulty === option.value ? styles.selected : ""
                }`}
                disabled={submitting}
              >
                <span className={styles.emoji}>{option.emoji}</span>
                <span className={styles.label}>{option.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCompleteLevel}
            disabled={!selectedDifficulty || submitting}
            className={styles.completeButton}
          >
            {submitting
              ? "Generating next level..."
              : "Complete & Next Level →"}
          </button>
        </div>

        <div className={styles.footer}>
          <div className={styles.journeyInfo}>
            <span>📚 {journey?.level}</span>
            <span>⏱️ {journey?.timeCommitment}</span>
            {journey?.goal && <span>🎯 {journey?.goal}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
Game.propTypes = {};
