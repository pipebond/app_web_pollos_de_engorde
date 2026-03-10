import "package:flutter/material.dart";
import "package:flutter/services.dart";

import "../services/api_client.dart";
import "../services/api_exception.dart";
import "../services/session_store.dart";

class HomePage extends StatefulWidget {
  final VoidCallback onLogout;

  const HomePage({super.key, required this.onLogout});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _sessionStore = SessionStore();

  int _tabIndex = 0;
  bool _loadingSession = true;
  String? _token;
  String _nombreUsuario = "";

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final token = await _sessionStore.getToken();
    final user = await _sessionStore.getUser();

    if (!mounted) return;
    if (token == null) {
      await _logout();
      return;
    }

    setState(() {
      _token = token;
      _nombreUsuario = user["nombre_completo"]?.toString() ?? "";
      _loadingSession = false;
    });
  }

  Future<void> _logout() async {
    await _sessionStore.clear();
    widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingSession || _token == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Control de Produccion"),
        actions: [
          IconButton(
            tooltip: "Cerrar sesion",
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_nombreUsuario.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: Text("Usuario: $_nombreUsuario"),
            ),
          Expanded(
            child: IndexedStack(
              index: _tabIndex,
              children: [
                DashboardTab(token: _token!),
                CamadasCrudTab(token: _token!),
                BeneficiosCrudTab(token: _token!),
                InformesCrudTab(token: _token!),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (value) => setState(() => _tabIndex = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: "Dashboard",
          ),
          NavigationDestination(
            icon: Icon(Icons.hive_outlined),
            selectedIcon: Icon(Icons.hive),
            label: "Camadas",
          ),
          NavigationDestination(
            icon: Icon(Icons.paid_outlined),
            selectedIcon: Icon(Icons.paid),
            label: "Beneficios",
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: "Informes",
          ),
        ],
      ),
    );
  }
}

class DashboardTab extends StatefulWidget {
  final String token;

  const DashboardTab({super.key, required this.token});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final _api = ApiClient();

  bool _loading = true;
  String? _error;
  Map<String, dynamic> _data = const {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _api.get(
        path: "/api/datos-iniciales/dashboard",
        token: widget.token,
      );

      if (!mounted) return;
      setState(() {
        _data = (response as Map?)?.cast<String, dynamic>() ?? {};
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "No se pudo cargar el dashboard.");
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorRetry(error: _error!, onRetry: _load);
    }

    final entries = _data.entries.toList();
    if (entries.isEmpty) {
      return const Center(child: Text("Sin datos de dashboard."));
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: entries.length,
        itemBuilder: (context, index) {
          final entry = entries[index];
          return Card(
            child: ListTile(
              title: Text(entry.key),
              subtitle: Text(entry.value.toString()),
            ),
          );
        },
      ),
    );
  }
}

class CamadasCrudTab extends StatefulWidget {
  final String token;

  const CamadasCrudTab({super.key, required this.token});

  @override
  State<CamadasCrudTab> createState() => _CamadasCrudTabState();
}

class _CamadasCrudTabState extends State<CamadasCrudTab> {
  final _api = ApiClient();

  final _nombreCamadaCtrl = TextEditingController();
  final _fechaLlegadaCtrl = TextEditingController();
  final _pesoPromedioCtrl = TextEditingController();
  final _galponCtrl = TextEditingController();

  final _fechaSeguimientoCtrl = TextEditingController();
  final _cantidadAvesCtrl = TextEditingController();
  final _mortalidadCtrl = TextEditingController(text: "0");
  final _pesoSeguimientoCtrl = TextEditingController();
  final _consumoCtrl = TextEditingController(text: "0");
  final _observacionesCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _message;

  List<Map<String, dynamic>> _camadas = const [];
  List<Map<String, dynamic>> _seguimientos = const [];

  String _selectedCamada = "";
  int? _editingSeguimientoId;

  @override
  void initState() {
    super.initState();
    _loadCamadas();
  }

