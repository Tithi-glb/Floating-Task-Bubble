import { useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { getStoredUserSession, login, logoutUser, register } from "./utils/auth";

function ProtectedRoute({ userProfile, onLogout, children }) {
  const location = useLocation();

  if (!userProfile) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  const [userProfile, setUserProfile] = useState(() => getStoredUserSession());

  const handleLogin = (email, password) => {
    const res = login(email, password);
    if (res.success) {
      setUserProfile(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleRegister = (name, email, password) => {
    return register(name, email, password);
  };

  const handleLogout = () => {
    logoutUser();
    setUserProfile(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login onLogin={handleLogin} onRegister={handleRegister} />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute userProfile={userProfile} onLogout={handleLogout}>
              <Dashboard userProfile={userProfile} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;