import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './buttons.css'
import { router } from './router.tsx'



createRoot(document.getElementById('root')!).render(

    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)