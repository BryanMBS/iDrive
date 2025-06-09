import React from 'react';
import Sidebar from '../components/Sidebar';
import './Dashboard.css'; // Mantenemos el CSS específico del Dashboard para las tarjetas
import './Usuarios.css'; // IMPORTANTE: Añadimos la importación del CSS de Usuarios para el layout

const Dashboard = () => {
  return (
    // 1. Usamos la misma estructura de contenedor que en Usuarios.js
    <div className="d-flex main-layout-container">
      <Sidebar />
      {/* 2. Usamos la clase que aplica el margen izquierdo de 250px */}
      <div className="content-area_User">
        <div id="content">
          <div className="container-fluid py-4">
            {/* */}
            <div className="d-sm-flex align-items-center justify-content-between mb-4">
              <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
              <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
                <i className="fas fa-download fa-sm text-white-50"></i> Generar Reporte
              </a>
            </div>

            {/* */}
            <div className="row">
              {/* */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-primary shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                          Clases Programadas (Mes)
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">42</div>
                      </div>
                      <div className="col-auto">
                        <i className="fas fa-calendar-alt fa-2x text-gray-300"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-success shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                          Nuevos Usuarios (Mes)
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">15</div>
                      </div>
                      <div className="col-auto">
                        <i className="fas fa-user-plus fa-2x text-gray-300"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-info shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                          Tasa de Ocupación
                        </div>
                        <div className="row no-gutters align-items-center">
                          <div className="col-auto">
                            <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">75%</div>
                          </div>
                          <div className="col">
                            <div className="progress progress-sm mr-2">
                              <div
                                className="progress-bar bg-info"
                                role="progressbar"
                                style={{ width: '75%' }}
                                aria-valuenow="75"
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-auto">
                        <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* */}
              <div className="col-xl-3 col-md-6 mb-4">
                <div className="card-dashboard border-left-warning shadow h-100 py-2">
                  <div className="card-body">
                    <div className="row no-gutters align-items-center">
                      <div className="col mr-2">
                        <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                          Alertas Pendientes
                        </div>
                        <div className="h5 mb-0 font-weight-bold text-gray-800">3</div>
                      </div>
                      <div className="col-auto">
                        <i className="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* */}
            <div className="row">
              <div className="col-lg-12 mb-4">
                <div className="card-dashboard shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">Bienvenido al Sistema de Administración</h6>
                  </div>
                  <div className="card-body">
                    <p>
                      Hola, bienvenido de nuevo. Desde este panel podrás gestionar todos los aspectos de la academia. Utiliza la barra lateral para navegar entre las secciones de <strong>usuarios</strong>, <strong>clases</strong>, <strong>reservas</strong> y más.
                    </p>
                    <p className="mb-0">
                      Si tienes alguna duda, no dudes en consultar la documentación o contactar con el soporte técnico.
                    </p>
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