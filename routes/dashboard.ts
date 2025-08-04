import express, { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models/table';
import authenticateToken from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/user-count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roleName, adminId } = (req as any).user;

    const baseCondition: any = { roleName: 'USER' };
    if (roleName === 'ADMIN') baseCondition.adminId = adminId;

    const active = await User.count({
      where: { ...baseCondition, status: 'active' },
    });

    const blocked = await User.count({
      where: { ...baseCondition, status: { [Op.ne]: 'active' } },
    });

    const total = await User.count({
      where: baseCondition,
    });

    const admin = await User.count({
      where: { ...baseCondition, roleName: 'ADMIN' },
    });

    res.json({ code: '0000', active, blocked, total, admin });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ code: '9999', message: 'Failed to get user count' });
  }
});

export default router;
