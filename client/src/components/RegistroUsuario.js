import React, { useState } from "react";
import "./RegistroUsuario.css";

function RegistroUsuario({ onVolverLogin }) {
  // URL base del backend para facilitar cambios por entorno.
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

  // Estado del formulario de registro, alineado con columnas del backend.
  const [formulario, setFormulario] = useState({
    nombre_completo: "",
    correo_electronico: "",
    numero_de_telefono: "",
    password: "",
    confirmar_password: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [redirigiendo, setRedirigiendo] = useState(false);

  const esTelefonoValido = (valor) => {
    // Permite digitos, espacios y simbolos comunes de telefono.
    return /^[0-9+()\-\s]{7,20}$/.test(String(valor || "").trim());
  };

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: value,
    }));
  };

  const registrarUsuario = async (evento) => {
    evento.preventDefault();
    if (redirigiendo) return;

    setMensaje("");

    if (
      !formulario.nombre_completo ||
      !formulario.correo_electronico ||
      !formulario.numero_de_telefono ||
      !formulario.password ||
      !formulario.confirmar_password
    ) {
      setMensaje("Completa todos los campos para registrar el usuario.");
      return;
    }

    if (formulario.password.length < 8) {
      setMensaje("La contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (formulario.password !== formulario.confirmar_password) {
      setMensaje("La confirmacion de contrasena no coincide.");
      return;
    }

    if (!esTelefonoValido(formulario.numero_de_telefono)) {
      setMensaje("Ingresa un numero de telefono valido (solo digitos/simbolos de telefono).");
      return;
    }

    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_completo: formulario.nombre_completo,
          correo_electronico: formulario.correo_electronico,
          numero_de_telefono: formulario.numero_de_telefono,
          password: formulario.password,
        }),
      });

      if (!respuesta.ok) {
        let detalle = "No fue posible registrar el usuario.";
        try {
          const data = await respuesta.json();
          if (data?.message) {
            detalle = data.message;
          }
        } catch {
          // Si la respuesta no trae JSON, se conserva el mensaje por defecto.
        }
        throw new Error(detalle);
      }

      // Se informa el exito antes de volver al login automaticamente.
      setMensaje("Usuario creado correctamente. Redirigiendo al login...");
      setRedirigiendo(true);
      setFormulario({
        nombre_completo: "",
        correo_electronico: "",
        numero_de_telefono: "",
        password: "",
        confirmar_password: "",
      });

      setTimeout(() => {
        onVolverLogin();
      }, 1600);
    } catch (error) {
      setMensaje(error?.message || "Error al registrar usuario en el servidor.");
    }
  };

  return (
    <section
      className="registro-escena"
      aria-label="Pantalla de registro de usuario"
    >
      <article className="registro-tarjeta">
        <header className="registro-cabecera">
          <p className="registro-etiqueta">Nuevo usuario</p>
          <h2>Registro de acceso</h2>
          <p>Crea una cuenta para acceder al sistema y volver al login.</p>
        </header>

        <form className="registro-formulario" onSubmit={registrarUsuario}>
          <label htmlFor="nombre_completo">Nombre completo</label>
          <input
            id="nombre_completo"
            name="nombre_completo"
            type="text"
            placeholder="Ingresa nombre y apellido"
            value={formulario.nombre_completo}
            onChange={manejarCambio}
          />

          <label htmlFor="correo_electronico">Correo electronico</label>
          <input
            id="correo_electronico"
            name="correo_electronico"
            type="email"
            placeholder="usuario@granja.com"
            value={formulario.correo_electronico}
            onChange={manejarCambio}
          />

          <label htmlFor="numero_de_telefono">Numero de telefono</label>
          <input
            id="numero_de_telefono"
            name="numero_de_telefono"
            type="tel"
            placeholder="3001234567"
            value={formulario.numero_de_telefono}
            onChange={manejarCambio}
          />

          <label htmlFor="password">Contrasena</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Minimo 8 caracteres"
            value={formulario.password}
            onChange={manejarCambio}
          />

          <label htmlFor="confirmar_password">Confirmar contrasena</label>
          <input
            id="confirmar_password"
            name="confirmar_password"
            type="password"
            placeholder="Repite la contrasena"
            value={formulario.confirmar_password}
            onChange={manejarCambio}
          />

          <div className="registro-acciones">
            <button type="submit" className="registro-btn-principal">
              {redirigiendo ? "Redirigiendo..." : "Registrar usuario"}
            </button>

            <button
              type="button"
              className="registro-btn-secundario"
              onClick={onVolverLogin}
            >
              Volver al login
            </button>
          </div>
        </form>

        {mensaje ? <p className="registro-mensaje">{mensaje}</p> : null}
      </article>
    </section>
  );
}

export default RegistroUsuario;
