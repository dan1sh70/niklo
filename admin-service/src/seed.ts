import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RolesService } from './roles/roles.service';
import { AdminsService } from './admins/admins.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const rolesService = app.get(RolesService);
  const adminsService = app.get(AdminsService);

  // Seed default roles
  const superAdminRole = await rolesService.createRole({
    name: 'Super Admin',
    description: 'Unrestricted access to all modules',
    permissions: ['*'],
  });

  await rolesService.createRole({
    name: 'Customer Support Manager',
    description: 'Can manage bookings, users, and tickets',
    permissions: ['read:bookings', 'write:bookings', 'read:users', 'write:users', 'read:tickets', 'write:tickets'],
  });

  await rolesService.createRole({
    name: 'Finance Reviewer',
    description: 'Can review payouts and refunds',
    permissions: ['read:finance', 'approve:payouts', 'approve:refunds'],
  });

  // Seed initial Super Admin
  const existingAdmin = await adminsService.findByEmail('admin@niklo.com');
  if (!existingAdmin) {
    const password_hash = await bcrypt.hash('Admin@123!', 10);
    await adminsService.createAdmin({
      email: 'admin@niklo.com',
      name: 'Super Admin',
      password_hash,
      role_id: superAdminRole.id,
    });
    console.log('Created default Super Admin (admin@niklo.com / Admin@123!)');
  } else {
    console.log('Super Admin already exists');
  }

  await app.close();
}

bootstrap();
