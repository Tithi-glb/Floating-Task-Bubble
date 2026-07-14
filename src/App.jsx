import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { login, register } from "./utils/auth";

function App() {
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("ftb_user_profile");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (email, password) => {
    const user = login(email, password);
    if (user) {
      setUserProfile(user);
      return { success: true };
    }
    return { success: false, error: "Incorrect email or password." };
  };

  const handleRegister = (name, email, password) => {
    const res = register(name, email, password);
    if (res.success) {
      setUserProfile(res.user);
    }
    return res;
  };

  const handleLogout = () => {
    setUserProfile(null);
    localStorage.removeItem("ftb_user_profile");
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
          element={<Dashboard userProfile={userProfile} onLogout={handleLogout} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;