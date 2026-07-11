import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAccessDenied: boolean;
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
  isAccessDenied: false,
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
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (payload.adminRole) {
            localStorage.setItem("adminRole", payload.adminRole);
          }
        } catch (e) {
          // Ignore decode errors
        }
      }
    },
    logOutState: (state) => {
      state.user = null;
      state.token = null;
      state.isAccessDenied = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("adminName");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("deniedPaths");
      }
    },
    setAccessDenied: (state, action: PayloadAction<boolean>) => {
      state.isAccessDenied = action.payload;
    },
  },
});

export const { setCredentials, logOutState, setAccessDenied } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAccessDenied = (state: { auth: AuthState }) => state.auth.isAccessDenied;
