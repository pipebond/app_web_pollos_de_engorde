const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "pollos_de_engorde_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

connection.query("SELECT 1", (err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");

  const createUsuarioTableQuery = `
    CREATE TABLE IF NOT EXISTS usuario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre_completo VARCHAR(150) NOT NULL,
      correo_electronico VARCHAR(180) NOT NULL UNIQUE,
      numero_de_telefono VARCHAR(40) NOT NULL,
      password_hash VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  // Inicializa tablas necesarias para el modulo de datos iniciales de pollos.
  const createCamadaTableQuery = `
    CREATE TABLE IF NOT EXISTS camada_pollos (
      id_camada INT AUTO_INCREMENT PRIMARY KEY,
      nombre_camada VARCHAR(120) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  const createDatosInicialesTableQuery = `
    CREATE TABLE IF NOT EXISTS datos_iniciales_pollos (
      id_dato_inicial INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_camada INT NOT NULL,
      fecha_llegada DATE NOT NULL,
      peso_promedio DECIMAL(10,2) NOT NULL,
      galpon VARCHAR(120) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_datos_iniciales_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),
      CONSTRAINT fk_datos_iniciales_camada FOREIGN KEY (id_camada) REFERENCES camada_pollos(id_camada)
    ) ENGINE=InnoDB;
  `;

  const createSeguimientoDiarioTableQuery = `
    CREATE TABLE IF NOT EXISTS seguimiento_diario_camadas (
      id_seguimiento INT AUTO_INCREMENT PRIMARY KEY,
      id_camada INT NOT NULL,
      id_usuario INT NOT NULL,
      fecha_registro DATE NOT NULL,
      cantidad_aves INT NOT NULL,
      mortalidad INT NOT NULL DEFAULT 0,
      peso_promedio DECIMAL(10,2) NOT NULL,
      consumo_alimento_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
      observaciones VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_seguimiento_camada FOREIGN KEY (id_camada) REFERENCES camada_pollos(id_camada),
      CONSTRAINT fk_seguimiento_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),
      CONSTRAINT uq_seguimiento_usuario_camada_fecha UNIQUE (id_usuario, id_camada, fecha_registro)
    ) ENGINE=InnoDB;
  `;

  const createBeneficioPolloTableQuery = `
    CREATE TABLE IF NOT EXISTS beneficio_pollo (
      id_beneficio INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_camada INT NULL,
      peso_en_vivo DECIMAL(10,2) NOT NULL,
      peso_sacrificado DECIMAL(10,2) NOT NULL,
      precio DECIMAL(12,2) NOT NULL,
      cantidad_beneficiados INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_beneficio_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),
      CONSTRAINT fk_beneficio_camada FOREIGN KEY (id_camada) REFERENCES camada_pollos(id_camada)
    ) ENGINE=InnoDB;
  `;

  const createInformeFinalCamadaTableQuery = `
    CREATE TABLE IF NOT EXISTS informe_final_camada (
      id_informe INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_camada INT NOT NULL,
      nombre_camada VARCHAR(120) NOT NULL,
      galpon VARCHAR(120) NULL,
      fecha_llegada DATE NULL,
      fecha_cierre DATE NULL,
      total_dias INT NOT NULL DEFAULT 0,
      aves_iniciales INT NOT NULL DEFAULT 0,
      aves_finales INT NOT NULL DEFAULT 0,
      mortalidad_total INT NOT NULL DEFAULT 0,
      peso_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
      peso_final DECIMAL(10,2) NOT NULL DEFAULT 0,
      ganancia_peso DECIMAL(10,2) NOT NULL DEFAULT 0,
      consumo_total_alimento DECIMAL(10,2) NOT NULL DEFAULT 0,
      indice_conversion DECIMAL(12,4) NOT NULL DEFAULT 0,
      observaciones VARCHAR(600) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_informe_final_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id),
      CONSTRAINT fk_informe_final_camada FOREIGN KEY (id_camada) REFERENCES camada_pollos(id_camada)
    ) ENGINE=InnoDB;
  `;

  const removeColumnIfExists = (columnName, done) => {
    const columnExistsQuery = `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'datos_iniciales_pollos'
        AND COLUMN_NAME = ?
    `;

    connection.query(columnExistsQuery, [columnName], (checkErr, rows) => {
      if (checkErr) {
        done(checkErr);
        return;
      }

      const exists = rows && rows[0] && Number(rows[0].total) > 0;
      if (!exists) {
        done(null);
        return;
      }

      const dropQuery = `ALTER TABLE datos_iniciales_pollos DROP COLUMN ${columnName}`;
      connection.query(dropQuery, done);
    });
  };

  const ensureUsuarioPasswordColumn = (done) => {
    const columnExistsQuery = `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuario'
        AND COLUMN_NAME = 'password_hash'
    `;

    connection.query(columnExistsQuery, (checkErr, rows) => {
      if (checkErr) {
        done(checkErr);
        return;
      }

      const exists = rows && rows[0] && Number(rows[0].total) > 0;
      if (exists) {
        done(null);
        return;
      }

      connection.query(
        "ALTER TABLE usuario ADD COLUMN password_hash VARCHAR(255) NULL",
        done,
      );
    });
  };

  const ensureSeguimientoOwnership = (done) => {
    const columnExistsQuery = `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'seguimiento_diario_camadas'
        AND COLUMN_NAME = 'id_usuario'
    `;

    connection.query(columnExistsQuery, (columnErr, rows) => {
      if (columnErr) {
        done(columnErr);
        return;
      }

      const hasColumn = rows && rows[0] && Number(rows[0].total) > 0;
      const addColumnTask = (next) => {
        if (hasColumn) {
          next(null);
          return;
        }

        const alterAddColumnQuery = `
          ALTER TABLE seguimiento_diario_camadas
          ADD COLUMN id_usuario INT NULL AFTER id_camada
        `;

        connection.query(alterAddColumnQuery, next);
      };

      const dropLegacyUniqueTask = (next) => {
        const camadaIdxExistsQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'seguimiento_diario_camadas'
            AND INDEX_NAME = 'idx_seguimiento_camada'
        `;

        const legacyIndexExistsQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'seguimiento_diario_camadas'
            AND INDEX_NAME = 'uq_camada_fecha'
        `;

        connection.query(
          camadaIdxExistsQuery,
          (camadaIdxErr, camadaIdxRows) => {
            if (camadaIdxErr) {
              next(camadaIdxErr);
              return;
            }

            const camadaIdxExists =
              camadaIdxRows &&
              camadaIdxRows[0] &&
              Number(camadaIdxRows[0].total) > 0;

            const continueWithLegacyDrop = () => {
              connection.query(
                legacyIndexExistsQuery,
                (legacyErr, legacyRows) => {
                  if (legacyErr) {
                    next(legacyErr);
                    return;
                  }

                  const legacyExists =
                    legacyRows &&
                    legacyRows[0] &&
                    Number(legacyRows[0].total) > 0;

                  if (!legacyExists) {
                    next(null);
                    return;
                  }

                  connection.query(
                    "ALTER TABLE seguimiento_diario_camadas DROP INDEX uq_camada_fecha",
                    next,
                  );
                },
              );
            };

            if (camadaIdxExists) {
              continueWithLegacyDrop();
              return;
            }

            connection.query(
              "ALTER TABLE seguimiento_diario_camadas ADD INDEX idx_seguimiento_camada (id_camada)",
              (createCamadaIdxErr) => {
                if (createCamadaIdxErr) {
                  next(createCamadaIdxErr);
                  return;
                }

                continueWithLegacyDrop();
              },
            );
          },
        );
      };

      const createUniqueTask = (next) => {
        const uniqueExistsQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'seguimiento_diario_camadas'
            AND INDEX_NAME = 'uq_seguimiento_usuario_camada_fecha'
        `;

        connection.query(uniqueExistsQuery, (idxErr, idxRows) => {
          if (idxErr) {
            next(idxErr);
            return;
          }

          const uniqueExists =
            idxRows && idxRows[0] && Number(idxRows[0].total) > 0;
          if (uniqueExists) {
            next(null);
            return;
          }

          connection.query(
            "ALTER TABLE seguimiento_diario_camadas ADD UNIQUE INDEX uq_seguimiento_usuario_camada_fecha (id_usuario, id_camada, fecha_registro)",
            next,
          );
        });
      };

      const createLookupIndexTask = (next) => {
        const idxExistsQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'seguimiento_diario_camadas'
            AND INDEX_NAME = 'idx_seguimiento_usuario_camada'
        `;

        connection.query(idxExistsQuery, (idxErr, idxRows) => {
          if (idxErr) {
            next(idxErr);
            return;
          }

          const exists = idxRows && idxRows[0] && Number(idxRows[0].total) > 0;
          if (exists) {
            next(null);
            return;
          }

          connection.query(
            "ALTER TABLE seguimiento_diario_camadas ADD INDEX idx_seguimiento_usuario_camada (id_usuario, id_camada)",
            next,
          );
        });
      };

      const ensureForeignKeyTask = (next) => {
        const fkExistsQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'seguimiento_diario_camadas'
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND CONSTRAINT_NAME = 'fk_seguimiento_usuario'
        `;

        connection.query(fkExistsQuery, (fkErr, fkRows) => {
          if (fkErr) {
            next(fkErr);
            return;
          }

          const exists = fkRows && fkRows[0] && Number(fkRows[0].total) > 0;
          if (exists) {
            next(null);
            return;
          }

          connection.query(
            "ALTER TABLE seguimiento_diario_camadas ADD CONSTRAINT fk_seguimiento_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id)",
            next,
          );
        });
      };

      addColumnTask((addErr) => {
        if (addErr) {
          done(addErr);
          return;
        }

        dropLegacyUniqueTask((dropErr) => {
          if (dropErr) {
            done(dropErr);
            return;
          }

          createUniqueTask((uniqueErr) => {
            if (uniqueErr) {
              done(uniqueErr);
              return;
            }

            createLookupIndexTask((indexErr) => {
              if (indexErr) {
                done(indexErr);
                return;
              }

              ensureForeignKeyTask(done);
            });
          });
        });
      });
    });
  };

  const ensureBeneficioCamadaRelation = (done) => {
    const idCamadaColumnQuery = `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'beneficio_pollo'
        AND COLUMN_NAME = 'id_camada'
    `;

    connection.query(idCamadaColumnQuery, (columnErr, rows) => {
      if (columnErr) {
        done(columnErr);
        return;
      }

      const hasColumn = rows && rows[0] && Number(rows[0].total) > 0;

      const addColumnTask = (next) => {
        if (hasColumn) {
          next(null);
          return;
        }

        connection.query(
          "ALTER TABLE beneficio_pollo ADD COLUMN id_camada INT NULL AFTER id_usuario",
          next,
        );
      };

      const createIndexTask = (next) => {
        const indexQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'beneficio_pollo'
            AND INDEX_NAME = 'idx_beneficio_camada'
        `;

        connection.query(indexQuery, (idxErr, idxRows) => {
          if (idxErr) {
            next(idxErr);
            return;
          }

          const hasIndex = idxRows && idxRows[0] && Number(idxRows[0].total) > 0;
          if (hasIndex) {
            next(null);
            return;
          }

          connection.query(
            "ALTER TABLE beneficio_pollo ADD INDEX idx_beneficio_camada (id_camada)",
            next,
          );
        });
      };

      const ensureForeignKeyTask = (next) => {
        const fkExistsQuery = `
          SELECT COUNT(*) AS total
          FROM information_schema.TABLE_CONSTRAINTS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'beneficio_pollo'
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND CONSTRAINT_NAME = 'fk_beneficio_camada'
        `;

        connection.query(fkExistsQuery, (fkErr, fkRows) => {
          if (fkErr) {
            next(fkErr);
            return;
          }

          const hasFk = fkRows && fkRows[0] && Number(fkRows[0].total) > 0;
          if (hasFk) {
            next(null);
            return;
          }

          connection.query(
            "ALTER TABLE beneficio_pollo ADD CONSTRAINT fk_beneficio_camada FOREIGN KEY (id_camada) REFERENCES camada_pollos(id_camada)",
            next,
          );
        });
      };

      addColumnTask((addErr) => {
        if (addErr) {
          done(addErr);
          return;
        }

        createIndexTask((indexErr) => {
          if (indexErr) {
            done(indexErr);
            return;
          }

          ensureForeignKeyTask(done);
        });
      });
    });
  };

  connection.query(createUsuarioTableQuery, (usuarioErr) => {
    if (usuarioErr) {
      console.error("Error creating usuario table:", usuarioErr);
      return;
    }

    ensureUsuarioPasswordColumn((usuarioColumnErr) => {
      if (usuarioColumnErr) {
        console.error(
          "Error ensuring password_hash column in usuario:",
          usuarioColumnErr,
        );
        return;
      }

      connection.query(createCamadaTableQuery, (camadaErr) => {
        if (camadaErr) {
          console.error("Error creating camada_pollos table:", camadaErr);
          return;
        }

        connection.query(createDatosInicialesTableQuery, (datosErr) => {
          if (datosErr) {
            console.error(
              "Error creating datos_iniciales_pollos table:",
              datosErr,
            );
            return;
          }

          removeColumnIfExists("cantidad_comida_kg", (cleanupErrOne) => {
            if (cleanupErrOne) {
              console.error(
                "Error removing legacy column cantidad_comida_kg:",
                cleanupErrOne,
              );
              return;
            }

            removeColumnIfExists("precio_total", (cleanupErrTwo) => {
              if (cleanupErrTwo) {
                console.error(
                  "Error removing legacy column precio_total:",
                  cleanupErrTwo,
                );
                return;
              }

              connection.query(
                createSeguimientoDiarioTableQuery,
                (seguimientoErr) => {
                  if (seguimientoErr) {
                    console.error(
                      "Error creating seguimiento_diario_camadas table:",
                      seguimientoErr,
                    );
                    return;
                  }

                  connection.query(
                    createBeneficioPolloTableQuery,
                    (beneficioErr) => {
                      if (beneficioErr) {
                        console.error(
                          "Error creating beneficio_pollo table:",
                          beneficioErr,
                        );
                        return;
                      }

                      connection.query(
                        createInformeFinalCamadaTableQuery,
                        (informeErr) => {
                          if (informeErr) {
                            console.error(
                              "Error creating informe_final_camada table:",
                              informeErr,
                            );
                            return;
                          }

                          ensureSeguimientoOwnership((ownershipErr) => {
                            if (ownershipErr) {
                              console.error(
                                "Error ajustando ownership en seguimiento_diario_camadas:",
                                ownershipErr,
                              );
                              return;
                            }

                            ensureBeneficioCamadaRelation((beneficioCamadaErr) => {
                              if (beneficioCamadaErr) {
                                console.error(
                                  "Error asegurando relacion camada en beneficio_pollo:",
                                  beneficioCamadaErr,
                                );
                                return;
                              }

                              console.log("Tablas de datos iniciales listas");
                            });
                          });
                        },
                      );
                    },
                  );
                },
              );
            });
          });
        });
      });
    });
  });
});

module.exports = connection;
