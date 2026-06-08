import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App/App';
import Form from './App/100-Form/Form';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PurchaseRequestsProvider } from './Contexts/PurchaseRequestContext';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Form />,
      },
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PurchaseRequestsProvider>
      <RouterProvider router={router} />
    </PurchaseRequestsProvider>
  </StrictMode>,
)
