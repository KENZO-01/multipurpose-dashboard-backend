function role(...allowedRoles) {
  return (req, res, next) => {
    if (!req?.user?.role) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    if (!allowedRoles.includes(req?.user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = role;
