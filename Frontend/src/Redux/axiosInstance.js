import axios from "axios";

const rawBaseURL =
  import.meta.env.VITE_API_URL || "https://netflix-clone-qjtd.onrender.com";

const baseURL = String(rawBaseURL).trim().replace(/\/+$/, "");

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem("userToken");
    const adminToken = localStorage.getItem("adminToken");

    config.headers = config.headers || {};

    if (!config.headers.Authorization && userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }

    if (adminToken) {
      config.headers.AdminToken = adminToken;
    } else {
      delete config.headers.AdminToken;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
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
      [
        "userToken",
        "accessToken",
        "refreshToken",
        "verificationToken",
        "resetToken",
        "user",
        "userInfo",
        "userData",
        "profile",
      ].forEach((key) => localStorage.removeItem(key));

      window.dispatchEvent(new Event("auth-changed"));
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
