import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../services/authService';

const savedAccessToken = localStorage.getItem('accessToken');
const savedRefreshToken = localStorage.getItem('refreshToken');

const initialState = {
  user: null,
  accessToken: savedAccessToken,
  refreshToken: savedRefreshToken,
  isAuthenticated: Boolean(savedAccessToken),
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;

      const data = await authService.getMe(token);

      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const refreshToken = getState().auth.refreshToken;

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {}

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    return true;
  },
);

const authSlice = createSlice({
  name: 'auth',

  initialState,

  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;

      state.accessToken = accessToken;

      if (refreshToken) {
        state.refreshToken = refreshToken;
        localStorage.setItem('refreshToken', refreshToken);
      }

      state.isAuthenticated = true;

      localStorage.setItem('accessToken', accessToken);
    },

    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;

        localStorage.setItem('accessToken', action.payload.accessToken);

        localStorage.setItem('refreshToken', action.payload.refreshToken);
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })

      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.user = null;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearError, setTokens, clearAuth } = authSlice.actions;

export default authSlice.reducer;