  @override
  void dispose() {
    _nombreCamadaCtrl.dispose();
    _fechaLlegadaCtrl.dispose();
    _pesoPromedioCtrl.dispose();
    _galponCtrl.dispose();
    _fechaSeguimientoCtrl.dispose();
    _cantidadAvesCtrl.dispose();
    _mortalidadCtrl.dispose();
    _pesoSeguimientoCtrl.dispose();
    _consumoCtrl.dispose();
    _observacionesCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCamadas() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _api.get(
        path: "/api/datos-iniciales/camadas-dashboard",
        token: widget.token,
      );

      final camadas = _toListMap(response);
      if (!mounted) return;

      setState(() {
        _camadas = camadas;
        if (_selectedCamada.isEmpty && camadas.isNotEmpty) {
          _selectedCamada = camadas.first["id_camada"].toString();
        }
      });

      await _loadSeguimientos();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "No se pudieron cargar las camadas.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadSeguimientos() async {
    if (_selectedCamada.isEmpty) {
      setState(() => _seguimientos = const []);
      return;
    }

    try {
      final response = await _api.get(
        path: "/api/datos-iniciales/camadas/$_selectedCamada/seguimientos",
        token: widget.token,
      );

      if (!mounted) return;
      setState(() => _seguimientos = _toListMap(response));
    } catch (_) {
      if (!mounted) return;
      setState(() => _seguimientos = const []);
    }
  }

