// src/pages/MisClases.js (Corregido)

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ConfirmationModal from '../components/ConfirmationModal';
import axios from 'axios';
import "./MisClases.css";
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const MisClases = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [misAgendamientos, setMisAgendamientos] = useState([]);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [agendamientosTotales, setAgendamientosTotales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formulario, setFormulario] = useState({ id_clase: '', cedula: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  
  const [confirmation, setConfirmation] = useState({ 
      show: false, 
      title: '', 
      message: '', 
      onConfirm: () => {} 
  });

  const TOTAL_CLASES_META = 13;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resMisAgendamientos, resClases, resAgendamientosTotales] = await Promise.all([
        apiClient.get("/agendamientos/mis-agendamientos"),
        apiClient.get("/clases/"),
        apiClient.get("/agendamientos/")
      ]);
      setMisAgendamientos(resMisAgendamientos.data || []);
      setClasesDisponibles(resClases.data || []);
      setAgendamientosTotales(resAgendamientosTotales.data || []);
    } catch (error) {
      console.error("Error al cargar los datos de la página:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAgendarClase = async () => {
    if (!formulario.id_clase || !formulario.cedula) {
      addNotification("Por favor, selecciona una clase y proporciona tu cédula.", 'error');
      return;
    }

    setConfirmation({
        show: true,
        title: "Confirmar Agendamiento",
        message: "¿Estás seguro de que deseas agendar esta clase? Tu cupo quedará confirmado inmediatamente.",
        onConfirm: async () => {
            try {
                await apiClient.post("/agendamientos/", { id_clase: parseInt(formulario.id_clase), cedula: formulario.cedula });
                addNotification("¡Excelente! Tu cupo en la clase ha sido confirmado.", 'success');
                setShowModal(false);
                setFormulario({ id_clase: '', cedula: '' });
                fetchData();
            } catch (error) {
                addNotification("Error al agendar la clase: " + (error.response?.data?.detail || error.message), 'error');
            } finally {
                setConfirmation({ ...confirmation, show: false });
            }
        }
    });
  };

  const handleVerDetalles = (clase) => {
    setClaseSeleccionada(clase);
  };

  const handleCerrarDetalles = () => {
    setClaseSeleccionada(null);
  };

  const getClasesFiltradas = () => {
    const ahora = new Date();
    const idsClasesYaAgendadas = new Set(misAgendamientos.map(a => a.id_clase));
    const cuposOcupados = agendamientosTotales.reduce((acc, agendamiento) => {
      acc[agendamiento.id_clase] = (acc[agendamiento.id_clase] || 0) + 1;
      return acc;
    }, {});

    return clasesDisponibles.filter(clase => {
      const registrados = cuposOcupados[clase.id_clase] || 0;
      const tieneCupo = registrados < clase.cupos_disponibles;
      const esEnElFuturo = new Date(clase.fecha_hora) > ahora;
      const noEstaAgendada = !idsClasesYaAgendadas.has(clase.id_clase);
      return tieneCupo && esEnElFuturo && noEstaAgendada;
    });
  };

  if (isLoading) {
    return (
        <div className="d-flex">
            <Sidebar />
            <div className="_MC_page-container">Cargando...</div>
        </div>
    );
  }

  const clasesFiltradasParaAgendar = getClasesFiltradas();
  const progresoActual = Math.min((misAgendamientos.length / TOTAL_CLASES_META) * 100, 100);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="_MC_page-container">
        <div className="_MC_header">
          <h1>Mis Clases Agendadas</h1>
          <button className="_MC_btn-primary" onClick={() => setShowModal(true)}>
            + Agendar Nueva Clase
          </button>
        </div>

        <div className="_MC_progreso-container">
            <div className="_MC_progreso-header">
                <h3>Progreso</h3>
                <span>{misAgendamientos.length} / {TOTAL_CLASES_META} Clases</span>
            </div>
            <div className="_MC_progreso-bar-externo">
                <div 
                    className="_MC_progreso-bar-interno" 
                    style={{ width: `${progresoActual}%` }}
                >
                </div>
            </div>
        </div>
        
        <div className="_MC_clases-list">
          {misAgendamientos.length > 0 ? (
            misAgendamientos.map(item => (
              <div key={item.id_agendamiento} className="_MC_list-item" onClick={() => handleVerDetalles(item)}>
                <div className="_MC_list-item-info">
                    <h3>{item.nombre_clase}</h3>
                    <p>Fecha: {new Date(item.fecha_hora).toLocaleDateString()}</p>
                </div>
                <span className={`_MC_estado-badge _MC_estado-${item.estado.toLowerCase()}`}>{item.estado}</span>
              </div>
            ))
          ) : (
            <p className="_MC_no-clases">Aún no tienes clases agendadas. ¡Agenda tu primera clase usando el botón!</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="_MC_modal-overlay">
          <div className="_MC_modal-container">
            <h2>Agendar una Clase</h2>
            <p>Selecciona una de las clases con cupos disponibles.</p>
            <input 
              type="text"
              className="_MC_modal-input"
              placeholder="Confirma tu número de cédula"
              value={formulario.cedula}
              onChange={(e) => setFormulario({...formulario, cedula: e.target.value})}
            />
            <select
              className="_MC_modal-select"
              value={formulario.id_clase}
              onChange={(e) => setFormulario({...formulario, id_clase: e.target.value})}
            >
              <option value="">-- Elige una clase disponible --</option>
              {clasesFiltradasParaAgendar.length > 0 ? (
                clasesFiltradasParaAgendar.map(clase => (
                  <option key={clase.id_clase} value={clase.id_clase}>
                    {clase.nombre_clase} ({new Date(clase.fecha_hora).toLocaleString()})
                  </option>
                ))
              ) : (
                <option disabled>No hay clases nuevas disponibles por el momento.</option>
              )}
            </select>
            <div className="_MC_modal-actions">
              <button className="_MC_btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="_MC_btn-primary" onClick={handleAgendarClase}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {claseSeleccionada && (
        <div className="_MC_modal-overlay">
          <div className="_MC_modal-container">
            <h2>Detalles de la Clase</h2>
            <div className="_MC_card-body _MC_modal-detalles-body">
                <p><strong>Clase:</strong> {claseSeleccionada.nombre_clase}</p>
                <p><strong>Profesor:</strong> {claseSeleccionada.profesor}</p>
                <p><strong>Salón:</strong> {claseSeleccionada.nombre_salon}</p>
                <p><strong>Fecha:</strong> {new Date(claseSeleccionada.fecha_hora).toLocaleDateString()}</p>
                <p><strong>Hora:</strong> {new Date(claseSeleccionada.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Estado:</strong> <span className={`_MC_estado-badge _MC_estado-${claseSeleccionada.estado.toLowerCase()}`}>{claseSeleccionada.estado}</span></p>
            </div>
            <div className="_MC_modal-actions">
              <button className="_MC_btn-secondary" onClick={handleCerrarDetalles}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        show={confirmation.show}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={confirmation.onConfirm}
        onClose={() => setConfirmation({ ...confirmation, show: false })}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default MisClases;