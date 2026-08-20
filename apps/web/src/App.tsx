import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InvitationPage } from './pages/InvitationPage';
import { NotFoundPage } from './pages/NotFoundPage';

const router = createBrowserRouter([{ element: <Layout />, children: [{ path: '/', element: <DashboardPage /> }, { path: '/ref/:code', element: <InvitationPage /> }, { path: '*', element: <NotFoundPage /> }] }]);
export function App() { return <RouterProvider router={router}/>; }
