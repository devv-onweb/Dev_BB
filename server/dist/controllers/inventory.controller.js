import { BloodGroup } from '../types/enums.js';
import prisma from '../config/db.js';
/**
 * Helper to determine inventory stock status
 */
const getStockStatus = (units) => {
    if (units <= 5)
        return 'CRITICAL';
    if (units <= 15)
        return 'LOW_STOCK';
    return 'SUFFICIENT';
};
/**
 * Controller: Get current blood stock grouped by blood group
 * Route: GET /api/inventory
 * Access: Authenticated users (verifyToken)
 */
export const getInventory = async (_req, res) => {
    try {
        const inventoryRecords = await prisma.bloodInventory.findMany({
            orderBy: { blood_group: 'asc' },
        });
        // Ensure all blood groups are represented even if DB is partially empty
        const allBloodGroups = Object.values(BloodGroup);
        const existingGroupMap = new Map(inventoryRecords.map((item) => [item.blood_group, item]));
        const fullInventory = allBloodGroups.map((group) => {
            const existing = existingGroupMap.get(group);
            const units = existing ? existing.units_available : 0;
            return {
                id: existing?.id || null,
                blood_group: group,
                units_available: units,
                stock_status: getStockStatus(units),
                last_updated: existing?.last_updated || new Date(),
            };
        });
        const totalUnits = fullInventory.reduce((acc, curr) => acc + curr.units_available, 0);
        const lowStockCount = fullInventory.filter((i) => i.stock_status !== 'SUFFICIENT').length;
        res.status(200).json({
            success: true,
            data: {
                total_units: totalUnits,
                low_stock_count: lowStockCount,
                inventory: fullInventory,
            },
        });
    }
    catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve blood inventory.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
