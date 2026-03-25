import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { usersService } from '../services/users.service';

export function useAuth() {
  const { user, accessToken, isLoading, isAuthenticated, setUser, loadFromStorage, logout } =
    useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken && !user) {
      usersService
        .getMe()
        .then(setUser)
        .catch(() => logout());
    }
  }, [isAuthenticated, accessToken, user]);

  return { user, isLoading, isAuthenticated };
}
