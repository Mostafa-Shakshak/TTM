const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");
const { sendPasswordResetEmail } = require("../../config/mailer");

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const RESET_RESPONSE =
	"If an account exists for this email, a reset code has been sent";

function validatePassword(password) {
	if (!password || password.length < 8) {
		throw new Error("Password must be at least 8 characters");
	}

	if (
		!/[a-z]/.test(password) ||
		!/[A-Z]/.test(password) ||
		!/[0-9]/.test(password) ||
		!/[^A-Za-z0-9]/.test(password)
	) {
		throw new Error(
			"Password must include uppercase, lowercase, number and special character",
		);
	}
}

async function signupService(data) {
	const { name, username, email, password } = data;

	if (!name || !username || !email || !password) {
		throw new Error("All fields are required");
	}

	validatePassword(password);

	const existingEmail = await prisma.user.findUnique({
		where: { email: email.toLowerCase() },
	});

	if (existingEmail) {
		throw new Error("Email already exists");
	}

	const existingUsername = await prisma.user.findUnique({
		where: { username },
	});

	if (existingUsername) {
		throw new Error("Username already exists");
	}

	const hashedPassword = await bcrypt.hash(password, 12);

	try {
		const user = await prisma.user.create({
			data: {
				name: name.trim(),
				username: username.trim(),
				email: email.toLowerCase().trim(),
				password: hashedPassword,
			},
		});

		const { password: _, ...safeUser } = user;
		return safeUser;
	} catch (err) {
		console.error(err);
		throw new Error("Unable to create account");
	}
}

async function loginService(data) {
	const { email, password } = data;

	if (!email || !password) {
		throw new Error("All fields are required");
	}

	const user = await prisma.user.findUnique({
		where: {
			email: email.toLowerCase().trim(),
		},
	});

	if (!user) {
		throw new Error("Invalid credentials");
	}

	const isCorrectPassword = await bcrypt.compare(password, user.password);

	if (!isCorrectPassword) {
		throw new Error("Invalid credentials");
	}

	return createSession(user);
}

async function createSession(user) {
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	const session = await prisma.authSession.create({
		data: {
			userId: user.id,
			refreshTokenHash: "pending",
			expiresAt,
		},
	});

	const accessToken = createAccessToken(user, session.id);

	const refreshToken = createRefreshToken(user, session.id);

	const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

	await prisma.authSession.update({
		where: {
			id: session.id,
		},
		data: {
			refreshTokenHash,
		},
	});

	return {
		accessToken,
		refreshToken,
	};
}

async function refreshTokenService(refreshToken) {
	if (!refreshToken) {
		throw new Error("Refresh token is required");
	}

	let decoded;

	try {
		decoded = jwt.verify(refreshToken, REFRESH_SECRET);
	} catch (err) {
		throw new Error("Invalid refresh token");
	}

	if (decoded.type !== "refresh" || !decoded.sessionId) {
		throw new Error("Invalid refresh token");
	}

	const session = await prisma.authSession.findUnique({
		where: {
			id: decoded.sessionId,
		},
		include: {
			user: true,
		},
	});

	if (!session || session.revokedAt || session.expiresAt <= new Date()) {
		throw new Error("Refresh token has been revoked");
	}

	const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);

	if (!isValid) {
		await prisma.authSession.update({
			where: { id: session.id },
			data: { revokedAt: new Date() },
		});
		throw new Error("Refresh token has been revoked");
	}

	const newAccessToken = createAccessToken(session.user, session.id);

	const newRefreshToken = createRefreshToken(session.user, session.id);

	const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

	await prisma.authSession.update({
		where: { id: session.id },
		data: {
			refreshTokenHash: newRefreshTokenHash,
		},
	});

	return {
		accessToken: newAccessToken,
		refreshToken: newRefreshToken,
	};
}

async function logoutService(userId, sessionId) {
	await prisma.authSession.updateMany({
		where: {
			id: sessionId,
			userId,
			revokedAt: null,
		},
		data: {
			revokedAt: new Date(),
		},
	});

	return {
		message: "Logged out successfully",
	};
}

async function logoutAllService(userId) {
	await prisma.authSession.updateMany({
		where: {
			userId,
			revokedAt: null,
		},
		data: {
			revokedAt: new Date(),
		},
	});
	return {
		message: "Logged out from all devices successfully",
	};
}

