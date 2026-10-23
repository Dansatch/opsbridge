import type { OperationalEvent } from '@opsbridge/domain';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { OperationalEventStore } from './event-store.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true });
  });
});

describe('OperationalEventStore', () => {
  it('keeps event history when the store is reopened', () => {
    const directory = mkdtempSync(join(tmpdir(), 'opsbridge-events-'));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, 'opsbridge.db');
    const event: OperationalEvent = {
      id: 'event-restart-check',
      tick: 12,
      type: 'device.activity',
      deviceId: 'PKG-PRN-01',
      message: 'Printer remembered this one.',
    };

    const firstStore = new OperationalEventStore(databasePath);
    firstStore.record(event);
    firstStore.close();

    const reopenedStore = new OperationalEventStore(databasePath);
    expect(reopenedStore.recent()).toMatchObject([
      {
        id: 'event-restart-check',
        tick: 12,
        message: 'Printer remembered this one.',
      },
    ]);
    reopenedStore.close();
  });
});
