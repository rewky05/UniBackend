import { ref, push, set, get, onValue, off, query, orderByChild, equalTo, limitToFirst, limitToLast, startAt, endAt } from 'firebase/database';
import { db } from '@/lib/firebase/config';
import type { BaseEntity, FirebaseError } from '@/lib/types';

export abstract class BaseFirebaseService<T extends BaseEntity> {
  protected collectionRef;
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collectionRef = ref(db, collectionName);
  }

  /**
   * Handle Firebase errors with user-friendly messages
   */
  protected handleError(operation: string, error: any): never {
    console.error(`Firebase ${operation} failed:`, error);
    
    const errorCode = error?.code || 'unknown';
    const errorMessage = error?.message || 'An unknown error occurred';

    switch (errorCode) {
      case 'PERMISSION_DENIED':
        throw new Error('You do not have permission to perform this action');
      case 'NETWORK_ERROR':
        throw new Error('Network error. Please check your internet connection');
      case 'DATABASE_ERROR':
        throw new Error('Database error. Please try again later');
      case 'INVALID_ARGUMENT':
        throw new Error('Invalid data provided. Please check your input');
      case 'NOT_FOUND':
        throw new Error('The requested resource was not found');
      default:
        throw new Error(`${operation} failed: ${errorMessage}`);
    }
  }

  /**
   * Generate a new ID for the collection
   */
  protected generateId(): string {
    return push(this.collectionRef).key!;
  }

  /**
   * Create a new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = this.generateId();
      const now = Date.now();
      
      const entityData = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now
      } as T;

      const entityRef = ref(db, `${this.collectionName}/${id}`);
      await set(entityRef, entityData);
      
      return id;
    } catch (error) {
      this.handleError('create', error);
    }
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const entityRef = ref(db, `${this.collectionName}/${id}`);
      const snapshot = await get(entityRef);
      
      return snapshot.exists() ? snapshot.val() as T : null;
    } catch (error) {
      this.handleError('getById', error);
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const entityRef = ref(db, `${this.collectionName}/${id}`);
      
      // Get current data to preserve createdAt
      const currentSnapshot = await get(entityRef);
      if (!currentSnapshot.exists()) {
        throw new Error('Entity not found');
      }

      const currentData = currentSnapshot.val() as T;
      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: Date.now()
      };

      await set(entityRef, updatedData);
    } catch (error) {
      this.handleError('update', error);
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const entityRef = ref(db, `${this.collectionName}/${id}`);
      await set(entityRef, null);
    } catch (error) {
      this.handleError('delete', error);
    }
  }

  /**
   * Subscribe to all entities in the collection
   */
  subscribeToAll(
    callback: (entities: T[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const unsubscribe = onValue(
      this.collectionRef,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const entities = data ? Object.values(data) as T[] : [];
          callback(entities);
        } catch (error) {
          onError(new Error(`Failed to process data: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Subscription failed: ${error.message}`));
      }
    );
    
    return () => off(this.collectionRef, 'value', unsubscribe);
  }

  /**
   * Subscribe to entities with a filter
   */
  subscribeByField<K extends keyof T>(
    field: K,
    value: T[K],
    callback: (entities: T[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const filteredQuery = query(
      this.collectionRef,
      orderByChild(field as string),
      equalTo(value)
    );

    const unsubscribe = onValue(
      filteredQuery,
      (snapshot) => {
        try {
          const data = snapshot.val();
          const entities = data ? Object.values(data) as T[] : [];
          callback(entities);
        } catch (error) {
          onError(new Error(`Failed to process filtered data: ${error.message}`));
        }
      },
      (error) => {
        onError(new Error(`Filtered subscription failed: ${error.message}`));
      }
    );
    
    return () => off(filteredQuery, 'value', unsubscribe);
  }

  /**
   * Get entities with pagination
   */
  async getPaginated(
    page: number = 1,
    limit: number = 10,
    orderBy?: keyof T
  ): Promise<{ entities: T[]; hasMore: boolean }> {
    try {
      const offset = (page - 1) * limit;
      
      let paginatedQuery;
      if (orderBy) {
        paginatedQuery = query(
          this.collectionRef,
          orderByChild(orderBy as string),
          limitToFirst(limit + offset + 1) // +1 to check if there are more
        );
      } else {
        paginatedQuery = query(
          this.collectionRef,
          limitToFirst(limit + offset + 1)
        );
      }

      const snapshot = await get(paginatedQuery);
      
      if (!snapshot.exists()) {
        return { entities: [], hasMore: false };
      }

      const allEntities = Object.values(snapshot.val()) as T[];
      const entities = allEntities.slice(offset, offset + limit);
      const hasMore = allEntities.length > offset + limit;

      return { entities, hasMore };
    } catch (error) {
      this.handleError('getPaginated', error);
    }
  }

  /**
   * Search entities by a text field (case-insensitive)
   */
  async searchByField<K extends keyof T>(
    field: K,
    searchTerm: string
  ): Promise<T[]> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const entities = Object.values(snapshot.val()) as T[];
      const searchTermLower = searchTerm.toLowerCase();

      return entities.filter(entity => {
        const fieldValue = entity[field];
        if (typeof fieldValue === 'string') {
          return fieldValue.toLowerCase().includes(searchTermLower);
        }
        return false;
      });
    } catch (error) {
      this.handleError('searchByField', error);
    }
  }

  /**
   * Count entities in the collection
   */
  async count(): Promise<number> {
    try {
      const snapshot = await get(this.collectionRef);
      
      if (!snapshot.exists()) {
        return 0;
      }

      return Object.keys(snapshot.val()).length;
    } catch (error) {
      this.handleError('count', error);
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const entityRef = ref(db, `${this.collectionName}/${id}`);
      const snapshot = await get(entityRef);
      return snapshot.exists();
    } catch (error) {
      this.handleError('exists', error);
    }
  }

  /**
   * Batch create multiple entities
   */
  async createBatch(entities: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const ids: string[] = [];
      const now = Date.now();

      for (const entityData of entities) {
        const id = this.generateId();
        const entity = {
          ...entityData,
          id,
          createdAt: now,
          updatedAt: now
        } as T;

        const entityRef = ref(db, `${this.collectionName}/${id}`);
        await set(entityRef, entity);
        ids.push(id);
      }

      return ids;
    } catch (error) {
      this.handleError('createBatch', error);
    }
  }
}