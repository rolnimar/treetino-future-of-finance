import { useMemo, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { ConnectedWallet } from '../../chain/wallet';
import { getActivePersona, getPersonaConnectedWallet } from './demo-personas';

export function useConnectedWallet(): ConnectedWallet | null {
  const {
    connected,
    publicKey,
    signMessage,
    signTransaction,
    sendTransaction,
  } = useWallet();

  const [persona, setPersona] = useState(() => getActivePersona());

  useEffect(() => {
    const handlePersonaChange = () => {
      setPersona(getActivePersona());
    };
    window.addEventListener('treetino-persona-changed', handlePersonaChange);
    return () => {
      window.removeEventListener(
        'treetino-persona-changed',
        handlePersonaChange,
      );
    };
  }, []);

  return useMemo<ConnectedWallet | null>(() => {
    if (connected && publicKey) {
      return {
        address: publicKey.toBase58(),
        signMessage,
        signTransaction,
        sendTransaction,
      };
    }
    if (persona) {
      return getPersonaConnectedWallet(persona);
    }
    return null;
  }, [
    persona,
    connected,
    publicKey,
    signMessage,
    signTransaction,
    sendTransaction,
  ]);
}
