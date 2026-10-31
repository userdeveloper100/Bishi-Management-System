import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { otpService } from "../services/otp.service";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body;
      const newUser = await authService.register(name, email, password, phone);
      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(err.status ?? 400).json({ message: err.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ message: err.message });
    }
  },

  // OTP errors are thrown as HttpError and returned by the global error handler as { success: false, message }.
  async sendOtp(req: Request, res: Response) {
    res.json(await otpService.sendOtp(req.body?.phone));
  },

  async verifyOtp(req: Request, res: Response) {
    const phone = await otpService.verifyOtp(req.body?.phone, req.body?.otp);
    const result = await authService.loginWithPhone(phone);
    res.json({ success: true, token: result.token, user: result.user });
  },
};
