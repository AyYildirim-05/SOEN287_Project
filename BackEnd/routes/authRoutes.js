const express = require("express");
const { signInController, signUpController} = require("../controller/authController");
const router = express.Router();


router.post("/signup" ,signUpController);
router.post("/signin", signInController);

module.exports = router;
