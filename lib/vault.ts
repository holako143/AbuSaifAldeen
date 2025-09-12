export interface VaultEntry {
  id: string;
  text: string;
  createdAt: number;
  tags?: string[];
}

const VAULT_STORAGE_KEY = "shifrishan-vault";

/**
 * Retrieves all vault items from localStorage.
 * @returns An array of VaultEntry objects.
 */
export const getVaultItems = (): VaultEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const itemsJson = localStorage.getItem(VAULT_STORAGE_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    console.error("Failed to parse vault items from localStorage", error);
    return [];
  }
};

/**
 * Saves the entire list of vault items to localStorage.
 * @param items - The array of VaultEntry objects to save.
 */
const saveVaultItems = (items: VaultEntry[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save vault items to localStorage", error);
  }
};

/**
 * Adds a new item to the vault.
 * @param text - The text content of the item to add.
 */
export const addToVault = (text: string): VaultEntry | null => {
  if (!text) return null;
  const items = getVaultItems();

  // Prevent adding duplicates
  if (items.some(item => item.text === text)) {
      return null;
  }

  const newEntry: VaultEntry = {
    id: `vault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text,
    createdAt: Date.now(),
  };

  const updatedItems = [newEntry, ...items];
  saveVaultItems(updatedItems);
  return newEntry;
};

/**
 * Deletes an item from the vault by its ID.
 * @param id - The ID of the item to delete.
 */
export const removeFromVault = (id: string): void => {
  const items = getVaultItems();
  const updatedItems = items.filter((item) => item.id !== id);
  saveVaultItems(updatedItems);
};

/**
 * Updates the entire vault, useful for reordering.
 * @param updatedItems - The new array of vault items.
 */
export const updateVaultItems = (updatedItems: VaultEntry[]): void => {
    saveVaultItems(updatedItems);
}
