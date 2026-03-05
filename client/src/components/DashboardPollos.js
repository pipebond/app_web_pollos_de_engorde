import React, { useCallback, useEffect, useState } from "react";
import "./DashboardPollos.css";
import { buildAuthHeaders } from "../utils/auth";

function DashboardPollos({ refreshToken = 0, usuarioActivo }) {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Estado del resumen principal que se muestra en todas las pantallas.
  const [dashboard, setDashboard] = useState({
    resumen: {
      total_registros: 0,
      total_camadas: 0,
      peso_promedio_general: 0,
    },
    ultimoRegistro: null,
  });

  const [error, setError] = useState("");

  const cargarDashboard = useCallback(async () => {
    if (!usuarioActivo?.id) {
      setDashboard({
        resumen: {
          total_registros: 0,
          total_camadas: 0,
          peso_promedio_general: 0,
        },
        ultimoRegistro: null,
      });
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/api/datos-iniciales/dashboard`,
        {
          headers: buildAuthHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible cargar el dashboard");
      }

      const data = await respuesta.json();
      setDashboard(data);
      setError("");
    } catch (e) {
      setError("No se pudo actualizar el dashboard de pollos.");
    }
  }, [API_BASE_URL, usuarioActivo]);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard, refreshToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarDashboard();
    }, 12000);

    return () => clearInterval(interval);
  }, [cargarDashboard]);

  const { resumen, ultimoRegistro } = dashboard;

  return (
    <section
      className="dashboard-pollos"
      aria-label="Dashboard global de camadas"
    >
      <div className="dashboard-grid">
        <article className="dashboard-item">
          <h3>Total registros</h3>
          <p>{resumen?.total_registros || 0}</p>
        </article>

        <article className="dashboard-item">
          <h3>Camadas activas</h3>
          <p>{resumen?.total_camadas || 0}</p>
        </article>

        <article className="dashboard-item">
          <h3>Peso promedio general</h3>
          <p>{resumen?.peso_promedio_general || 0} kg</p>
        </article>
      </div>

      <div className="dashboard-ultimo-registro">
        <h4>Ultimo registro</h4>
        {ultimoRegistro ? (
          <p>
            Camada <strong>{ultimoRegistro.nombre_camada}</strong> en galpon
            <strong> {ultimoRegistro.galpon}</strong> | Peso promedio:
            <strong> {ultimoRegistro.peso_promedio} kg</strong> | Responsable:
            <strong> {ultimoRegistro.nombre_completo}</strong>
          </p>
        ) : (
          <p>Aun no hay datos iniciales registrados.</p>
        )}
      </div>

      {error ? <p className="dashboard-error">{error}</p> : null}
    </section>
  );
}

export default DashboardPollos;
