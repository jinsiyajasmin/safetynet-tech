const asyncHandler = require('express-async-handler');
const prisma = require("../prismaClient");
const cloudinary = require('../config/cloudinary');

// Upload a document
exports.uploadDocument = asyncHandler(async (req, res) => {
    try {
        const { title, version, validFrom, validUntil, tags, siteId, category } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        if (!siteId) {
            return res.status(400).json({ success: false, message: "Site ID is required" });
        }

        const fileData = {
            title,
            version,
            validFrom,
            validUntil,
            tags,
            siteId,
            category: category || 'uploads', // Default to uploads if not specified
            uploadedById: req.user.id,
            url: req.file.path,
            type: req.file.originalname.split('.').pop().toUpperCase(),
            size: (req.file.size / 1024 / 1024).toFixed(2) + " MB"
        };

        const document = await prisma.siteDocument.create({
            data: fileData
        });

        res.status(201).json({ success: true, document });
    } catch (error) {
        console.error("Upload error details:", error);
        res.status(500).json({
            success: false,
            message: "Upload failed",
            error: error.message
        });
    }
});

// Get documents for a specific site and module (category)
// Filter by user -> "show that only in that site , with that user"
exports.getDocuments = asyncHandler(async (req, res) => {
    const { siteId, category } = req.query;
    const userId = req.user.id;

    if (!siteId) {
        return res.status(400).json({ success: false, message: "Site ID is required" });
    }

    const where = {
        siteId,
        uploadedById: userId, // ISOLATION: Only show docs uploaded by this user
    };

    if (category) {
        where.category = category;
    }

    const documents = await prisma.siteDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            uploadedBy: {
                select: { firstName: true, lastName: true }
            }
        }
    });

    res.json({ success: true, documents });
});

// Get counts per module for a site (User specific)
exports.getModuleCounts = asyncHandler(async (req, res) => {
    const { siteId } = req.query;
    const userId = req.user.id;

    if (!siteId) {
        return res.status(400).json({ success: false, message: "Site ID is required" });
    }

    // Group by category and count
    const counts = await prisma.siteDocument.groupBy({
        by: ['category'],
        where: {
            siteId,
            uploadedById: userId // ISOLATION: Count only user's docs
        },
        _count: {
            category: true
        }
    });

    // Format into an object { rams: 5, drawings: 2, ... }
    const countMap = {};
    counts.forEach(c => {
        countMap[c.category] = c._count.category;
    });

    res.json({ success: true, counts: countMap });
});

exports.deleteDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if doc exists
    const doc = await prisma.siteDocument.findUnique({ where: { id } });

    if (!doc) {
        return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Optional: Check permissions (e.g., only uploader or admin)
    // if (doc.uploadedById !== req.user.id && req.user.role !== 'admin') { ... }

    // Delete from Cloudinary
    if (doc.url) {
        // Extract public_id from URL
        const publicId = doc.url.split('/').pop().split('.')[0];
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error("Cloudinary delete error:", err);
            // Continue to delete from DB even if Cloudinary fails
        }
    }

    // Delete from DB
    await prisma.siteDocument.delete({ where: { id } });

    res.json({ success: true, message: "Document deleted" });
});
