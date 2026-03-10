import "dart:convert";

import "package:http/http.dart" as http;

import "api_config.dart";
import "api_exception.dart";
import "auth_models.dart";

class AuthApi {
  Future<void> register({
    required String nombreCompleto,
    required String correoElectronico,
    required String numeroTelefono,
    required String password,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}/api/usuarios");

    final response = await http.post(
      uri,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "nombre_completo": nombreCompleto.trim(),
        "correo_electronico": correoElectronico.trim().toLowerCase(),
        "numero_de_telefono": numeroTelefono.trim(),
        "password": password,
      }),
    );

    final body = _decodeBody(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    final message = body["message"]?.toString() ?? "Error al registrar usuario";
    throw ApiException(message);
  }

  Future<LoginResult> login({
    required String correoElectronico,
    required String password,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}/api/usuarios/login");

    final response = await http.post(
      uri,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "correo_electronico": correoElectronico.trim().toLowerCase(),
        "password": password,
      }),
    );

    final body = _decodeBody(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final token = body["token"]?.toString() ?? "";
      if (token.isEmpty) {
        throw ApiException("Respuesta de login sin token.");
      }

      return LoginResult(
        token: token,
        usuario: (body["usuario"] as Map<String, dynamic>?) ?? {},
      );
    }

    final message = body["message"]?.toString() ?? "Error de autenticacion";
    throw ApiException(message);
  }

  Map<String, dynamic> _decodeBody(String body) {
    if (body.trim().isEmpty) return {};
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return {};
  }
}
