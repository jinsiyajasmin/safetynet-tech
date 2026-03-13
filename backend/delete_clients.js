const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteSpecificClients() {
    const idsToDelete = [
        'a98c129e-f4dd-4e72-bfad-0dfb076a956b', // TestCo
        'de290b5c-de5e-4287-b8ea-76a2c47aa9d9'  // Test Co
    ];

    try {
        // 1. Delete associated users first
        const deleteUsers = await prisma.user.deleteMany({
            where: {
                clientId: {
                    in: idsToDelete,
                },
            }, 
        });
        console.log(`Deleted ${deleteUsers.count} associated users.`);

        // 2. Delete the clients
        const deleteClients = await prisma.client.deleteMany({
            where: {
                id: {
                    in: idsToDelete,
                },
            },
        });

        console.log(`Successfully deleted ${deleteClients.count} clients.`);
    } catch (error) {
        console.error('Error deleting clients:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteSpecificClients();
