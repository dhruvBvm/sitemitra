const User = require('../user/user.model');
const jwt = require('jsonwebtoken');

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (uses httpOnly refresh token)
const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, { expiresIn: '1m' });
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    };
    res.cookie('accessToken', newAccessToken, cookieOptions);
    return res.json({
      message: 'Token refreshed',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        assignedSites: user.assignedSites,
        bookmarkedSiteId: user.bookmarkedSiteId
      }
    });
  } catch (err) {
    console.error('Refresh token verification error:', err);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Logout user and clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: '' } });
    } catch (e) {
      // ignore errors
    }
  }
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' };
  res.clearCookie('accessToken', cookieOpts);
  res.clearCookie('refreshToken', cookieOpts);
  return res.json({ message: 'Logged out' });
};

// @desc    Register initial owner
// @route   POST /api/auth/register
// @access  Public
const registerOwner = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ message: 'Please provide name, email, mobile, and password' });
  }

  try {
    // Check if any owner exists in the DB
    const ownerExists = await User.findOne({ role: 'owner' });
    if (ownerExists) {
      return res.status(400).json({ message: 'Owner already exists. Only the first owner registration is allowed.' });
    }

    // Check if user with same email or mobile exists
    const userExists = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email or mobile already exists' });
    }

    // Create the owner user
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: 'owner'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        assignedSites: user.assignedSites,
        bookmarkedSiteId: user.bookmarkedSiteId
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Public registration (staff only)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, mobile, password, role = 'staff' } = req.body;

  // Only allow staff role
  if (role !== 'staff') {
    return res.status(403).json({ message: 'Use staff role or contact owner' });
  }

  // Validate required fields
  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ message: 'Please provide name, email, mobile, and password' });
  }

  try {
    // Check uniqueness of email or mobile
    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      return res.status(400).json({ message: 'User with this email or mobile already exists' });
    }

    // Create user (pre-save hook hashes password)
    const user = await User.create({ name, email, mobile, password, role, status: 'active' });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const login = async (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) {
    return res.status(400).json({ message: 'Please provide loginId (email or mobile) and password' });
  }

  try {
    const user = await User.findOne({ $or: [{ email: loginId }, { mobile: loginId }] });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account disabled, contact owner' });
    }

    // Generate tokens
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET, { expiresIn: '1m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '7d' });

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Set HttpOnly cookies
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    };
    const refreshCookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    // Return user info (no tokens)
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      assignedSites: user.assignedSites,
      bookmarkedSiteId: user.bookmarkedSiteId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password (generates OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { loginId } = req.body;
  if (!loginId) return res.status(400).json({ message: 'Please provide email or mobile' });

  try {
    const user = await User.findOne({
      $or: [{ email: loginId }, { mobile: loginId }]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit OTP (simplified for testing, return in response)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real app, store OTP in DB and email/SMS it
    // For now, return it
    res.json({ success: true, message: 'OTP generated', otp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password (with OTP)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { loginId, otp, newPassword } = req.body;
  if (!loginId || !otp || !newPassword) {
    return res.status(400).json({ message: 'Please provide loginId, otp, and newPassword' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: loginId }, { mobile: loginId }]
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Assuming OTP verification passed (mocked here)
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerOwner,
  login,
  register,
  forgotPassword,
  resetPassword,
  refresh,
  logout
};