  Future<void> _crearCamada() async {
    final nombre = _nombreCamadaCtrl.text.trim();
    final fecha = _fechaLlegadaCtrl.text.trim();
    final peso = double.tryParse(_pesoPromedioCtrl.text.trim());
    final galpon = _galponCtrl.text.trim();

    if (nombre.isEmpty || fecha.isEmpty || peso == null || galpon.isEmpty) {
      setState(() => _message = "Completa todos los campos de la camada.");
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      await _api.post(
        path: "/api/datos-iniciales",
        token: widget.token,
        payload: {
          "nombre_camada": nombre,
          "fecha_llegada": fecha,
          "peso_promedio": peso,
          "galpon": galpon,
        },
      );

      _nombreCamadaCtrl.clear();
      _fechaLlegadaCtrl.clear();
      _pesoPromedioCtrl.clear();
      _galponCtrl.clear();

      await _loadCamadas();
      if (!mounted) return;
      setState(() => _message = "Camada registrada correctamente.");
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _editarSeguimiento(Map<String, dynamic> row) {
    _editingSeguimientoId = int.tryParse(row["id_seguimiento"].toString());
    _fechaSeguimientoCtrl.text = _dateOnly(row["fecha_registro"]);
    _cantidadAvesCtrl.text = row["cantidad_aves"]?.toString() ?? "";
    _mortalidadCtrl.text = row["mortalidad"]?.toString() ?? "0";
    _pesoSeguimientoCtrl.text = row["peso_promedio"]?.toString() ?? "";
    _consumoCtrl.text = row["consumo_alimento_kg"]?.toString() ?? "0";
    _observacionesCtrl.text = row["observaciones"]?.toString() ?? "";
    setState(() => _message = "Editando seguimiento.");
  }

  void _limpiarSeguimiento() {
    _editingSeguimientoId = null;
    _fechaSeguimientoCtrl.clear();
    _cantidadAvesCtrl.clear();
    _mortalidadCtrl.text = "0";
    _pesoSeguimientoCtrl.clear();
    _consumoCtrl.text = "0";
    _observacionesCtrl.clear();
    setState(() {});
  }

  Future<void> _guardarSeguimiento() async {
    final fecha = _fechaSeguimientoCtrl.text.trim();
    final cantidad = int.tryParse(_cantidadAvesCtrl.text.trim());
    final mortalidad = int.tryParse(_mortalidadCtrl.text.trim()) ?? 0;
    final peso = double.tryParse(_pesoSeguimientoCtrl.text.trim());
    final consumo = double.tryParse(_consumoCtrl.text.trim()) ?? 0;

    if (_selectedCamada.isEmpty) {
      setState(() => _message = "Selecciona una camada.");
      return;
    }

    if (fecha.isEmpty || cantidad == null || peso == null) {
      setState(() {
        _message = "Completa fecha, cantidad de aves y peso promedio.";
      });
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      final payload = {
        "fecha_registro": fecha,
        "cantidad_aves": cantidad,
        "mortalidad": mortalidad,
        "peso_promedio": peso,
        "consumo_alimento_kg": consumo,
        "observaciones": _observacionesCtrl.text.trim(),
      };

      if (_editingSeguimientoId == null) {
        await _api.post(
          path: "/api/datos-iniciales/camadas/$_selectedCamada/seguimientos",
          token: widget.token,
          payload: payload,
        );
      } else {
        await _api.put(
          path: "/api/datos-iniciales/seguimientos/$_editingSeguimientoId",
          token: widget.token,
          payload: payload,
        );
      }

      _limpiarSeguimiento();
      await _loadCamadas();
      await _loadSeguimientos();
      if (!mounted) return;
      setState(() => _message = "Seguimiento guardado correctamente.");
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorRetry(error: _error!, onRetry: _loadCamadas);
    }

    return RefreshIndicator(
      onRefresh: _loadCamadas,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          const Text("Crear Camada", style: TextStyle(fontSize: 18)),
          const SizedBox(height: 8),
          _InputText(controller: _nombreCamadaCtrl, label: "Nombre camada"),
          _DateInput(controller: _fechaLlegadaCtrl, label: "Fecha llegada"),
          _InputText(
            controller: _pesoPromedioCtrl,
            label: "Peso promedio inicial",
            number: true,
          ),
          _InputText(controller: _galponCtrl, label: "Galpon"),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _saving ? null : _crearCamada,
            child: Text(_saving ? "Guardando..." : "Registrar camada"),
          ),
          const Divider(height: 28),
          DropdownButtonFormField<String>(
            initialValue: _selectedCamada.isEmpty ? null : _selectedCamada,
            decoration: const InputDecoration(labelText: "Camada activa"),
            items:
                _camadas
                    .map(
                      (e) => DropdownMenuItem(
                        value: e["id_camada"].toString(),
                        child: Text(e["nombre_camada"]?.toString() ?? "Camada"),
                      ),
                    )
                    .toList(),
            onChanged: (value) {
              if (value == null) return;
              setState(() => _selectedCamada = value);
              _loadSeguimientos();
            },
          ),
          const SizedBox(height: 12),
          const Text("Seguimiento Diario", style: TextStyle(fontSize: 18)),
          const SizedBox(height: 8),
          _DateInput(
            controller: _fechaSeguimientoCtrl,
            label: "Fecha registro",
          ),
          _InputText(
            controller: _cantidadAvesCtrl,
            label: "Cantidad aves",
            number: true,
            decimal: false,
          ),
          _InputText(
            controller: _mortalidadCtrl,
            label: "Mortalidad",
            number: true,
            decimal: false,
          ),
          _InputText(
            controller: _pesoSeguimientoCtrl,
            label: "Peso promedio",
            number: true,
          ),
          _InputText(
            controller: _consumoCtrl,
            label: "Consumo alimento kg",
            number: true,
          ),
          _InputText(controller: _observacionesCtrl, label: "Observaciones"),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : _guardarSeguimiento,
                  child: Text(
                    _editingSeguimientoId == null
                        ? "Guardar seguimiento"
                        : "Actualizar seguimiento",
                  ),
                ),
              ),
              if (_editingSeguimientoId != null) ...[
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: _limpiarSeguimiento,
                  child: const Text("Cancelar"),
                ),
              ],
            ],
          ),
          if (_message != null) ...[const SizedBox(height: 8), Text(_message!)],
          const SizedBox(height: 14),
          const Text(
            "Historial de seguimientos",
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 8),
          if (_seguimientos.isEmpty)
            const Text("No hay seguimientos registrados.")
          else
            ..._seguimientos.map(
              (row) => Card(
                child: ListTile(
                  title: Text(
                    "${_dateOnly(row["fecha_registro"])} - ${row["cantidad_aves"]} aves",
                  ),
                  subtitle: Text(
                    "Peso ${row["peso_promedio"]}, Mortalidad ${row["mortalidad"]}",
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => _editarSeguimiento(row),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 24),
          const Text(
            "Nota: el backend actual no expone eliminar camada ni seguimiento.",
          ),
        ],
      ),
    );
  }
}

class BeneficiosCrudTab extends StatefulWidget {
  final String token;

  const BeneficiosCrudTab({super.key, required this.token});

  @override
  State<BeneficiosCrudTab> createState() => _BeneficiosCrudTabState();
}

class _BeneficiosCrudTabState extends State<BeneficiosCrudTab> {
  final _api = ApiClient();

