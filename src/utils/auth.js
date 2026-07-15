// Simple persistent auth utility using localStorage

function createUserId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem("ftb_users") || "[]");
    return users.map((user) => ({ ...user, id: user.id || createUserId() }));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem("ftb_users", JSON.stringify(users));
}

export function getStoredUserSession() {
  try {
    const stored = localStorage.getItem("current-user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function register(name, email, password) {
  try {
    const users = readUsers();

    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Email address is already registered." };
    }

    const newUser = {
      id: createUserId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "Member",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
    };

    users.push(newUser);
    writeUsers(users);

    return { success: true, user: newUser };
  } catch {
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

export function login(email, password) {
  try {
    const users = readUsers();
    const matchedUser = users.find(
      (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
    );

    if (matchedUser) {
      localStorage.setItem("current-user", JSON.stringify(matchedUser));
      localStorage.setItem("ftb_user_profile", JSON.stringify(matchedUser));
      return { success: true, user: matchedUser };
    }

    return { success: false, error: "Incorrect email or password." };
  } catch {
    return { success: false, error: "Incorrect email or password." };
  }
}

export function logoutUser() {
  localStorage.removeItem("current-user");
  localStorage.removeItem("ftb_user_profile");
}