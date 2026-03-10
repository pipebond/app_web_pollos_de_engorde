import "dart:convert";

import "package:http/http.dart" as http;

import "api_config.dart";
import "api_exception.dart";

class ApiClient {
  Future<dynamic> get({required String path, required String token}) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final response = await http.get(uri, headers: _headers(token));
    return _parseResponse(response);
  }

  Future<dynamic> post({
    required String path,
    required String token,
    required Map<String, dynamic> payload,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final response = await http.post(
      uri,
      headers: _headers(token),
      body: jsonEncode(payload),
    );
    return _parseResponse(response);
  }

  Future<dynamic> put({
    required String path,
    required String token,
    required Map<String, dynamic> payload,
  }) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final response = await http.put(
      uri,
      headers: _headers(token),
      body: jsonEncode(payload),
    );
    return _parseResponse(response);
  }

  Future<dynamic> delete({required String path, required String token}) async {
    final uri = Uri.parse("${ApiConfig.baseUrl}$path");
    final response = await http.delete(uri, headers: _headers(token));
    return _parseResponse(response);
  }

  Map<String, String> _headers(String token) {
    return {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    };
  }

  dynamic _parseResponse(http.Response response) {
    final body =
        response.body.trim().isEmpty ? null : jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final message =
        body is Map<String, dynamic>
            ? body["message"]?.toString() ?? "Error de API"
            : "Error de API";

    if (response.statusCode == 401) {
      throw ApiException("Sesion expirada. Inicia sesion nuevamente.");
    }

    throw ApiException(message);
  }
}
