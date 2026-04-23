const { body, validationResult } = require("express-validator");
const mongoSanitize = require("express-mongo-sanitize");
const AppError = require("../utils/AppError");

const validate = (validations) => async (req, res, next) => {
	await Promise.all(validations.map((validation) => validation.run(req)));

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const message = errors
			.array()
			.map((err) => `${err.param}: ${err.msg}`)
			.join("; ");
		return next(new AppError(message, 400, { errors: errors.array() }));
	}

	next();
};

const sanitizeRequest = mongoSanitize();

const signupValidation = validate([
	body("name")
		.trim()
		.isLength({ min: 2, max: 100 })
		.withMessage("Name must be between 2 and 100 characters."),
	body("email").trim().isEmail().withMessage("Invalid email address."),
	body("password")
		.isStrongPassword({
			minLength: 8,
			minLowercase: 1,
			minUppercase: 1,
			minNumbers: 1,
			minSymbols: 1,
		})
		.withMessage(
			"Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.",
		),
]);

const loginValidation = validate([
	body("email").trim().isEmail().withMessage("Invalid email address."),
	body("password").notEmpty().withMessage("Password is required."),
]);

const emailValidation = validate([
	body("email").trim().isEmail().withMessage("Invalid email address."),
]);

const resetPasswordValidation = validate([
	body("email").trim().isEmail().withMessage("Invalid email address."),
	body("token").trim().notEmpty().withMessage("Reset token is required."),
	body("password")
		.isStrongPassword({
			minLength: 8,
			minLowercase: 1,
			minUppercase: 1,
			minNumbers: 1,
			minSymbols: 1,
		})
		.withMessage(
			"Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.",
		),
]);

module.exports = {
	validate,
	sanitizeRequest,
	signupValidation,
	loginValidation,
	emailValidation,
	resetPasswordValidation,
};
