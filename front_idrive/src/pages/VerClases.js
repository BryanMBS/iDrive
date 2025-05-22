import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VerClases.css";
import Sidebar from "../components/Sidebar"; // Asegúrate de que la ruta sea correcta

const VerClases = () => {
    const [clases, setClases] = useState([]);

    useEffect(() => {
        const fetchClases = async () => {
            try {
                const response = await axios.get("http://localhost:3000/Clases");
                setClases(response.data);  // Aquí actualizas el estado con la respuesta de la API
            } catch (error) {
                console.error("Error al obtener las clases:", error);
            }
        };

        fetchClases();
    }, []);

    return (
        <div className="clases-container">
            <h2>Clases Agendadas</h2>
            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Clase</th>
                        <th>Fecha y Hora</th>
                        <th>ID Profesor</th>
                        <th>ID Salón</th>
                    </tr>
                </thead>
                <tbody>
                    {clases.map((clase) => (
                        <tr key={clase.id_clase}>
                            <td>{clase.id_clase}</td>
                            <td>{clase.nombre_clase}</td>
                            <td>{clase.fecha_hora}</td>
                            <td>{clase.id_profesor}</td>
                            <td>{clase.id_salon}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
        </div>
        
    );
};

export default VerClases;
