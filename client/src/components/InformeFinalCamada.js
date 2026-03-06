import React, { useEffect, useMemo, useState } from "react";
import "./InformeFinalCamada.css";
import { buildAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

function InformeFinalCamada({ usuarioActivo, onAgregarNuevaCamada }) {
  const [camadas, setCamadas] = useState([]);
  const [filtroCamadas, setFiltroCamadas] = useState("");
  const [idCamadaSeleccionada, setIdCamadaSeleccionada] = useState("");
  const [preview, setPreview] = useState(null);
  const [observaciones, setObservaciones] = useState("");
  const [informes, setInformes] = useState([]);
  const [idComparacionA, setIdComparacionA] = useState("");
  const [idComparacionB, setIdComparacionB] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarCamadas = async () => {
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
        throw new Error("No fue posible cargar camadas");
      }

      const data = await respuesta.json();
      const lista = Array.isArray(data) ? data : [];
      setCamadas(lista);

      if (!idCamadaSeleccionada && lista.length > 0) {
        setIdCamadaSeleccionada(String(lista[0].id_camada));
      }
    } catch (error) {
      setMensaje("No se pudo cargar la lista de camadas.");
    }
  };

  const cargarInformes = async () => {
    if (!usuarioActivo?.id) {
      setInformes([]);
      return;
    }

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/api/informes-finales-camada`,
        {
          headers: buildAuthHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible cargar informes");
      }

      const data = await respuesta.json();
      const lista = Array.isArray(data) ? data : [];
      setInformes(lista);

      if (lista.length >= 2 && (!idComparacionA || !idComparacionB)) {
        setIdComparacionA(String(lista[0].id_informe));
        setIdComparacionB(String(lista[1].id_informe));
      }
    } catch (error) {
      setMensaje("No se pudo cargar el historial de informes finales.");
    }
  };

  useEffect(() => {
    cargarCamadas();
    cargarInformes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActivo?.id]);

  const generarPreview = async () => {
    if (!usuarioActivo?.id || !idCamadaSeleccionada) {
      setMensaje("Selecciona una camada para generar el informe final.");
      return;
    }

    try {
      setCargando(true);
      setMensaje("");
      const respuesta = await fetch(
        `${API_BASE_URL}/api/informes-finales-camada/preview/${idCamadaSeleccionada}`,
        {
          headers: buildAuthHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible generar informe previo");
      }

      const data = await respuesta.json();
      setPreview(data);
      setMensaje("Informe previo generado. Puedes guardarlo en base de datos.");
    } catch (error) {
      setMensaje("Error generando el informe final de camada.");
    } finally {
      setCargando(false);
    }
  };

  const guardarInforme = async () => {
    if (!usuarioActivo?.id || !preview?.id_camada) {
      setMensaje("Primero genera el informe antes de guardar.");
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await fetch(
        `${API_BASE_URL}/api/informes-finales-camada`,
        {
          method: "POST",
          headers: buildAuthHeaders({ withJson: true }),
          body: JSON.stringify({
            id_camada: Number(preview.id_camada),
            observaciones,
          }),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible guardar el informe");
      }

      setMensaje("Informe final guardado correctamente.");
      await cargarInformes();
    } catch (error) {
      setMensaje("Error guardando el informe final.");
    } finally {
      setCargando(false);
    }
  };

  const eliminarInforme = async (idInforme) => {
    if (!usuarioActivo?.id) return;

    const confirmar = window.confirm(
      "Seguro que deseas eliminar este informe final guardado?",
    );
    if (!confirmar) return;

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/api/informes-finales-camada/${idInforme}`,
        {
          method: "DELETE",
          headers: buildAuthHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible eliminar el informe");
      }

      setMensaje("Informe eliminado correctamente.");
      await cargarInformes();
    } catch (error) {
      setMensaje("Error eliminando el informe final.");
    }
  };

  const cantidadCamadasEnInformes = useMemo(() => {
    const setCamadas = new Set(informes.map((i) => Number(i.id_camada)));
    return setCamadas.size;
  }, [informes]);

  const camadasFiltradas = useMemo(() => {
    const criterio = String(filtroCamadas || "")
      .trim()
      .toLowerCase();
    if (!criterio) return camadas;

    return camadas.filter((camada) => {
      const nombre = String(camada.nombre_camada || "").toLowerCase();
      const fecha = String(camada.fecha_llegada || "")
        .slice(0, 10)
        .toLowerCase();
      return nombre.includes(criterio) || fecha.includes(criterio);
    });
  }, [camadas, filtroCamadas]);

  const comparacion = useMemo(() => {
    if (
      !idComparacionA ||
      !idComparacionB ||
      idComparacionA === idComparacionB
    ) {
      return null;
    }

    const informeA = informes.find(
      (i) => String(i.id_informe) === String(idComparacionA),
    );
    const informeB = informes.find(
      (i) => String(i.id_informe) === String(idComparacionB),
    );

    if (!informeA || !informeB) return null;

    const delta = (a, b) => Number((b - a).toFixed(2));

    return {
      informeA,
      informeB,
      cambios: [
        {
          etiqueta: "Aves finales",
          valorA: Number(informeA.aves_finales || 0),
          valorB: Number(informeB.aves_finales || 0),
          diferencia: delta(
            Number(informeA.aves_finales || 0),
            Number(informeB.aves_finales || 0),
          ),
        },
        {
          etiqueta: "Mortalidad total",
          valorA: Number(informeA.mortalidad_total || 0),
          valorB: Number(informeB.mortalidad_total || 0),
          diferencia: delta(
            Number(informeA.mortalidad_total || 0),
            Number(informeB.mortalidad_total || 0),
          ),
        },
        {
          etiqueta: "Peso final (kg)",
          valorA: Number(informeA.peso_final || 0),
          valorB: Number(informeB.peso_final || 0),
          diferencia: delta(
            Number(informeA.peso_final || 0),
            Number(informeB.peso_final || 0),
          ),
        },
        {
          etiqueta: "Consumo total alimento (kg)",
          valorA: Number(informeA.consumo_total_alimento || 0),
          valorB: Number(informeB.consumo_total_alimento || 0),
          diferencia: delta(
            Number(informeA.consumo_total_alimento || 0),
            Number(informeB.consumo_total_alimento || 0),
          ),
        },
        {
          etiqueta: "Indice de conversion",
          valorA: Number(informeA.indice_conversion || 0),
          valorB: Number(informeB.indice_conversion || 0),
          diferencia: delta(
            Number(informeA.indice_conversion || 0),
            Number(informeB.indice_conversion || 0),
          ),
        },
      ],
    };
  }, [idComparacionA, idComparacionB, informes]);

  return (
    <section
      className="informe-final-bloque"
      aria-label="Informe final de camada"
    >
      <header className="informe-final-cabecera">
        <p className="informe-final-etiqueta">Informe cierre</p>
        <h3>Informe final de camada</h3>
        <p>
          Consolida los datos del dashboard de la camada, guarda el informe
          final, eliminalo si lo necesitas y comparalo desde la segunda camada.
        </p>
      </header>

      <div className="informe-final-acciones-superiores">
        <label htmlFor="buscador_camadas">
          Buscar camada por nombre o fecha
        </label>
        <input
          id="buscador_camadas"
          type="text"
          placeholder="Ejemplo: marzo o 2026-03"
          value={filtroCamadas}
          onChange={(e) => setFiltroCamadas(e.target.value)}
        />

        <label htmlFor="camada_informe">Camada a cerrar</label>
        <select
          id="camada_informe"
          value={idCamadaSeleccionada}
          onChange={(e) => setIdCamadaSeleccionada(e.target.value)}
        >
          <option value="">Selecciona una camada</option>
          {camadasFiltradas.map((camada) => (
            <option key={camada.id_camada} value={String(camada.id_camada)}>
              {camada.nombre_camada} - Galpon {camada.galpon || "N/A"}
            </option>
          ))}
        </select>

        {camadasFiltradas.length === 0 ? (
          <p>No hay camadas que coincidan con la busqueda.</p>
        ) : null}

        <div className="informe-final-botones-superiores">
          <button
            type="button"
            className="informe-final-btn"
            onClick={generarPreview}
          >
            {cargando ? "Procesando..." : "Generar informe previo"}
          </button>

          <button
            type="button"
            className="informe-final-btn informe-final-btn-secundario"
            onClick={() => {
              if (onAgregarNuevaCamada) {
                onAgregarNuevaCamada();
              }
            }}
          >
            Agregar nueva camada
          </button>
        </div>
      </div>

      {preview ? (
        <div className="informe-final-preview">
          <h4>Vista previa del informe final</h4>
          <div className="informe-final-grid">
            <article>
              <strong>Camada:</strong> {preview.nombre_camada}
            </article>
            <article>
              <strong>Galpon:</strong> {preview.galpon || "N/A"}
            </article>
            <article>
              <strong>Fecha llegada:</strong> {preview.fecha_llegada || "N/A"}
            </article>
            <article>
              <strong>Fecha cierre:</strong> {preview.fecha_cierre || "N/A"}
            </article>
            <article>
              <strong>Total dias:</strong> {preview.total_dias}
            </article>
            <article>
              <strong>Registros diarios:</strong>{" "}
              {preview.total_registros_diarios}
            </article>
            <article>
              <strong>Aves iniciales:</strong> {preview.aves_iniciales}
            </article>
            <article>
              <strong>Aves finales:</strong> {preview.aves_finales}
            </article>
            <article>
              <strong>Mortalidad total:</strong> {preview.mortalidad_total}
            </article>
            <article>
              <strong>Peso inicial:</strong> {preview.peso_inicial} kg
            </article>
            <article>
              <strong>Peso final:</strong> {preview.peso_final} kg
            </article>
            <article>
              <strong>Ganancia de peso:</strong> {preview.ganancia_peso} kg
            </article>
            <article>
              <strong>Consumo total:</strong> {preview.consumo_total_alimento}{" "}
              kg
            </article>
            <article>
              <strong>Indice conversion:</strong> {preview.indice_conversion}
            </article>
          </div>

          <label htmlFor="observaciones_informe">
            Observaciones del cierre
          </label>
          <textarea
            id="observaciones_informe"
            rows="3"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones finales de la camada"
          />

          <button
            type="button"
            className="informe-final-btn"
            onClick={guardarInforme}
          >
            Guardar
          </button>
        </div>
      ) : null}

      <section className="informe-final-historial">
        <h4>Informes finales guardados</h4>
        {informes.length === 0 ? (
          <p>No hay informes finales guardados para este usuario.</p>
        ) : (
          <div className="informe-final-tabla-scroll">
            <table className="informe-final-tabla">
              <thead>
                <tr>
                  <th>Fecha guardado</th>
                  <th>Camada</th>
                  <th>Peso final</th>
                  <th>Mortalidad</th>
                  <th>Indice conv.</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {informes.map((informe) => (
                  <tr key={informe.id_informe}>
                    <td>
                      {new Date(informe.created_at).toLocaleString("es-CO")}
                    </td>
                    <td>{informe.nombre_camada}</td>
                    <td>{Number(informe.peso_final).toFixed(2)} kg</td>
                    <td>{informe.mortalidad_total}</td>
                    <td>{Number(informe.indice_conversion).toFixed(4)}</td>
                    <td>
                      <button
                        type="button"
                        className="informe-final-btn-eliminar"
                        onClick={() => eliminarInforme(informe.id_informe)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="informe-final-comparacion">
        <h4>Comparar informes</h4>
        {cantidadCamadasEnInformes < 2 ? (
          <p>
            La comparacion se habilita a partir de la segunda camada guardada.
          </p>
        ) : (
          <>
            <div className="informe-final-comparacion-selectores">
              <select
                value={idComparacionA}
                onChange={(e) => setIdComparacionA(e.target.value)}
              >
                <option value="">Informe A</option>
                {informes.map((informe) => (
                  <option
                    key={`a-${informe.id_informe}`}
                    value={String(informe.id_informe)}
                  >
                    {informe.nombre_camada} (
                    {new Date(informe.created_at).toLocaleDateString("es-CO")})
                  </option>
                ))}
              </select>

              <select
                value={idComparacionB}
                onChange={(e) => setIdComparacionB(e.target.value)}
              >
                <option value="">Informe B</option>
                {informes.map((informe) => (
                  <option
                    key={`b-${informe.id_informe}`}
                    value={String(informe.id_informe)}
                  >
                    {informe.nombre_camada} (
                    {new Date(informe.created_at).toLocaleDateString("es-CO")})
                  </option>
                ))}
              </select>
            </div>

            {comparacion ? (
              <div className="informe-final-comparacion-tabla">
                <p>
                  Comparando{" "}
                  <strong>{comparacion.informeA.nombre_camada}</strong> vs{" "}
                  <strong>{comparacion.informeB.nombre_camada}</strong>
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Informe A</th>
                      <th>Informe B</th>
                      <th>Diferencia (B - A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparacion.cambios.map((fila) => (
                      <tr key={fila.etiqueta}>
                        <td>{fila.etiqueta}</td>
                        <td>{fila.valorA}</td>
                        <td>{fila.valorB}</td>
                        <td>{fila.diferencia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Selecciona dos informes diferentes para comparar.</p>
            )}
          </>
        )}
      </section>

      {mensaje ? <p className="informe-final-mensaje">{mensaje}</p> : null}
    </section>
  );
}

export default InformeFinalCamada;
