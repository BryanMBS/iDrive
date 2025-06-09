// Login.js

import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

//---------------------------------------------
// CONFIGURACIÓN DE LA API
//---------------------------------------------
// Se utiliza una variable de entorno para la URL de la API, con un valor por defecto para desarrollo.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

//---------------------------------------------
// COMPONENTE PRINCIPAL DE LOGIN
//---------------------------------------------
const Login = () => {
    //---------------------------------------------
    // ESTADOS DEL COMPONENTE
    //---------------------------------------------
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    //---------------------------------------------
    // MANEJADOR DE ENVÍO DEL FORMULARIO
    //---------------------------------------------
    const handleLogin = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        setError(''); // Limpia errores previos

        try {
            // Se realiza la petición POST al endpoint de login del backend.
            const response = await axios.post(`${API_URL}/usuarios/login`, {
                correo_electronico: correo,
                password: password,
            });

            // Si la respuesta contiene un token, el inicio de sesión fue exitoso.
            if (response.data && response.data.token) {
                // Se guarda el token en localStorage para mantener la sesión.
                localStorage.setItem('token', response.data.token);
                
                alert('Inicio de sesión exitoso');
                navigate('/dashboard'); // Redirige al usuario al dashboard.
            } else {
                // Caso en que la respuesta no contiene el token esperado.
                const errorMessage = 'Error de autenticación: La respuesta del servidor no contenía un token.';
                setError(errorMessage);
                console.error(errorMessage, response.data);
            }

        } catch (err) {
            console.error("Error durante el inicio de sesión:", err);
            // Muestra un mensaje de error específico si el backend lo provee.
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Correo o contraseña incorrectos.');
            }
        }
    };

    //---------------------------------------------
    // RENDERIZADO DEL COMPONENTE
    //---------------------------------------------
    return (
        <div className="login-container_Login">
            <div className="login-box_Login">
                <h2>Iniciar sesión</h2>
                <form onSubmit={handleLogin}>
                    {/* Input para el correo electrónico */}
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

                    {/* Input para la contraseña */}
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

                    {/* Muestra el mensaje de error si existe */}
                    {error && <p className="error-message_Login">{error}</p>}

                    {/* Opciones adicionales como "Recuérdame" y "Olvidé contraseña" */}
                    <div className="options_Login">
                        <label>
                            <input type="checkbox" /> Recuérdame
                        </label>
                        <a href="#">¿Olvidaste la contraseña?</a>
                    </div>

                    {/* Botón para enviar el formulario */}
                    <button type="submit" className="login-btn_Login">Iniciar sesión</button>
                </form>
            </div>
            <Footer className="footer_Login" />
        </div>
    );
};

export default Login;