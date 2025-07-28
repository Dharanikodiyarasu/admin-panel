// import express, { Request, Response } from 'express';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcrypt';
// import { Admin } from '../models/table';

// const router = express.Router();

// router.post('/login', async (req: Request, res: Response) => {
//   const { adminEmail, password } = req.body;

//   if (!adminEmail || !password) {
//     return res.status(400).json({ code: "9999", message: "Missing email or password" });
//   }

//   try {
//     const admin = await Admin.findOne({ where: { adminEmail } });
//     if (!admin) {
//       return res.status(401).json({ code: "9999", message: "Invalid email or password" });
//     }

//     const isMatch = await bcrypt.compare(password.trim(), admin.password);
//     if (!isMatch) {
//       return res.status(401).json({ code: "9999", message: "Invalid email or password" });
//     }

//     const token = jwt.sign(
//       {
//         adminId: admin.adminId,
//         role: admin.roleName
//       },
//       process.env.SECRET_KEY!,
//       { expiresIn: '1h' }
//     );

//     return res.status(200).json({
//       code: "0000",
//       message: "Login successful",
//       token,
//       role: admin.roleName,
//       adminId: admin.adminId
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ code: "9999", message: "Internal server error" });
//   }
// });

// export default router;



import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Admin } from '../models/table';
import { sendMessage } from '../kafka/producer';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const { adminEmail, password } = req.body;

  if (!adminEmail || !password) {
    return res.status(400).json({ code: "9999", message: "Missing email or password" });
  }

  try {
    const admin = await Admin.findOne({ where: { adminEmail } });
    if (!admin) {
      return res.status(401).json({ code: "9999", message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password.trim(), admin.password);
    if (!isMatch) {
      return res.status(401).json({ code: "9999", message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        adminId: admin.adminId,
        role: admin.roleName
      },
      process.env.SECRET_KEY!,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      code: "0000",
      message: "Login successful",
      token,
      role: admin.roleName,
      adminId: admin.adminId
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: "9999", message: "Internal server error" });
  }
});


router.post('/forgot-password', async (req: Request, res: Response) => {
  const { adminEmail } = req.body;

  try {
    const admin = await Admin.findOne({ where: { adminEmail } });
    if (!admin) {
      return res.status(404).json({ code: '9999', message: 'Email not found' });
    }

    const token = jwt.sign(
      { adminId: admin.adminId },
      process.env.SECRET_KEY!,
      { expiresIn: '15m' }
    );

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await sendMessage('forgot-password-topic', {
      to: adminEmail,
      subject: 'Password Reset',
      //   html: `
      //     <p>Hello ${admin.adminName},</p>
      //     <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
      //     <p>This link expires in 15 minutes.</p>
      //   `,
      // });

      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #333;">Hello ${admin.adminName},</h2>
    <p style="font-size: 16px; color: #555;">
      You requested to reset your password. Please click the button below to proceed.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: #007bff; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-size: 16px;">
        Reset Password
      </a>
    </div>
    <p style="font-size: 14px; color: #888;">
      This link will expire in <strong>15 minutes</strong>. If you didn’t request this, you can safely ignore this email.
    </p>
    <p style="font-size: 14px; color: #aaa;">— The Team</p>
  </div>
`
    });

    res.status(200).json({ code: '0000', message: 'Reset email sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ code: '9999', message: 'Internal server error' });
  }
});


router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ code: '9999', message: 'Missing token or password' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as { adminId: string };
    const admin = await Admin.findOne({ where: { adminId: decoded.adminId } });

    if (!admin) {
      return res.status(404).json({ code: '9999', message: 'Admin not found' });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    await admin.update({ password: hashedPassword });

    res.status(200).json({ code: '0000', message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ code: '9999', message: 'Invalid or expired token' });
  }
});


export default router;

