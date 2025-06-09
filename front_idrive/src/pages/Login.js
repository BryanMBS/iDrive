// Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importamos el hook de autenticación

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // Obtenemos la función 'login' de nuestro contexto

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // CAMBIO: El backend con OAuth2PasswordRequestForm espera los datos en formato 'form-data'
            const formData = new URLSearchParams();
            formData.append('username', correo); // El campo para el email es 'username'
            formData.append('password', password);

            const response = await axios.post(`${API_URL}/usuarios/login`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.data && response.data.access_token) {
                // Usamos la función login del contexto para guardar el token y los datos del usuario
                login(response.data);
                
                alert('Inicio de sesión exitoso');
                navigate('/dashboard');
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
                        <input
                            type="text"
                            placeholder="Correo electrónico"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group_Login">
                        <span className="icon_Login"><FaLock /></span>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="error-message_Login">{error}</p>}

                    <div className="options_Login">
                        <label>
                            <input type="checkbox" /> Recuérdame
                        </label>
                        <a href="#">¿Olvidaste la contraseña?</a>
                    </div>

                    <button type="submit" className="login-btn_Login">Iniciar sesión</button>
                </form>
            </div>
            <Footer className="footer_Login" />
        </div>
    );
};

export default Login;