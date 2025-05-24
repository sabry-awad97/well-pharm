import { createComponentLogger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

const inventoryAPILog = createComponentLogger('InventoryAPI');

// Schema definitions
export const InventoryItemSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Product name is required'),
  stockLevel: z.number().int().nonnegative('Stock level must be non-negative'),
  threshold: z.number().int().nonnegative('Threshold must be non-negative'),
  category: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  lastOrdered: z.string().nullable().optional(),
  stockHistory: z.array(z.number()).nullable().optional(),
  reorderAmount: z.number().int().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  purchasePrice: z.number().nonnegative('Purchase price must be non-negative'),
  sellingPrice: z.number().nonnegative('Selling price must be non-negative'),
  priceUpdatedAt: z.string(),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const LowStockItemSchema = InventoryItemSchema.extend({
  percentRemaining: z.number().int().nonnegative(),
  priority: z.enum(['high', 'medium', 'low']).nullable().optional(),
});

export type LowStockItem = z.infer<typeof LowStockItemSchema>;

export const UpdateInventoryRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  stockLevel: z.number().int().nonnegative().optional(),
  threshold: z.number().int().nonnegative().optional(),
  supplier: z.string().nullable().optional(),
  reorderAmount: z.number().int().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
});

export type UpdateInventoryRequest = z.infer<typeof UpdateInventoryRequestSchema>;

export const StockTransactionRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().nonzero('Quantity must be non-zero'),
  transactionType: z.enum([
    'purchase',
    'sale',
    'adjustment_add',
    'adjustment_subtract',
  ]),
  notes: z.string().nullable().optional(),
});

export type StockTransactionRequest = z.infer<typeof StockTransactionRequestSchema>;

export const UpdatePriceRequestSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
});

export type UpdatePriceRequest = z.infer<typeof UpdatePriceRequestSchema>;

/**
 * Fetches low stock items
 * 
 * @returns Promise with array of low stock items
 */
export async function fetchLowStockItems(): Promise<LowStockItem[]> {
  inventoryAPILog.info('Fetching low stock items');

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('fetch_low_stock_items');

    // Validate the response with Zod schema
    const validatedItems = z.array(LowStockItemSchema).parse(response);

    return validatedItems;
  } catch (error) {
    inventoryAPILog.error('Failed to fetch low stock items', error);
    throw new Error(
      `Failed to fetch low stock items: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Gets an inventory item by product ID
 * 
 * @param productId Product ID
 * @returns Promise with inventory item or null if not found
 */
export async function getInventoryItem(productId: string): Promise<InventoryItem | null> {
  inventoryAPILog.info('Getting inventory item', { productId });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('get_inventory_item', { productId });

    // If null, return null
    if (response === null) {
      return null;
    }

    // Validate the response with Zod schema
    const validatedItem = InventoryItemSchema.parse(response);

    return validatedItem;
  } catch (error) {
    inventoryAPILog.error('Failed to get inventory item', error);
    throw new Error(
      `Failed to get inventory item: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Lists all inventory items
 * 
 * @returns Promise with array of inventory items
 */
export async function listInventoryItems(): Promise<InventoryItem[]> {
  inventoryAPILog.info('Listing inventory items');

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('list_inventory_items');

    // Validate the response with Zod schema
    const validatedItems = z.array(InventoryItemSchema).parse(response);

    return validatedItems;
  } catch (error) {
    inventoryAPILog.error('Failed to list inventory items', error);
    throw new Error(
      `Failed to list inventory items: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Updates an inventory item
 * 
 * @param data Update data
 * @returns Promise with updated inventory item
 */
export async function updateInventoryItem(data: UpdateInventoryRequest): Promise<InventoryItem> {
  inventoryAPILog.info('Updating inventory item', { productId: data.productId });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('update_inventory_item', { request: data });

    // Validate the response with Zod schema
    const validatedItem = InventoryItemSchema.parse(response);

    return validatedItem;
  } catch (error) {
    inventoryAPILog.error('Failed to update inventory item', error);
    throw new Error(
      `Failed to update inventory item: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Records a stock transaction
 * 
 * @param data Transaction data
 * @returns Promise that resolves when the transaction is recorded
 */
export async function recordStockTransaction(data: StockTransactionRequest): Promise<void> {
  inventoryAPILog.info('Recording stock transaction', {
    productId: data.productId,
    quantity: data.quantity,
    type: data.transactionType,
  });

  try {
    // Call the Tauri backend command
    await invoke<void>('record_stock_transaction', { request: data });
  } catch (error) {
    inventoryAPILog.error('Failed to record stock transaction', error);
    throw new Error(
      `Failed to record stock transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Updates product prices
 * 
 * @param data Price update data
 * @returns Promise with updated inventory item
 */
export async function updatePrices(data: UpdatePriceRequest): Promise<InventoryItem> {
  inventoryAPILog.info('Updating prices', {
    productId: data.productId,
    purchasePrice: data.purchasePrice,
    sellingPrice: data.sellingPrice,
  });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('update_prices', { request: data });

    // Validate the response with Zod schema
    const validatedItem = InventoryItemSchema.parse(response);

    return validatedItem;
  } catch (error) {
    inventoryAPILog.error('Failed to update prices', error);
    throw new Error(
      `Failed to update prices: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Gets stock level for a product
 * 
 * @param productId Product ID
 * @returns Promise with stock level
 */
export async function getStockLevel(productId: string): Promise<number> {
  inventoryAPILog.info('Getting stock level', { productId });

  try {
    // Call the Tauri backend command
    const response = await invoke<number>('get_stock_level', { productId });

    return response;
  } catch (error) {
    inventoryAPILog.error('Failed to get stock level', error);
    throw new Error(
      `Failed to get stock level: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * React Query hook for fetching low stock items
 */
export function useLowStockItems() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: fetchLowStockItems,
  });
}

/**
 * React Query hook for getting an inventory item
 */
export function useInventoryItem(productId: string | null) {
  return useQuery({
    queryKey: ['inventory', 'item', productId],
    queryFn: () => (productId ? getInventoryItem(productId) : null),
    enabled: !!productId,
  });
}

/**
 * React Query hook for listing all inventory items
 */
export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: listInventoryItems,
  });
}

/**
 * React Query mutation hook for updating an inventory item
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInventoryItem,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.setQueryData(['inventory', 'item', data.id], data);
    },
  });
}

/**
 * React Query mutation hook for recording a stock transaction
 */
export function useRecordStockTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordStockTransaction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'item', variables.productId] });
    },
  });
}

/**
 * React Query mutation hook for updating prices
 */
export function useUpdatePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrices,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.setQueryData(['inventory', 'item', data.id], data);
    },
  });
}