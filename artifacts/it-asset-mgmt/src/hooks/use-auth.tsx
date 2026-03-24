import { createContext, useContext, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey, Employee } from "@workspace/api-client-react";

// OVERRIDE: Automatically inject JWT into all generated hooks
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("token");
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return originalFetch(input, init);
};

interface AuthContextType {
  user: Employee | null;
  isLoading: boolean;
  login: (token: string, user: Employee) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const login = (newToken: string, newUser: Employee) => {
    localStorage.setItem("token", newToken);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    queryClient.setQueryData(getGetMeQueryKey(), null);
    window.location.href = "/login";
  };

  const isAuthLoading = !!token && isLoading && !error;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading: isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
