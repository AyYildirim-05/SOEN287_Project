const { auth } = require("../database/firebase");

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error.message);
    res.status(403).json({ message: "Unauthorized" });
  }
}

module.exports = { verifyToken };
