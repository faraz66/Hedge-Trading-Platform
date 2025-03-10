import { createBrowserRouter } from 'react-router-dom';
import Orders from './pages/Orders';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Dashboard />,
      },
      {
        path: '/orders',
        element: <Orders />,
      },
      // Add other routes here
    ],
  },
]); 