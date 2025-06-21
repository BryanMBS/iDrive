// src/components/CambiarPassword.js (Corregido)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthForm.css';
import Logo_iDrive2 from '../assets/img/Logo_iDrive2.png';
import { useNotification } from '../context/NotificationContext'; // <-- IMPORTAR

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const CambiarPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const { addNotification } = useNotification(); // <-- OBTENER FUNCIÓN

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (newPassword.length < 8) {
            addNotification("La contraseña debe tener al menos 8 caracteres.", 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            addNotification("Las contraseñas no coinciden.", 'error');
            return;
        }
        try {
            await apiClient.put('/usuarios/cambiar-password', { new_password: newPassword });
            addNotification("Contraseña cambiada exitosamente. Serás redirigido al dashboard.", 'success');
            navigate('/dashboard');
        } catch (err) {
            addNotification(err.response?.data?.detail || "Ocurrió un error al cambiar la contraseña.", 'error');
        }
    };

    return (
        <div className="_AF_auth-layout">
            <div className="_AF_brand-panel">
                <Link to="/dashboard">
                    <img src={Logo_iDrive2} alt="Logo iDrive" className="_AF_logo" />
                </Link>
                <h1>Bienvenido de Nuevo</h1>
                <p>La seguridad de tu cuenta es nuestra prioridad. Por favor, establece una nueva contraseña.</p>
            </div>
            <div className="_AF_form-container">
                <div className="_AF_card">
                    <h2>Cambiar Contraseña</h2>
                    <p className="_AF_subtitle">Establece una contraseña segura para continuar.</p>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="password"
                            className="_AF_input"
                            placeholder="Nueva Contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            className="_AF_input"
                            placeholder="Confirmar Nueva Contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {/* Se elimina el mensaje de error local */}
                        <button type="submit" className="_AF_button">Guardar Contraseña</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CambiarPassword;