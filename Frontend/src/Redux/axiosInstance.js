import axios from "axios";

const rawBaseURL =
  import.meta.env.VITE_API_URL || "https://netflix-clone-qjtd.onrender.com";
const baseURL = String(rawBaseURL).trim().replace(/\/+$/, "");

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 60000, // 60s — Render free-tier cold starts can take 30-60s
});

axiosInstance.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem("userToken");
    const adminToken = localStorage.getItem("adminToken");

    const token = userToken || adminToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    const isUserDeleted =
      status === 401 &&
      message === "User account no longer exists. Please login again.";

    const isInvalidUserToken =
      status === 401 &&
      (message === "Invalid access token." ||
        message === "Access token expired.");

    if (isUserDeleted || isInvalidUserToken) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("verificationToken");
      localStorage.removeItem("resetToken");

      window.dispatchEvent(new Event("userLogout"));

      const base = import.meta.env.BASE_URL || "/";
      const targetLogin = `${base.replace(/\/$/, "")}/login`;
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = targetLogin;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
