const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

let serviceAccount;

try {
  // Option 1: Load from a file path specified in .env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
  } 
  // Option 2: Load from a JSON string in .env
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
} catch (error) {
  console.error("Error loading Firebase service account:", error.message);
}

let auth;
let db;

if (serviceAccount) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    console.log("Firebase Admin initialized successfully.");
    auth = admin.auth();
    db = admin.firestore();
  } catch (error) {
    console.error("Firebase initialization error:", error.message);
  }
} else {
  console.error("CRITICAL: Firebase Admin NOT initialized. Please check your .env and serviceAccountKey.json.");
  // Provide dummy objects or handle undefined in controllers to prevent immediate crash
  auth = null;
  db = null;
}

module.exports = { auth, db, admin };
