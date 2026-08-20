import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InvitationPage } from './pages/InvitationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { RequireAuth } from './auth/RequireAuth';

const router = createBrowserRouter([{ element: <Layout />, children: [
  { path: '/login', element: <LoginPage /> },
  { path: '/reset-password', element: <RequireAuth><ResetPasswordPage /></RequireAuth> },
  { path: '/', element: <RequireAuth resetComplete><DashboardPage /></RequireAuth> },
  { path: '/i/:token', element: <InvitationPage /> },
  { path: '*', element: <NotFoundPage /> }
] }]);
export function App() { return <RouterProvider router={router}/>; }
