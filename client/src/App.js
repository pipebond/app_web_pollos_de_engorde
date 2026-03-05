import React from "react";
import "./App.css";
import Login from "./components/Login";
import RegistroUsuario from "./components/RegistroUsuario";
import { useState } from "react";
import DatosInicialesPollos from "./components/DatosInicialesPollos";
import { clearSession, getStoredUser } from "./utils/auth";

function App() {
  const usuarioGuardado = getStoredUser();
  // Controla si se muestra la vista de login o de registro.
  const [vistaActual, setVistaActual] = useState(
    usuarioGuardado ? "datos-iniciales" : "login",
  );
  const [usuarioActivo, setUsuarioActivo] = useState(() => usuarioGuardado);

  const manejarLoginExitoso = ({ usuario }) => {
    setUsuarioActivo(usuario);
    setVistaActual("datos-iniciales");
  };

  const cerrarSesion = () => {
    clearSession();
    setUsuarioActivo(null);
    setVistaActual("login");
  };

  return (
    <main className="app-contenedor">
      {vistaActual === "login" ? (
        <Login
          onIrRegistro={() => setVistaActual("registro")}
          onLoginExitoso={manejarLoginExitoso}
        />
      ) : vistaActual === "registro" ? (
        <RegistroUsuario onVolverLogin={() => setVistaActual("login")} />
      ) : (
        <DatosInicialesPollos
          usuarioActivo={usuarioActivo}
          onCerrarSesion={cerrarSesion}
        />
      )}
    </main>
  );
}

export default App;
