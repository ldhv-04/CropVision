/**
 * Offline Mutation & Synchronization Domain Contracts
 * Strictly adheres to Rule 2.1 (<= 300 LOC) and Rule 2.2 (Strict Typing).
 */

export type MutationType =
  | 'CREATE_FIELD'
  | 'UPDATE_FIELD_GEOMETRY'
  | 'RECORD_DIAGNOSIS'
  | 'UPDATE_ZONE_METRICS'
  | 'DELETE_FIELD';

export type SyncStatus = 'pending' | 'syncing' | 'failed' | 'acknowledged';

export interface OfflineMutation {
  mutationId: string;
  idempotencyKey: string;
  type: MutationType;
  payload: Record<string, unknown>;
  createdAt: string; // ISO timestamp
  retryCount: number;
  lastAttemptAt: string | null;
  status: SyncStatus;
  errorMessage?: string;
}

export interface SyncBatchResult {
  successful: string[];
  failed: {
    mutationId: string;
    error: string;
    retryable: boolean;
  }[];
  syncedAt: string;
}
