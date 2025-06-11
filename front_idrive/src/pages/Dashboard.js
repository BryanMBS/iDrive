// src/pages/Dashboard.js

// --- Importaciones de Módulos y Componentes ---
import React, { useState, useEffect, useCallback } from 'react'; // Hooks de React para estado, efectos y optimización
import Sidebar from '../components/Sidebar'; // Componente de la barra lateral
import axios from 'axios'; // Librería para realizar peticiones HTTP a la API
import { useAuth } from '../context/AuthContext'; // Hook personalizado para acceder a datos de autenticación y permisos
import './Dashboard.css'; // Estilos específicos para el Dashboard
import './Usuarios.css'; // Reutilizamos estilos generales de las páginas de gestión

// --- Configuración del Cliente de API con Axios ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // URL del backend
const apiClient = axios.create({ baseURL: API_URL });

// Interceptor: Se ejecuta antes de cada petición para añadir el token de autenticación
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    // Si hay un token, se añade al encabezado 'Authorization'
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Componente Principal del Dashboard ---
const Dashboard = () => {
  // --- Estados del Componente ---
  const { hasPermission } = useAuth(); // Obtenemos la función para verificar permisos del usuario logueado

  // Estado para almacenar las estadísticas que se mostrarán en las tarjetas
  const [stats, setStats] = useState({
    clasesMes: 'N/A',
    nuevosUsuariosMes: 'N/A',
    tasaOcupacion: 0,
    alertasPendientes: 'N/A',
  });
  // Estado para controlar la visualización del mensaje "Cargando..."
  const [isLoading, setIsLoading] = useState(true);

  // --- Función para Obtener y Procesar los Datos ---
  // useCallback optimiza la función para que no se recree en cada renderizado, a menos que sus dependencias cambien
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true); // Mostramos el indicador de carga

    try {
      // Creamos una lista de promesas para las peticiones a la API
      const peticiones = [
        apiClient.get('/clases/'), // Siempre obtenemos las clases
      ];

      // Peticiones condicionales basadas en los permisos del usuario
      if (hasPermission('usuarios:leer')) {
        peticiones.push(apiClient.get('/usuarios/'));
      } else {
        peticiones.push(Promise.resolve({ data: [] })); // Si no tiene permiso, devolvemos una promesa resuelta con un array vacío
      }
      
      if (hasPermission('agendamientos:ver:todos')) {
        peticiones.push(apiClient.get('/agendamientos/'));
      } else {
        peticiones.push(Promise.resolve({ data: [] })); // Igual para agendamientos
      }
      
      // Promise.all ejecuta todas las peticiones en paralelo para mayor eficiencia
      const [resClases, resUsuarios, resAgendamientos] = await Promise.all(peticiones);
      
      // Extraemos los datos de las respuestas, asegurándonos de tener un array vacío si no hay datos
      const clasesData = resClases.data || [];
      const usuariosData = resUsuarios.data || [];
      const agendamientosData = resAgendamientos.data || [];

      // --- Inicia el Cálculo de las Estadísticas ---
      const ahora = new Date();
      const mesActual = ahora.getMonth(); // 0 = Enero, 11 = Diciembre
      const anioActual = ahora.getFullYear();

      // 1. Cálculo: Clases programadas en el mes actual
      const clasesMes = clasesData.filter(clase => {
        const fechaClase = new Date(clase.fecha_hora);
        return fechaClase.getMonth() === mesActual && fechaClase.getFullYear() === anioActual;
      }).length;

      // 2. Cálculo: Nuevos usuarios registrados en el mes actual
      const nuevosUsuariosMes = usuariosData.filter(usuario => {
        const fechaRegistro = new Date(usuario.fecha_registro);
        return fechaRegistro.getMonth() === mesActual && fechaRegistro.getFullYear() === anioActual;
      }).length;
      
      // 3. Cálculo: Tasa de ocupación total
      const totalCupos = clasesData.reduce((sum, clase) => sum + clase.cupos_disponibles, 0);
      const totalAgendados = agendamientosData.length;
      // Verificamos que totalCupos no sea 0 para evitar división por cero
      const tasaOcupacion = totalCupos > 0 ? (totalAgendados / totalCupos) * 100 : 0;

      // 4. Cálculo: Alertas (agendamientos con estado 'Pendiente')
      const alertasPendientes = agendamientosData.filter(a => a.estado === 'Pendiente').length;

      // Actualizamos el estado con los nuevos valores calculados
      setStats({
        clasesMes: clasesMes,
        nuevosUsuariosMes: hasPermission('usuarios:leer') ? nuevosUsuariosMes : 'N/A',
        tasaOcupacion: tasaOcupacion,
        alertasPendientes: hasPermission('agendamientos:ver:todos') ? alertasPendientes : 'N/A',
      });

    } catch (error) {
      console.error("Error al cargar los datos del dashboard:", error);
      // Podríamos establecer un estado de error aquí si quisiéramos mostrar un mensaje en la UI
    } finally {
      // Se ejecuta siempre, haya o no error, para ocultar el indicador de carga
      setIsLoading(false);
    }
  }, [hasPermission]); // La dependencia es 'hasPermission' para que se vuelva a ejecutar si los permisos cambian

  // --- Efecto de Carga Inicial ---
  // useEffect con un array de dependencias vacío se ejecuta solo una vez, cuando el componente se monta
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Se llama a la función de carga de datos

  // Si los datos aún están cargando, mostramos un mensaje simple
  if (isLoading) {
    return (
        <div className="d-flex main-layout-container">
            <Sidebar />
            <div className="content-area_User p-4">
              <h4>Cargando datos del Dashboard...</h4>
            </div>
        </div>
    );
  }

  // --- Renderizado del Componente ---
  return (
    <div className="d-flex main-layout-container">
      <Sidebar />
      <div className="content-area_User">
        <div id="content">
          <div className="container-fluid py-4">
            
            {/* Cabecera del Dashboard */}
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
              <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
              <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
                <i className="fas fa-download fa-sm text-white-50"></i> Generar Reporte
              </a>
            </div>

            {/* Fila de Tarjetas de Estadísticas */}
            <div className="row">
              {/* Tarjeta 1: Clases Programadas (Dato Dinámico) */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Clases Programadas (Mes)</div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.clasesMes}</div>
                      </div>
                      <div className="col-auto"><i className="fas fa-calendar-alt fa-2x text-gray-300"></i></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Nuevos Usuarios (Dato Dinámico) */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-success shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">Nuevos Usuarios (Mes)</div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.nuevosUsuariosMes}</div>
                      </div>
                      <div className="col-auto"><i className="fas fa-user-plus fa-2x text-gray-300"></i></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Tasa de Ocupación (Dato Dinámico) */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-info shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">Tasa de Ocupación</div>
                        <div className="row no-gutters align-items-center">
                          <div className="col-auto">
                            <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">{Math.round(stats.tasaOcupacion)}%</div>
                          </div>
                          <div className="col">
                            <div className="progress progress-sm mr-2">
                              <div
                                className="progress-bar bg-info"
                                role="progressbar"
                                style={{ width: `${stats.tasaOcupacion}%` }} // El ancho de la barra es dinámico
                                aria-valuenow={stats.tasaOcupacion}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-auto"><i className="fas fa-clipboard-list fa-2x text-gray-300"></i></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 4: Alertas Pendientes (Dato Dinámico) */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-warning shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Agendamientos Pendientes</div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.alertasPendientes}</div>
                      </div>
                      <div className="col-auto"><i className="fas fa-exclamation-triangle fa-2x text-gray-300"></i></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fila de Bienvenida */}
            <div className="row">
              <div className="col-lg-12 mb-4">
                <div className="card-dashboard shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">Bienvenido al Sistema de Administración iDrive</h6>
                  </div>
                  <div className="card-body">
                    <p>Desde este panel podrás gestionar todos los aspectos de la academia. Utiliza la barra lateral para navegar entre las diferentes secciones.</p>
                    <p className="mb-0">Revisa las tarjetas de arriba para obtener una vista rápida del estado actual de la operación.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;