import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Modal } from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom"; /* prettier-ignore */

import Login from "./pages/login";
import Register from "./pages/registration";
import ResetPassword from "./pages/reset password";
import Authorized from "./pages/authorized";

import Dashboard from "./pages/dashboard";
import SWTDDashboard from "./pages/employee dashboard";
import AddSWTD from "./pages/employee dashboard/AddSWTD";
import EditSWTD from "./pages/employee dashboard/EditSWTD";
import AdminDashboard from "./pages/admin dashboard";

import Settings from "./pages/settings";
import Drawer from "./common/drawer";

import SessionUserContext from "./contexts/SessionUserContext";
import { getUser } from "./api/user";

import styles from "./styles/App.module.css";
import BtnSecondary from "./common/buttons/BtnSecondary";
import BtnPrimary from "./common/buttons/BtnPrimary";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = Cookies.get("userToken");
  console.log(token);
  const cookieID = Cookies.get("userID");
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  let id = null;
  if (cookieID !== undefined) {
    id = JSON.parse(cookieID);
  }

  const data = {
    token: token,
    id: id,
  };

  const getSessionUser = () => {
    getUser(
      {
        token: data.token,
        id: data.id,
      },
      (response) => {
        setUser(response?.data);
      }
    );
  };

  const showDrawer = ["/dashboard", "/swtd", "/admin", "/settings"].some(
    (path) => location.pathname.startsWith(path)
  );

  const tabNames = {
    "/login": "Login",
    "/register": "Register",
    "/dashboard": "Dashboard",
    "/reset": "Reset Password",
    "/settings": "Settings",
    "/swtd": "SWTD Points Overview",
    "/swtd/form": "Add a New Record",
    "/admin": "Admin",
  };

  document.title =
    location.pathname.startsWith("/swtd/") &&
    !location.pathname.startsWith("/swtd/form")
      ? "Training Information"
      : tabNames[location.pathname] || "WildPark";

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/login");
  };

  useEffect(() => {
    const isTokenExpired = (token) => {
      const decodedToken = jwtDecode(token);
      return decodedToken.exp * 1000 <= Date.now();
    };

    // Handling expired tokens
    if (token && isTokenExpired(token)) {
      Cookies.remove("userToken");
      Cookies.remove("userID");
      setUser(null);
      navigate("/");
      setShowModal(true);
    }

    if (data.token !== null && data.id !== null) {
      getSessionUser();
    }
  }, [data.token, data.id]);

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
            element={token ? <Navigate to="/swtd" /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/authorized" element={<Authorized />} />
          <Route
            path="/swtd"
            element={token ? <SWTDDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/swtd/form"
            element={token ? <AddSWTD /> : <Navigate to="/login" />}
          />
          <Route
            path="/swtd/:id"
            element={token ? <EditSWTD /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={token ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={token ? <AdminDashboard /> : <Navigate to="/login" />}
          />
        </Routes>
      </SessionUserContext.Provider>

      {/* <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Session Expired</Modal.Title>
        </Modal.Header>
        <Modal.Body>Your session has expired. Please login again.</Modal.Body>
        <Modal.Footer>
          <BtnSecondary variant="secondary" onClick={handleModalClose}>
            Close
          </BtnSecondary>
          <BtnPrimary variant="primary" onClick={handleModalClose}>
            Login
          </BtnPrimary>
        </Modal.Footer>
      </Modal> */}
    </div>
  );
};

export default App;
