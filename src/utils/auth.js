import { authAPI } from "../services/api";

export function getStoredUserSession() {
  try {
    const stored = localStorage.getItem("current-user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function register(name, email, password) {
  try {
    const data = await authAPI.register(name.trim(), email.trim(), password);
    if (data.success) {
      // Save token and user details upon successful signup
      localStorage.setItem("ftb_token", data.token);
      localStorage.setItem("current-user", JSON.stringify(data.user));
      localStorage.setItem("ftb_user_profile", JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, error: "Failed to create account." };
  } catch (err) {
    const errorMsg = err.response?.data?.error || "Failed to create account. Please try again.";
    return { success: false, error: errorMsg };
  }
}

export async function login(email, password) {
  try {
    const data = await authAPI.login(email.trim(), password);
    if (data.success) {
      // Save token and user details upon successful login
      localStorage.setItem("ftb_token", data.token);
      localStorage.setItem("current-user", JSON.stringify(data.user));
      localStorage.setItem("ftb_user_profile", JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, error: "Incorrect email or password." };
  } catch (err) {
    const errorMsg = err.response?.data?.error || "Incorrect email or password. Please try again.";
    return { success: false, error: errorMsg };
  }
}

export function logoutUser() {
  localStorage.removeItem("ftb_token");
  localStorage.removeItem("current-user");
  localStorage.removeItem("ftb_user_profile");
}