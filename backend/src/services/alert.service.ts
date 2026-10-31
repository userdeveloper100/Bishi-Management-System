// src/services/alert.service.ts
import { prisma } from "../prismaClient";
import {
    ALERT_TYPES,
    AlertCategory,
    buildCategories,
    filterByCategory,
    NotificationRow,
    toAlertItem,
} from "./alert.mapper";

export const alertService = {
    /** The caller's activity feed, newest first, plus per-category counts for the filter pills. */
    async getFeed(userId: string, category: AlertCategory) {
        const rows = (await prisma.notification.findMany({
            where: { userId, type: { in: [...ALERT_TYPES] } },
            orderBy: { created_date: "desc" },
        })) as NotificationRow[];

        const items = rows.map(toAlertItem).filter((item): item is NonNullable<typeof item> => item !== null);

        return {
            categories: buildCategories(items),
            items: filterByCategory(items, category),
        };
    },
};
