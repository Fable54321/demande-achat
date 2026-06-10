import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App/App';
import Form from './App/100-Form/Form';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PurchaseRequestsProvider } from './Contexts/PurchaseRequestContext';
import PriceConfirmation from './App/101--PriceConfirmation/PriceConfirmation';
import AdminApproval from './App/102--AdminApproval/AdminApproval';


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
  {
    path: "/requete/:purchaseRequestId/validation-prix/:token",
    element: <PriceConfirmation />
  },
  {
    path: "/requete/:id/approbation-achat/:token",
    element: <AdminApproval />
  }
 
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PurchaseRequestsProvider>
      <RouterProvider router={router} />
    </PurchaseRequestsProvider>
  </StrictMode>,
)
