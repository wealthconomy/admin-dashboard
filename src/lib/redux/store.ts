import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import authReducer from './features/authSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore RTK Query internal actions and state paths that might contain Blobs/Files
          ignoredActions: [
            "api/executeQuery/fulfilled",
            "api/executeQuery/rejected",
            "api/subscriptions/internal_getRTKQSubscriptions"
          ],
          ignoredPaths: ["api"],
        },
      }).concat(apiSlice.middleware),
  });
};

// Infer the types for the store, state, and dispatch
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
