-- =============================================
-- Script Final para la Base de Datos iDrive
-- Versión: Optimizada y Completa
-- Fecha: 11/06/2025
-- Combina normalización, índices, vistas, eventos y todas las tablas requeridas.
-- =============================================

-- Eliminar base de datos existente para una instalación limpia
DROP DATABASE IF EXISTS DataBaseiDrive;
CREATE DATABASE DataBaseiDrive;
USE DataBaseiDrive;

-- Habilitar el programador de eventos si no está activo
SET GLOBAL event_scheduler = ON;

-- =============================================
-- 1. ESTRUCTURA DE TABLAS
-- =============================================

-- Tabla de Roles: Define los tipos de usuario en el sistema.
CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Usuarios: Almacena la información de todos los usuarios.
CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    cedula VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    id_rol INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
) ENGINE=InnoDB;

-- Tabla de Salones: Describe las aulas donde se imparten las clases.
CREATE TABLE Salones (
    id_salon INT AUTO_INCREMENT PRIMARY KEY,
    nombre_salon VARCHAR(50) NOT NULL UNIQUE,
    ubicacion VARCHAR(100) NOT NULL,
    aforo INT NOT NULL CHECK (aforo > 0),
    equipamiento TEXT,
    estado ENUM('disponible', 'mantenimiento') DEFAULT 'disponible'
) ENGINE=InnoDB;

-- Tabla de Clases: Define las clases programadas.
CREATE TABLE Clases (
    id_clase INT AUTO_INCREMENT PRIMARY KEY,
    nombre_clase VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_hora TIMESTAMP NOT NULL,
    duracion_minutos INT NOT NULL DEFAULT 60,
    id_profesor INT NOT NULL,
    id_salon INT NOT NULL,
    cupos_disponibles INT NOT NULL CHECK (cupos_disponibles >= 0),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_profesor) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_salon) REFERENCES Salones(id_salon)
) ENGINE=InnoDB;

-- Tabla de Agendamientos: Registra la reserva de una clase por un estudiante.
CREATE TABLE Agendamientos (
    id_agendamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_clase INT NOT NULL,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('Pendiente', 'Confirmado', 'Cancelado') DEFAULT 'Pendiente',
    metodo_reserva ENUM('web', 'movil', 'presencial') DEFAULT 'web',
    fecha_confirmacion TIMESTAMP NULL,
    FOREIGN KEY (id_estudiante) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES Clases(id_clase),
    UNIQUE KEY unique_agendamiento (id_estudiante, id_clase) -- Evita que un estudiante agende la misma clase dos veces
) ENGINE=InnoDB;

-- Tabla de Inscripciones: Podría usarse para inscribir a un estudiante en un curso completo (conjunto de clases).
CREATE TABLE Inscripciones (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_clase INT NOT NULL, -- O podría ser id_curso si existiera esa tabla
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_estudiante) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES Clases(id_clase)
) ENGINE=InnoDB;

-- Tabla de Notificaciones: Para enviar mensajes a los usuarios.
CREATE TABLE Notificaciones (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  mensaje TEXT NOT NULL,
  leida TINYINT(1) DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
) ENGINE=InnoDB;

