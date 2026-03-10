import "package:flutter/material.dart";

import "../services/api_exception.dart";
import "../services/auth_api.dart";
import "../services/session_store.dart";

class LoginPage extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginPage({super.key, required this.onLoginSuccess});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _nombreCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _correoCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmarCtrl = TextEditingController();
  final _authApi = AuthApi();
  final _sessionStore = SessionStore();

  bool _loading = false;
  String? _error;
  bool _modoRegistro = false;

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _telefonoCtrl.dispose();
    _correoCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmarCtrl.dispose();
    super.dispose();
  }

  Future<void> _registrar() async {
    final nombre = _nombreCtrl.text.trim();
    final telefono = _telefonoCtrl.text.trim();
    final correo = _correoCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirmar = _confirmarCtrl.text;

    if (nombre.isEmpty ||
        telefono.isEmpty ||
        correo.isEmpty ||
        password.isEmpty) {
      setState(() => _error = "Completa todos los campos del registro.");
      return;
    }

    if (password.length < 8) {
      setState(
        () => _error = "La contrasena debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (password != confirmar) {
      setState(() => _error = "Las contrasenas no coinciden.");
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await _authApi.register(
        nombreCompleto: nombre,
        correoElectronico: correo,
        numeroTelefono: telefono,
        password: password,
      );

      final result = await _authApi.login(
        correoElectronico: correo,
        password: password,
      );

      await _sessionStore.save(result);
      widget.onLoginSuccess();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = "No se pudo completar el registro.");
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _authApi.login(
        correoElectronico: _correoCtrl.text,
        password: _passwordCtrl.text,
      );
      await _sessionStore.save(result);
      widget.onLoginSuccess();
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
      });
    } catch (_) {
      setState(() {
        _error = "No se pudo iniciar sesion.";
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Pollos de Engorde")),
      body: SafeArea(
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFE7F0E8), Color(0xFFF5F3EE)],
            ),
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _modoRegistro ? "Crear cuenta" : "Bienvenido",
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (_modoRegistro) ...[
                        TextField(
                          controller: _nombreCtrl,
                          decoration: const InputDecoration(
                            labelText: "Nombre completo",
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _telefonoCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: "Numero de telefono",
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextField(
                        controller: _correoCtrl,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: "Correo"),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordCtrl,
                        decoration: const InputDecoration(
                          labelText: "Contrasena",
                        ),
                        obscureText: true,
                      ),
                      if (_modoRegistro) ...[
                        const SizedBox(height: 12),
                        TextField(
                          controller: _confirmarCtrl,
                          decoration: const InputDecoration(
                            labelText: "Confirmar contrasena",
                          ),
                          obscureText: true,
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _loading
                              ? null
                              : _modoRegistro
                                  ? _registrar
                                  : _login,
                          child: Text(
                            _loading
                                ? (_modoRegistro
                                    ? "Creando cuenta..."
                                    : "Ingresando...")
                                : (_modoRegistro
                                    ? "Crear cuenta"
                                    : "Iniciar sesion"),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextButton(
                        onPressed: _loading
                            ? null
                            : () {
                                setState(() {
                                  _modoRegistro = !_modoRegistro;
                                  _error = null;
                                });
                              },
                        child: Text(
                          _modoRegistro
                              ? "Ya tengo cuenta"
                              : "No tengo cuenta, registrarme",
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
