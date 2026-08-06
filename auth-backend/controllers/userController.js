const getProfile = async (req, res) => {
	res.json({
		success: true,
		data: {
			id: req.user.id,
			name: req.user.name,
			email: req.user.email,
			role: req.user.role,
			createdAt: req.user.createdAt,
		},
	});
};

const getAdminDashboard = async (req, res) => {
	res.json({
		success: true,
		data: {
			message: "Welcome to the admin dashboard.",
			admin: req.user.email,
		},
	});
};

module.exports = { getProfile, getAdminDashboard };
