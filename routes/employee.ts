import express, { Request, Response } from 'express';
import { User, Admin } from '../models/table';
import authenticateToken from '../middlewares/auth.middleware';
import { Op } from 'sequelize';
import { sendRegistrationMail } from '../mailsend/mailer';
import bcrypt from 'bcrypt';

const router = express.Router();

// Save User
router.post('/save-user', authenticateToken, async (req: Request, res: Response) => {
  const { userName, email, password, phoneNo, dob, roleName } = req.body;
  const { adminId } = (req as any).user;

  if (!userName || !email || !dob || !phoneNo) {
    return res.json({ code: "9999", message: "Missing required fields" });
  }

  try {
    const newUser = await User.create({
      user_name: userName,
      email,
      password: password || null,
      phone_no: phoneNo,
      dob,
      roleName: roleName || 'USER',
      adminId: adminId
    });

    await sendRegistrationMail(email, userName);
    res.json({ code: "0000", message: "User created", data: newUser });
  } catch (e) {
    console.error('User creation error:', e);
    res.json({ code: "9999", message: "Error creating user" });
  }
});

// Get All Users
router.get('/get-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const offset = (page - 1) * size;
    const { role, adminId } = (req as any).user;

    let whereCondition: any = {
      roleName: 'USER',
    };
    if (role === 'ADMIN') {
      whereCondition.adminId = adminId;
    }
    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status'],
      offset,
      limit: size
    });
    
    // res.json({ total: count, data: rows, page, size });
    const dataWithSerialIds = rows.map((user, index) => ({
      ...user.toJSON(),
      serialId: offset + index + 1
    }));

    res.json({ total: count, data: dataWithSerialIds, page, size });

  } catch (e) {
    console.error('Error fetching users:', e);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});


// Toggle Status
router.put('/toggle-status/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    await user.update({ status: newStatus });

    res.json({ message: `User is ${newStatus}` });
  } catch (e) {
    res.status(500).json({ message: 'Error toggling status' });
  }
});

// Update User
router.put('/update-user/:id', authenticateToken, async (req: Request, res: Response) => {
  const { userName, dob, email, phoneNo } = req.body;

  try {
    const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
    if (!user) return res.status(404).json({ code: "9999", message: "User not found" });

    await user.update({ user_name: userName, dob, email, phone_no: phoneNo });

    res.json({ code: "0000", message: "User updated successfully" });
  } catch (e) {
    res.status(500).json({ code: "9999", message: "Update failed" });
  }
});

// Delete User
router.delete('/delete-user/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
    if (!user) {
      return res.status(404).json({ code: "9999", message: "User not found" });
    }

    await user.destroy();
    res.json({ code: "0000", message: "User deleted successfully" });
  } catch (e) {
    console.error('Error deleting user:', e);
    res.status(500).json({ code: "9999", message: "Failed to delete user" });
  }
});

// Get Active Users
router.get('/active-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 5;
    const offset = (page - 1) * size;

    const { count, rows } = await User.findAndCountAll({
      where: {
        roleName: 'USER',
        status: 'active'
      },
      attributes: ['id', 'user_name', 'email', 'phone_no', 'dob', 'status'],
      offset,
      limit: size
    });

    res.json({ total: count, data: rows, page, size });
  } catch (e) {
    console.error('Error fetching active users:', e);
    res.status(500).json({ code: "9999", message: 'Failed to fetch active users' });
  }
});


// Register Admin
router.post('/register-admin', async (req: Request, res: Response) => {
  try {
    const { adminName, adminEmail, password, roleName } = req.body;

    if (!adminEmail || !password || !adminName || !roleName) {
      return res.status(400).json({ code: "9999", message: "Missing required fields" });
    }

    const existingAdmin = await Admin.findOne({ where: { adminEmail } });
    if (existingAdmin) {
      return res.status(409).json({ code: "9999", message: "Email already registered" });
    }

    const newAdmin = await Admin.create({
      adminName,
      adminEmail: adminEmail.trim(),
      password: password.trim(),
      roleName,
    });

    res.status(200).json({
      code: "0000",
      message: "Admin registered successfully",
      data: {
        id: newAdmin.id,
        adminId: newAdmin.adminId,
        adminEmail: newAdmin.adminEmail,
        roleName: newAdmin.roleName
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ code: "9999", message: "Error registering admin" });
  }
});


// Get Admin List - Only for SUPERADMIN
router.get('/admin-list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = (req as any).user;

    if (role !== 'SUPERADMIN') {
      return res.status(403).json({ code: "9999", message: "Access denied" });
    }

    const admins = await Admin.findAll({
      where: {
        roleName: 'ADMIN',
      },
      attributes: ['adminId', 'adminName', 'adminEmail', 'roleName', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ code: "0000", message: "Admin list fetched", data: admins });
  } catch (err) {
    console.error('Error fetching admin list:', err);
    res.status(500).json({ code: "9999", message: "Failed to fetch admin list" });
  }
});


// GET /all-admins
router.get('/all-admins', authenticateToken, async (req: Request, res: Response) => {
  try {
    const admins = await Admin.findAll({
      where: {
        roleName: {
          [Op.ne]: 'SUPER ADMIN'
        }
      },
      order: [['adminId', 'DESC']],
    });

    res.json({ code: "0000", message: "All admins fetched", data: admins });
  } catch (err) {
    console.error('Error fetching all admins:', (err as Error).message);
    res.status(500).json({ code: "9999", message: "Failed to fetch admins" });
  }
});


// router.get('/admin/:id', authenticateToken, async (req: Request, res: Response) => {
//   try {
//     const admin = await Admin.findOne({
//       where: { adminId: req.params.id },
//     });

//     if (!admin) {
//       return res.status(404).json({ code: "9999", message: "Admin not found" });
//     }

//     res.json({ code: "0000", message: "Admin fetched", data: admin });
//   } catch (err) {
//     console.error('Error fetching admin:', err);
//     res.status(500).json({ code: "9999", message: "Failed to fetch admin" });
//   }
// });




export default router;
