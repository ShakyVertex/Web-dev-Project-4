import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "../../styles/login.module.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.success) {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Header */}
          <div className={styles.heroHeader}>
            <h1 className={styles.heroLogo}>LEVEL UP</h1>
            <p className={styles.heroTagline}>Transform Your Potential</p>
          </div>

          <div className={styles.heroMain}>
            <h2 className={styles.heroTitle}>
              Your Personal Growth<br />
              Management System
            </h2>
            <p className={styles.heroDescription}>
              LEVEL UP is a comprehensive platform designed to help you organize, track, and achieve your personal and professional goals. Transform your ambitions into actionable plans and see real progress every day.
            </p>
          </div>

          <div className={styles.whatWeDoSection}>
            <h3 className={styles.sectionTitle}>What LEVEL UP Helps You Do</h3>
            
            <div className={styles.benefitItem}>
              <h4>Organize Your Goals</h4>
              <p>Create a clear roadmap for what you want to achieve. Break down big dreams into manageable steps and keep everything in one place.</p>
            </div>

            <div className={styles.benefitItem}>
              <h4>Track Your Progress</h4>
              <p>Monitor your journey with intuitive tracking tools. See how far you've come and stay motivated as you move toward your objectives.</p>
            </div>

            <div className={styles.benefitItem}>
              <h4>Build Consistent Habits</h4>
              <p>Develop the daily routines that lead to success. Our system helps you stay accountable and maintain momentum over time.</p>
            </div>

            <div className={styles.benefitItem}>
              <h4>Measure What Matters</h4>
              <p>Get insights into your performance and identify areas for improvement. Data-driven feedback helps you make better decisions about where to focus your energy.</p>
            </div>
          </div>

          <div className={styles.whySection}>
            <h3 className={styles.sectionTitle}>Why Choose LEVEL UP?</h3>
            <p className={styles.whyText}>
              Whether you're working on personal development, career growth, fitness goals, or learning new skills, LEVEL UP provides the structure and motivation you need to succeed. Our platform adapts to your unique journey, helping you stay focused and achieve meaningful results.
            </p>
          </div>

          <div className={styles.heroFooter}>
            <p>© 2025 LEVEL UP. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Fixed Login Form */}
      <div className={styles.loginSection}>
        <div className={styles.loginContainer}>
          <div className={styles.authCard}>
            <h2 className={styles.title}>Welcome Back</h2>
            <p className={styles.subtitle}>Sign in to continue your journey</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.inputGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className={styles.switchText}>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default Login;