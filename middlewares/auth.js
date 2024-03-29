const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
	try {

		const token = await req.headers.authorization.split(" ")[1];
		const user = await jwt.verify(token, process.env.JWT_SECRET);
		req.user = user;

		next();
	} catch (error) {
		res.status(401).json({
			error: new Error("Unauthorized"),
		});
	}
};
