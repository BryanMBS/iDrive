import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

// MEJORA: Usar variable de entorno para la URL de la API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // CORRECCIÓN: Apuntar al endpoint de login correcto definido en el backend (`/usuarios/login`).
            const response = await axios.post(`${API_URL}/usuarios/login`, {
                correo_electronico: correo,
                password: password,
            });

            // CORRECCIÓN: El backend devuelve `token`, no `access_token`.
            if (response.data && response.data.token) {
                // MEJORA DE SEGURIDAD: Guardar el token de acceso en localStorage.
                localStorage.setItem('token', response.data.token);
                
                alert('Inicio de sesión exitoso');
                navigate('/dashboard'); // Redirige tras login
            } else {
                // Manejar el caso en que el login es exitoso pero no viene el token.
                const errorMessage = 'Error de autenticación: La respuesta del servidor no contenía un token.';
                setError(errorMessage);
                console.error(errorMessage, response.data);
            }

        } catch (err) {
            console.error("Error durante el inicio de sesión:", err);
            // MEJORA: Mostrar error específico del backend si está disponible.
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