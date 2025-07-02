// Clases.js (Corregido y Completo)

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import ConfirmationModal from "../components/ConfirmationModal";
import { useNotification } from "../context/NotificationContext";
import axios from 'axios';
import "./Usuarios.css"; // Reutilizamos los estilos para consistencia

//---------------------------------------------
// CONFIGURACIÓN DE AXIOS
//---------------------------------------------
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//---------------------------------------------
// DATOS PREDEFINIDOS
//---------------------------------------------
const CLASES_TEORICAS_PREDEFINIDAS = [
    { nombre: 'Normatividad de Tránsito (Módulo 1)', descripcion: 'Conocimiento del Código Nacional de Tránsito (Ley 769 de 2002).' },
    { nombre: 'Normatividad de Tránsito (Módulo 2)', descripcion: 'Señales de tránsito, normas de circulación y sanciones.' },
    { nombre: 'Seguridad Vial (Módulo 1)', descripcion: 'Comportamiento responsable como conductor y cultura vial.' },
    { nombre: 'Seguridad Vial (Módulo 2)', descripcion: 'Técnicas y estrategias para la prevención de accidentes.' },
    { nombre: 'Primeros Auxilios', descripcion: 'Atención inmediata en caso de accidentes, manejo básico de heridas, fracturas y reanimación.' },
    { nombre: 'Mecánica Básica (Módulo 1)', descripcion: 'Revisión preoperacional y funcionamiento básico de niveles de fluidos.' },
    { nombre: 'Mecánica Básica (Módulo 2)', descripcion: 'Funcionamiento básico del motor, frenos y sistema de luces.' },
    { nombre: 'Conducción Defensiva', descripcion: 'Técnicas para evitar accidentes, identificación de riesgos y manejo preventivo.' },
    { nombre: 'Factores de Riesgo al Conducir', descripcion: 'Influencia de la fatiga, alcohol, drogas, estrés y clima en la conducción.' },
    { nombre: 'Medio Ambiente y Conducción Sostenible', descripcion: 'Técnicas para reducir el impacto ambiental y emisiones contaminantes.' },
    { nombre: 'Derechos y Deberes del Conductor y Peatón', descripcion: 'Responsabilidad ciudadana, convivencia y prioridad peatonal en la vía.' },
    { nombre: 'Manejo de Emergencias y Contingencias', descripcion: 'Procedimientos en caso de fallas mecánicas o siniestros y uso del equipo de seguridad.' },
    { nombre: 'Sistema Integrado de Transporte', descripcion: 'Funcionamiento del transporte público/privado y rol del conductor en la movilidad.' },
];

