// src/context/NotificationContext.js

import React, { createContext, useState, useContext, useCallback } from 'react';
import Notification from '../components/Notification'; 

//
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
// Este estado se usa para almacenar la notificación actual
    const addNotification = useCallback((message, type = 'info') => {
        setNotification({ message, type });

        setTimeout(() => {
            setNotification(null);
        }, 6000);
    }, []);
// Esta función se usa para agregar una notificación y eliminarla después de 6 segundos
    const removeNotification = () => {
        setNotification(null);
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {/* Ahora React sabe que este <Notification> es tu componente y no la API del navegador */}
            {notification && (
                <Notification 
                    message={notification.message} 
                    type={notification.type}
                    onClose={removeNotification}
                />
            )}
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    return useContext(NotificationContext);
};