async function changePasswordService(userId, data) {
	const { currentPassword, newPassword } = data;

	if (!currentPassword || !newPassword) {
		throw new Error("All fields are required");
	}

	validatePassword(newPassword);

	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		throw new Error("User Not Found");
	}

	const isCorrect = await bcrypt.compare(currentPassword, user.password);

	if (!isCorrect) {
		throw new Error("Current password is incorrect");
	}

	const hashedPassword = await bcrypt.hash(newPassword, 12);

	await prisma.$transaction([
		prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		}),
		prisma.authSession.updateMany({
			where: {
				userId,
				revokedAt: null,
			},
			data: {
				revokedAt: new Date(),
			},
		}),
	]);

	return {
		message: "Password changed successfully",
	};
}

async function requestPasswordResetService(email) {
	if (!email) {
		return { message: RESET_RESPONSE };
	}

	const user = await prisma.user.findUnique({
		where: {
			email: email.toLowerCase().trim(),
		},
	});

	if (!user) {
		return { message: RESET_RESPONSE };
	}

	const existingOtp = await prisma.passwordResetOtp.findUnique({
		where: {
			userId: user.id,
		},
	});

	if (existingOtp && Date.now() - existingOtp.createdAt.getTime() < 60000) {
		return { message: RESET_RESPONSE };
	}

	const otp = crypto.randomInt(100000, 1000000).toString();

	const otpHash = await bcrypt.hash(otp, 12);
	const expiresAt = new Date(Date.now() + 60000);

	await prisma.passwordResetOtp.upsert({
		where: {
			userId: user.id,
		},
		update: {
			otpHash,
			attempts: 0,
			expiresAt,
			createdAt: new Date(),
		},
		create: {
			userId: user.id,
			otpHash,
			expiresAt,
		},
	});

	try {
		await sendPasswordResetEmail(user.email, user.name, otp);
	} catch (err) {
		await prisma.passwordResetOtp.deleteMany({
			where: {
				userId: user.id,
			},
		});
		throw new Error("Password reset email failed");
	}

	return { message: RESET_RESPONSE };
}

async function resetPasswordService(data) {
	const { email, otp, newPassword } = data;

	if (!email || !otp || !newPassword) {
		throw new Error("All fields are required");
	}

	validatePassword(newPassword);

	const user = await prisma.user.findUnique({
		where: {
			email: email.toLowerCase().trim(),
		},
	});

	if (!user) {
		throw new Error("Invalid or expired reset code");
	}

	const resetOtp = await prisma.passwordResetOtp.findUnique({
		where: {
			userId: user.id,
		},
	});

	if (!resetOtp || resetOtp.expiresAt <= new Date() || resetOtp.attempts >= 5) {
		await prisma.passwordResetOtp.deleteMany({
			where: { userId: user.id },
		});
		throw new Error("Invalid or expired reset code");
	}

	const isCorrect = await bcrypt.compare(otp, resetOtp.otpHash);

	if (!isCorrect) {
		const updated = await prisma.passwordResetOtp.update({
			where: { userId: user.id },
			data: {
				attempts: {
					increment: 1,
				},
			},
		});

		if (updated.attempts >= 5) {
			await prisma.passwordResetOtp.delete({
				where: { userId: user.id },
			});
		}

		throw new Error("Invalid or expired reset code");
	}

	const hashedPassword = await bcrypt.hash(newPassword, 12);

	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		}),
		prisma.passwordResetOtp.delete({
			where: { userId: user.id },
		}),
		prisma.authSession.updateMany({
			where: {
				userId: user.id,
				revokedAt: null,
			},
			data: {
				revokedAt: new Date(),
			},
		}),
	]);

	return {
		message: "Password reset successfully",
	};
}

function createAccessToken(user, sessionId) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			sessionId,
			type: "access",
		},
		ACCESS_SECRET,
		{
			expiresIn: "15m",
		},
	);
}

function createRefreshToken(user, sessionId) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			sessionId,
			type: "refresh",
		},
		REFRESH_SECRET,
		{
			expiresIn: "7d",
		},
	);
}

module.exports = {
	signupService,
	loginService,
	refreshTokenService,
	logoutService,
	logoutAllService,
	changePasswordService,
	requestPasswordResetService,
	resetPasswordService,
};
