import React, { useState } from "react";
import "./Login.css";
import { saveSession } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";

function Login({ onIrRegistro, onLoginExitoso }) {
  // Estado centralizado del formulario para controlar cada campo.
  const [credenciales, setCredenciales] = useState({
    correo: "",
    clave: "",
    recordar: false,
  });

  // Mensaje de estado para mostrar validaciones o resultados del envio.
  const [mensaje, setMensaje] = useState("");

  // Actualiza dinamicamente el estado en funcion del tipo de entrada.
  const manejarCambio = (evento) => {
    const { name, value, type, checked } = evento.target;

    setCredenciales((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Maneja el submit del login y aplica una validacion basica del lado cliente.
  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (!credenciales.correo || !credenciales.clave) {
      setMensaje("Por favor completa correo y contrasena para iniciar sesion.");
      return;
    }

    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo_electronico: credenciales.correo,
          password: credenciales.clave,
        }),
      });

      if (!respuesta.ok) {
        throw new Error("Credenciales invalidas");
      }

      const data = await respuesta.json();
      saveSession({ token: data.token, usuario: data.usuario });
      setMensaje(
        `Acceso validado para ${credenciales.correo}. Redirigiendo...`,
      );

      setTimeout(() => {
        if (onLoginExitoso) {
          onLoginExitoso({ usuario: data.usuario, token: data.token });
        }
      }, 900);
    } catch (error) {
      setMensaje("Usuario no encontrado. Revisa el correo o registrate.");
    }
  };

  return (
    <section className="login-escena" aria-label="Pantalla de inicio de sesion">
      {/* Figuras decorativas para aportar profundidad visual al fondo. */}
      <div className="figura figura-uno" aria-hidden="true" />
      <div className="figura figura-dos" aria-hidden="true" />

      <article className="login-tarjeta">
        <header className="login-cabecera">
          <p className="login-etiqueta">Sistema de gestion avicola</p>
          <h1>Bienvenido</h1>
          <p>Inicia sesion para administrar tus lotes de pollos de engorde.</p>
        </header>

        <form className="login-formulario" onSubmit={manejarEnvio}>
          <label htmlFor="correo">Correo electronico</label>
          <input
            id="correo"
            name="correo"
            type="email"
            placeholder="ejemplo@granja.com"
            value={credenciales.correo}
            onChange={manejarCambio}
          />

          <label htmlFor="clave">Contrasena</label>
          <input
            id="clave"
            name="clave"
            type="password"
            placeholder="Ingresa tu contrasena"
            value={credenciales.clave}
            onChange={manejarCambio}
          />

          <div className="login-opciones">
            <label htmlFor="recordar" className="recordar-opcion">
              <input
                id="recordar"
                name="recordar"
                type="checkbox"
                checked={credenciales.recordar}
                onChange={manejarCambio}
              />
              Recordar sesion
            </label>

            <button type="button" className="recuperar-btn">
              Olvide mi clave
            </button>
          </div>

          <button type="submit" className="ingresar-btn">
            Ingresar
          </button>
        </form>

        {/* Mensaje dinamico de feedback para el usuario. */}
        {mensaje ? <p className="login-mensaje">{mensaje}</p> : null}

        <p className="login-registro">
          No tienes una cuenta?{" "}
          <button type="button" className="login-enlace" onClick={onIrRegistro}>
            Registrate aqui
          </button>
        </p>
      </article>
    </section>
  );
}

export default Login;
