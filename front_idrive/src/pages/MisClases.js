import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import "./MisClases.css";
import { useAuth } from '../context/AuthContext'; // Importamos el hook para obtener datos del usuario

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const MisClases = () => {
  const { user } = useAuth(); // Obtenemos la información del usuario logueado
  const [misAgendamientos, setMisAgendamientos] = useState([]);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [agendamientosTotales, setAgendamientosTotales] = useState([]); // Para calcular cupos
  const [showModal, setShowModal] = useState(false);
  const [formulario, setFormulario] = useState({ id_clase: '', cedula: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Obtenemos todas las peticiones en paralelo para mejorar el rendimiento
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
      alert("Por favor, selecciona una clase y proporciona tu cédula.");
      return;
    }
    
    // --- CAMBIO: Se añade un diálogo de confirmación ---
    const isConfirmed = window.confirm(
        "¿Estás seguro de que deseas agendar esta clase? Tu cupo quedará confirmado inmediatamente."
    );

    // Si el usuario presiona "Cancelar", la función se detiene aquí.
    if (!isConfirmed) {
        return;
    }

    try {
        await apiClient.post("/agendamientos/", { 
            id_clase: parseInt(formulario.id_clase), 
            cedula: formulario.cedula
        });
        
        // --- CAMBIO: Mensaje de éxito actualizado ---
        alert("¡Excelente! Tu cupo en la clase ha sido confirmado.");
        
        setShowModal(false);
        setFormulario({ id_clase: '', cedula: '' });
        fetchData(); // Recargamos los datos para que la nueva clase aparezca en la lista
    } catch (error) {
        alert("Error al agendar la clase: " + (error.response?.data?.detail || error.message));
    }
  };

  // --- LÓGICA DE FILTRADO DE CLASES DISPONIBLES ---
  const getClasesFiltradas = () => {
    const ahora = new Date();
    // 1. Creamos un Set con los IDs de las clases en las que el estudiante ya está agendado
    const idsClasesYaAgendadas = new Set(misAgendamientos.map(a => a.id_clase));

    // 2. Contamos cuántos estudiantes hay en cada clase
    const cuposOcupados = agendamientosTotales.reduce((acc, agendamiento) => {
        acc[agendamiento.id_clase] = (acc[agendamiento.id_clase] || 0) + 1;
        return acc;
    }, {});

    // 3. Filtramos la lista de todas las clases
    return clasesDisponibles.filter(clase => {
        const registrados = cuposOcupados[clase.id_clase] || 0;
        
        // La clase debe cumplir todas estas condiciones para estar disponible
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
        
        <div className="_MC_clases-grid">
          {misAgendamientos.length > 0 ? (
            misAgendamientos.map(item => (
              <div key={item.id_agendamiento} className={`_MC_clase-card _MC_estado-${item.estado.toLowerCase()}`}>
                <div className="_MC_card-header">
                  <h3>{item.nombre_clase}</h3>
                  <span className="_MC_estado-badge">{item.estado}</span>
                </div>
                <div className="_MC_card-body">
                  <p><strong>Profesor:</strong> {item.profesor}</p>
                  <p><strong>Salón:</strong> {item.nombre_salon}</p>
                  <p><strong>Fecha:</strong> {new Date(item.fecha_hora).toLocaleDateString()}</p>
                  <p><strong>Hora:</strong> {new Date(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
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
            {/* CAMBIO: El input para la cédula es necesario para el backend actual */}
            <input 
              type="text"
              className="_MC_modal-input"
              placeholder="Confirma tu número de cédula"
              value={formulario.cedula}
              onChange={(e) => setFormulario({...formulario, cedula: e.target.value})}
            />
            {/* CAMBIO: El select ahora usa la lista de clases filtrada */}
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
    </div>
  );
};

export default MisClases;