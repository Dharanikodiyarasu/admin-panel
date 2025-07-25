import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sequelize from '../db/db.config';

import authRoutes from '../routes/login';
import userRoutes from '../routes/employee';
import dashboardRoutes from '../routes/dashboard';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '8080', 10);

(async () => {
  try {
    await sequelize.sync();
    console.log('✅ Database synced');
  } catch (error) {
    console.error('❌ Database sync failed:', error);
  }
})();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
