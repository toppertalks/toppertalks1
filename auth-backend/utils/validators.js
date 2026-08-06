const validator = require("validator");

const sanitizeString = (value) => {
	if (typeof value !== "string") return value;
	return validator.escape(value.trim());
};

const isStrongPassword = (password) => {
	return validator.isStrongPassword(password, {
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
	});
};

module.exports = { sanitizeString, isStrongPassword };
