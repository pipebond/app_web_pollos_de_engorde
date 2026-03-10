import "package:flutter/material.dart";

class AppTheme {
  static ThemeData build() {
    const seed = Color(0xFF1E7A3F);
    final scheme = ColorScheme.fromSeed(
      seedColor: seed,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: const Color(0xFFF5F3EE),
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: Color(0xFFE7F0E8),
        foregroundColor: Color(0xFF16321F),
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        color: Colors.white,
        margin: const EdgeInsets.symmetric(vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
      textTheme: const TextTheme(
        headlineSmall: TextStyle(
          fontFamily: "Georgia",
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
        titleLarge: TextStyle(
          fontFamily: "Georgia",
          fontWeight: FontWeight.w700,
        ),
        bodyMedium: TextStyle(fontFamily: "Trebuchet MS", height: 1.25),
      ),
    );
  }
}
