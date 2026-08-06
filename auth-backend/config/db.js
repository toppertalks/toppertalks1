const mongoose = require("mongoose");
const { config } = require("./env");

const connectDatabase = async () => {
	if (!config.MONGO_URI) {
		throw new Error("MONGO_URI is required in environment variables.");
	}

	await mongoose.connect(config.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});

	console.log("MongoDB connected successfully.");
};

module.exports = { connectDatabase };
