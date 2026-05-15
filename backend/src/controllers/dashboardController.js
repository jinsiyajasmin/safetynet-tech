const asyncHandler = require("express-async-handler");
const prisma = require("../prismaClient");

exports.getDashboardStats = asyncHandler(async (req, res) => {
    const user = req.user;
    const isSuper = user.role === "superadmin";

    // Build filter based on role/clientId if needed (assuming multi-tenant)
    const filter = isSuper ? {} : { submittedBy: { clientId: user.clientId } };

    try {
        const [
            totalSites,
            totalUsers,
            allResponses
        ] = await Promise.all([
            prisma.site.count(isSuper ? {} : { where: { manager: { clientId: user.clientId } } }),
            prisma.user.count(isSuper ? {} : { where: { clientId: user.clientId } }),
            prisma.formResponse.findMany({
                where: filter,
                include: { form: true },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Process Responses
        const categories = {};
        const inspectionScores = [];
        const monthlyTrends = {}; // key: YYYY-MM
        const recentActions = [];

        allResponses.forEach(resp => {
            const cat = resp.category || resp.form?.title || "Other";
            categories[cat] = (categories[cat] || 0) + 1;

            const d = new Date(resp.createdAt);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyTrends[monthKey] = (monthlyTrends[monthKey] || 0) + 1;

            // Extract Inspection Data
            if (cat.includes("Weekly supervisor")) {
                const answers = resp.answers || {};
                // The WeeklySupervisorInspectionForm calculates Site Rating
                // We'll try to find it in the stored answers
                const siteRating = answers.siteRating || 0;
                inspectionScores.push(parseFloat(siteRating));
            }

            // Recent Actions (extracting from answers if they have remedial actions)
            // This is a bit complex as answers are dynamic, but we can sample
            if (recentActions.length < 6) {
                const answers = resp.answers && typeof resp.answers === "object" ? resp.answers : {};
                const heading = (answers.report_heading && String(answers.report_heading).trim()) || cat;
                recentActions.push({
                    title: heading,
                    subtitle: new Date(resp.createdAt).toLocaleDateString(),
                    status: "Submitted",
                    id: resp.id
                });
            }
        });

        // Calculate Average Compliance
        const avgCompliance = inspectionScores.length > 0 
            ? (inspectionScores.reduce((a, b) => a + b, 0) / inspectionScores.length).toFixed(1)
            : "0";

        // Format for Charts
        const barChartData = Object.keys(categories).map(cat => ({
            name: cat.length > 22 ? `${cat.substring(0, 22)}…` : cat,
            fullName: cat,
            value: categories[cat]
        }));

        const now = new Date();
        const areaChartData = [];
        for (let i = 5; i >= 0; i--) {
            const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
            areaChartData.push({
                name: dt.toLocaleString("en-GB", { month: "short" }),
                completed: monthlyTrends[monthKey] || 0
            });
        }

        res.json({
            success: true,
            stats: {
                totalSites,
                totalUsers,
                totalReports: allResponses.length,
                hsConcerns: categories["Health & Safety concern"] || 0,
                envConcerns: categories["Sustainability concern"] || 0,
                complianceRate: `${avgCompliance}%`
            },
            charts: {
                areaChartData,
                barChartData: barChartData.sort((a, b) => b.value - a.value).slice(0, 8),
                pieChartData: []
            },
            recentActions
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
