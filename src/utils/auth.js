// Simple persistent auth utility using localStorage

export function register(name, email, password) {
  try {
    const users = JSON.parse(localStorage.getItem("ftb_users") || "[]");
    
    // Check if user already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Email address is already registered." };
    }

    const newUser = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password, // in a real app this would be hashed
      role: "Member",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
    };

    users.push(newUser);
    localStorage.setItem("ftb_users", JSON.stringify(users));
    
    // Auto-set as current active profile
    localStorage.setItem("ftb_user_profile", JSON.stringify(newUser));
    return { success: true, user: newUser };
  } catch (err) {
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

export function login(email, password) {
  try {
    const users = JSON.parse(localStorage.getItem("ftb_users") || "[]");
    const matchedUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (matchedUser) {
      // Set active profile
      localStorage.setItem("ftb_user_profile", JSON.stringify(matchedUser));
      return matchedUser;
    }

    // Fallback: If no registered users exist, allow logging in with any details as a default user
    if (users.length === 0) {
      const defaultUser = {
        name: "User",
        email: email.trim().toLowerCase(),
        role: "Member",
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      };
      localStorage.setItem("ftb_user_profile", JSON.stringify(defaultUser));
      return defaultUser;
    }

    return null;
  } catch (err) {
    return null;
  }
}