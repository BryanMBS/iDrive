-- Creación de la base de datos
CREATE DATABASE DataBaseiDrive;
USE DataBaseiDrive;

-- Tabla de Roles
CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

INSERT INTO Roles (nombre_rol) VALUES 
('Estudiante'), 
('Profesor'), 
('Administrador');

-- Tabla de Usuarios (corregida)
CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    cedula VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- Inserts de usuarios corregidos
INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, id_rol)
VALUES 
('Juan Pérez', 'juan.perez@example.com', '1234567890', '1020451233', 'hashed_password_juan', 1),
('Ana López', 'ana.lopez@example.com', '0987654321', '10190298833', 'hashed_password_ana', 2),
('Bryan Mora', 'bryanmora18@gmail.com', '3167303517', '1019096837', 'Daki2025*', 3),
('Javier Quiroga', 'javiquiroga@gmail.com', '3156678899', '1000022345', 'Sena2025*', 3);

-- Tabla de Salones
CREATE TABLE Salones (
    id_salon INT AUTO_INCREMENT PRIMARY KEY,
    nombre_salon VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(100) NOT NULL,
    aforo INT NOT NULL
);

INSERT INTO Salones (nombre_salon, ubicacion, aforo)
VALUES 
('Salon 201', 'Piso 2', 25),
('Salon 101', 'Piso 1', 20);

-- Tabla de Clases modificada
CREATE TABLE Clases (
    id_clase INT AUTO_INCREMENT PRIMARY KEY,
    nombre_clase VARCHAR(100) NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    id_profesor INT,
    id_salon INT,
    cupos_disponibles INT NOT NULL,
    FOREIGN KEY (id_profesor) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_salon) REFERENCES Salones(id_salon)
);

-- Tabla de Estados de Agendamiento
CREATE TABLE EstadosAgendamiento (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    nombre_estado VARCHAR(20) NOT NULL
);

INSERT INTO EstadosAgendamiento (nombre_estado) 
VALUES ('Pendiente'), ('Confirmado'), ('Cancelado');

-- Tabla de Agendamientos modificada
CREATE TABLE Agendamientos (
    id_agendamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_clase INT NOT NULL,
    fecha_reserva DATETIME NOT NULL DEFAULT NOW(),
    estado INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_estudiante) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES Clases(id_clase),
    FOREIGN KEY (estado) REFERENCES EstadosAgendamiento(id_estado)
);

-- Triggers actualizados
DELIMITER //
CREATE TRIGGER before_insert_agendamiento
BEFORE INSERT ON Agendamientos
FOR EACH ROW
BEGIN
    DECLARE cupos_restantes INT;

    SELECT cupos_disponibles INTO cupos_restantes 
    FROM Clases 
    WHERE id_clase = NEW.id_clase;

    IF cupos_restantes <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No hay cupos disponibles para esta clase.';
    END IF;

    UPDATE Clases 
    SET cupos_disponibles = cupos_disponibles - 1 
    WHERE id_clase = NEW.id_clase;
END;
//
DELIMITER ;

DELIMITER //
CREATE TRIGGER after_delete_agendamiento
AFTER DELETE ON Agendamientos
FOR EACH ROW
BEGIN
    UPDATE Clases 
    SET cupos_disponibles = cupos_disponibles + 1 
    WHERE id_clase = OLD.id_clase;
END;
//
DELIMITER ;

-- Insert de ejemplo para clases (formato actualizado)
INSERT INTO Clases (nombre_clase, fecha_hora_inicio, fecha_hora_fin, id_profesor, id_salon, cupos_disponibles)
VALUES 
('Mecanica 1', '2025-03-10 09:00:00', '2025-03-10 11:00:00', 2, 1, 25),
('Normas de transito 1', '2025-03-10 11:00:00', '2025-03-10 12:00:00', 2, 2, 20);