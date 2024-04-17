import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/registration";
import Dashboard from "./pages/Employee Dashboard";

// import SessionUserContext from "./contexts/SessionUserContext";

import styles from "./styles/App.module.css";

const App = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  const tabNames = {
    "/login": "Login",
    "/register": "Register",
    "/dashboard": "Dashboard",
  };

  document.title = tabNames[location.pathname] || "PointWatch";

  return (
    <div
      className={`${styles.App} ${
        location.pathname === "/login" ? styles.bg : styles["no-bg"]
      }`}
    >
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
};

export default App;