//---------------------------------------------
// COMPONENTE PRINCIPAL DE CLASES
//---------------------------------------------
const Clases = () => {
    const { addNotification } = useNotification();
    const [clases, setClases] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [salones, setSalones] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(false);
    const [claseEditandoId, setClaseEditandoId] = useState(null);
    const [errorApi, setErrorApi] = useState(null);
    // Declara un estado 'formulario' que es un objeto para manejar los valores de los campos del formulario.
    const [formulario, setFormulario] = useState({
        nombre_clase: "",
        descripcion: "",
        fecha_hora: "",
        id_profesor: "",
        id_salon: "",
        cupos_disponibles: "",
        duracion_minutos: "60",
    });

    const [confirmation, setConfirmation] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'Confirmar',
        confirmVariant: 'btn-primary'
    });
    // Función para obtener la lista de todas las clases del servidor.
    const fetchClases = useCallback(async () => {
        try {
            const response = await apiClient.get("/clases/");
            setClases(response.data || []);
        } catch (err) {
            console.error("Error al cargar clases:", err);
            setErrorApi(`No se pudieron cargar las clases: ${err.response?.data?.detail || err.message}.`);
            setClases([]);
        }
    }, []);
    // Función para obtener la lista de usuarios y filtrarlos para conseguir solo los profesores.
    const fetchProfesores = useCallback(async () => {
        try {
            const response = await apiClient.get("/usuarios/");
            const listaProfesores = response.data.filter(user => user.nombre_rol === 'Profesor');
            setProfesores(listaProfesores || []);
        } catch (err) {
            console.error("Error al cargar profesores:", err);
            setErrorApi(`No se pudieron cargar los profesores: ${err.response?.data?.detail || err.message}.`);
            setProfesores([]);
        }
    }, []);
    // Función para obtener la lista de todos los salones disponibles.
    const fetchSalones = useCallback(async () => {
        try {
            const response = await apiClient.get("/salones/");
            setSalones(response.data || []);
        } catch (err) {
            console.error("Error al cargar salones:", err);
            setErrorApi(`No se pudieron cargar los salones: ${err.response?.data?.detail || err.message}.`);
            setSalones([]);
        }
    }, []);
    // El hook useEffect ejecuta código cuando el componente se monta por primera vez.

    useEffect(() => {
        fetchClases();
        fetchProfesores();
        fetchSalones();
    }, [fetchClases, fetchProfesores, fetchSalones]);

    // Función que se ejecuta al enviar el formulario para crear una nueva clase.
    const handleCrearClase = async () => {
        const datosParaEnviar = {
            ...formulario,
            id_profesor: parseInt(formulario.id_profesor, 10),
            id_salon: parseInt(formulario.id_salon, 10),
            cupos_disponibles: parseInt(formulario.cupos_disponibles, 10),
            duracion_minutos: parseInt(formulario.duracion_minutos, 10),
        };
        try {
            await apiClient.post("/clases/", datosParaEnviar);
            addNotification("Clase creada exitosamente", 'success');
            cerrarModalYLimpiar();
            fetchClases();
        } catch (err) {
            addNotification(`Error al crear la clase: ${err.response?.data?.detail || err.message}`, 'error');
        }
    };

    const handleActualizarClase = async () => {
        const datosParaEnviar = {
            ...formulario,
            id_profesor: parseInt(formulario.id_profesor, 10),
            id_salon: parseInt(formulario.id_salon, 10),
            cupos_disponibles: parseInt(formulario.cupos_disponibles, 10),
            duracion_minutos: parseInt(formulario.duracion_minutos, 10),
        };
        try {
            await apiClient.put(`/clases/${claseEditandoId}`, datosParaEnviar);
            addNotification("Clase actualizada exitosamente", 'success');
            cerrarModalYLimpiar();
            fetchClases();
        } catch (err) {
            addNotification(`Error al actualizar la clase: ${err.response?.data?.detail || err.message}`, 'error');
        }
    };

    const handleEliminarClase = (idClase, nombreClase) => {
        setConfirmation({
            show: true,
            title: 'Confirmar Eliminación',
            message: `¿Está seguro de que desea eliminar la clase "${nombreClase}"?`,
            confirmText: 'Eliminar',
            confirmVariant: 'btn-danger_User',
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/clases/${idClase}`);
                    addNotification("Clase eliminada exitosamente.", 'success');
                    fetchClases();
                } catch (err) {
                    addNotification(`Hubo un error al eliminar la clase: ${err.response?.data?.detail || err.message}`, 'error');
                }
                setConfirmation({ ...confirmation, show: false });
            },
        });
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormulario({ ...formulario, [name]: value });
    };

    const handleClasePredefinidaChange = (e) => {
        const nombreClaseSeleccionada = e.target.value;
        const claseSeleccionada = CLASES_TEORICAS_PREDEFINIDAS.find(c => c.nombre === nombreClaseSeleccionada);

        setFormulario({
            ...formulario,
            nombre_clase: claseSeleccionada ? claseSeleccionada.nombre : "",
            descripcion: claseSeleccionada ? claseSeleccionada.descripcion : ""
        });
    };

    const resetFormulario = () => {
        setFormulario({ nombre_clase: "", descripcion: "", fecha_hora: "", id_profesor: "", id_salon: "", cupos_disponibles: "", duracion_minutos: "60" });
    };
    
    const abrirModalParaCrear = () => {
        setEditando(false);
        resetFormulario();
        setModalVisible(true);
    };
    
    const abrirModalParaEditar = (clase) => {
        const fechaParaInput = clase.fecha_hora ? new Date(clase.fecha_hora).toISOString().slice(0, 16) : "";
        setFormulario({
            nombre_clase: clase.nombre_clase,
            descripcion: clase.descripcion,
            fecha_hora: fechaParaInput,
            id_profesor: clase.id_profesor,
            id_salon: clase.id_salon,
            cupos_disponibles: clase.cupos_disponibles,
            duracion_minutos: clase.duracion_minutos,
        });
        setClaseEditandoId(clase.id_clase);
        setEditando(true);
        setModalVisible(true);
    };
    
    const cerrarModalYLimpiar = () => {
        setModalVisible(false);
        setEditando(false);
        setClaseEditandoId(null);
        resetFormulario();
    };

    const getProfesorNombre = useCallback((id) => {
        const profesor = profesores.find(p => p.id_usuario === id);
        return profesor ? profesor.nombre : 'N/A';
    }, [profesores]);

    const getSalonNombre = useCallback((id) => {
        const salon = salones.find(s => s.id_salon === id);
        return salon ? salon.nombre_salon : 'N/A';
    }, [salones]);

    return (
        <div className="d-flex main-layout-container">
            <Sidebar />
            <div className="content-area_User">
                <div className="container-fluid mt-4 usuarios-container">
                    <div className="usuarios-header d-flex justify-content-between align-items-center mb-4">
                        <h2 className="usuarios-title">Gestión de Clases</h2>
                        <button className="btn_User btn-primary_User" onClick={abrirModalParaCrear}>
                            Programar Clase
                        </button>
                    </div>
                    {errorApi && <div className="alert alert-danger">{errorApi}</div>}
                    <div className="table-responsive">
                        <table className="table table-hover usuarios-table">
                            <thead>
                                <tr>
                                    <th>Nombre de la Clase</th>
                                    <th>Profesor</th>
                                    <th>Salón</th>
                                    <th>Fecha y Hora</th>
                                    <th>Cupos</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clases.length > 0 ? (
                                    clases.map((clase) => (
                                        <tr key={clase.id_clase}>
                                            <td>{clase.nombre_clase}</td>
                                            <td>{getProfesorNombre(clase.id_profesor)}</td>
                                            <td>{getSalonNombre(clase.id_salon)}</td>
                                            <td>{new Date(clase.fecha_hora).toLocaleString()}</td>
                                            <td>{clase.cupos_disponibles}</td>
                                            <td className="acciones-buttons_User">
                                                <button className="btn_User btn-edit_User me-2" onClick={() => abrirModalParaEditar(clase)}>
                                                    Editar
                                                </button>
                                                <button className="btn_User btn-delete_User" onClick={() => handleEliminarClase(clase.id_clase, clase.nombre_clase)}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center">No hay clases para mostrar.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {modalVisible && (
                        <div className="modal-overlay_User">
                            <div className="modal-container_User">
                                <h4 className="modal-title_User">{editando ? "Editar Programación" : "Programar Nueva Clase"}</h4>
                                
                                <select 
                                    name="nombre_clase" 
                                    value={formulario.nombre_clase} 
                                    onChange={handleClasePredefinidaChange} 
                                    className="modal-select_User"
                                >
                                    <option value="">Seleccione un módulo teórico</option>
                                    {CLASES_TEORICAS_PREDEFINIDAS.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
                                </select>
                                
                                <textarea 
                                    name="descripcion" 
                                    placeholder="Descripción de la clase" 
                                    value={formulario.descripcion} 
                                    className="modal-input_User" 
                                    disabled
                                    rows="3"
                                />

                                <input type="datetime-local" name="fecha_hora" value={formulario.fecha_hora} onChange={handleInputChange} className="modal-input_User" />
                                
                                <select name="id_profesor" value={formulario.id_profesor} onChange={handleInputChange} className="modal-select_User">
                                    <option value="">Seleccione un profesor</option>
                                    {profesores.map(p => <option key={p.id_usuario} value={p.id_usuario}>{p.nombre}</option>)}
                                </select>
                                
                                <select name="id_salon" value={formulario.id_salon} onChange={handleInputChange} className="modal-select_User">
                                    <option value="">Seleccione un salón</option>
                                    {salones.map(s => <option key={s.id_salon} value={s.id_salon}>{s.nombre_salon}</option>)}
                                </select>
                                
                                <input type="number" name="cupos_disponibles" placeholder="Cupos disponibles" value={formulario.cupos_disponibles} onChange={handleInputChange} className="modal-input_User" />
                                <input type="number" name="duracion_minutos" placeholder="Duración (minutos)" value={formulario.duracion_minutos} onChange={handleInputChange} className="modal-input_User" />
                                
                                <div className="modal-buttons_User mt-4">
                                    <button className="btn_User btn-save_User me-3" onClick={editando ? handleActualizarClase : handleCrearClase}>
                                        {editando ? "Actualizar" : "Guardar"}
                                    </button>
                                    <button className="btn_User btn-cancel_User" onClick={cerrarModalYLimpiar}>
                                        Cancelar
                                    </button>
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
                        confirmText={confirmation.confirmText}
                        confirmVariant={confirmation.confirmVariant}
                    />
                </div>
            </div>
        </div>
    );
};

export default Clases;