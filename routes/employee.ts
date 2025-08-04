import express, { Request, Response } from 'express';
import { User } from '../models/table';
import authenticateToken from '../middlewares/auth.middleware';
import { sendRegistrationMail } from '../mailsend/mailer';

const router = express.Router();

// save-user
router.post('/save-user', authenticateToken, async (req: Request, res: Response) => {
  const { name, email, password, phoneNo, dob, roleName } = req.body;
  const { adminId } = (req as any).user;

  if (!name || !email || !dob || !phoneNo) {
    return res.json({ code: "9999", message: "Missing required fields" });
  }

  try {
    const newUser = await User.create({
      name,
      email,
      password: password || 'default123',
      phoneNo,
      dob,
      roleName: roleName || 'USER',
      adminId: adminId
    });

    await sendRegistrationMail(email, name);
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
    const { roleName, adminId } = (req as any).user;

    let whereCondition: any = { roleName: 'USER' };
    if (roleName === 'ADMIN') whereCondition.adminId = adminId;

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: ['id', 'name', 'email', 'phoneNo', 'dob', 'status'],
      offset,
      limit: size
    });

    const dataWithSerialIds = rows.map((user, index) => ({
      ...user.toJSON(),
      serialId: offset + index + 1
    }));

    res.json({ code: '0000', total: count, data: dataWithSerialIds, page, size });
  } catch (e) {
    console.error('Error fetching users:', e);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Status update
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
  const { name, dob, email, phoneNo } = req.body;

  try {
    const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
    if (!user) return res.status(404).json({ code: "9999", message: "User not found" });

    await user.update({ name, dob, email, phoneNo });
    res.json({ code: "0000", message: "User updated successfully" });
  } catch (e) {
    res.status(500).json({ code: "9999", message: "Update failed" });
  }
});

// Delete User
router.delete('/delete-user/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, roleName: 'USER' } });
    if (!user) return res.status(404).json({ code: "9999", message: "User not found" });

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
    const size = parseInt(req.query.size as string) || 10;
    const offset = (page - 1) * size;

    const { count, rows } = await User.findAndCountAll({
      where: { roleName: 'USER', status: 'active' },
      attributes: ['id', 'name', 'email', 'phoneNo', 'dob', 'status'],
      offset,
      limit: size
    });

    res.json({ code: "0000", total: count, data: rows, page, size });
  } catch (e) {
    console.error('Error fetching active users:', e);
    res.status(500).json({ code: "9999", message: 'Failed to fetch active users' });
  }
});


// register-admin
router.post('/register-admin', async (req: Request, res: Response) => {
  try {
    const { name, email, password, roleName, phoneNo, dob } = req.body;

    if (!email || !password || !name || !roleName) {
      return res.status(400).json({ code: "9999", message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ code: "9999", message: "Email already registered" });
    }

    const newUser = await User.create({
      name,
      email,
      password: password.trim(),
      phoneNo: phoneNo ? phoneNo.toString() : null,
      dob: dob || null,
      status: 'active',
      roleName: 'ADMIN',
      created_on: new Date(),
    });

    res.status(200).json({
      code: "0000",
      message: "Admin registered successfully",
      data: {
        id: newUser.id,
        email: newUser.email,
        roleName: newUser.roleName
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ code: "9999", message: "Error registering admin" });
  }
});


router.get('/all-admins', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role  } = (req as any).user;

    console.log('Authenticated roleName:', role );

    if (role  !== 'SUPER ADMIN') {
      return res.status(403).json({ code: '9999', message: 'Access denied' });
    }

    const admins = await User.findAll({ where: { roleName: 'ADMIN' } });

    res.status(200).json({ code: '0000', data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ code: '9999', message: 'Failed to fetch admins' });
  }
});






export default router;
