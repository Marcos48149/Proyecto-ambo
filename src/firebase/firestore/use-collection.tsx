'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * Safely extracts the path from a Firestore query or collection reference.
 * @param queryOrRef The query or collection reference
 * @returns The path string or 'unknown' if extraction fails
 */
function extractPath(queryOrRef: CollectionReference<DocumentData> | Query<DocumentData>): string {
  try {
    if (!queryOrRef) {
      return 'unknown (null query)';
    }

    // Check if it's a collection reference
    if (queryOrRef.type === 'collection') {
      const path = (queryOrRef as CollectionReference).path;
      return path || 'unknown (empty collection path)';
    }

    // Try to extract from query internal structure
    const internalQuery = queryOrRef as unknown as InternalQuery;
    if (internalQuery._query?.path) {
      const path = internalQuery._query.path.canonicalString();
      return path || 'unknown (empty query path)';
    }

    return 'unknown (could not extract path)';
  } catch (e) {
    console.error('Error extracting path from query:', e);
    return 'unknown (extraction error)';
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidance. Also make sure that its dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading true
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // Early return if no query provided. This is the key fix.
    // When the component first renders, the query might be null.
    // This ensures we wait for a valid query before proceeding.
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false); // Not loading because we are not fetching.
      setError(null);
      return;
    }

    // Check memoization (development warning)
    if (process.env.NODE_ENV === 'development' && !memoizedTargetRefOrQuery.__memo) {
      console.warn(
        'useCollection: Query was not properly memoized using useMemoFirebase. This may cause infinite loops.',
        memoizedTargetRefOrQuery
      );
    }

    setIsLoading(true);
    setError(null);

    // Extract path early for error handling
    const queryPath = extractPath(memoizedTargetRefOrQuery);

    // Subscribe to the collection/query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        console.error('Firestore error:', error);
        console.error('Query path:', queryPath);

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: queryPath,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
