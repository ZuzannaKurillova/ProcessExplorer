/**
 * Models for process mining event log data
 */

export interface ProcessEvent {
    caseId: string;
    activity: string;
    timestamp: string;
}

export interface ActivityStats {
    activity: string;
    avgDuration: number;    // in minutes
    frequency: number;      // how many times this activity occurs
    totalDuration: number;  // sum of all durations
}

export interface ProcessLink {
    source: string;
    target: string;
    frequency: number;
    avgDuration: number;    // average time between source and target in minutes
}

export interface ProcessNode {
    id: string;
    activity: string;
    frequency: number;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface DailyKPI {
    date: Date;
    avgCaseDuration: number;  // in hours
    caseCount: number;
}
