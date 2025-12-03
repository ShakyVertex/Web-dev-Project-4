import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/dashboard.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUserJourneys = useCallback(async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/gameData?userId=${user._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setJourneys(data.data || []);
      } else {
        setError("Failed to load journeys");
      }
    } catch (err) {
      console.error("Error fetching journeys:", err);
      setError("Failed to load your journeys");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserJourneys();
  }, [fetchUserJourneys]);

  const handleCreateJourney = () => {
    navigate("/create");
  };

  const handleContinueJourney = (journeyId) => {
    navigate(`/game?id=${journeyId}`);
  };

  const handleDeleteJourney = async (journeyId) => {
    if (!window.confirm("Are you sure you want to delete this journey?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/gameData/${journeyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchUserJourneys();
      } else {
        alert("Failed to delete journey");
      }
    } catch (err) {
      console.error("Error deleting journey:", err);
      alert("Failed to delete journey");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div className={styles.userSection}>
          {user?.profileImage && (
            <img
              src={user.profileImage}
              alt={user.name}
              className={styles.avatar}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <div>
            <h2 className={styles.greeting}>Welcome back, {user?.name}</h2>
            <p className={styles.subtitle}>Continue your learning journey</p>
          </div>
        </div>
        <button
          onClick={handleCreateJourney}
          className={styles.newJourneyButton}
        >
          + New Journey
        </button>
      </div>

      <div className={styles.mainContent}>
        {loading ? (
          <div className={styles.loading}>Loading your journeys...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : journeys.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎯</div>
            <h3 className={styles.emptyTitle}>Start Your First Journey</h3>
            <p className={styles.emptyText}>
              Choose a skill and begin your personalized learning path
            </p>
            <button
              onClick={handleCreateJourney}
              className={styles.createButton}
            >
              Create Your First Journey
            </button>
          </div>
        ) : (
          <div className={styles.journeyGrid}>
            {journeys.map((journey) => (
              <div key={journey._id} className={styles.journeyCard}>
                <div className={styles.journeyHeader}>
                  <h3 className={styles.journeySkill}>{journey.skill}</h3>
                  <button
                    onClick={() => handleDeleteJourney(journey._id)}
                    className={styles.deleteButton}
                    title="Delete journey"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.journeyDetails}>
                  <p className={styles.journeyLevel}>
                    <span className={styles.label}>Level:</span> {journey.level}
                  </p>
                  <p className={styles.journeyTime}>
                    <span className={styles.label}>Time:</span>{" "}
                    {journey.timeCommitment || "Not set"}
                  </p>
                  {journey.goal && (
                    <p className={styles.journeyGoal}>
                      <span className={styles.label}>Goal:</span> {journey.goal}
                    </p>
                  )}
                  <p className={styles.journeyDate}>
                    Started: {formatDate(journey.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleContinueJourney(journey._id)}
                  className={styles.continueButton}
                >
                  Continue Journey →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
Dashboard.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    profileImage: PropTypes.string,
  }).isRequired,
};
