/**
 * AuditLogger.ts
 * DEV_D Audit Logging Service
 */

export interface AuditLogEntry {
  action: string;
  userId: string;
  details: string;
  timestamp: Date;
}

export class AuditLogger {
  private static logs: AuditLogEntry[] = [];

  public static async log(action: string, userId: string, details: string): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      action,
      userId,
      details,
      timestamp: new Date(),
    };

    this.logs.push(entry);
    console.log(`[AUDIT LOG ${entry.timestamp.toISOString()}] Action: ${action} | User: ${userId} | Details: ${details}`);
    return entry;
  }

  public static getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }
}
