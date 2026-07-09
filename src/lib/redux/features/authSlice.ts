import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

const getInitialToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const initialState: AuthState = {
  user: null,
  token: getInitialToken(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.token = accessToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("adminName", `${user.firstName} ${user.lastName}`);
      }
    },
    logOutState: (state) => {
      state.user = null;
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("adminName");
      }
    },
  },
});

export const { setCredentials, logOutState } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;
