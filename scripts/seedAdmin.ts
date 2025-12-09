import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const name = process.env.ADMIN_SEED_NAME || 'Bootstrap Admin';

  if (!email) {
    console.error('ADMIN_SEED_EMAIL is required');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === UserRole.ADMIN) {
      console.log(`Admin already exists for ${email}`);
      return;
    }
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.ADMIN },
    });
    console.log(`Promoted existing user to admin: ${updated.id}`);
    return;
  }

  // Create a user with admin role but without setting password here.
  // Password setup and email verification should happen via normal auth flows.
  const user = await prisma.user.create({
    data: {
      email,
      name,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded bootstrap admin user: ${user.id} (${email})`);
  console.log(
    'Next steps: Sign up via Better Auth to set password and verify email.',
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
