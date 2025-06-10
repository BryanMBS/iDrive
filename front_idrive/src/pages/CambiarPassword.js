import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthForm.css'; // <-- CAMBIO: Importamos el nuevo CSS
import { FaCarSide } from "react-icons/fa"; // Para el logo

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
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        try {
            await apiClient.put('/usuarios/cambiar-password', { new_password: newPassword });
            alert("Contraseña cambiada exitosamente. Serás redirigido al dashboard.");
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || "Ocurrió un error.");
        }
    };

    return (
        <div className="_AF_auth-layout">
            <div className="_AF_brand-panel">
                <div className="_AF_brand-logo">
                    <i className="fas fa-car-side"></i>
                    <span>iDrive</span>
                </div>
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
                        {error && <p className="_AF_error">{error}</p>}
                        <button type="submit" className="_AF_button">Guardar Contraseña</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CambiarPassword;