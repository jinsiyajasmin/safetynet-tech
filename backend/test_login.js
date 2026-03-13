
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
    const email = 'admin@safetynet.com';
    const password = 'password123';

    console.log(`Testing login for: ${email}`);

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: { equals: email, mode: 'insensitive' } },
                { username: { equals: email, mode: 'insensitive' } }
            ]
        }
    });

    if (!user) {
        console.error("❌ User not found in DB.");
        return;
    }

    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    console.log(`Stored Hash: ${user.password}`);

    // 2. Compare Password
    const match = await bcrypt.compare(password, user.password);

    if (match) {
        console.log("✅ Password MATCHES!");
    } else {
        console.error("❌ Password DOES NOT MATCH.");

        // Debug: Gen new hash to see diff
        const newHash = await bcrypt.hash(password, 10);
        console.log(`Expected hash format (example): ${newHash}`);
    }
}

testLogin()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
