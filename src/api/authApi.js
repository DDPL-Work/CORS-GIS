const BASE_URL = "https://survey.drdesigntech.com/api"; 
// ⚠️ removed double slash

export const loginUser = async (credentials) => {
  const res = await fetch(`${BASE_URL}/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Invalid username or password");
  }

  return data;
};

export const signupUser = async (payload) => {
  const res = await fetch(`${BASE_URL}/signup/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
};