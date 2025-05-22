import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import "./Usuarios.css";
import "bootstrap/dist/css/bootstrap.min.css";

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo_electronico: "",
    telefono: "",
    cedula: "",
    password: "",
    id_rol: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const fetchUsuarios = () => {
    fetch("http://localhost:8000/Usuarios/")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error("Error al cargar usuarios:", err));
  };

  const fetchRoles = () => {
    fetch("http://localhost:8000/Roles/")
      .then((res) => res.json())
      .then((data) => setRoles(data))
      .catch((err) => console.error("Error al cargar roles:", err));
  };

  const handleInputChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleCrearUsuario = () => {
    if (
      !formulario.nombre ||
      !formulario.correo_electronico ||
      !formulario.telefono ||
      !formulario.cedula ||
      !formulario.password ||
      !formulario.id_rol
    ) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    fetch("http://localhost:8000/Crear_usuario/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Usuario creado exitosamente");
          setModalVisible(false);
          setFormulario({
            nombre: "",
            correo_electronico: "",
            telefono: "",
            cedula: "",
            password: "",
            id_rol: "",
          });
          fetchUsuarios();
        } else {
          alert("Hubo un error al crear el usuario.");
          console.error("Error al crear usuario:", data);
        }
      })
      .catch((err) => {
        console.error("Error al enviar datos:", err);
        alert(
          "Hubo un error al crear el usuario. Verifique la consola para más detalles."
        );
      });
  };

  const handleEditarUsuario = (usuario, index) => {
    const rol = roles.find((r) => r.nombre_rol === usuario[4]);
    setFormulario({
      nombre: usuario[0],
      correo_electronico: usuario[1],
      telefono: usuario[2],
      cedula: usuario[3],
      password: "",
      id_rol: rol ? rol.id_rol : "",
    });
    setUsuarioEditandoId(index + 1);
    setEditando(true);
    setModalVisible(true);
  };

  const handleActualizarUsuario = () => {
    fetch(`http://localhost:8000/Editar_usuario/${usuarioEditandoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario),
    })
      .then((res) => res.json())
      .then(() => {
        setModalVisible(false);
        setEditando(false);
        setFormulario({
          nombre: "",
          correo_electronico: "",
          telefono: "",
          cedula: "",
          password: "",
          id_rol: "",
        });
        fetchUsuarios();
      });
  };

  const handleEliminarUsuario = (id) => {
    if (!window.confirm("¿Deseas eliminar este usuario?")) return;
    fetch(`http://localhost:8000/Borrar_usuario/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => fetchUsuarios());
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u[0].toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="container-fluid mt-4">
        <div className="usuarios-header d-flex justify-content-between align-items-center mb-3">
          <h2>Gestión de Usuarios</h2>
          <button
            className="btn btn-primarys
            
            
            btn-sm custom-btn-crear-usuario"
            onClick={() => {
              setModalVisible(true);
              setEditando(false);
              setFormulario({
                nombre: "",
                correo_electronico: "",
                telefono: "",
                cedula: "",
                password: "",
                id_rol: "",
              });
            }}
          >
            Crear Usuario
          </button>
        </div>

        <div className="mb-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="button">
              <i className="bi bi-search"></i> {/* Ícono de búsqueda */}
            </button>
          </div>
        </div>

        <table className="table table-bordered bg-white shadow-sm">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Cédula</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u, idx) => (
              <tr key={idx}>
                <td>{u[0]}</td>
                <td>{u[1]}</td>
                <td>{u[2]}</td>
                <td>{u[3]}</td>
                <td>{u[4]}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEditarUsuario(u, idx)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleEliminarUsuario(idx + 1)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {modalVisible && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h4>{editando ? "Editar Usuario" : "Crear Usuario"}</h4>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={formulario.nombre}
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="correo_electronico"
                placeholder="Correo"
                value={formulario.correo_electronico}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="telefono"
                placeholder="Teléfono"
                value={formulario.telefono}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="cedula"
                placeholder="Cédula"
                value={formulario.cedula}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                value={formulario.password}
                onChange={handleInputChange}
              />
              <select
                name="id_rol"
                value={formulario.id_rol}
                onChange={handleInputChange}
              >
                <option value="">Seleccione un rol</option>
                {roles.length > 0 ? (
                  roles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre_rol}
                    </option>
                  ))
                ) : (
                  <option>Cargando roles...</option>
                )}
              </select>
              <div className="modal-buttons mt-3">
                <button
                  className="modal-button guardar"
                  onClick={
                    editando ? handleActualizarUsuario : handleCrearUsuario
                  }
                >
                  {editando ? "Actualizar" : "Guardar"}
                </button>
                <button
                  className="modal-button cancelar"
                  onClick={() => setModalVisible(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;
