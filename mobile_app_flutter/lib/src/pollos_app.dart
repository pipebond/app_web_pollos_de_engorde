import "package:flutter/material.dart";

import "screens/home_page.dart";
import "screens/login_page.dart";
import "services/session_store.dart";
import "theme/app_theme.dart";

class PollosApp extends StatefulWidget {
  const PollosApp({super.key});

  @override
  State<PollosApp> createState() => _PollosAppState();
}

class _PollosAppState extends State<PollosApp> {
  final _sessionStore = SessionStore();

  bool _checkingSession = true;
  bool _authenticated = false;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final token = await _sessionStore.getToken();
    if (!mounted) return;

    setState(() {
      _authenticated = token != null;
      _checkingSession = false;
    });
  }

  void _onLoginSuccess() {
    setState(() {
      _authenticated = true;
    });
  }

  void _onLogout() {
    setState(() {
      _authenticated = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: "Pollos de Engorde",
      theme: AppTheme.build(),
      home:
          _checkingSession
              ? const _SplashPage()
              : _authenticated
              ? HomePage(onLogout: _onLogout)
              : LoginPage(onLoginSuccess: _onLoginSuccess),
    );
  }
}

class _SplashPage extends StatelessWidget {
  const _SplashPage();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
