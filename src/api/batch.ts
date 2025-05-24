import { createComponentLogger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

const batchAPILog = createComponentLogger('batch-api');

// Schema definitions
export const BatchItemSchema = z.object({
  id: z.string().uuid('Invalid batch ID'),
  productId: z.string().uuid('Invalid product ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
  manufacturingDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  purchasePrice: z.number().nonnegative('Purchase price must be non-negative'),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AddBatchSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
  manufacturingDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  purchasePrice: z.number().nonnegative('Purchase price must be non-negative'),
  notes: z.string().nullable().optional(),
});

export const UpdateBatchSchema = z.object({
  id: z.string().uuid('Invalid batch ID'),
  quantity: z
    .number()
    .int()
    .nonnegative('Quantity must be non-negative')
    .optional(),
  manufacturingDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  purchasePrice: z
    .number()
    .nonnegative('Purchase price must be non-negative')
    .optional(),
  notes: z.string().nullable().optional(),
});

export const BatchTransactionSchema = z.object({
  id: z.string().uuid('Invalid transaction ID'),
  batchId: z.string().uuid('Invalid batch ID'),
  quantity: z.number().int(),
  transactionType: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  createdBy: z.string().uuid().nullable(),
});

// Type definitions
export type BatchItem = z.infer<typeof BatchItemSchema>;
export type AddBatchRequest = z.infer<typeof AddBatchSchema>;
export type UpdateBatchRequest = z.infer<typeof UpdateBatchSchema>;
export type BatchTransactionRequest = z.infer<typeof BatchTransactionSchema>;
export type BatchTransaction = z.infer<typeof BatchTransactionSchema>;

/**
 * Adds a new batch
 *
 * @param data Batch data
 * @returns Promise with the created batch
 */
export async function addBatch(data: AddBatchRequest): Promise<BatchItem> {
  batchAPILog.info('Adding batch', {
    productId: data.productId,
    batchNumber: data.batchNumber,
  });

  try {
    const response = await invoke<BatchItem>('add_batch', { request: data });
    return response;
  } catch (error) {
    batchAPILog.error('Failed to add batch', error);
    throw new Error(
      `Failed to add batch: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Updates an existing batch
 *
 * @param data Batch update data
 * @returns Promise with the updated batch
 */
export async function updateBatch(
  data: UpdateBatchRequest,
): Promise<BatchItem> {
  batchAPILog.info('Updating batch', { batchId: data.id });

  try {
    const response = await invoke<BatchItem>('update_batch', { request: data });
    return response;
  } catch (error) {
    batchAPILog.error('Failed to update batch', error);
    throw new Error(
      `Failed to update batch: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Gets a batch by ID
 *
 * @param batchId Batch ID
 * @returns Promise with the batch or null if not found
 */
export async function getBatch(batchId: string): Promise<BatchItem | null> {
  batchAPILog.info('Getting batch', { batchId });

  try {
    const response = await invoke<BatchItem | null>('get_batch', { batchId });
    return response;
  } catch (error) {
    batchAPILog.error('Failed to get batch', error);
    throw new Error(
      `Failed to get batch: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Lists all batches for a product
 *
 * @param productId Product ID
 * @returns Promise with list of batches
 */
export async function listBatchesByProduct(
  productId: string,
): Promise<BatchItem[]> {
  batchAPILog.info('Listing batches by product', { productId });

  try {
    const response = await invoke<BatchItem[]>('list_batches_by_product', {
      productId,
    });
    return response;
  } catch (error) {
    batchAPILog.error('Failed to list batches', error);
    throw new Error(
      `Failed to list batches: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Records a batch transaction
 *
 * @param data Transaction data
 * @returns Promise that resolves when the transaction is recorded
 */
export async function recordBatchTransaction(
  data: BatchTransactionRequest,
): Promise<void> {
  batchAPILog.info('Recording batch transaction', {
    batchId: data.batchId,
    quantity: data.quantity,
    type: data.transactionType,
  });

  try {
    await invoke<void>('record_batch_transaction', { request: data });
  } catch (error) {
    batchAPILog.error('Failed to record batch transaction', error);
    throw new Error(
      `Failed to record batch transaction: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Gets batches expiring within specified days
 *
 * @param days Number of days
 * @returns Promise with list of expiring batches
 */
export async function getExpiringBatches(days: number): Promise<BatchItem[]> {
  batchAPILog.info('Getting expiring batches', { days });

  try {
    const response = await invoke<BatchItem[]>('get_expiring_batches', {
      days,
    });
    return response;
  } catch (error) {
    batchAPILog.error('Failed to get expiring batches', error);
    throw new Error(
      `Failed to get expiring batches: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// React Query hooks

/**
 * React Query hook for adding a batch
 */
export function useAddBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBatch,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['batches', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
    },
  });
}

/**
 * React Query hook for updating a batch
 */
export function useUpdateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBatch,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['batches', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['batches', data.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
    },
  });
}

/**
 * React Query hook for getting a batch
 */
export function useGetBatch(batchId: string) {
  return useQuery({
    queryKey: ['batches', batchId],
    queryFn: () => getBatch(batchId),
    enabled: !!batchId,
  });
}

/**
 * React Query hook for listing batches by product
 */
export function useListBatchesByProduct(productId: string) {
  return useQuery({
    queryKey: ['batches', productId],
    queryFn: () => listBatchesByProduct(productId),
    enabled: !!productId,
  });
}

/**
 * React Query hook for recording a batch transaction
 */
export function useRecordBatchTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordBatchTransaction,
    onSuccess: (_data, variables) => {
      // Get the batch to find its product ID
      queryClient
        .fetchQuery({
          queryKey: ['batches', variables.batchId],
          queryFn: () => getBatch(variables.batchId),
        })
        .then(batch => {
          if (batch) {
            queryClient.invalidateQueries({
              queryKey: ['batches', batch.productId],
            });
          }
        });

      queryClient.invalidateQueries({
        queryKey: ['batches', variables.batchId],
      });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
    },
  });
}

/**
 * React Query hook for getting expiring batches
 */
export function useExpiringBatches(days = 30) {
  return useQuery({
    queryKey: ['batches', 'expiring', days],
    queryFn: () => getExpiringBatches(days),
  });
}

/**
 * Fetches all batches from the database
 */
export async function listAllBatches(): Promise<BatchItem[]> {
  try {
    batchAPILog.debug('Fetching all batches');
    const result = await invoke<BatchItem[]>('list_all_batches');
    batchAPILog.debug('Fetched all batches successfully', { count: result.length });
    return result;
  } catch (error) {
    batchAPILog.error('Failed to fetch all batches', { error });
    throw error;
  }
}

/**
 * React Query hook for fetching all batches
 */
export function useListAllBatches() {
  return useQuery({
    queryKey: ['batches', 'all'],
    queryFn: listAllBatches,
  });
}

/**
 * Lists transaction history for a specific batch
 *
 * @param batchId Batch ID
 * @returns Promise with list of batch transactions
 */
export async function listBatchTransactions(
  batchId: string
): Promise<BatchTransaction[]> {
  batchAPILog.info('Listing batch transactions', { batchId });

  try {
    const response = await invoke<unknown>('list_batch_transactions', {
      batchId,
    });
    
    // Validate the response with Zod schema
    const validatedTransactions = z.array(BatchTransactionSchema).parse(response);
    
    batchAPILog.debug('Fetched batch transactions successfully', { 
      batchId, 
      count: validatedTransactions.length 
    });
    
    return validatedTransactions;
  } catch (error) {
    batchAPILog.error('Failed to list batch transactions', { batchId, error });
    throw new Error(
      `Failed to list batch transactions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * React Query hook for listing batch transactions
 *
 * @param batchId Batch ID
 * @returns Query result with transactions, loading state, and error
 */
export function useListBatchTransactions(batchId: string) {
  return useQuery({
    queryKey: ['batches', batchId, 'transactions'],
    queryFn: () => listBatchTransactions(batchId),
    enabled: !!batchId, // Only run the query if batchId is provided
  });
}


