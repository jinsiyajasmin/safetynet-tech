const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@safetynet.com';
    console.log(`Disabling 2FA for ${email}...`);

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found!');
            return;
        }

        await prisma.user.update({
            where: { email },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null
            }
        });

        console.log('Successfully disabled 2FA for admin.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
