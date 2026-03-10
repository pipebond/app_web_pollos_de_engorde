class ApiConfig {
  // Valor por defecto para telefono fisico en la misma red Wi-Fi.
  // Si usas emulador Android: --dart-define=API_BASE_URL=http://10.0.2.2:3001
  static const String baseUrl = String.fromEnvironment(
    "API_BASE_URL",
    defaultValue: "http://192.168.0.105:3001",
  );
}
