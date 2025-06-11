// src/components/ResetearPassword.js

import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthForm.css';
import Logo_iDrive2 from '../assets/img/Logo_iDrive2.png'; // <- Ruta correcta ya en uso

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ResetearPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (newPassword.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        } 
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        try {
            await axios.post(`${API_URL}/usuarios/reseteo-password`, { token, new_password: newPassword });
            setMessage("¡Contraseña restablecida con éxito! Serás redirigido para iniciar sesión en 3 segundos.");
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "Error: el enlace puede ser inválido o haber expirado.");
        }
    };

    return (
        <div className="_AF_auth-layout">
            <div className="_AF_brand-panel">
                <Link to="/"><img src={Logo_iDrive2} alt="Logo iDrive" className="_AF_logo" /></Link>
                <h1>Casi Listo</h1>
                <p>Establece tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar para ti.</p>
            </div>
            <div className="_AF_form-container">
                <div className="_AF_card">
                    <h2>Establecer Nueva Contraseña</h2>
                    <p className="_AF_subtitle">Introduce y confirma tu nueva contraseña.</p>
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
                        {message && <p style={{color: 'green', fontWeight: '500'}}>{message}</p>}
                        {error && <p className="_AF_error">{error}</p>}
                        <button type="submit" className="_AF_button">Guardar Nueva Contraseña</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetearPassword;