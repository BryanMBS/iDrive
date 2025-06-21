// src/pages/Login.js (Corregido)

import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';
import Footer from '../components/Footer';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addNotification } = useNotification();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', correo);
            formData.append('password', password);

            const response = await axios.post(`${API_URL}/usuarios/login`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data && response.data.access_token) {
                login(response.data);
                
                if (response.data.requiere_cambio_password) {
                    addNotification("Es tu primer inicio de sesión. Por seguridad, debes cambiar tu contraseña.", 'info');
                    navigate('/cambiar-password');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError('Error de autenticación: Respuesta inesperada del servidor.');
            }

        } catch (err) {
            console.error("Error durante el inicio de sesión:", err);
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Correo o contraseña incorrectos.');
            }
        }
    };

    return (
        <div className="login-container_Login">
            <div className="login-box_Login">
                <h2>Iniciar sesión</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group_Login">
                        <span className="icon_Login"><FaUser /></span>
                        <input type="text" placeholder="Correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
                    </div>
                    <div className="input-group_Login">
                        <span className="icon_Login"><FaLock /></span>
                        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="error-message_Login">{error}</p>}
                    <div className="options_Login">
                        <label><input type="checkbox" /> Recuérdame</label>
                        <Link to="/solicitar-reseteo">¿Olvidaste la contraseña?</Link>
                    </div>
                    <button type="submit" className="login-btn_Login">Iniciar sesión</button>
                </form>
            </div>
            <Footer className="footer_Login" />
        </div>
    );
};

export default Login;