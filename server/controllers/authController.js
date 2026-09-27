const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "local",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the account.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.authProvider !== "local") {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.authProvider} login.`,
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    user.isOnline = true;
    user.lastSeen = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken, googleId, email, name, profileImage } = req.body;

    let userEmail = email;
    let userName = name;
    let userGoogleId = googleId;
    let userPicture = profileImage;

    if (idToken) {
      try {
        const googleRes = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
        );
        if (googleRes.data && googleRes.data.email) {
          userEmail = googleRes.data.email;
          userName = googleRes.data.name || name;
          userGoogleId = googleRes.data.sub || googleId;
          userPicture = googleRes.data.picture || profileImage;
        }
      } catch (err) {
        console.warn("Google idToken verification warning:", err.message);
      }
    } else if (accessToken) {
      try {
        const googleRes = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (googleRes.data && googleRes.data.email) {
          userEmail = googleRes.data.email;
          userName = googleRes.data.name || name;
          userGoogleId = googleRes.data.sub || googleId;
          userPicture = googleRes.data.picture || profileImage;
        }
      } catch (err) {
        console.warn("Google accessToken verification warning:", err.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Google authentication failed. Email is required.",
      });
    }

    const normalizedEmail = userEmail.trim().toLowerCase();

    let user = await User.findOne({
      $or: [{ googleId: userGoogleId }, { email: normalizedEmail }],
    });

    if (user) {
      if (!user.googleId && userGoogleId) {
        user.googleId = userGoogleId;
      }
      if (userPicture && (!user.profileImage || user.profileImage === "")) {
        user.profileImage = userPicture;
      }
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: (userName || "Google User").trim(),
        email: normalizedEmail,
        googleId: userGoogleId || `google_${Date.now()}`,
        profileImage: userPicture || "",
        authProvider: "google",
        isOnline: true,
        lastSeen: new Date(),
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        authProvider: user.authProvider,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during Google registration/login.",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profileImage: req.user.profileImage,
        authProvider: req.user.authProvider,
        isOnline: req.user.isOnline,
        lastSeen: req.user.lastSeen,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get user information.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  getCurrentUser,
};