import { Router } from "express";
import { authController } from "../controllers/auth.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthRegisterInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           example: "Shailendra Pardeshi"
 *         email:
 *           type: string
 *           format: email
 *           example: "shailendra@example.com"
 *         phone:
 *           type: string
 *           description: Unique ten-digit Indian mobile number. Required for every account.
 *           example: "+919876543210"
 *         password:
 *           type: string
 *           format: password
 *           example: "P@ssword123"
 *     AuthLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "shailendra@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "P@ssword123"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input, including a missing or malformed phone number
 *       409:
 *         description: An account with this email or phone number already exists
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginInput'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authController.login);

/**
 * @swagger
 * components:
 *   schemas:
 *     SendOtpInput:
 *       type: object
 *       required:
 *         - phone
 *       properties:
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *     VerifyOtpInput:
 *       type: object
 *       required:
 *         - phone
 *         - otp
 *       properties:
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         otp:
 *           type: string
 *           example: "482616"
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send a one-time code by SMS to an Indian mobile number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtpInput'
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Invalid phone number
 *       429:
 *         description: Resend requested too soon, or too many requests this hour
 */
router.post("/send-otp", authController.sendOtp);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify an OTP and sign in (creates the account on first use)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpInput'
 *     responses:
 *       200:
 *         description: Signed in
 *       400:
 *         description: Invalid phone number or OTP format
 *       401:
 *         description: Invalid OTP, or the OTP expired or was not found
 *       429:
 *         description: Too many incorrect attempts
 */
router.post("/verify-otp", authController.verifyOtp);

export default router;
