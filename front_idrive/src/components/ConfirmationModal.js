import React from 'react';
import './ConfirmationModal.css'; // Crearemos este archivo de estilos en el siguiente paso.

/**
 * Componente de Modal de Confirmación Reutilizable.
 *
 * @param {object} props
 * @param {boolean} props.show - Controla si el modal está visible.
 * @param {string} props.title - El título del modal.
 * @param {string} props.message - El mensaje o pregunta de confirmación.
 * @param {function} props.onClose - Función para cerrar el modal (acción de cancelar).
 * @param {function} props.onConfirm - Función a ejecutar si el usuario confirma.
 * @param {string} [props.confirmText='Confirmar'] - Texto para el botón de confirmación.
 * @param {string} [props.cancelText='Cancelar'] - Texto para el botón de cancelar.
 * @param {string} [props.confirmVariant=''] - Clase CSS para estilizar el botón de confirmación (ej. 'btn-danger', 'btn-success').
 */
const ConfirmationModal = ({
  show,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'btn-primary'
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-container" onClick={(e) => e.stopPropagation()}>
        <h4 className="confirm-modal-title">{title}</h4>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-buttons">
          <button className="btn_User btn-cancel_User" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`btn_User ${confirmVariant}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;