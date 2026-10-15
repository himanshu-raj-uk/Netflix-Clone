import axiosInstance from "./axiosInstance";

// --------------------------------------------------User Interface------------------------------

export const registerUser = (data) => {
  return axiosInstance.post("/user/register", data);
};

export const registerUserByGoogle = (data) => {
  return axiosInstance.post("/user/google", data);
};

export const loginUser = (data) => {
  return axiosInstance.post("/user/login", data);
};

export const verifyOTP = ({ otp, token }) => {
  return axiosInstance.post(
    "/user/verify-otp",
    { otp },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const forgotPassword = (email) => {
  return axiosInstance.post("/user/forgot-password", {
    email,
  });
};

export const changePassword = (currentPassword, newPassword) => {
  return axiosInstance.put("/user/change-password", {
    currentPassword,
    newPassword,
  });
};

export const resetPassword = (password, resetToken) => {
  return axiosInstance.post(
    "/user/reset-password",
    { password },
    {
      headers: {
        Authorization: `Bearer ${resetToken}`,
      },
    },
  );
};


export const resendOTP = (token) => {
  return axiosInstance.post(
    "/user/resend-otp",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const getUserProfile = () => {
  return axiosInstance.get("/user/profile");
};

export const updateUserProfile = (formData) => {
  return axiosInstance.put("/user/update-profile", formData);
};


export const logoutUser = () => {
  return axiosInstance.post("/user/logout");
};


export const getMovieLists = async () => {
  const response = await axiosInstance.get("/user/movie-lists");
  return response.data;
};

export const addMovieToList = async (listType, movieId, movie) => {
  if (!["wishlist", "watchlist", "likelist"].includes(listType)) {
    throw new Error("Invalid movie list.");
  }

  const response = await axiosInstance.post(
    `/user/${listType}/${movieId}`,
    { movie }
  );

  return response.data;
};

export const removeMovieFromList = async (listType, movieId) => {
  if (!["wishlist", "watchlist", "likelist"].includes(listType)) {
    throw new Error("Invalid movie list.");
  }

  const response = await axiosInstance.delete(
    `/user/${listType}/${movieId}`
  );

  return response.data;
};