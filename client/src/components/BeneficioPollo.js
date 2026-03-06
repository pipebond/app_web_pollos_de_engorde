import React, { useEffect, useMemo, useState } from "react";
import "./BeneficioPollo.css";
import { buildAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

function BeneficioPollo({ usuarioActivo }) {
  // Campos solicitados para registrar cada proceso de beneficio.
  const [formulario, setFormulario] = useState({
    id_camada: "",
    peso_en_vivo: "",
    peso_sacrificado: "",
    precio: "",
    cantidad_beneficiados: "",
  });

  const [camadas, setCamadas] = useState([]);
  const [beneficios, setBeneficios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargarBeneficios = async () => {
    if (!usuarioActivo?.id) {
      setBeneficios([]);
      return;
    }

    try {
      setCargando(true);
      const respuesta = await fetch(`${API_BASE_URL}/api/beneficios-pollo`, {
        headers: buildAuthHeaders(),
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible cargar beneficios");
      }

      const datos = await respuesta.json();
      setBeneficios(Array.isArray(datos) ? datos : []);
    } catch (error) {
      setMensaje("Error al cargar los beneficios del pollo.");
    } finally {
      setCargando(false);
    }
  };

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

      const datos = await respuesta.json();
      setCamadas(Array.isArray(datos) ? datos : []);
    } catch (error) {
      setMensaje("Error al cargar camadas para beneficio.");
    }
  };

  useEffect(() => {
    cargarCamadas();
    cargarBeneficios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActivo?.id]);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;

    if (name === "precio") {
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const pesoSacrificado = Number(formulario.peso_sacrificado);
    const precioCalculado =
      Number.isFinite(pesoSacrificado) && pesoSacrificado > 0
        ? Number((pesoSacrificado * 11000).toFixed(2))
        : 0;

    setFormulario((prev) => {
      const siguientePrecio =
        precioCalculado > 0 ? String(precioCalculado) : "";
      if (prev.precio === siguientePrecio) {
        return prev;
      }
      return {
        ...prev,
        precio: siguientePrecio,
      };
    });
  }, [formulario.peso_sacrificado]);

  const registrarBeneficio = async (evento) => {
    evento.preventDefault();

    if (!usuarioActivo?.id) {
      setMensaje("Debes iniciar sesion para registrar beneficios.");
      return;
    }

    if (guardando) return;

    if (
      !formulario.id_camada ||
      !formulario.peso_en_vivo ||
      !formulario.peso_sacrificado ||
      !formulario.precio ||
      !formulario.cantidad_beneficiados
    ) {
      setMensaje("Selecciona la camada y completa todos los campos del beneficio.");
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const endpoint = editandoId
        ? `${API_BASE_URL}/api/beneficios-pollo/${editandoId}`
        : `${API_BASE_URL}/api/beneficios-pollo`;

      const respuesta = await fetch(endpoint, {
        method: editandoId ? "PUT" : "POST",
        headers: buildAuthHeaders({ withJson: true }),
        body: JSON.stringify({
          id_camada: Number(formulario.id_camada),
          peso_en_vivo: Number(formulario.peso_en_vivo),
          peso_sacrificado: Number(formulario.peso_sacrificado),
          precio: Number(formulario.precio),
          cantidad_beneficiados: Number(formulario.cantidad_beneficiados),
        }),
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible registrar el beneficio");
      }

      setFormulario({
        id_camada: "",
        peso_en_vivo: "",
        peso_sacrificado: "",
        precio: "",
        cantidad_beneficiados: "",
      });
      setEditandoId(null);
      setMensaje(
        editandoId
          ? "Beneficio actualizado correctamente."
          : "Beneficio registrado correctamente.",
      );
      await cargarBeneficios();
    } catch (error) {
      setMensaje(
        editandoId
          ? "Error al actualizar el beneficio del pollo."
          : "Error al registrar el beneficio del pollo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (item) => {
    setEditandoId(item.id_beneficio);
    setFormulario({
      id_camada: String(item.id_camada || ""),
      peso_en_vivo: String(item.peso_en_vivo),
      peso_sacrificado: String(item.peso_sacrificado),
      precio: String(item.precio),
      cantidad_beneficiados: String(item.cantidad_beneficiados),
    });
    setMensaje("Editando registro seleccionado.");
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario({
      id_camada: "",
      peso_en_vivo: "",
      peso_sacrificado: "",
      precio: "",
      cantidad_beneficiados: "",
    });
    setMensaje("Edicion cancelada.");
  };

  const eliminarBeneficio = async (idBeneficio) => {
    if (!usuarioActivo?.id || !idBeneficio) {
      return;
    }

    const confirmar = window.confirm(
      "Seguro que deseas eliminar este registro de beneficio?",
    );
    if (!confirmar) return;

    try {
      const respuesta = await fetch(
        `${API_BASE_URL}/api/beneficios-pollo/${idBeneficio}`,
        {
          method: "DELETE",
          headers: buildAuthHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No fue posible eliminar el beneficio");
      }

      if (editandoId === idBeneficio) {
        cancelarEdicion();
      }

      setMensaje("Beneficio eliminado correctamente.");
      await cargarBeneficios();
    } catch (error) {
      setMensaje("Error al eliminar el beneficio del pollo.");
    }
  };

  const resumen = useMemo(() => {
    if (!beneficios.length) {
      return {
        totalRegistros: 0,
        totalCantidad: 0,
        totalPesoVivo: 0,
        totalPesoSacrificado: 0,
        totalIngreso: 0,
        rendimiento: 0,
      };
    }

    const acumulado = beneficios.reduce(
      (acc, item) => {
        const pesoVivo = Number(item.peso_en_vivo) || 0;
        const pesoSacrificado = Number(item.peso_sacrificado) || 0;
        const precio = Number(item.precio) || 0;
        const cantidad = Number(item.cantidad_beneficiados) || 0;

        return {
          totalCantidad: acc.totalCantidad + cantidad,
          totalPesoVivo: acc.totalPesoVivo + pesoVivo,
          totalPesoSacrificado: acc.totalPesoSacrificado + pesoSacrificado,
          totalIngreso: acc.totalIngreso + precio,
        };
      },
      {
        totalCantidad: 0,
        totalPesoVivo: 0,
        totalPesoSacrificado: 0,
        totalIngreso: 0,
      },
    );

    const rendimiento =
      acumulado.totalPesoVivo > 0
        ? (acumulado.totalPesoSacrificado / acumulado.totalPesoVivo) * 100
        : 0;

    return {
      totalRegistros: beneficios.length,
      ...acumulado,
      rendimiento,
    };
  }, [beneficios]);

  return (
    <section className="beneficio-bloque" aria-label="Beneficio del pollo">
      <header className="beneficio-cabecera">
        <p className="beneficio-etiqueta">Produccion</p>
        <h3>Beneficio del pollo</h3>
        <p>
          Registra pesos, precio y cantidad beneficiada para llevar control por
          usuario.
        </p>
      </header>

      <form className="beneficio-formulario" onSubmit={registrarBeneficio}>
        <label htmlFor="id_camada">Camada</label>
        <select
          id="id_camada"
          name="id_camada"
          value={formulario.id_camada}
          onChange={manejarCambio}
          disabled={camadas.length === 0}
        >
          <option value="">Selecciona una camada</option>
          {camadas.map((camada) => (
            <option key={camada.id_camada} value={String(camada.id_camada)}>
              {camada.nombre_camada}
            </option>
          ))}
        </select>

        <label htmlFor="peso_en_vivo">Peso en vivo (kg)</label>
        <input
          id="peso_en_vivo"
          name="peso_en_vivo"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formulario.peso_en_vivo}
          onChange={manejarCambio}
        />

        <label htmlFor="peso_sacrificado">Peso sacrificado (kg)</label>
        <input
          id="peso_sacrificado"
          name="peso_sacrificado"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formulario.peso_sacrificado}
          onChange={manejarCambio}
        />

        <label htmlFor="precio">Precio total</label>
        <input
          id="precio"
          name="precio"
          type="number"
          step="0.01"
          min="0"
          placeholder="Se calcula automaticamente"
          value={formulario.precio}
          onChange={manejarCambio}
          readOnly
        />

        <label htmlFor="cantidad_beneficiados">Cantidad beneficiados</label>
        <input
          id="cantidad_beneficiados"
          name="cantidad_beneficiados"
          type="number"
          step="1"
          min="1"
          placeholder="0"
          value={formulario.cantidad_beneficiados}
          onChange={manejarCambio}
        />

        <button type="submit" className="beneficio-btn-principal">
          {guardando
            ? "Guardando..."
            : editandoId
              ? "Actualizar beneficio"
              : "Registrar beneficio"}
        </button>

        {editandoId ? (
          <button
            type="button"
            className="beneficio-btn-secundario"
            onClick={cancelarEdicion}
          >
            Cancelar edicion
          </button>
        ) : null}
      </form>

      {mensaje ? <p className="beneficio-mensaje">{mensaje}</p> : null}

      <div className="beneficio-listado">
        <div className="beneficio-resumen-grid">
          <article className="beneficio-resumen-item">
            <h5>Registros</h5>
            <p>{resumen.totalRegistros}</p>
          </article>
          <article className="beneficio-resumen-item">
            <h5>Cantidad beneficiada</h5>
            <p>{resumen.totalCantidad}</p>
          </article>
          <article className="beneficio-resumen-item">
            <h5>Peso vivo total</h5>
            <p>{resumen.totalPesoVivo.toFixed(2)} kg</p>
          </article>
          <article className="beneficio-resumen-item">
            <h5>Peso sacrificado total</h5>
            <p>{resumen.totalPesoSacrificado.toFixed(2)} kg</p>
          </article>
          <article className="beneficio-resumen-item">
            <h5>Ingreso total</h5>
            <p>${resumen.totalIngreso.toFixed(2)}</p>
          </article>
          <article className="beneficio-resumen-item">
            <h5>Rendimiento</h5>
            <p>{resumen.rendimiento.toFixed(2)}%</p>
          </article>
        </div>

        <h4>Historial del usuario</h4>
        {cargando ? <p>Cargando beneficios...</p> : null}

        {!cargando && beneficios.length === 0 ? (
          <p>No hay registros de beneficio para este usuario.</p>
        ) : null}

        {!cargando && beneficios.length > 0 ? (
          <div className="beneficio-tabla-contenedor">
            <table className="beneficio-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Camada</th>
                  <th>Peso en vivo</th>
                  <th>Peso sacrificado</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {beneficios.map((item) => (
                  <tr key={item.id_beneficio}>
                    <td>{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>{item.nombre_camada || "Sin camada"}</td>
                    <td>{Number(item.peso_en_vivo).toFixed(2)} kg</td>
                    <td>{Number(item.peso_sacrificado).toFixed(2)} kg</td>
                    <td>${Number(item.precio).toFixed(2)}</td>
                    <td>{item.cantidad_beneficiados}</td>
                    <td>
                      <div className="beneficio-tabla-acciones">
                        <button
                          type="button"
                          className="beneficio-tabla-btn"
                          onClick={() => iniciarEdicion(item)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="beneficio-tabla-btn beneficio-tabla-btn-eliminar"
                          onClick={() => eliminarBeneficio(item.id_beneficio)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default BeneficioPollo;
