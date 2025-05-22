import React, { useState } from 'react';
import axios from 'axios';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:8000/Validacion_Login/', {
                correo_electronico: correo,
                password: password
            }, {
                withCredentials: true
            });

            console.log(response.data);
            alert('Inicio de sesión exitoso');
            navigate('/dashboard'); // Redirige tras login
        } catch (err) {
            console.error(err);
            setError('Correo o contraseña incorrectos');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Iniciar sesión</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <span className="icon"><FaUser /></span>
                        <input
                            type="text"
                            placeholder="Correo electrónico"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <span className="icon"><FaLock /></span>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <div className="options">
                        <label>
                            <input type="checkbox" /> Recuérdame
                        </label>
                        <a href="#">¿Olvidaste la contraseña?</a>
                    </div>

                    <button type="submit" className="login-btn">Iniciar sesión</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
