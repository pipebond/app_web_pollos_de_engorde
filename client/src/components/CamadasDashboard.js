import React, { useCallback, useEffect, useState } from "react";
import "./CamadasDashboard.css";
import { buildAuthHeaders } from "../utils/auth";

function CamadasDashboard({ usuarioActivo }) {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  const [camadas, setCamadas] = useState([]);
  const [camadaSeleccionada, setCamadaSeleccionada] = useState("");
  const [seguimientos, setSeguimientos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);

  const camadaActiva = camadas.find(
    (camada) => String(camada.id_camada) === String(camadaSeleccionada),
  );

  // Formulario de seguimiento diario editable para crear o actualizar.
  const [formulario, setFormulario] = useState({
    fecha_registro: "",
    cantidad_aves: "",
    mortalidad: "0",
    peso_promedio: "",
    consumo_alimento_kg: "0",
    observaciones: "",
  });

  const cargarCamadas = useCallback(async () => {
    if (!usuarioActivo?.id) {
      setCamadas([]);
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/api/datos-iniciales/camadas-dashboard`,
        {
          headers: buildAuthHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible consultar camadas");
      }

      const data = await respuesta.json();
      setCamadas(Array.isArray(data) ? data : []);

      if (!camadaSeleccionada && Array.isArray(data) && data.length > 0) {
        setCamadaSeleccionada(String(data[0].id_camada));
      }
    } catch (error) {
      setMensaje("No se pudo cargar el dashboard de camadas.");
    }
  }, [API_BASE_URL, camadaSeleccionada, usuarioActivo]);

  const cargarSeguimientos = useCallback(
    async (idCamada) => {
      if (!usuarioActivo?.id) {
        setSeguimientos([]);
        return;
      }

      if (!idCamada) {
        setSeguimientos([]);
        return;
      }

      try {
        setCargando(true);
        const respuesta = await fetch(
          `${API_BASE_URL}/api/datos-iniciales/camadas/${idCamada}/seguimientos`,
          {
            headers: buildAuthHeaders(),
          },
        );

        if (!respuesta.ok) {
          throw new Error("No fue posible consultar seguimientos");
        }

        const data = await respuesta.json();
        setSeguimientos(Array.isArray(data) ? data : []);
      } catch (error) {
        setMensaje("No se pudo cargar el historial diario de la camada.");
      } finally {
        setCargando(false);
      }
    },
    [API_BASE_URL, usuarioActivo],
  );

  useEffect(() => {
    cargarCamadas();
  }, [cargarCamadas]);

  useEffect(() => {
    cargarSeguimientos(camadaSeleccionada);
  }, [camadaSeleccionada, cargarSeguimientos]);

  const manejarCambioFormulario = (evento) => {
    const { name, value } = evento.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      fecha_registro: "",
      cantidad_aves: "",
      mortalidad: "0",
      peso_promedio: "",
      consumo_alimento_kg: "0",
      observaciones: "",
    });
    setEditandoId(null);
  };

  const guardarSeguimiento = async (evento) => {
    evento.preventDefault();
    setMensaje("");

    if (!camadaSeleccionada) {
      setMensaje("Selecciona una camada para registrar seguimiento diario.");
      return;
    }

    if (
      !formulario.fecha_registro ||
      !formulario.cantidad_aves ||
      !formulario.peso_promedio
    ) {
      setMensaje("Debes completar fecha, cantidad de aves y peso promedio.");
      return;
    }

    const payload = {
      fecha_registro: formulario.fecha_registro,
      cantidad_aves: Number(formulario.cantidad_aves),
      mortalidad: Number(formulario.mortalidad || 0),
      peso_promedio: Number(formulario.peso_promedio),
      consumo_alimento_kg: Number(formulario.consumo_alimento_kg || 0),
      observaciones: formulario.observaciones,
    };

    try {
      const url = editandoId
        ? `${API_BASE_URL}/api/datos-iniciales/seguimientos/${editandoId}`
        : `${API_BASE_URL}/api/datos-iniciales/camadas/${camadaSeleccionada}/seguimientos`;

      const method = editandoId ? "PUT" : "POST";

      const respuesta = await fetch(url, {
        method,
        headers: buildAuthHeaders({ withJson: true }),
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible guardar el seguimiento");
      }

      setMensaje(
        editandoId
          ? "Seguimiento diario actualizado correctamente."
          : "Seguimiento diario registrado correctamente.",
      );

      limpiarFormulario();
      await Promise.all([
        cargarCamadas(),
        cargarSeguimientos(camadaSeleccionada),
      ]);
    } catch (error) {
      setMensaje("Error guardando seguimiento diario.");
    }
  };

  const iniciarEdicion = (seguimiento) => {
    setEditandoId(seguimiento.id_seguimiento);
    setFormulario({
      fecha_registro: String(seguimiento.fecha_registro).slice(0, 10),
      cantidad_aves: String(seguimiento.cantidad_aves),
      mortalidad: String(seguimiento.mortalidad ?? 0),
      peso_promedio: String(seguimiento.peso_promedio),
      consumo_alimento_kg: String(seguimiento.consumo_alimento_kg ?? 0),
      observaciones: seguimiento.observaciones || "",
    });
  };

  return (
    <section
      className="camadas-dashboard"
      aria-label="Dashboard de todas las camadas"
    >
      <header className="camadas-dashboard-cabecera">
        <h3>Dashboard de camadas cultivadas</h3>
        <p>Consulta todas tus camadas y registra/actualiza datos diarios.</p>
        <div className="camadas-seleccion-actual" aria-live="polite">
          <span className="camadas-seleccion-etiqueta">Camada seleccionada</span>
          <strong>
            {camadaActiva?.nombre_camada ||
              "Selecciona una camada para continuar"}
          </strong>
        </div>
      </header>

      <div className="camadas-grid">
        {camadas.length === 0 ? (
          <p className="camadas-vacio">Aun no hay camadas registradas.</p>
        ) : (
          camadas.map((camada) => (
            <article
              key={camada.id_camada}
              className={`camada-card ${
                String(camada.id_camada) === String(camadaSeleccionada)
                  ? "camada-card-activa"
                  : ""
              }`}
            >
              <button
                type="button"
                className="camada-select-btn"
                onClick={() => setCamadaSeleccionada(String(camada.id_camada))}
              >
                <strong>{camada.nombre_camada}</strong>
                <span>Galpon: {camada.galpon || "N/A"}</span>
                <span>Peso inicial: {camada.peso_inicial || 0} kg</span>
                <span>
                  Registros diarios: {camada.total_registros_diarios || 0}
                </span>
                <span>
                  Ultimo peso diario:{" "}
                  {camada.ultimo_peso_promedio || "Sin datos"}
                </span>
              </button>
            </article>
          ))
        )}
      </div>

      <form className="seguimiento-form" onSubmit={guardarSeguimiento}>
        <h4>
          {editandoId
            ? "Actualizar seguimiento diario"
            : "Agregar seguimiento diario"}
        </h4>

        <label htmlFor="camada_formulario">Nombre de la camada</label>
        <select
          id="camada_formulario"
          value={camadaSeleccionada}
          onChange={(e) => setCamadaSeleccionada(e.target.value)}
          disabled={camadas.length === 0 || editandoId !== null}
        >
          <option value="">Selecciona una camada</option>
          {camadas.map((camada) => (
            <option key={camada.id_camada} value={String(camada.id_camada)}>
              {camada.nombre_camada}
            </option>
          ))}
        </select>

        <label htmlFor="fecha_registro">Fecha</label>
        <input
          id="fecha_registro"
          name="fecha_registro"
          type="date"
          value={formulario.fecha_registro}
          onChange={manejarCambioFormulario}
        />

        <label htmlFor="cantidad_aves">Cantidad de aves</label>
        <input
          id="cantidad_aves"
          name="cantidad_aves"
          type="number"
          min="0"
          value={formulario.cantidad_aves}
          onChange={manejarCambioFormulario}
        />

        <label htmlFor="mortalidad">Mortalidad</label>
        <input
          id="mortalidad"
          name="mortalidad"
          type="number"
          min="0"
          value={formulario.mortalidad}
          onChange={manejarCambioFormulario}
        />

        <label htmlFor="peso_promedio">Peso promedio (kg)</label>
        <input
          id="peso_promedio"
          name="peso_promedio"
          type="number"
          step="0.01"
          min="0"
          value={formulario.peso_promedio}
          onChange={manejarCambioFormulario}
        />

        <label htmlFor="consumo_alimento_kg">Consumo alimento (kg)</label>
        <input
          id="consumo_alimento_kg"
          name="consumo_alimento_kg"
          type="number"
          step="0.01"
          min="0"
          value={formulario.consumo_alimento_kg}
          onChange={manejarCambioFormulario}
        />

        <label htmlFor="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows="3"
          value={formulario.observaciones}
          onChange={manejarCambioFormulario}
        />

        <div className="seguimiento-form-acciones">
          <button type="submit" className="seguimiento-btn-principal">
            {editandoId ? "Actualizar" : "Guardar"}
          </button>

          {editandoId ? (
            <button
              type="button"
              className="seguimiento-btn-secundario"
              onClick={limpiarFormulario}
            >
              Cancelar edicion
            </button>
          ) : null}
        </div>
      </form>

      <section className="seguimiento-historial">
        <h4>Historial diario de la camada seleccionada</h4>

        {cargando ? (
          <p>Cargando historial...</p>
        ) : seguimientos.length === 0 ? (
          <p>No hay seguimientos diarios registrados para esta camada.</p>
        ) : (
          <div className="seguimiento-tabla-scroll">
            <table className="seguimiento-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Aves</th>
                  <th>Mortalidad</th>
                  <th>Peso (kg)</th>
                  <th>Alimento (kg)</th>
                  <th>Observaciones</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {seguimientos.map((fila) => (
                  <tr key={fila.id_seguimiento}>
                    <td>{String(fila.fecha_registro).slice(0, 10)}</td>
                    <td>{fila.cantidad_aves}</td>
                    <td>{fila.mortalidad}</td>
                    <td>{fila.peso_promedio}</td>
                    <td>{fila.consumo_alimento_kg}</td>
                    <td>{fila.observaciones || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="seguimiento-editar-btn"
                        onClick={() => iniciarEdicion(fila)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mensaje ? <p className="seguimiento-mensaje">{mensaje}</p> : null}
    </section>
  );
}

export default CamadasDashboard;
