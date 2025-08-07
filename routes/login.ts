import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/table';
import { sendMessage } from '../kafka/producer';

const router = express.Router();


router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ code: '9999', message: 'Missing email or password' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ code: '9999', message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ code: '9999', message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.roleName,
        adminId: user.adminId
      },
      process.env.SECRET_KEY!,
      { expiresIn: '1h' }
    );

    console.log("Admin Name--->", user.name);


    return res.status(200).json({
      code: '0000',
      message: 'Login successful',
      token,
      role: user.roleName,
      adminId: user.adminId,
      name: user.name
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: '9999', message: 'Internal server error' });
  }
});


router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ code: '9999', message: 'Email not found' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.SECRET_KEY!,
      { expiresIn: '15m' }
    );

    // const resetLink = `http://localhost:3000/users#/reset-password`;
    const resetLink = `http://localhost:3000/users#/reset-password?token=${token}`;


    await sendMessage('forgot-password-topic', {
      to: email,
      subject: 'Password Reset',
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #333;">Hello ${user.name},</h2>
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
  </div>`

    });

    console.log("resetLink--->", resetLink)


    res.status(200).json({ code: '0000', message: 'Reset email sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ code: '9999', message: 'Internal server error' });
  }
});

// router.post('/reset-password', async (req: Request, res: Response) => {
//   const { token, password } = req.body;

//   if (!token || !password) {
//     return res.status(400).json({ code: '9999', message: 'Missing token or password' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.SECRET_KEY!) as { id: string };
//     const user = await User.findByPk(decoded.id);

//     if (!user) {
//       return res.status(404).json({ code: '9999', message: 'User not found' });
//     }

//     const hashedPassword = await bcrypt.hash(password.trim(), 10);
//     await user.update({ password: hashedPassword });

//     res.status(200).json({ code: '0000', message: 'Password updated successfully' });
//   } catch (error) {
//     console.error('Reset password error:', error);
//     res.status(500).json({ code: '9999', message: 'Invalid or expired token' });
//   }
// });


router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ code: '9999', message: 'Missing token or password' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY!) as { id: string };
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ code: '9999', message: 'User not found' });
    }
    user.password = password.trim();
    await user.save();

    res.status(200).json({ code: '0000', message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ code: '9999', message: 'Invalid or expired token' });
  }
});


export default router;