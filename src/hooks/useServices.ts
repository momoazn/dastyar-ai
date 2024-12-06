/**
 * Custom hook for managing service connections
 * @module hooks/useServices
 */

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { checkServices } from '../utils/api';

export const useServices = () => {
  const setConnectionStatus = useStore((state) => state.setConnectionStatus);

  useEffect(() => {
    const checkAvailability = async () => {
      const status = await checkServices();
      setConnectionStatus(status);
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 30000);

    return () => clearInterval(interval);
  }, [setConnectionStatus]);
};