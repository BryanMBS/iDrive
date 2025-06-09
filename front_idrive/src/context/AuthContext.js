// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Creamos el Contexto
const AuthContext = createContext(null);

// 2. Creamos el Proveedor del Contexto (AuthProvider)
// Este componente envolverá toda nuestra aplicación.
export const AuthProvider = ({ children }) => {
    // El estado 'user' contendrá la información del usuario logueado (o null si no hay nadie)
    const [user, setUser] = useState(null);

    // useEffect se ejecuta una sola vez cuando la aplicación carga por primera vez
    useEffect(() => {
        try {
            // Intenta recuperar los datos del usuario guardados en el almacenamiento local del navegador
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                // Si existen datos, los convierte de texto a objeto y los establece como el usuario actual
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("No se pudo cargar la información del usuario desde localStorage", error);
            // Limpia el almacenamiento en caso de que los datos guardados estén corruptos
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }, []);

    // Función para iniciar sesión
    const login = (userData) => {
        // Guarda los datos completos del usuario (incluyendo permisos) y el token en localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.access_token);
        // Actualiza el estado 'user' para que toda la aplicación sepa que el usuario ha iniciado sesión
        setUser(userData);
    };

    // Función para cerrar sesión
    const logout = () => {
        // Elimina los datos del usuario y el token de localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Establece el usuario a null para que la aplicación sepa que la sesión se ha cerrado
        setUser(null);
    };

    // Función para verificar si el usuario tiene un permiso específico
    const hasPermission = (requiredPermission) => {
        // Si no hay usuario o no tiene una lista de permisos, devuelve falso
        if (!user || !user.permisos) {
            return false;
        }
        // Devuelve verdadero si el permiso requerido está en la lista de permisos del usuario
        return user.permisos.includes(requiredPermission);
    };

    // El proveedor hace que el valor (value) esté disponible para todos los componentes hijos
    return (
        <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. Creamos un Hook Personalizado
// Este es un atajo para que otros componentes puedan acceder fácilmente al contexto.
export const useAuth = () => {
    return useContext(AuthContext);
};