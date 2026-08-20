import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RequireAuth({ children, resetComplete = false }: { children: ReactNode; resetComplete?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.ready) return <main className="centered-state"><div className="spinner"/><p>正在确认登录状态…</p></main>;
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (resetComplete && auth.user.mustResetPassword) return <Navigate to="/reset-password" replace />;
  return children;
}
