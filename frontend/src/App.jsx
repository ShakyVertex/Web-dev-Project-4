import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import Navigation from "./components/Navigation/Navigation";
import styles from "./styles/app.module.css";
import Profile from "./components/Profile/Profile";
import CreateJourney from "./components/CreateJourney/CreateJourney";
import Game from "./components/Game/Game";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const handleUpdateUser = (updatedUser) => {
    if (updatedUser === null) {
      // User was deleted
      handleLogout();
    } else {
      setUser(updatedUser);
    }
  };

  return (
    <Router>
      <div className={styles.app}>
        {user && <Navigation user={user} onLogout={handleLogout} />}
        <main className={styles.mainContent}>
          <Routes>
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Signup onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                user ? <Dashboard user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/create"
              element={
                user ? <CreateJourney user={user} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/game"
              element={user ? <Game user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/profile"
              element={
                user ? (
                  <Profile user={user} onUpdateUser={handleUpdateUser} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/dashboard" : "/login"} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
App.propTypes = {};
