import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/profile.module.css";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Profile({ user, onUpdateUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        currentEmail: user.email,
        profileImage: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(formData.name)}`,
      };

      // Only include password if user entered one
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`${API_URL}/api/auth/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Update failed");
      }

      if (data.success) {
        const updatedUser = {
          ...user,
          name: formData.name,
          email: formData.email,
          profileImage: updateData.profileImage,
        };

        onUpdateUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setSuccess("Profile updated successfully!");
        setIsEditing(false);

        setFormData({
          ...formData,
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      confirmPassword: "",
    });
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    if (
      !window.confirm(
        "This will permanently delete your account and all your data. Are you absolutely sure?",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      if (data.success) {
        // Clear user data and redirect to login
        localStorage.removeItem("user");
        onUpdateUser(null);
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <img
            src={user.profileImage}
            alt={user.name}
            className={styles.profileAvatar}
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=fallback`;
            }}
          />
          <h2 className={styles.title}>My Profile</h2>
        </div>

        {success && <div className={styles.success}>{success}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">
              {isEditing
                ? "New Password (leave blank to keep current)"
                : "Password"}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder={
                isEditing ? "Enter new password (optional)" : "••••••••"
              }
            />
          </div>

          {isEditing && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          )}

          <div className={styles.buttonGroup}>
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={styles.editButton}
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className={styles.deleteButton}
                  disabled={loading}
                >
                  Delete Account
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
Profile.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    name: PropTypes.string,
    email: PropTypes.string,
    profileImage: PropTypes.string,
  }).isRequired,
  onUpdateUser: PropTypes.func.isRequired,
};
