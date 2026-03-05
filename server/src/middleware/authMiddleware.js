const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return res.status(401).json({ message: "No autorizado. Inicia sesion." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    if (!payload?.id || Number(payload.id) <= 0) {
      return res.status(401).json({ message: "Token invalido." });
    }

    req.user = {
      id: Number(payload.id),
      correo_electronico: payload.correo_electronico,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Sesion expirada o invalida." });
  }
};

module.exports = {
  requireAuth,
};
