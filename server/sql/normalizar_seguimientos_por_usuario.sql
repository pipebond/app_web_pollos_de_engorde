-- Normaliza seguimientos legacy para evitar cruces de informacion entre usuarios.
--
-- Que hace este script:
-- 1) Respalda filas legacy (id_usuario NULL).
-- 2) Asigna id_usuario cuando la camada tiene un unico propietario.
-- 3) Asigna id_usuario en camadas compartidas usando el dato inicial mas cercano.
-- 4) Elimina duplicados por (id_usuario, id_camada, fecha_registro), conservando el mas reciente.
-- 5) Guarda pendientes no resueltos para revision manual.
--
-- Recomendacion: ejecutar con una copia de seguridad de la BD.

START TRANSACTION;

-- 1) Respaldo de filas legacy con id_usuario nulo.
CREATE TABLE IF NOT EXISTS backup_seguimiento_diario_camadas_legacy LIKE seguimiento_diario_camadas;

INSERT INTO backup_seguimiento_diario_camadas_legacy
SELECT s.*
FROM seguimiento_diario_camadas s
WHERE s.id_usuario IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM backup_seguimiento_diario_camadas_legacy b
    WHERE b.id_seguimiento = s.id_seguimiento
  );

-- 2) Asignacion directa: camadas con un solo usuario en datos iniciales.
UPDATE seguimiento_diario_camadas s
JOIN (
  SELECT
    d.id_camada,
    MIN(d.id_usuario) AS id_usuario_unico
  FROM datos_iniciales_pollos d
  GROUP BY d.id_camada
  HAVING COUNT(DISTINCT d.id_usuario) = 1
) unicos ON unicos.id_camada = s.id_camada
SET s.id_usuario = unicos.id_usuario_unico
WHERE s.id_usuario IS NULL;

-- 3) Asignacion por cercania temporal en camadas compartidas.
-- Primero intenta con datos iniciales creados antes o en la fecha del seguimiento.
UPDATE seguimiento_diario_camadas s
SET s.id_usuario = (
  SELECT d.id_usuario
  FROM datos_iniciales_pollos d
  WHERE d.id_camada = s.id_camada
    AND d.created_at <= s.created_at
  ORDER BY d.created_at DESC
  LIMIT 1
)
WHERE s.id_usuario IS NULL
  AND EXISTS (
    SELECT 1
    FROM datos_iniciales_pollos d
    WHERE d.id_camada = s.id_camada
      AND d.created_at <= s.created_at
  );

-- Si aun quedan nulos, usa el dato inicial mas reciente disponible en esa camada.
UPDATE seguimiento_diario_camadas s
SET s.id_usuario = (
  SELECT d.id_usuario
  FROM datos_iniciales_pollos d
  WHERE d.id_camada = s.id_camada
  ORDER BY d.created_at DESC
  LIMIT 1
)
WHERE s.id_usuario IS NULL
  AND EXISTS (
    SELECT 1
    FROM datos_iniciales_pollos d
    WHERE d.id_camada = s.id_camada
  );

-- 4) Limpiar duplicados por clave funcional esperada.
-- Conserva el id_seguimiento mas alto (mas reciente) por cada grupo.
DELETE s1
FROM seguimiento_diario_camadas s1
JOIN seguimiento_diario_camadas s2
  ON s1.id_usuario = s2.id_usuario
 AND s1.id_camada = s2.id_camada
 AND s1.fecha_registro = s2.fecha_registro
 AND s1.id_seguimiento < s2.id_seguimiento
WHERE s1.id_usuario IS NOT NULL;

-- 5) Guardar pendientes para revision manual.
CREATE TABLE IF NOT EXISTS seguimiento_diario_camadas_pendientes LIKE seguimiento_diario_camadas;

INSERT INTO seguimiento_diario_camadas_pendientes
SELECT s.*
FROM seguimiento_diario_camadas s
WHERE s.id_usuario IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM seguimiento_diario_camadas_pendientes p
    WHERE p.id_seguimiento = s.id_seguimiento
  );

COMMIT;

-- Reportes de verificacion:
SELECT COUNT(*) AS pendientes_sin_usuario
FROM seguimiento_diario_camadas
WHERE id_usuario IS NULL;

SELECT
  id_usuario,
  id_camada,
  fecha_registro,
  COUNT(*) AS total
FROM seguimiento_diario_camadas
GROUP BY id_usuario, id_camada, fecha_registro
HAVING COUNT(*) > 1;
