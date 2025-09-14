import { encryptAES, decryptAES } from "./crypto";

export interface VaultEntry {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  tags?: string[];
}

const VAULT_STORAGE_KEY = "shifrishan-vault-encrypted";
const VAULT_HASH_KEY = "shifrishan-vault-hash";

// Helper to create a SHA-256 hash of the master password for verification
const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves and decrypts all vault items from localStorage.
 * @param masterPassword The password to decrypt the vault.
 * @returns An array of VaultEntry objects.
 */
export const getVaultItems = async (masterPassword: string): Promise<VaultEntry[]> => {
  if (typeof window === "undefined") return [];

  const encryptedBlob = localStorage.getItem(VAULT_STORAGE_KEY);
  const storedHash = localStorage.getItem(VAULT_HASH_KEY);

  if (!storedHash) {
    // No hash means this is a completely new vault.
    // If there's also no data, return empty. If there's data, it's an old vault version.
    return encryptedBlob ? JSON.parse(await decryptAES(encryptedBlob, masterPassword)) : [];
  }

  // Verify password against hash
  const providedHash = await hashPassword(masterPassword);
  if (providedHash !== storedHash) {
    throw new Error("كلمة المرور خاطئة.");
  }

  // If we are here, password is correct. Now get data.
  if (!encryptedBlob) {
    return []; // Correct password, but vault is empty.
  }

  const itemsJson = await decryptAES(encryptedBlob, masterPassword);
  return JSON.parse(itemsJson);
};

/**
 * Encrypts and saves the entire list of vault items to localStorage.
 * @param items The array of VaultEntry objects to save.
 * @param masterPassword The password to encrypt the vault.
 */
const saveVaultItems = async (items: VaultEntry[], masterPassword: string): Promise<void> => {
  if (typeof window === "undefined") return;

  const itemsJson = JSON.stringify(items);
  const encryptedBlob = await encryptAES(itemsJson, masterPassword);
  localStorage.setItem(VAULT_STORAGE_KEY, encryptedBlob);

  // Also save the hash of the new password for verification
  const passwordHash = await hashPassword(masterPassword);
  localStorage.setItem(VAULT_HASH_KEY, passwordHash);
};

/**
 * Adds a new item to the vault.
 * @param title The title of the new item.
 * @param text The text content of the item to add.
 * @param masterPassword The password to access the vault.
 */
export const addToVault = async (title: string, text: string, masterPassword: string): Promise<VaultEntry> => {
  if (!text || !title || !masterPassword) throw new Error("العنوان، النص، وكلمة المرور الرئيسية مطلوبة.");

  const items = await getVaultItems(masterPassword);

  const newEntry: VaultEntry = {
    id: `vault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    text,
    createdAt: Date.now(),
  };

  const updatedItems = [newEntry, ...items];
  await saveVaultItems(updatedItems, masterPassword);
  return newEntry;
};

/**
 * Deletes an item from the vault by its ID.
 * @param id The ID of the item to delete.
 * @param masterPassword The password to access the vault.
 */
export const removeFromVault = async (id: string, masterPassword: string): Promise<void> => {
  const items = await getVaultItems(masterPassword);
  const updatedItems = items.filter((item) => item.id !== id);
  await saveVaultItems(updatedItems, masterPassword);
};

/**
 * Updates an existing item in the vault.
 * @param updatedEntry The vault entry with updated information.
 * @param masterPassword The password to access the vault.
 */
export const updateVaultItem = async (updatedEntry: VaultEntry, masterPassword: string): Promise<void> => {
    const items = await getVaultItems(masterPassword);
    const itemIndex = items.findIndex(item => item.id === updatedEntry.id);
    if (itemIndex === -1) throw new Error("لم يتم العثور على العنصر للتحديث.");

    const updatedItems = [...items];
    updatedItems[itemIndex] = updatedEntry;
    await saveVaultItems(updatedItems, masterPassword);
}

/**
 * Updates the entire vault, useful for reordering.
 * @param updatedItems The new array of vault items.
 * @param masterPassword The password to access the vault.
 */
export const updateVaultOrder = async (updatedItems: VaultEntry[], masterPassword: string): Promise<void> => {
    await saveVaultItems(updatedItems, masterPassword);
}

/**
 * Changes the master password for the vault.
 * Re-encrypts all items with the new password.
 * @param oldPassword The current master password.
 * @param newPassword The new master password.
 */
export const changeMasterPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    if (!newPassword) {
        throw new Error("لا يمكن أن تكون كلمة المرور الجديدة فارغة.");
    }
    // This step implicitly verifies the old password.
    // If it's wrong, getVaultItems will throw an error.
    const items = await getVaultItems(oldPassword);

    // Re-encrypt and save with the new password.
    // This will also update the password hash.
    await saveVaultItems(items, newPassword);
}

/**
 * Exports the raw encrypted vault blob to a file.
 */
export const exportEncryptedVault = (): { success: boolean, messageKey?: string } => {
    if (typeof window === "undefined") return { success: false, messageKey: 'common.errors.notInBrowser' };

    const encryptedBlob = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!encryptedBlob) {
        return { success: false, messageKey: 'vaultPage.toasts.exportErrorEmpty' };
    }

    const blob = new Blob([encryptedBlob], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shifrishan-vault-backup-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
};

/**
 * Imports an encrypted vault blob, overwriting the current vault.
 * @param vaultContent The raw encrypted string from the backup file.
 * @returns An object indicating success or failure.
 */
export const importEncryptedVault = (vaultContent: string): { success: boolean, message?: string } => {
    if (typeof window === "undefined") return { success: false, message: 'Not in browser' };

    if (!vaultContent || typeof vaultContent !== 'string' || !vaultContent.startsWith('{"iv"')) {
        // Basic sanity check to see if it looks like our encrypted JSON object
        return { success: false, message: "الملف غير صالح أو تالف." };
    }

    // This is a destructive action. Overwrite the vault.
    localStorage.setItem(VAULT_STORAGE_KEY, vaultContent);
    // Remove the old password hash. The user will need to unlock with the new vault's password.
    // A new hash will be generated on the next save operation.
    localStorage.removeItem(VAULT_HASH_KEY);

    return { success: true };
};
