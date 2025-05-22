CREATE DATABASE DataBaseiDrive;

CREATE TABLE Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

INSERT INTO Roles (nombre_rol) VALUES ('Estudiante'), ('Profesor'), ('Administrador');

CREATE TABLE Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    cedula VARCHAR(20) UNIQUE NOT NULL, -- Ahora es un campo único y obligatorio
    password_hash VARCHAR(255) NOT NULL, -- Almacena la contraseña hasheada
    id_rol INT,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol)
);

-- Insertar usuarios con contraseñas (En la aplicación deben ser hasheadas antes de insertarlas)
INSERT INTO Usuarios (nombre, correo_electronico, telefono, cedula, password_hash, id_rol)
VALUES 
('Juan Pérez', 'juan.perez@example.com', '1234567890', '1020451233','hashed_password_juan', 1), -- Estudiante
('Ana López', 'ana.lopez@example.com', '0987654321', '10190298833', 'hashed_password_ana', 2),  -- Profesor
('Bryan Mora', 'bryanmora18@gmail.com', '3167303517', '1019096837', 'Daki2025*', 3), -- Administrador
('Javier Quiroga', 'javiquiroga@gmail.com', '3156678899', '1000022345', 'Sena2025*', 3); -- Administrador

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

CREATE TABLE Clases (
    id_clase INT AUTO_INCREMENT PRIMARY KEY,
    nombre_clase VARCHAR(100) NOT NULL,
    fecha_hora DATETIME NOT NULL,
    id_profesor INT,
    id_salon INT,
    cupos_disponibles INT NOT NULL,
    FOREIGN KEY (id_profesor) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_salon) REFERENCES Salones(id_salon)
);

INSERT INTO Clases (nombre_clase, fecha_hora, id_profesor, id_salon, cupos_disponibles)
VALUES 
('Mecanica 1', '2025-03-10 09:00:00', 2, 1, 25),
('Normas de transito 1', '2025-03-10 11:00:00', 2, 2, 20);

CREATE TABLE Agendamientos (
    id_agendamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT NOT NULL,
    id_clase INT NOT NULL,
    fecha_reserva DATETIME NOT NULL DEFAULT NOW(),
    estado ENUM('Pendiente', 'Confirmado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    FOREIGN KEY (id_estudiante) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES Clases(id_clase)
);

DELIMITER //
CREATE TRIGGER before_insert_agendamiento
BEFORE INSERT ON Agendamientos
FOR EACH ROW
BEGIN
    DECLARE cupos_restantes INT;

    -- Obtener los cupos disponibles de la clase
    SELECT cupos_disponibles INTO cupos_restantes 
    FROM Clases 
    WHERE id_clase = NEW.id_clase;

    -- Verificar si hay cupos
    IF cupos_restantes <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No hay cupos disponibles para esta clase.';
    END IF;

    -- Reducir en 1 el número de cupos disponibles
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
    -- Aumentar en 1 los cupos disponibles
    UPDATE Clases 
    SET cupos_disponibles = cupos_disponibles + 1 
    WHERE id_clase = OLD.id_clase;
END;
//
DELIMITER ;

-- Crear la tabla de Inscripciones
CREATE TABLE Inscripciones (
    id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
    id_estudiante INT,
    id_clase INT,
    FOREIGN KEY (id_estudiante) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_clase) REFERENCES Clases(id_clase)
);
