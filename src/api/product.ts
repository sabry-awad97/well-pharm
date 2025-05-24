import { createComponentLogger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

const productAPILog = createComponentLogger('ProductAPI');

// Schema definitions
export const ProductCategorySchema = z.enum([
  'Prescription',
  'OTC',
  'Supplement',
  'MedicalDevice',
  'Other',
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Product name is required'),
  genericName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string(),
  dosageForm: z.string().min(1, 'Dosage form is required'),
  strength: z.string().min(1, 'Strength is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  barcode: z.string().nullable().optional(),
  activeIngredients: z.any(),
  image: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  genericName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string(),
  dosageForm: z.string().min(1, 'Dosage form is required'),
  strength: z.string().min(1, 'Strength is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  barcode: z.string().nullable().optional(),
  activeIngredients: z.any(),
  image: z.string().nullable().optional(),
});

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = z.object({
  id: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Product name is required').optional(),
  genericName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
  dosageForm: z.string().min(1, 'Dosage form is required').optional(),
  strength: z.string().min(1, 'Strength is required').optional(),
  manufacturer: z.string().min(1, 'Manufacturer is required').optional(),
  barcode: z.string().nullable().optional(),
  activeIngredients: z.any().optional(),
  image: z.string().nullable().optional(),
});

export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

/**
 * Creates a new product
 *
 * @param data Product data to create
 * @returns Promise with the created product
 */
export async function createProduct(
  data: CreateProductRequest,
): Promise<Product> {
  productAPILog.info('Creating new product', { name: data.name });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('create_product', { request: data });

    // Validate the response with Zod schema
    const validatedProduct = ProductSchema.parse(response);

    return validatedProduct;
  } catch (error) {
    productAPILog.error('Failed to create product', error);
    throw new Error(
      `Failed to create product: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Updates an existing product
 *
 * @param data Product data to update
 * @returns Promise with the updated product
 */
export async function updateProduct(
  data: UpdateProductRequest,
): Promise<Product> {
  productAPILog.info('Updating product', { id: data.id });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('update_product', { request: data });

    // Validate the response with Zod schema
    const validatedProduct = ProductSchema.parse(response);

    return validatedProduct;
  } catch (error) {
    productAPILog.error('Failed to update product', error);
    throw new Error(
      `Failed to update product: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Deletes a product by ID
 *
 * @param id Product ID to delete
 * @returns Promise that resolves when the product is deleted
 */
export async function deleteProduct(id: string): Promise<void> {
  productAPILog.info('Deleting product', { id });

  try {
    // Call the Tauri backend command
    await invoke<void>('delete_product', { id });
  } catch (error) {
    productAPILog.error('Failed to delete product', error);
    throw new Error(
      `Failed to delete product: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Gets a product by ID
 *
 * @param id Product ID to retrieve
 * @returns Promise with the product or null if not found
 */
export async function getProductById(id: string): Promise<Product | null> {
  productAPILog.info('Getting product by ID', { id });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('get_product_by_id', { id });

    // If null, return null
    if (response === null) {
      return null;
    }

    // Validate the response with Zod schema
    const validatedProduct = ProductSchema.parse(response);

    return validatedProduct;
  } catch (error) {
    productAPILog.error('Failed to get product by ID', error);
    throw new Error(
      `Failed to get product: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Fetches all products from the database
 *
 * @returns Promise with array of all products
 */
export async function fetchAllProducts(): Promise<Product[]> {
  productAPILog.info('Fetching all products');

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('get_all_products');

    // Validate the response with Zod schema
    const validatedProducts = z.array(ProductSchema).parse(response);

    return validatedProducts;
  } catch (error) {
    productAPILog.error('Failed to fetch all products', error);
    throw new Error(
      `Failed to fetch all products: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Searches products by query string
 *
 * @param query Search query
 * @returns Promise with array of matching products
 */
export async function searchProducts(query: string): Promise<Product[]> {
  productAPILog.info('Searching products', { query });

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('search_products', { query });

    // Validate the response with Zod schema
    const validatedProducts = z.array(ProductSchema).parse(response);

    return validatedProducts;
  } catch (error) {
    productAPILog.error('Failed to search products', error);
    throw new Error(
      `Failed to search products: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Filters products by category and/or manufacturer
 *
 * @param params Filter parameters
 * @returns Promise with array of filtered products
 */
export async function filterProducts(params: {
  category?: string;
  manufacturer?: string;
}): Promise<Product[]> {
  productAPILog.info('Filtering products', params);

  try {
    // Call the Tauri backend command
    const response = await invoke<unknown>('filter_products', params);

    // Validate the response with Zod schema
    const validatedProducts = z.array(ProductSchema).parse(response);

    return validatedProducts;
  } catch (error) {
    productAPILog.error('Failed to filter products', error);
    throw new Error(
      `Failed to filter products: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * React Query hook for getting a product by ID
 */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => (id ? getProductById(id) : null),
    enabled: !!id,
  });
}

/**
 * React Query hook for searching products
 */
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts(query),
    enabled: query.length > 0,
  });
}

/**
 * React Query hook for filtering products
 */
// Enhanced filter parameters
export interface ProductFilterParams {
  category?: string;
  manufacturer?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: string;
  priceMax?: string;
}

/**
 * Fetches products based on filter criteria
 */
export function useProductFilter(params: ProductFilterParams) {
  const queryKey = ['products', 'filter', params];

  return useQuery({
    queryKey,
    queryFn: async () => {
      productAPILog.info('Filtering products', params);

      try {
        // Fetch all products from the backend
        const allProducts = await fetchAllProducts();

        // Apply filters
        return allProducts.filter(product => {
          // Category filter (supports comma-separated multi-select)
          if (params.category && params.category.length > 0) {
            const categories = params.category.split(',');
            if (!categories.includes(product.category)) {
              return false;
            }
          }

          // Manufacturer filter (supports comma-separated multi-select)
          if (params.manufacturer && params.manufacturer.length > 0) {
            const manufacturers = params.manufacturer.split(',');
            if (!manufacturers.includes(product.manufacturer)) {
              return false;
            }
          }

          // Date range filter
          if (params.dateFrom || params.dateTo) {
            const productDate = new Date(product.updatedAt);

            if (params.dateFrom && new Date(params.dateFrom) > productDate) {
              return false;
            }

            if (params.dateTo && new Date(params.dateTo) < productDate) {
              return false;
            }
          }

          // Price range filter (assuming products have a price field)
          if (params.priceMin || params.priceMax) {
            // This is a mock implementation - adjust based on your actual data model
            const price = product.price || 0;

            if (params.priceMin && Number(params.priceMin) > price) {
              return false;
            }

            if (params.priceMax && Number(params.priceMax) < price) {
              return false;
            }
          }

          return true;
        });
      } catch (error) {
        productAPILog.error('Error filtering products', error);
        throw error;
      }
    },
  });
}

/**
 * React Query mutation hook for creating a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.setQueryData(['product', data.id], data);
    },
  });
}

/**
 * React Query mutation hook for updating a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.setQueryData(['product', data.id], data);
    },
  });
}

/**
 * React Query mutation hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.removeQueries({ queryKey: ['product', variables] });
    },
  });
}
