import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that provides AbortSignals for fetch requests and
 * automatically cancels them on component unmount.
 */
export function useCancellableRequest() {
  const controllersRef = useRef<AbortController[]>([]);

  useEffect(() => {
    return () => {
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current = [];
    };
  }, []);

  const createAbortSignal = useCallback((): AbortSignal => {
    const controller = new AbortController();
    controllersRef.current.push(controller);
    return controller.signal;
  }, []);

  const cancelAll = useCallback(() => {
    controllersRef.current.forEach((controller) => controller.abort());
    controllersRef.current = [];
  }, []);

  return { createAbortSignal, cancelAll };
}
