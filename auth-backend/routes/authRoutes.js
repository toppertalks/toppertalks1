const express = require("express");
const router = express.Router();
const {
	signup,
	login,
	refreshToken,
	logout,
	verifyEmail,
	requestPasswordReset,
	resetPassword,
} = require("../controllers/authController");
const {
	sanitizeRequest,
	signupValidation,
	loginValidation,
	emailValidation,
	resetPasswordValidation,
} = require("../middleware/validateRequest");
const { csrfProtection } = require("../middleware/csrfProtection");

router.use(sanitizeRequest);
router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);
router.post("/refresh", csrfProtection, refreshToken);
router.post("/logout", csrfProtection, logout);
router.get("/verify-email", verifyEmail);
router.post("/request-password-reset", emailValidation, requestPasswordReset);
router.post("/reset-password", resetPasswordValidation, resetPassword);

module.exports = router;
