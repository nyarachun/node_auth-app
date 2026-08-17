import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('accessToken'),
  );

  const [loading, setLoading] = useState(true);

  const startSession = useCallback(
    async ({ accessToken: newAccessToken, refreshToken }) => {
      const me = await authService.getMe(newAccessToken);

      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setAccessToken(newAccessToken);
      setUser(me.user);
      setLoading(false);

      return me.user;
    },
    [],
  );

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(credentials);

      await startSession(data);

      return data;
    },
    [startSession],
  );

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      setAccessToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.getMe(accessToken);

        setUser(data.user);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        isAuthenticated: Boolean(user),
        login,
        startSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
