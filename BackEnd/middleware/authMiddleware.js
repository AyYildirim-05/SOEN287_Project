const { auth } = require("../database/firebase");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("Authorization header received:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    console.log("Decoded token uid:", decodedToken.uid);
    console.log("Decoded token aud:", decodedToken.aud);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(403).json({ message: "Unauthorized" });
  }
}

module.exports = { verifyToken };
