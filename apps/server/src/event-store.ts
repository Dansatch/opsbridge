import type { OperationalEvent } from '@opsbridge/domain';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type StoredOperationalEvent = OperationalEvent & {
  recordedAt: string;
};

export class OperationalEventStore {
  private readonly database: DatabaseSync;

  constructor(path = ':memory:') {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

    this.database = new DatabaseSync(path);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS operational_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        tick INTEGER NOT NULL,
        type TEXT NOT NULL,
        device_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        recorded_at TEXT NOT NULL
          DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
      CREATE INDEX IF NOT EXISTS operational_events_tick
        ON operational_events (tick DESC, sequence DESC);
    `);
  }

  record(event: OperationalEvent) {
    this.database
      .prepare(
        `INSERT INTO operational_events
          (event_id, tick, type, device_id, payload)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        event.id,
        event.tick,
        event.type,
        event.deviceId,
        JSON.stringify(event),
      );
  }

  recordMany(events: OperationalEvent[]) {
    this.database.exec('BEGIN');
    try {
      [...events].reverse().forEach((event) => this.record(event));
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  recent(limit = 25): StoredOperationalEvent[] {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const rows = this.database
      .prepare(
        `SELECT payload, recorded_at
         FROM operational_events
         ORDER BY sequence DESC
         LIMIT ?`,
      )
      .all(safeLimit) as { payload: string; recorded_at: string }[];

    return rows.map(({ payload, recorded_at }) => ({
      ...(JSON.parse(payload) as OperationalEvent),
      recordedAt: recorded_at,
    }));
  }

  count() {
    const row = this.database
      .prepare('SELECT COUNT(*) AS total FROM operational_events')
      .get() as { total: number };
    return row.total;
  }

  close() {
    this.database.close();
  }
}
