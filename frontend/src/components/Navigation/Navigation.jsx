import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import styles from "../../styles/navigation.module.css";

function Navigation({ user, onLogout }) {
  const location = useLocation();

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          LevelUp
        </Link>

        <div className={styles.navLinks}>
          {user ? (
            <>
              <span className={styles.userInfo}>
                {user.profileImage && (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className={styles.profilePic}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                {user.name}
              </span>
              <Link
                to="/dashboard"
                className={
                  location.pathname === "/dashboard"
                    ? styles.activeLink
                    : styles.navLink
                }
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className={
                  location.pathname === "/profile"
                    ? styles.activeLink
                    : styles.navLink
                }
              >
                Profile
              </Link>
              <button onClick={onLogout} className={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={
                  location.pathname === "/login"
                    ? styles.activeLink
                    : styles.navLink
                }
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={
                  location.pathname === "/signup"
                    ? styles.activeLink
                    : styles.navLink
                }
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
Navigation.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    name: PropTypes.string,
    email: PropTypes.string,
    profileImage: PropTypes.string,
  }),
  onLogout: PropTypes.func.isRequired,
};
