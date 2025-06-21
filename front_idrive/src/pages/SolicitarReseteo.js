// src/pages/SolicitarReseteo.js (Corregido)

import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AuthForm.css';
import Logo_iDrive2 from '../assets/img/Logo_iDrive2.png';
import { useNotification } from '../context/NotificationContext'; // <-- IMPORTAR

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SolicitarReseteo = () => {
    const [email, setEmail] = useState('');
    const { addNotification } = useNotification(); // <-- OBTENER FUNCIÓN
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/usuarios/solicitar-reseteo`, { correo_electronico: email });
            addNotification(response.data.message, 'success');
        } catch (err) {
            addNotification(err.response?.data?.detail || "Ocurrió un error. Inténtalo de nuevo más tarde.", 'error');
        }
    };

    return (
        <div className="_AF_auth-layout">
            <div className="_AF_brand-panel">
                <Link to="/">
                    <img src={Logo_iDrive2} alt="Logo iDrive" className="_AF_logo" />
                </Link>
                <h1>¿Olvidaste tu Contraseña?</h1>
                <p>No te preocupes. Ingresa tu correo y te ayudaremos a recuperar el acceso a tu cuenta.</p>
            </div>
            <div className="_AF_form-container">
                <div className="_AF_card">
                    <h2>Restablecer Contraseña</h2>
                    <p className="_AF_subtitle">Recibirás un enlace en tu correo electrónico.</p>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            className="_AF_input"
                            placeholder="Tu correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {/* Se eliminan los mensajes de estado locales */}
                        <button type="submit" className="_AF_button">Enviar Enlace de Reseteo</button>
                    </form>
                    <Link to="/login" className="_AF_link">Volver a Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default SolicitarReseteo;