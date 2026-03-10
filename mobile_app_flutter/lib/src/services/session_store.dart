import "dart:convert";

import "package:shared_preferences/shared_preferences.dart";

import "auth_models.dart";

class SessionStore {
  static const _tokenKey = "auth_token";
  static const _userKey = "auth_user";

  Future<void> save(LoginResult result) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, result.token);
    await prefs.setString(_userKey, jsonEncode(result.usuario));
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    if (token == null || token.isEmpty) return null;
    return token;
  }

  Future<Map<String, dynamic>> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null || raw.isEmpty) return {};

    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return {};
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