-- Tabla de Logs de Actividad: Para auditoría del sistema.
CREATE TABLE LogsActividad (
  id_log INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  accion VARCHAR(50) NOT NULL,
  tabla_afectada VARCHAR(50),
  registro_id INT,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  detalles LONGTEXT,
  FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla de Configuración del Sistema: Parámetros clave-valor.
CREATE TABLE ConfiguracionSistema (
  id_config INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(50) UNIQUE NOT NULL,
  valor VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- =============================================
CREATE INDEX idx_clases_fecha ON Clases(fecha_hora);
CREATE INDEX idx_agendamientos_estado ON Agendamientos(estado);
CREATE INDEX idx_usuarios_rol ON Usuarios(id_rol);
CREATE INDEX idx_notificaciones_usuario ON Notificaciones(id_usuario, leida);

-- =============================================
-- 3. VISTAS (Consultas almacenadas)
-- =============================================

-- Vista para monitorear el estado de los cupos y reservas de las clases
CREATE VIEW vista_cupos_clases AS
SELECT 
    c.id_clase,
    c.nombre_clase,
    c.fecha_hora,
    s.nombre_salon,
    u.nombre AS nombre_profesor,
    s.aforo AS aforo_total,
    c.cupos_disponibles,
    (s.aforo - c.cupos_disponibles) AS reservas_realizadas
FROM Clases c
JOIN Salones s ON c.id_salon = s.id_salon
JOIN Usuarios u ON c.id_profesor = u.id_usuario
ORDER BY c.fecha_hora;

-- =============================================
-- 4. TRIGGERS (Automatización de lógica de negocio)
-- =============================================
DELIMITER //

-- Trigger que se dispara ANTES de insertar un agendamiento para verificar y reducir cupos.
CREATE TRIGGER before_agendamiento_insert
BEFORE INSERT ON Agendamientos
FOR EACH ROW
BEGIN
    DECLARE cupos INT;
    SELECT cupos_disponibles INTO cupos
    FROM Clases
    WHERE id_clase = NEW.id_clase;
    
    IF cupos <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No hay cupos disponibles para esta clase.';
    END IF;

    UPDATE Clases
    SET cupos_disponibles = cupos_disponibles - 1
    WHERE id_clase = NEW.id_clase;
END//

-- Trigger que se dispara DESPUÉS de actualizar un agendamiento para devolver cupo si se cancela.
CREATE TRIGGER after_agendamiento_update
AFTER UPDATE ON Agendamientos
FOR EACH ROW
BEGIN
    IF NEW.estado = 'Cancelado' AND OLD.estado != 'Cancelado' THEN
        UPDATE Clases
        SET cupos_disponibles = cupos_disponibles + 1
        WHERE id_clase = OLD.id_clase;
    END IF;
END//

-- Trigger que se dispara DESPUÉS de eliminar un agendamiento para devolver el cupo.
CREATE TRIGGER after_agendamiento_delete
AFTER DELETE ON Agendamientos
FOR EACH ROW
BEGIN
    -- Solo se devuelve el cupo si la reserva no estaba ya cancelada
    IF OLD.estado != 'Cancelado' THEN
        UPDATE Clases
        SET cupos_disponibles = cupos_disponibles + 1
        WHERE id_clase = OLD.id_clase;
    END IF;
END//

DELIMITER ;

-- =============================================
-- 5. EVENTOS PROGRAMADOS (Tareas de mantenimiento)
-- =============================================
DELIMITER //

-- Evento que se ejecuta semanalmente para purgar agendamientos cancelados hace más de 30 días.
CREATE EVENT purge_old_canceled_reservations
ON SCHEDULE EVERY 1 WEEK
DO
BEGIN
    DELETE FROM Agendamientos
    WHERE estado = 'Cancelado'
    AND fecha_reserva < DATE_SUB(NOW(), INTERVAL 30 DAY);
END//

DELIMITER ;

-- =============================================
-- 6. INSERCIÓN DE DATOS INICIALES (POBLACIÓN)
-- =============================================

-- Roles
INSERT INTO Roles (nombre_rol) VALUES ('Estudiante'), ('Profesor'), ('Administrador');

-- Salones
INSERT INTO Salones (nombre_salon, ubicacion, aforo, equipamiento) VALUES
('S201', 'Edificio Principal - Piso 2', 30, 'Proyector, Aire Acondicionado'),
('S101', 'Edificio Secundario - Piso 1', 25, 'Pizarra Interactiva'),

-- Usuarios (Contraseñas y salts son de ejemplo, deben ser generados de forma segura)
INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, salt, id_rol) VALUES
('Carlos Acosta', 'carlos.acosta@email.com', '3101112233', '1020304050', 'hash_ejemplo_1', 'salt_ejemplo_1', 1),
('Lucia Méndez', 'lucia.mendez@email.com', '3114445566', '1030405060', 'hash_ejemplo_2', 'salt_ejemplo_2', 1),
('Roberto Gómez', 'roberto.gomez@profes.com', '3127778899', '2010203040', 'hash_ejemplo_3', 'salt_ejemplo_3', 2),
('Ana Jurado', 'ana.jurado@admin.com', '3130001122', '3040506070', 'hash_ejemplo_4', 'salt_ejemplo_4', 3);
('Bryan Mora', 'bryanmora18@gmail.com', '3167303517', '1019096837', 'Daki2025*', 'salt_ejemplo_5', 3);
('Administrador', 'administrador@idrive.com', '3001112222', '99999999', 'hash_ejemplo_admin1234', 'salt_ejemplo_6', 3);

-- -----------------------------------------------------
-- Tabla `Permisos`
-- Define cada acción individual que se puede realizar en el sistema.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Permisos` (
  `id_permiso` INT NOT NULL AUTO_INCREMENT,
  `nombre_permiso` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id_permiso`),
  UNIQUE INDEX `nombre_permiso_UNIQUE` (`nombre_permiso` ASC)
)
ENGINE = InnoDB;

