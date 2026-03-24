const USER_KEY = "aeris_user";

function generateUUID() {
  return crypto.randomUUID();
}

export const identity = {
  getUserId: () => {
    const existing = localStorage.getItem(USER_KEY);
    if (existing) return JSON.parse(existing).user_id;

    const newUser = {
      user_id: generateUUID(),
      created_at: Date.now()
    };

    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser.user_id;
  },

  getEmail: () => {
    const data = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
    return data.email || null;
  },

  setEmail: (email: string) => {
    const data = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
    data.email = email;
    localStorage.setItem(USER_KEY, JSON.stringify(data));
  }
};
