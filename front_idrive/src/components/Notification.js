// src/components/Notification.js

import React from 'react';
import './Notification.css';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const icons = {
    success: <FaCheckCircle />,
    error: <FaExclamationTriangle />,
    info: <FaInfoCircle />,
};

const Notification = ({ message, type, onClose }) => {
    return (
        <div className={`_NTF_notification _NTF_${type}`}>
            <div className="_NTF_icon">
                {icons[type]}
            </div>
            <div className="_NTF_message">
                {message}
            </div>
            <button onClick={onClose} className="_NTF_close-btn">
                <FaTimes />
            </button>
        </div>
    );
};

export default Notification;