-- Poblar la tabla de Permisos con las acciones clave de la aplicación
INSERT INTO `Permisos` (`nombre_permiso`, `descripcion`) VALUES
('usuarios:crear', 'Permite crear nuevos usuarios'),
('usuarios:leer', 'Permite ver la lista de todos los usuarios'),
('usuarios:editar', 'Permite editar la información de cualquier usuario'),
('usuarios:eliminar', 'Permite eliminar cualquier usuario'),
('clases:crear', 'Permite programar nuevas clases'),
('clases:editar', 'Permite editar clases existentes'),
('clases:eliminar', 'Permite eliminar clases programadas'),
('agendamientos:crear:propio', 'Permite a un estudiante agendarse a una clase'),
('agendamientos:crear:cualquiera', 'Permite a un administrador agendar a cualquier estudiante'),
('agendamientos:ver:todos', 'Permite ver todos los agendamientos del sistema');


-- -----------------------------------------------------
-- Tabla `Roles_Permisos`
-- Tabla de unión que establece la relación Muchos-a-Muchos
-- entre los Roles y los Permisos.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Roles_Permisos` (
  `id_rol` INT NOT NULL,
  `id_permiso` INT NOT NULL,
  PRIMARY KEY (`id_rol`, `id_permiso`),
  INDEX `fk_Roles_Permisos_Permisos_idx` (`id_permiso` ASC),
  INDEX `fk_Roles_Permisos_Roles_idx` (`id_rol` ASC),
  CONSTRAINT `fk_Roles_Permisos_Roles`
    FOREIGN KEY (`id_rol`)
    REFERENCES `Roles` (`id_rol`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Roles_Permisos_Permisos`
    FOREIGN KEY (`id_permiso`)
    REFERENCES `Permisos` (`id_permiso`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- Asignar permisos a los roles existentes
-- Asumimos: 1=Estudiante, 2=Profesor, 3=Administrador

-- Permisos para Administrador (ID 3) - Tiene acceso a casi todo
INSERT INTO `Roles_Permisos` (`id_rol`, `id_permiso`) VALUES
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'usuarios:crear')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'usuarios:leer')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'usuarios:editar')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'usuarios:eliminar')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'clases:crear')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'clases:editar')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'clases:eliminar')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'agendamientos:crear:cualquiera')),
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'agendamientos:ver:todos'));

-- Permisos para Estudiante (ID 1) - Acciones limitadas
INSERT INTO `Roles_Permisos` (`id_rol`, `id_permiso`) VALUES
(1, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'agendamientos:crear:propio'));

-- Permisos para Profesor (ID 2) - Puede ver información relevante
INSERT INTO `Roles_Permisos` (`id_rol`, `id_permiso`) VALUES
(2, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'agendamientos:ver:todos'));

-- Nuevos permisos para las vistas de agendamiento
INSERT INTO `Permisos` (`nombre_permiso`, `descripcion`) VALUES
('mis-clases:ver', 'Permite a un estudiante ver su propia lista de clases agendadas'),
('agendamientos:ver:calendario', 'Permite a admins/profesores ver el calendario completo de agendamientos');

-- Asignar el nuevo permiso al rol de Estudiante (ID 1)
INSERT INTO `Roles_Permisos` (`id_rol`, `id_permiso`) VALUES
(1, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'mis-clases:ver'));

-- Asignar el nuevo permiso a Administrador (ID 3) y Profesor (ID 2)
INSERT INTO `Roles_Permisos` (`id_rol`, `id_permiso`) VALUES
(3, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'agendamientos:ver:calendario')),
(2, (SELECT id_permiso FROM Permisos WHERE nombre_permiso = 'agendamientos:ver:calendario'));

COMMIT;