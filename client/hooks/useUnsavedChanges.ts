// client/hooks/useUnsavedChanges.ts

import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChanges(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false);
  
  const blocker = useBlocker(({ nextLocation }) => {
    if (isDirty && nextLocation.pathname !== location.pathname) {
      setShowModal(true);
      return true; // Block navigation
    }
    return false; // Allow navigation
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const handleConfirmNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
    setShowModal(false);
  };

  const handleCancelNavigation = () => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
    setShowModal(false);
  };

  return {
    showModal,
    handleConfirmNavigation,
    handleCancelNavigation,
  };
}