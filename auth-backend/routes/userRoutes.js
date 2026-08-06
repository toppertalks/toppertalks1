const express = require("express");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const {
	getProfile,
	getAdminDashboard,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", authenticate, getProfile);
router.get(
	"/admin/dashboard",
	authenticate,
	authorize("admin"),
	getAdminDashboard,
);

module.exports = router;
