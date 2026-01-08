import { Injectable, signal, computed } from '@angular/core';
import { ProcessEvent, ActivityStats, ProcessLink, ProcessNode, DailyKPI } from '../models/event-log.model';

@Injectable({
    providedIn: 'root'
})
export class ProcessDataService {
    // Mock event log data - expanded dataset with multiple cases
    private readonly mockData: ProcessEvent[] = [
        // Case A1
        { caseId: 'A1', activity: 'Order Created', timestamp: '2024-01-01T09:00:00' },
        { caseId: 'A1', activity: 'Payment Received', timestamp: '2024-01-01T10:30:00' },
        { caseId: 'A1', activity: 'Order Shipped', timestamp: '2024-01-02T08:00:00' },
        { caseId: 'A1', activity: 'Order Delivered', timestamp: '2024-01-03T14:00:00' },
        // Case A2
        { caseId: 'A2', activity: 'Order Created', timestamp: '2024-01-01T11:00:00' },
        { caseId: 'A2', activity: 'Payment Received', timestamp: '2024-01-01T11:45:00' },
        { caseId: 'A2', activity: 'Order Shipped', timestamp: '2024-01-02T09:00:00' },
        { caseId: 'A2', activity: 'Order Delivered', timestamp: '2024-01-03T10:00:00' },
        // Case A3 - has a problem step
        { caseId: 'A3', activity: 'Order Created', timestamp: '2024-01-02T08:00:00' },
        { caseId: 'A3', activity: 'Payment Received', timestamp: '2024-01-02T14:00:00' },
        { caseId: 'A3', activity: 'Payment Issue', timestamp: '2024-01-02T14:30:00' },
        { caseId: 'A3', activity: 'Payment Received', timestamp: '2024-01-03T09:00:00' },
        { caseId: 'A3', activity: 'Order Shipped', timestamp: '2024-01-04T10:00:00' },
        { caseId: 'A3', activity: 'Order Delivered', timestamp: '2024-01-05T16:00:00' },
        // Case A4
        { caseId: 'A4', activity: 'Order Created', timestamp: '2024-01-03T10:00:00' },
        { caseId: 'A4', activity: 'Payment Received', timestamp: '2024-01-03T10:15:00' },
        { caseId: 'A4', activity: 'Order Shipped', timestamp: '2024-01-03T14:00:00' },
        { caseId: 'A4', activity: 'Order Delivered', timestamp: '2024-01-04T11:00:00' },
        // Case A5 - cancelled
        { caseId: 'A5', activity: 'Order Created', timestamp: '2024-01-03T14:00:00' },
        { caseId: 'A5', activity: 'Order Cancelled', timestamp: '2024-01-03T15:00:00' },
        // Case A6
        { caseId: 'A6', activity: 'Order Created', timestamp: '2024-01-04T09:00:00' },
        { caseId: 'A6', activity: 'Payment Received', timestamp: '2024-01-04T09:30:00' },
        { caseId: 'A6', activity: 'Order Shipped', timestamp: '2024-01-04T16:00:00' },
        { caseId: 'A6', activity: 'Order Delivered', timestamp: '2024-01-06T10:00:00' },
        // Case A7
        { caseId: 'A7', activity: 'Order Created', timestamp: '2024-01-05T08:00:00' },
        { caseId: 'A7', activity: 'Payment Received', timestamp: '2024-01-05T12:00:00' },
        { caseId: 'A7', activity: 'Order Shipped', timestamp: '2024-01-06T09:00:00' },
        { caseId: 'A7', activity: 'Order Delivered', timestamp: '2024-01-07T14:00:00' },
        // Case A8 - with return
        { caseId: 'A8', activity: 'Order Created', timestamp: '2024-01-05T10:00:00' },
        { caseId: 'A8', activity: 'Payment Received', timestamp: '2024-01-05T10:20:00' },
        { caseId: 'A8', activity: 'Order Shipped', timestamp: '2024-01-05T15:00:00' },
        { caseId: 'A8', activity: 'Order Delivered', timestamp: '2024-01-06T11:00:00' },
        { caseId: 'A8', activity: 'Return Requested', timestamp: '2024-01-07T09:00:00' },
        { caseId: 'A8', activity: 'Return Processed', timestamp: '2024-01-08T14:00:00' },
    ];

    // Selection state for cross-filtering
    readonly selectedActivity = signal<string | null>(null);

    // Raw events signal
    readonly events = signal<ProcessEvent[]>(this.mockData);

    // Unique activities
    readonly activities = computed(() => {
        const activitySet = new Set(this.events().map(e => e.activity));
        return Array.from(activitySet);
    });

