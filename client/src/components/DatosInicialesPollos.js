import React, { useEffect, useState } from "react";
import "./DatosInicialesPollos.css";
import DashboardPollos from "./DashboardPollos";
import CamadasDashboard from "./CamadasDashboard";
import BeneficioPollo from "./BeneficioPollo";
import InformeFinalCamada from "./InformeFinalCamada";
import { buildAuthHeaders } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

function DatosInicialesPollos({ usuarioActivo, onCerrarSesion }) {
  // Formulario principal para registrar datos de una camada.
  const [formulario, setFormulario] = useState({
    nombre_camada: "",
    fecha_llegada: "",
    peso_promedio: "",
    galpon: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrarDashboard, setMostrarDashboard] = useState(false);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);
  const [paginaActiva, setPaginaActiva] = useState("datos");
  const [mostrarConfirmacionSalida, setMostrarConfirmacionSalida] =
    useState(false);

  useEffect(() => {
    if (!usuarioActivo?.id) {
      setMensaje("Debes iniciar sesion para ver y registrar tu produccion.");
    }
  }, [usuarioActivo]);

  // Permite cerrar el modal de confirmacion con la tecla Esc.
  useEffect(() => {
    if (!mostrarConfirmacionSalida) return;

    const manejarTecla = (evento) => {
      if (evento.key === "Escape") {
        setMostrarConfirmacionSalida(false);
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [mostrarConfirmacionSalida]);

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const registrarDatosIniciales = async (evento) => {
    evento.preventDefault();

    if (enviando) return;

    if (!usuarioActivo?.id) {
      setMensaje("Debes iniciar sesion para registrar datos iniciales.");
      return;
    }

    setMensaje("");

    if (
      !formulario.nombre_camada ||
      !formulario.fecha_llegada ||
      !formulario.peso_promedio ||
      !formulario.galpon
    ) {
      setMensaje("Completa todos los campos para registrar la camada.");
      return;
    }

    try {
      setEnviando(true);

      const respuesta = await fetch(`${API_BASE_URL}/api/datos-iniciales`, {
        method: "POST",
        headers: buildAuthHeaders({ withJson: true }),
        body: JSON.stringify({
          ...formulario,
          peso_promedio: Number(formulario.peso_promedio),
        }),
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible registrar datos iniciales");
      }

      setMensaje("Datos iniciales registrados correctamente.");
      setFormulario({
        nombre_camada: "",
        fecha_llegada: "",
        peso_promedio: "",
        galpon: "",
      });

      // El dashboard se activa y actualiza solo despues de un registro exitoso.
      setMostrarDashboard(true);
      setDashboardRefreshToken((prev) => prev + 1);
    } catch (error) {
      setMensaje("Error al registrar datos iniciales en el servidor.");
    } finally {
      setEnviando(false);
    }
  };

  const agregarNuevaCamadaDesdeInforme = () => {
    setPaginaActiva("datos");
    setFormulario({
      nombre_camada: "",
      fecha_llegada: "",
      peso_promedio: "",
      galpon: "",
    });
    setMensaje("Completa los datos para agregar una nueva camada.");

    const inputNombreCamada = document.getElementById("nombre_camada");
    if (inputNombreCamada) {
      inputNombreCamada.scrollIntoView({ behavior: "smooth", block: "center" });
      inputNombreCamada.focus();
    }
  };

  const renderPaginaActiva = () => {
    if (paginaActiva === "camadas") {
      return <CamadasDashboard usuarioActivo={usuarioActivo} />;
    }

    if (paginaActiva === "beneficio") {
      return <BeneficioPollo usuarioActivo={usuarioActivo} />;
    }

    if (paginaActiva === "informe") {
      return (
        <InformeFinalCamada
          usuarioActivo={usuarioActivo}
          onAgregarNuevaCamada={agregarNuevaCamadaDesdeInforme}
        />
      );
    }

    return (
      <>
        <form className="datos-formulario" onSubmit={registrarDatosIniciales}>
          <label>Usuario activo</label>
          <input
            type="text"
            value={
              usuarioActivo
                ? `${usuarioActivo.nombre_completo} (${usuarioActivo.correo_electronico})`
                : "Sin sesion"
            }
            disabled
          />

          <label htmlFor="nombre_camada">Nombre de la camada</label>
          <input
            id="nombre_camada"
            name="nombre_camada"
            type="text"
            placeholder="Ejemplo: Camada Marzo 1"
            value={formulario.nombre_camada}
            onChange={manejarCambio}
          />

          <label htmlFor="fecha_llegada">Fecha de llegada</label>
          <input
            id="fecha_llegada"
            name="fecha_llegada"
            type="date"
            value={formulario.fecha_llegada}
            onChange={manejarCambio}
          />

          <label htmlFor="peso_promedio">Peso promedio (kg)</label>
          <input
            id="peso_promedio"
            name="peso_promedio"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formulario.peso_promedio}
            onChange={manejarCambio}
          />

          <label htmlFor="galpon">Galpon</label>
          <input
            id="galpon"
            name="galpon"
            type="text"
            placeholder="Galpon A"
            value={formulario.galpon}
            onChange={manejarCambio}
          />

          <div className="datos-acciones">
            <button type="submit" className="datos-btn-principal">
              {enviando ? "Guardando..." : "Registrar datos"}
            </button>
          </div>
        </form>

        {mensaje ? <p className="datos-mensaje">{mensaje}</p> : null}
      </>
    );
  };

  return (
    <section
      className="datos-escena"
      aria-label="Formulario de datos iniciales de pollos"
    >
      <article className="datos-tarjeta">
        <header className="datos-cabecera">
          <div className="datos-cabecera-superior">
            <p className="datos-etiqueta">Camadas y usuarios</p>
            <button
              type="button"
              className="datos-btn-cerrar-sesion"
              onClick={() => setMostrarConfirmacionSalida(true)}
            >
              Cerrar sesion
            </button>
          </div>
          <h2>Datos iniciales de pollos</h2>
          <p>
            Registra la informacion inicial de cada camada y asociala con el
            usuario responsable.
          </p>
        </header>

        <nav className="datos-nav-paginas" aria-label="Navegacion de modulos">
          <button
            type="button"
            className={`datos-nav-btn ${
              paginaActiva === "datos" ? "datos-nav-btn-activo" : ""
            }`}
            onClick={() => setPaginaActiva("datos")}
          >
            Datos iniciales
          </button>
          <button
            type="button"
            className={`datos-nav-btn ${
              paginaActiva === "camadas" ? "datos-nav-btn-activo" : ""
            }`}
            onClick={() => setPaginaActiva("camadas")}
          >
            Camadas
          </button>
          <button
            type="button"
            className={`datos-nav-btn ${
              paginaActiva === "beneficio" ? "datos-nav-btn-activo" : ""
            }`}
            onClick={() => setPaginaActiva("beneficio")}
          >
            Beneficio
          </button>
          <button
            type="button"
            className={`datos-nav-btn ${
              paginaActiva === "informe" ? "datos-nav-btn-activo" : ""
            }`}
            onClick={() => setPaginaActiva("informe")}
          >
            Informe final
          </button>
        </nav>

        {mostrarDashboard ? (
          <DashboardPollos
            refreshToken={dashboardRefreshToken}
            usuarioActivo={usuarioActivo}
          />
        ) : null}

        <section className="datos-contenido-pagina">{renderPaginaActiva()}</section>
      </article>

      {mostrarConfirmacionSalida ? (
        <div
          className="modal-salida-fondo"
          role="dialog"
          aria-modal="true"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) {
              setMostrarConfirmacionSalida(false);
            }
          }}
        >
          <div className="modal-salida-contenido">
            <h3>Cerrar sesion</h3>
            <p>Seguro que deseas cerrar la sesion actual?</p>

            <div className="modal-salida-acciones">
              <button
                type="button"
                className="modal-salida-cancelar"
                onClick={() => setMostrarConfirmacionSalida(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="modal-salida-confirmar"
                onClick={() => {
                  setMostrarConfirmacionSalida(false);
                  if (onCerrarSesion) {
                    onCerrarSesion();
                  }
                }}
              >
                Si, cerrar sesion
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default DatosInicialesPollos;
