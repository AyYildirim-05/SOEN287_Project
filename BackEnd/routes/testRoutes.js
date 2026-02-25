const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
    res.json({ message: "Backend is working" });
});

module.exports = router;

/**
 * In `Express`, routes define how your server responds to requests.
 * When the browser or frontend sends a request like: `GET /api/students`, routes decide what happens.
 * An analogy: If your server is a restaurant, routes are like the menu. They tell the server what to do when a customer (the frontend) orders something (sends a request).
 */