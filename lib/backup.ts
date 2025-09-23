import { db } from './db';

const SETTINGS_KEYS = [
    'shifrishan-locale',
    'shifrishan-auto-copy',
    'shifrishan-history-enabled',
    'shifrishan-theme-mode',
    'shifrishan-color-primary',
    'shifrishan-color-bg-start',
    'shifrishan-color-bg-end',
    'shifrishan-color-text',
    'shifrishan-default-mode',
];

interface BackupData {
    version: number;
    timestamp: number;
    settings: Record<string, string | null>;
    indexedDB: {
        history: any[];
        appState: any[];
        vault: any[];
    };
}

export const exportAllData = async (): Promise<{ success: boolean, message?: string }> => {
    try {
        const settings: Record<string, string | null> = {};
        SETTINGS_KEYS.forEach(key => {
            settings[key] = localStorage.getItem(key);
        });

        const history = await db.history.toArray();
        const appState = await db.appState.toArray();
        const vault = await db.vault.toArray();

        const backup: BackupData = {
            version: 1,
            timestamp: Date.now(),
            settings,
            indexedDB: {
                history,
                appState,
                vault,
            },
        };

        const backupJson = JSON.stringify(backup, null, 2);
        const blob = new Blob([backupJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `shifrishan-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        console.error("Failed to export data:", error);
        return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
};

export const importAllData = async (backupJson: string): Promise<{ success: boolean, message?: string }> => {
    try {
        const backup: BackupData = JSON.parse(backupJson);

        if (backup.version !== 1 || !backup.settings || !backup.indexedDB) {
            throw new Error("Invalid or unsupported backup file format.");
        }

        // Restore settings to localStorage
        Object.entries(backup.settings).forEach(([key, value]) => {
            if (value !== null) {
                localStorage.setItem(key, value);
            } else {
                localStorage.removeItem(key);
            }
        });

        // Restore IndexedDB data
        await db.transaction('rw', db.history, db.appState, db.vault, async () => {
            // Clear existing data
            await db.history.clear();
            await db.appState.clear();
            await db.vault.clear();

            // Bulk add new data
            if (backup.indexedDB.history?.length) {
                await db.history.bulkAdd(backup.indexedDB.history);
            }
            if (backup.indexedDB.appState?.length) {
                await db.appState.bulkAdd(backup.indexedDB.appState);
            }
            if (backup.indexedDB.vault?.length) {
                await db.vault.bulkAdd(backup.indexedDB.vault);
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to import data:", error);
        return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
};
