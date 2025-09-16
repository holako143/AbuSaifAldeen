import Dexie, { Table } from 'dexie';
import { HistoryEntry } from './history';

// The interfaces defined here are for the database schema.
// They might differ slightly from the application-level interfaces.

export interface HistoryRecord extends Omit<HistoryEntry, 'id'> {
  id?: number; // Dexie handles auto-incrementing primary keys
}

export interface VaultRecord {
    id: 'main' | 'hash'; // 'main' for the blob, 'hash' for the password hash
    data: string;
}

export interface AppStateRecord {
    key: string; // e.g., 'emoji-list', 'alphabet-list'
    value: any;
}

export class ShifrishanDexie extends Dexie {
    history!: Table<HistoryRecord, number>; // number is the type of the primary key
    vault!: Table<VaultRecord, 'main' | 'hash'>;
    appState!: Table<AppStateRecord, string>;

    constructor() {
        super('shifrishanDB');
        this.version(1).stores({
            history: '++id, timestamp', // Auto-incrementing 'id', index on 'timestamp'
            vault: '&id', // Primary key is 'id', must be unique
            appState: '&key', // Primary key is 'key', must be unique
        });
    }
}

export const db = new ShifrishanDexie();
