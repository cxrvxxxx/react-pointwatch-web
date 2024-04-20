import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/registration";
import Dashboard from "./pages/swtd dashboard";
import ResetPassword from "./pages/reset password";
import Authorized from "./pages/authorized";
import Settings from "./pages/settings";
import Drawer from "./common/drawer";

import SessionUserContext from "./contexts/SessionUserContext";

import styles from "./styles/App.module.css";

const App = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);

  const showDrawer = ["/dashboard", "/settings"].some((path) =>
    location.pathname.startsWith(path)
  );

  const tabNames = {
    "/login": "Login",
    "/register": "Register",
    "/dashboard": "Dashboard",
    "/reset": "Reset Password",
    "/settings": "Settings",
  };

  document.title = tabNames[location.pathname] || "PointWatch";

  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get("token");

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      setUser(accessToken);
    }
  }, []);

  return (
    <div
      className={`${styles.App} ${
        location.pathname === "/login" ? styles.bg : styles["no-bg"]
      }`}>
      <SessionUserContext.Provider value={{ user, setUser }}>
        {showDrawer && <Drawer />}
        <Routes>
          <Route
            path="/"
            element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reset" element={<ResetPassword token={token} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/authorized" element={<Authorized />} />
        </Routes>
      </SessionUserContext.Provider>
    </div>
  );
};

export default App;
