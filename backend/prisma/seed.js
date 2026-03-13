const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const clientName = 'Safetynett';

    // 1. Create Default Client
    let client = await prisma.client.findUnique({
        where: { name: clientName },
    });

    if (!client) {
        client = await prisma.client.create({
            data: {
                name: clientName,
                logo: null,
            },
        });
        console.log(`Created client: ${client.name}`);
    } else {
        console.log(`Client ${client.name} already exists.`);
    }

    // 2. Create Super Admin User
    const adminEmail = 'admin@safetynet.com';
    const adminPassword = 'password123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let admin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (!admin) {
        admin = await prisma.user.create({
            data: {
                username: 'superadmin',
                firstName: 'Super',
                lastName: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'superadmin',
                active: true,
                clientId: client.id,
                companyname: client.name,
                mobile: '1234567890',
                jobTitle: 'System Administrator'
            },
        });
        console.log(`Created superadmin: ${admin.email} / ${adminPassword}`);
    } else {
        console.log(`Superadmin ${admin.email} already exists.`);
        // Ensure role is superadmin
        if (admin.role !== 'superadmin') {
            admin = await prisma.user.update({
                where: { id: admin.id },
                data: { role: 'superadmin' }
            });
            console.log(`Updated existing admin role to superadmin`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
