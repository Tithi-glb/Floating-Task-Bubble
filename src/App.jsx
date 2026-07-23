import { useState } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import BubblePage from "./pages/BubblePage";
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

  const handleLogin = async (email, password) => {
    const res = await login(email, password);
    if (res.success) {
      setUserProfile(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleRegister = async (name, email, password) => {
    return await register(name, email, password);
  };

  const handleLogout = () => {
    logoutUser();
    setUserProfile(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/bubble/:id" element={<BubblePage />} />
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