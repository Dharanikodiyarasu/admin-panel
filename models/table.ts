import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db/db.config';
import bcrypt from 'bcrypt';


function generateAlphanumericId(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  phoneNo: string;
  dob: string;
  status?: string;
  roleName?: string;
  created_on?: Date;
  adminId?: string;
}

type UserCreationAttributes = Optional<UserAttributes, 'id' | 'status' | 'roleName' | 'created_on' | 'adminId'>;

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public phoneNo!: string;
  public dob!: string;
  public status!: string;
  public roleName!: string;
  public created_on!: Date;
  public adminId!: string;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: true },
  phoneNo: { type: DataTypes.STRING, allowNull: true },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  roleName: { type: DataTypes.STRING, defaultValue: 'ADMIN' },
  created_on: {
    type: DataTypes.DATE,
    defaultValue: () => new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000)
  },
  adminId: {
    type: DataTypes.STRING, allowNull: true, defaultValue: generateAlphanumericId
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});


export { User };
