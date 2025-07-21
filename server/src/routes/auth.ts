import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updatePassword,
  getMe,
  updateProfile,
  deleteAccount
} from '@/controllers/authController';
import {
  protect,
  rateLimitAuth,
  refreshTokenMiddleware,
  updateOnlineStatus
} from '@/middleware/auth';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updatePasswordValidation,
  updateProfileValidation
} from '@/utils/validation';

const router = express.Router();

// Public routes
router.post('/register', rateLimitAuth, registerValidation, register);
router.post('/login', rateLimitAuth, loginValidation, login);
router.post('/refresh-token', refreshTokenMiddleware, refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', forgotPasswordValidation, resendVerification);
router.post('/forgot-password', rateLimitAuth, forgotPasswordValidation, forgotPassword);
router.put('/reset-password/:token', resetPasswordValidation, resetPassword);

// Protected routes
router.use(protect); // All routes below require authentication
router.use(updateOnlineStatus); // Update user online status

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/update-password', updatePasswordValidation, updatePassword);
router.put('/update-profile', updateProfileValidation, updateProfile);
router.delete('/delete-account', deleteAccount);

export default router;