    // Activity statistics with duration calculations
    readonly activityStats = computed<ActivityStats[]>(() => {
        const events = this.events();
        const caseGroups = this.groupByCase(events);
        const stats = new Map<string, { totalDuration: number; count: number }>();

        // Calculate duration from previous activity to this one
        for (const [, caseEvents] of caseGroups) {
            const sorted = caseEvents.sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            for (let i = 1; i < sorted.length; i++) {
                const activity = sorted[i].activity;
                const prevTime = new Date(sorted[i - 1].timestamp).getTime();
                const currTime = new Date(sorted[i].timestamp).getTime();
                const duration = (currTime - prevTime) / (1000 * 60); // minutes

                const current = stats.get(activity) || { totalDuration: 0, count: 0 };
                stats.set(activity, {
                    totalDuration: current.totalDuration + duration,
                    count: current.count + 1
                });
            }
        }

        // First activities have 0 duration (they start the case)
        const firstActivities = new Set(
            Array.from(caseGroups.values()).map(events =>
                events.sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )[0]?.activity
            ).filter(Boolean)
        );

        for (const activity of firstActivities) {
            if (!stats.has(activity)) {
                stats.set(activity, { totalDuration: 0, count: 1 });
            }
        }

        return Array.from(stats.entries()).map(([activity, data]) => ({
            activity,
            avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
            frequency: data.count,
            totalDuration: data.totalDuration
        })).sort((a, b) => b.avgDuration - a.avgDuration);
    });

    // Process links (transitions between activities)
    readonly processLinks = computed<ProcessLink[]>(() => {
        const events = this.events();
        const caseGroups = this.groupByCase(events);
        const links = new Map<string, { totalDuration: number; count: number }>();

        for (const [, caseEvents] of caseGroups) {
            const sorted = caseEvents.sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            for (let i = 0; i < sorted.length - 1; i++) {
                const source = sorted[i].activity;
                const target = sorted[i + 1].activity;
                const key = `${source}→${target}`;

                const prevTime = new Date(sorted[i].timestamp).getTime();
                const currTime = new Date(sorted[i + 1].timestamp).getTime();
                const duration = (currTime - prevTime) / (1000 * 60); // minutes

                const current = links.get(key) || { totalDuration: 0, count: 0 };
                links.set(key, {
                    totalDuration: current.totalDuration + duration,
                    count: current.count + 1
                });
            }
        }

        return Array.from(links.entries()).map(([key, data]) => {
            const [source, target] = key.split('→');
            return {
                source,
                target,
                frequency: data.count,
                avgDuration: data.totalDuration / data.count
            };
        });
    });

    // Process nodes for force graph
    readonly processNodes = computed<ProcessNode[]>(() => {
        const activities = this.activities();
        const events = this.events();

        const frequency = new Map<string, number>();
        for (const event of events) {
            frequency.set(event.activity, (frequency.get(event.activity) || 0) + 1);
        }

        return activities.map(activity => ({
            id: activity,
            activity,
            frequency: frequency.get(activity) || 0
        }));
    });

    // Daily KPIs
    readonly dailyKPIs = computed<DailyKPI[]>(() => {
        const events = this.events();
        const caseGroups = this.groupByCase(events);

        // Get case durations and end dates
        const caseDurations: { date: Date; duration: number }[] = [];

        for (const [, caseEvents] of caseGroups) {
            const sorted = caseEvents.sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            if (sorted.length >= 2) {
                const startTime = new Date(sorted[0].timestamp).getTime();
                const endTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
                const durationHours = (endTime - startTime) / (1000 * 60 * 60);
                const endDate = new Date(sorted[sorted.length - 1].timestamp);
                endDate.setHours(0, 0, 0, 0);

                caseDurations.push({ date: endDate, duration: durationHours });
            }
        }

        // Group by date
        const byDate = new Map<string, { durations: number[]; count: number }>();
        for (const { date, duration } of caseDurations) {
            const key = date.toISOString().split('T')[0];
            const current = byDate.get(key) || { durations: [], count: 0 };
            current.durations.push(duration);
            current.count++;
            byDate.set(key, current);
        }

        return Array.from(byDate.entries())
            .map(([dateStr, data]) => ({
                date: new Date(dateStr),
                avgCaseDuration: data.durations.reduce((a, b) => a + b, 0) / data.durations.length,
                caseCount: data.count
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    // Selection methods
    selectActivity(activity: string | null): void {
        this.selectedActivity.set(activity);
    }

    toggleActivity(activity: string): void {
        if (this.selectedActivity() === activity) {
            this.selectedActivity.set(null);
        } else {
            this.selectedActivity.set(activity);
        }
    }

    // Helper methods
    private groupByCase(events: ProcessEvent[]): Map<string, ProcessEvent[]> {
        const groups = new Map<string, ProcessEvent[]>();
        for (const event of events) {
            const caseEvents = groups.get(event.caseId) || [];
            caseEvents.push(event);
            groups.set(event.caseId, caseEvents);
        }
        return groups;
    }
}
