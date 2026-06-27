// Helper to get auth headers for all dashboard API calls
export const authHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const authOpts = () => ({
  credentials: "include",
  headers: authHeaders(),
});