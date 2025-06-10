import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AuthForm.css'; // Reutilizamos los estilos
import { FaCarSide } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SolicitarReseteo = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await axios.post(`${API_URL}/usuarios/solicitar-reseteo`, { correo_electronico: email });
            setMessage(response.data.message);
        } catch (err) {
            setError("Ocurrió un error. Inténtalo de nuevo más tarde.");
        }
    };

    return (
        <div className="_AF_auth-layout">
            <div className="_AF_brand-panel">
                <div className="_AF_brand-logo">
                    <i className="fas fa-car-side"></i>
                    <span>iDrive</span>
                </div>
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
                        {message && <p style={{color: 'green', fontWeight: '500'}}>{message}</p>}
                        {error && <p className="_AF_error">{error}</p>}
                        <button type="submit" className="_AF_button">Enviar Enlace de Reseteo</button>
                    </form>
                    <Link to="/login" className="_AF_link">Volver a Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default SolicitarReseteo;