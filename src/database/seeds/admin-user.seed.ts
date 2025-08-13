import { DataSource } from 'typeorm';
import { User } from '../../app/auth/entities/user.entity';
import { UserRoleEnum } from '../../app/auth/enum/user-role.enum';
import * as bcrypt from 'bcrypt';

export async function createAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  
  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@taskmanagement.com' }
  });
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = userRepository.create({
      email: 'admin@taskmanagement.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      role: UserRoleEnum.ADMIN,
      isActive: true,
      isEmailVerified: true,
    });
    
    await userRepository.save(adminUser);
    console.log('✅ Admin user created: admin@taskmanagement.com / admin123');
  } else {
    console.log('ℹ️  Admin user already exists');
  }
}
