import { encryptAES, decryptAES } from "./crypto";

export interface VaultEntry {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  tags?: string[];
}

const VAULT_STORAGE_KEY = "shifrishan-vault-encrypted";

/**
 * Retrieves and decrypts all vault items from localStorage.
 * @param masterPassword The password to decrypt the vault.
 * @returns An array of VaultEntry objects.
 */
export const getVaultItems = async (masterPassword: string): Promise<VaultEntry[]> => {
  if (typeof window === "undefined") return [];
  try {
    const encryptedBlob = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!encryptedBlob) return [];

    const itemsJson = await decryptAES(encryptedBlob, masterPassword);
    return JSON.parse(itemsJson) as VaultEntry[];
  } catch (error) {
    console.error("Failed to decrypt or parse vault items", error);
    // Throw a specific error for wrong password to be caught in the UI
    throw new Error("كلمة المرور خاطئة أو الخزنة تالفة.");
  }
};

/**
 * Encrypts and saves the entire list of vault items to localStorage.
 * @param items The array of VaultEntry objects to save.
 * @param masterPassword The password to encrypt the vault.
 */
const saveVaultItems = async (items: VaultEntry[], masterPassword: string): Promise<void> => {
  if (typeof window === "undefined") return;
  try {
    const itemsJson = JSON.stringify(items);
    const encryptedBlob = await encryptAES(itemsJson, masterPassword);
    localStorage.setItem(VAULT_STORAGE_KEY, encryptedBlob);
  } catch (error) {
    console.error("Failed to encrypt and save vault items", error);
    throw new Error("فشل حفظ الخزنة.");
  }
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
