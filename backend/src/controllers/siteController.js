const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function companyUserWhere(req) {
    const { role, clientId } = req.user;
    if (role === "company_admin") {
        if (!clientId) return null;
        return { clientId };
    }
    if (clientId) return { clientId };
    return {};
}

async function assertManagerInCompany(req, managerId) {
    if (!managerId) return true;
    const companyWhere = companyUserWhere(req);
    if (companyWhere === null) return false;
    const manager = await prisma.user.findFirst({
        where: { id: managerId, active: true, ...companyWhere },
    });
    return Boolean(manager);
}

// Create a new site
exports.createSite = async (req, res) => {
    try {
        const { name, address, managerId } = req.body;

        if (!name || !address) {
            return res.status(400).json({ error: "Name and Address are required." });
        }

        if (managerId && !(await assertManagerInCompany(req, managerId))) {
            return res.status(400).json({
                error: "Selected site manager is not valid for your company.",
            });
        }

        const newSite = await prisma.site.create({
            data: {
                name,
                address,
                managerId,
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json(newSite);
    } catch (error) {
        console.error("Error creating site:", error);
        res.status(500).json({ error: "Failed to create site." });
    }
};

// Get all sites (with optional search)
exports.getAllSites = async (req, res) => {
    try {
        const { search } = req.query;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { address: { contains: search, mode: "insensitive" } },
                ],
            }
            : {};

        const sites = await prisma.site.findMany({
            where,
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(sites);
    } catch (error) {
        console.error("Error fetching sites:", error);
        res.status(500).json({ error: "Failed to fetch sites." });
    }
};

// Update site (including Activate/Deactivate)
exports.updateSite = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, managerId, isActive } = req.body;

        if (managerId && !(await assertManagerInCompany(req, managerId))) {
            return res.status(400).json({
                error: "Selected site manager is not valid for your company.",
            });
        }

        const data = {};
        if (name !== undefined) data.name = name;
        if (address !== undefined) data.address = address;
        if (managerId !== undefined) data.managerId = managerId;
        if (isActive !== undefined) data.isActive = isActive;

        const updatedSite = await prisma.site.update({
            where: { id },
            data,
            include: {
                manager: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        res.json(updatedSite);
    } catch (error) {
        console.error("Error updating site:", error);
        res.status(500).json({ error: "Failed to update site." });
    }
};

// Delete site
exports.deleteSite = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.site.delete({
            where: { id },
        });
        res.json({ message: "Site deleted successfully." });
    } catch (error) {
        console.error("Error deleting site:", error);
        res.status(500).json({ error: "Failed to delete site." });
    }
};

// All active users in the requester's company (for site manager assignment)
exports.getSiteManagers = async (req, res) => {
    try {
        const companyWhere = companyUserWhere(req);
        if (companyWhere === null) {
            return res.status(400).json({ error: "Company context required." });
        }

        const managers = await prisma.user.findMany({
            where: {
                active: true,
                ...companyWhere,
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
            },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        });
        res.json(managers);
    } catch (error) {
        console.error("Error fetching site managers:", error);
        res.status(500).json({ error: "Failed to fetch managers." });
    }
};