  final _pesoVivoCtrl = TextEditingController();
  final _pesoSacrificadoCtrl = TextEditingController();
  final _cantidadCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _message;

  String _selectedCamada = "";
  int? _editingId;
  int _page = 0;
  static const int _pageSize = 6;

  List<Map<String, dynamic>> _camadas = const [];
  List<Map<String, dynamic>> _beneficios = const [];

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _pesoVivoCtrl.dispose();
    _pesoSacrificadoCtrl.dispose();
    _cantidadCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  double get _precioCalculado {
    final peso = double.tryParse(_pesoSacrificadoCtrl.text.trim()) ?? 0;
    return double.parse((peso * 11000).toStringAsFixed(2));
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final camadasResponse = await _api.get(
        path: "/api/datos-iniciales/camadas-dashboard",
        token: widget.token,
      );
      final beneficiosResponse = await _api.get(
        path: "/api/beneficios-pollo",
        token: widget.token,
      );

      final camadas = _toListMap(camadasResponse);
      final beneficios = _toListMap(beneficiosResponse);

      if (!mounted) return;
      setState(() {
        _camadas = camadas;
        _beneficios = beneficios;
        _page = 0;
        if (_selectedCamada.isEmpty && camadas.isNotEmpty) {
          _selectedCamada = camadas.first["id_camada"].toString();
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "No se pudieron cargar beneficios.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    final pesoVivo = double.tryParse(_pesoVivoCtrl.text.trim());
    final pesoSacrificado = double.tryParse(_pesoSacrificadoCtrl.text.trim());
    final cantidad = int.tryParse(_cantidadCtrl.text.trim());

    if (_selectedCamada.isEmpty ||
        pesoVivo == null ||
        pesoSacrificado == null ||
        cantidad == null) {
      setState(() {
        _message = "Completa camada, pesos y cantidad beneficiados.";
      });
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      final payload = {
        "id_camada": int.parse(_selectedCamada),
        "peso_en_vivo": pesoVivo,
        "peso_sacrificado": pesoSacrificado,
        "precio": _precioCalculado,
        "cantidad_beneficiados": cantidad,
      };

      if (_editingId == null) {
        await _api.post(
          path: "/api/beneficios-pollo",
          token: widget.token,
          payload: payload,
        );
      } else {
        await _api.put(
          path: "/api/beneficios-pollo/$_editingId",
          token: widget.token,
          payload: payload,
        );
      }

      _editingId = null;
      _pesoVivoCtrl.clear();
      _pesoSacrificadoCtrl.clear();
      _cantidadCtrl.clear();

      await _loadAll();
      if (!mounted) return;
      setState(() => _message = "Beneficio guardado correctamente.");
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _edit(Map<String, dynamic> row) {
    _editingId = int.tryParse(row["id_beneficio"].toString());
    _selectedCamada = row["id_camada"].toString();
    _pesoVivoCtrl.text = row["peso_en_vivo"].toString();
    _pesoSacrificadoCtrl.text = row["peso_sacrificado"].toString();
    _cantidadCtrl.text = row["cantidad_beneficiados"].toString();
    setState(() => _message = "Editando beneficio.");
  }

  Future<void> _delete(int id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Eliminar beneficio"),
          content: const Text("Esta accion no se puede deshacer."),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text("Cancelar"),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text("Eliminar"),
            ),
          ],
        );
      },
    );

    if (ok != true) return;

    try {
      await _api.delete(path: "/api/beneficios-pollo/$id", token: widget.token);
      await _loadAll();
      if (!mounted) return;
      setState(() => _message = "Beneficio eliminado correctamente.");
    } catch (e) {
      if (!mounted) return;
      setState(() => _message = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorRetry(error: _error!, onRetry: _loadAll);
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          const Text("Formulario de Beneficio", style: TextStyle(fontSize: 18)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _selectedCamada.isEmpty ? null : _selectedCamada,
            decoration: const InputDecoration(labelText: "Camada"),
            items:
                _camadas
                    .map(
                      (e) => DropdownMenuItem(
                        value: e["id_camada"].toString(),
                        child: Text(e["nombre_camada"]?.toString() ?? "Camada"),
                      ),
                    )
                    .toList(),
            onChanged: (value) => setState(() => _selectedCamada = value ?? ""),
          ),
          _InputText(
            controller: _pesoVivoCtrl,
            label: "Peso en vivo (kg)",
            number: true,
            onChanged: (_) => setState(() {}),
          ),
          _InputText(
            controller: _pesoSacrificadoCtrl,
            label: "Peso sacrificado (kg)",
            number: true,
            onChanged: (_) => setState(() {}),
          ),
          _InputText(
            controller: _cantidadCtrl,
            label: "Cantidad beneficiados",
            number: true,
            decimal: false,
          ),
          const SizedBox(height: 6),
          Text("Precio calculado: ${_precioCalculado.toStringAsFixed(2)}"),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_editingId == null ? "Guardar" : "Actualizar"),
                ),
              ),
              if (_editingId != null) ...[
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () {
                    _editingId = null;
                    _pesoVivoCtrl.clear();
                    _pesoSacrificadoCtrl.clear();
                    _cantidadCtrl.clear();
                    setState(() {});
                  },
                  child: const Text("Cancelar"),
                ),
              ],
            ],
          ),
          if (_message != null) ...[const SizedBox(height: 8), Text(_message!)],
          const Divider(height: 28),
          const Text("Registros", style: TextStyle(fontSize: 16)),
          const SizedBox(height: 8),
          _InputText(
            controller: _searchCtrl,
            label: "Buscar por camada, peso o precio",
            onChanged: (_) => setState(() => _page = 0),
          ),
          const SizedBox(height: 8),
          if (_beneficiosFiltrados.isEmpty)
            const Text("No hay beneficios registrados.")
          else
            ..._beneficiosPaginados.map(
              (row) => Card(
                child: ListTile(
                  title: Text(
                    "Camada ${row["nombre_camada"] ?? row["id_camada"]} - ${row["precio"]}",
                  ),
                  subtitle: Text(
                    "Vivo ${row["peso_en_vivo"]} | Sacrificado ${row["peso_sacrificado"]}",
                  ),
                  trailing: Wrap(
                    spacing: 4,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit),
                        onPressed: () => _edit(row),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () {
                          final id = int.tryParse(
                            row["id_beneficio"].toString(),
                          );
                          if (id != null) _delete(id);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          if (_beneficiosFiltrados.isNotEmpty) ...[
            const SizedBox(height: 8),
            _PaginationControls(
              page: _page,
              totalItems: _beneficiosFiltrados.length,
              pageSize: _pageSize,
              onPrev: _page > 0 ? () => setState(() => _page -= 1) : null,
              onNext:
                  (_page + 1) * _pageSize < _beneficiosFiltrados.length
                      ? () => setState(() => _page += 1)
                      : null,
            ),
          ],
        ],
      ),
    );
  }

  List<Map<String, dynamic>> get _beneficiosFiltrados {
    final query = _searchCtrl.text.trim().toLowerCase();
    if (query.isEmpty) return _beneficios;

    return _beneficios.where((row) {
      final camada =
          (row["nombre_camada"] ?? row["id_camada"]).toString().toLowerCase();
      final precio = row["precio"]?.toString().toLowerCase() ?? "";
      final pesoVivo = row["peso_en_vivo"]?.toString().toLowerCase() ?? "";
      final pesoSac = row["peso_sacrificado"]?.toString().toLowerCase() ?? "";
      return camada.contains(query) ||
          precio.contains(query) ||
          pesoVivo.contains(query) ||
          pesoSac.contains(query);
    }).toList();
  }

  List<Map<String, dynamic>> get _beneficiosPaginados {
    final all = _beneficiosFiltrados;
    final start = _page * _pageSize;
    if (start >= all.length) return all.take(_pageSize).toList();
    final end = (start + _pageSize).clamp(0, all.length);
    return all.sublist(start, end);
  }
}

