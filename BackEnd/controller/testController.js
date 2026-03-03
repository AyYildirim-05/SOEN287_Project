function testController(req, res) {
    res.json({ message: "Backend is working" });
}

module.exports = { testController };