// App.js (Corregido)

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Importación de Páginas
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Agendamientos from "./pages/Agendamientos";
import Usuarios from "./pages/Usuarios";
import Clases from "./pages/Clases";
import Contacto from "./pages/Contacto";

// Estilos
import "./assets/css/sb-admin-2.min.css";

// --- CAMBIO 1: Importar el AuthProvider desde el contexto ---
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        // --- CAMBIO 2: Envolver toda la aplicación con AuthProvider ---
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Rutas Públicas */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/contacto" element={<Contacto />} />

                    {/* Rutas del Panel de Administración */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/agendamientos" element={<Agendamientos />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/clases" element={<Clases />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;