class InformesCrudTab extends StatefulWidget {
  final String token;

  const InformesCrudTab({super.key, required this.token});

  @override
  State<InformesCrudTab> createState() => _InformesCrudTabState();
}

class _InformesCrudTabState extends State<InformesCrudTab> {
  final _api = ApiClient();
  final _observacionesCtrl = TextEditingController();
  final _searchCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _message;

  String _selectedCamada = "";
  List<Map<String, dynamic>> _camadas = const [];
  List<Map<String, dynamic>> _informes = const [];
  Map<String, dynamic>? _preview;
  int _page = 0;
  static const int _pageSize = 6;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _observacionesCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final camadasResponse = await _api.get(
        path: "/api/datos-iniciales/camadas-dashboard",
        token: widget.token,
      );
      final informesResponse = await _api.get(
        path: "/api/informes-finales-camada",
        token: widget.token,
      );

      final camadas = _toListMap(camadasResponse);
      final informes = _toListMap(informesResponse);

      if (!mounted) return;
      setState(() {
        _camadas = camadas;
        _informes = informes;
        _page = 0;
        if (_selectedCamada.isEmpty && camadas.isNotEmpty) {
          _selectedCamada = camadas.first["id_camada"].toString();
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = "No se pudieron cargar informes.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _generarPreview() async {
    if (_selectedCamada.isEmpty) {
      setState(() => _message = "Selecciona una camada.");
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      final response = await _api.get(
        path: "/api/informes-finales-camada/preview/$_selectedCamada",
        token: widget.token,
      );

      if (!mounted) return;
      setState(() {
        _preview = (response as Map?)?.cast<String, dynamic>() ?? {};
        _message = "Vista previa generada.";
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _guardarInforme() async {
    if (_preview == null || _preview!["id_camada"] == null) {
      setState(() => _message = "Genera primero la vista previa.");
      return;
    }

    setState(() {
      _saving = true;
      _message = null;
    });

    try {
      await _api.post(
        path: "/api/informes-finales-camada",
        token: widget.token,
        payload: {
          "id_camada": _preview!["id_camada"],
          "observaciones": _observacionesCtrl.text.trim(),
        },
      );

      _observacionesCtrl.clear();
      await _loadAll();
      if (!mounted) return;
      setState(() => _message = "Informe guardado correctamente.");
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteInforme(int id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Eliminar informe"),
          content: const Text("Esta accion no se puede deshacer."),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text("Cancelar"),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text("Eliminar"),
            ),
          ],
        );
      },
    );

    if (ok != true) return;

    try {
      await _api.delete(
        path: "/api/informes-finales-camada/$id",
        token: widget.token,
      );
      await _loadAll();
      if (!mounted) return;
      setState(() => _message = "Informe eliminado correctamente.");
    } catch (e) {
      if (!mounted) return;
      setState(() => _message = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _ErrorRetry(error: _error!, onRetry: _loadAll);
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          const Text("Informe Final de Camada", style: TextStyle(fontSize: 18)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _selectedCamada.isEmpty ? null : _selectedCamada,
            decoration: const InputDecoration(labelText: "Camada"),
            items:
                _camadas
                    .map(
                      (e) => DropdownMenuItem(
                        value: e["id_camada"].toString(),
                        child: Text(e["nombre_camada"]?.toString() ?? "Camada"),
                      ),
                    )
                    .toList(),
            onChanged: (value) => setState(() => _selectedCamada = value ?? ""),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: _saving ? null : _generarPreview,
            child: const Text("Generar vista previa"),
          ),
          if (_preview != null) ...[
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children:
                      _preview!.entries
                          .map((e) => Text("${e.key}: ${e.value}"))
                          .toList(),
                ),
              ),
            ),
            _InputText(controller: _observacionesCtrl, label: "Observaciones"),
            const SizedBox(height: 6),
            ElevatedButton(
              onPressed: _saving ? null : _guardarInforme,
              child: const Text("Guardar informe"),
            ),
          ],
          if (_message != null) ...[const SizedBox(height: 8), Text(_message!)],
          const Divider(height: 28),
          const Text("Informes guardados", style: TextStyle(fontSize: 16)),
          const SizedBox(height: 8),
          _InputText(
            controller: _searchCtrl,
            label: "Buscar por camada, dias o indice",
            onChanged: (_) => setState(() => _page = 0),
          ),
          const SizedBox(height: 8),
          if (_informesFiltrados.isEmpty)
            const Text("No hay informes guardados.")
          else
            ..._informesPaginados.map(
              (row) => Card(
                child: ListTile(
                  title: Text(row["nombre_camada"]?.toString() ?? "Informe"),
                  subtitle: Text(
                    "Dias: ${row["total_dias"]} | IC: ${row["indice_conversion"]}",
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () {
                      final id = int.tryParse(row["id_informe"].toString());
                      if (id != null) _deleteInforme(id);
                    },
                  ),
                ),
              ),
            ),
          if (_informesFiltrados.isNotEmpty) ...[
            const SizedBox(height: 8),
            _PaginationControls(
              page: _page,
              totalItems: _informesFiltrados.length,
              pageSize: _pageSize,
              onPrev: _page > 0 ? () => setState(() => _page -= 1) : null,
              onNext:
                  (_page + 1) * _pageSize < _informesFiltrados.length
                      ? () => setState(() => _page += 1)
                      : null,
            ),
          ],
          const SizedBox(height: 16),
          const Text(
            "Nota: la API actual no expone actualizacion de informes.",
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> get _informesFiltrados {
    final query = _searchCtrl.text.trim().toLowerCase();
    if (query.isEmpty) return _informes;

    return _informes.where((row) {
      final camada = row["nombre_camada"]?.toString().toLowerCase() ?? "";
      final dias = row["total_dias"]?.toString().toLowerCase() ?? "";
      final ic = row["indice_conversion"]?.toString().toLowerCase() ?? "";
      return camada.contains(query) ||
          dias.contains(query) ||
          ic.contains(query);
    }).toList();
  }

  List<Map<String, dynamic>> get _informesPaginados {
    final all = _informesFiltrados;
    final start = _page * _pageSize;
    if (start >= all.length) return all.take(_pageSize).toList();
    final end = (start + _pageSize).clamp(0, all.length);
    return all.sublist(start, end);
  }
}

class _InputText extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool number;
  final bool decimal;
  final void Function(String)? onChanged;

  const _InputText({
    required this.controller,
    required this.label,
    this.number = false,
    this.decimal = true,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextField(
        controller: controller,
        keyboardType:
            number
                ? TextInputType.numberWithOptions(decimal: decimal)
                : TextInputType.text,
        inputFormatters:
            number
                ? [
                  FilteringTextInputFormatter.allow(
                    RegExp(decimal ? r"[0-9.]" : r"[0-9]"),
                  ),
                ]
                : null,
        onChanged: onChanged,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}

class _DateInput extends StatelessWidget {
  final TextEditingController controller;
  final String label;

  const _DateInput({required this.controller, required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: TextField(
        controller: controller,
        readOnly: true,
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_month),
        ),
        onTap: () async {
          final now = DateTime.now();
          final parsed = DateTime.tryParse(controller.text.trim());
          final date = await showDatePicker(
            context: context,
            initialDate: parsed ?? now,
            firstDate: DateTime(2020, 1, 1),
            lastDate: DateTime(now.year + 3, 12, 31),
          );

          if (date != null) {
            controller.text =
                "${date.year.toString().padLeft(4, "0")}-${date.month.toString().padLeft(2, "0")}-${date.day.toString().padLeft(2, "0")}";
          }
        },
      ),
    );
  }
}

class _PaginationControls extends StatelessWidget {
  final int page;
  final int totalItems;
  final int pageSize;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;

  const _PaginationControls({
    required this.page,
    required this.totalItems,
    required this.pageSize,
    required this.onPrev,
    required this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    final totalPages = (totalItems / pageSize).ceil();
    final current = page + 1;

    return Row(
      children: [
        OutlinedButton(onPressed: onPrev, child: const Text("Anterior")),
        const SizedBox(width: 8),
        Text("Pagina $current de ${totalPages == 0 ? 1 : totalPages}"),
        const SizedBox(width: 8),
        OutlinedButton(onPressed: onNext, child: const Text("Siguiente")),
      ],
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String error;
  final Future<void> Function() onRetry;

  const _ErrorRetry({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(error, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: onRetry, child: const Text("Reintentar")),
          ],
        ),
      ),
    );
  }
}

List<Map<String, dynamic>> _toListMap(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((e) => e.map((k, v) => MapEntry(k.toString(), v)))
        .toList();
  }

  if (value is Map<String, dynamic>) {
    return [value];
  }

  return const [];
}

String _dateOnly(dynamic value) {
  final raw = value?.toString() ?? "";
  if (raw.length >= 10) return raw.substring(0, 10);
  return raw;
}
