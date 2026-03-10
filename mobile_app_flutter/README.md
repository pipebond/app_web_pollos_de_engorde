# App Movil Flutter

Este modulo movil vive en el mismo repositorio, pero como proyecto separado.

## Arquitectura

- `server/`: API Node + Express conectada a MySQL.
- `client/`: App web React.
- `mobile_app_flutter/`: App movil Flutter consumiendo la API existente.

La app Flutter no se conecta directo a MySQL. Siempre consume el backend por HTTP con JWT.

## Endpoints consumidos

- `POST /api/usuarios/login`
- `GET /api/datos-iniciales/dashboard`
- `GET /api/datos-iniciales/camadas-dashboard`
- `GET /api/beneficios-pollo`
- `GET /api/informes-finales-camada`

## Configuracion de API base

La app usa `String.fromEnvironment` en `lib/src/services/api_config.dart`.

- Emulador Android: `http://10.0.2.2:3001`
- Dispositivo fisico: `http://IP_DE_TU_PC:3001`
- Produccion: URL publica del backend

## Ejecutar en desarrollo

1. Arrancar backend en `server/`.
2. Entrar en `mobile_app_flutter/`.
3. Ejecutar:

```powershell
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

Para dispositivo fisico cambia el valor de `API_BASE_URL` por la IP local del PC.
