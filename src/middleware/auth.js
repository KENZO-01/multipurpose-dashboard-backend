
const jwt = require("jsonwebtoken")
const User = require("../models/User")

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({
    status_code: 401,
    error: 'unauthorised user'
  })

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if(!req.user) return res.status(404).json({
      status_code: 404,
      error: "User not Found"
    })
    next()
  } catch(err) {
    res.status(403).json({
      status_code: 403,
      error: 'Invalid Token'
    })
  }
}