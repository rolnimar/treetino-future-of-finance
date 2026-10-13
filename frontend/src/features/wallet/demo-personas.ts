import {
  Keypair,
  type Transaction,
  type VersionedTransaction,
  type Connection,
  type SendOptions,
} from '@solana/web3.js';
import nacl from 'tweetnacl';
import type { ConnectedWallet } from '../../chain/wallet';

export interface DemoPersona {
  id: string;
  label: string;
  shortLabel: string;
  role: string;
  address: string;
  description: string;
  secretKey: Uint8Array;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'host',
    label: 'Commercial Host (MKovo)',
    shortLabel: 'Host',
    role: '0% CAPEX Facility Off-Taker',
    address: 'HSfu83FdjREjj61z3DK6gBepM1Y2QWqHkRYLozTEbmzc',
    description:
      'Posts 100 SOL collateral into Marinade to guarantee power off-take agreement.',
    secretKey: new Uint8Array([
      11, 158, 79, 214, 122, 8, 32, 64, 7, 226, 245, 92, 181, 193, 176, 67, 28,
      78, 229, 237, 5, 169, 220, 229, 57, 157, 155, 159, 40, 176, 43, 173, 244,
      78, 126, 111, 74, 35, 10, 192, 193, 194, 227, 248, 57, 80, 106, 92, 253,
      0, 3, 90, 118, 129, 191, 57, 70, 65, 21, 222, 91, 1, 124, 221,
    ]),
  },
  {
    id: 'investor-alice',
    label: 'Investor: Alice',
    shortLabel: 'Alice',
    role: 'Clean Energy Backer',
    address: 'A3A4vAVnFnJaLiCJWVL363Mm32ds3oG89GaHdb4SAMPX',
    description:
      'Liquid yield investor funding solar trees and battery storage.',
    secretKey: new Uint8Array([
      126, 168, 138, 54, 128, 186, 154, 176, 182, 112, 169, 37, 156, 123, 143,
      220, 218, 70, 2, 221, 127, 103, 47, 103, 142, 80, 183, 227, 39, 142, 114,
      71, 134, 70, 152, 189, 131, 179, 125, 236, 123, 189, 127, 198, 80, 82,
      136, 213, 92, 70, 191, 138, 149, 248, 215, 80, 146, 212, 179, 250, 53,
      253, 99, 66,
    ]),
  },
  {
    id: 'investor-bob',
    label: 'Investor: Bob',
    shortLabel: 'Bob',
    role: 'DePIN Infrastructure Fund',
    address: '1nhHEz7J7Qy8DDoUBKJtPwXh61Bso6pvb5UbBCw2Vrf',
    description: 'Co-investor funding commercial grid-scale battery storage.',
    secretKey: new Uint8Array([
      20, 93, 224, 93, 29, 178, 104, 43, 220, 53, 52, 155, 180, 18, 102, 34, 73,
      63, 167, 51, 129, 31, 106, 38, 55, 245, 102, 133, 112, 5, 143, 133, 0, 51,
      170, 187, 14, 79, 136, 162, 10, 67, 54, 255, 198, 240, 4, 205, 196, 103,
      233, 9, 157, 242, 207, 155, 59, 123, 200, 126, 39, 146, 235, 24,
    ]),
  },
  {
    id: 'admin',
    label: 'Protocol Originator',
    shortLabel: 'Admin',
    role: 'Originator & Tree Deployer',
    address: 'GQZnVmJiySbuZ77HWuu4oB1BQaS2hXXnUtNovyGK2PpE',
    description:
      'Deploys on-chain tree programs and launches community crowdfunding campaigns.',
    secretKey: new Uint8Array([
      180, 82, 201, 90, 27, 188, 162, 25, 175, 42, 224, 100, 69, 120, 177, 254,
      0, 13, 237, 247, 148, 167, 119, 72, 159, 151, 165, 163, 78, 24, 24, 140,
      228, 232, 187, 97, 144, 212, 170, 72, 145, 85, 178, 92, 176, 52, 189, 88,
      190, 56, 91, 201, 84, 41, 200, 116, 38, 27, 153, 35, 135, 155, 3, 243,
    ]),
  },
];

const STORAGE_KEY = 'treetino_active_demo_persona';

export function getActivePersona(): DemoPersona | null {
  if (typeof window === 'undefined') return null;
  // If not running under automated webdriver/puppeteer, clear any stale demo persona
  if (typeof navigator !== 'undefined' && !navigator.webdriver) {
    if (localStorage.getItem(STORAGE_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }
  const id = localStorage.getItem(STORAGE_KEY);
  if (!id) return null;
  return DEMO_PERSONAS.find((p) => p.id === id) ?? null;
}

export function setActivePersona(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (!id) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, id);
  }
  window.dispatchEvent(
    new CustomEvent('treetino-persona-changed', { detail: id }),
  );
}

export function getPersonaConnectedWallet(
  persona: DemoPersona,
): ConnectedWallet {
  const keypair = Keypair.fromSecretKey(persona.secretKey);

  return {
    address: persona.address,
    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      return nacl.sign.detached(message, keypair.secretKey);
    },
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      transaction: T,
    ): Promise<T> => {
      if ('version' in transaction) {
        (transaction as VersionedTransaction).sign([keypair]);
      } else {
        (transaction as Transaction).partialSign(keypair);
      }
      return transaction;
    },
    sendTransaction: async (
      transaction: Transaction | VersionedTransaction,
      connection: Connection,
      options?: SendOptions,
    ): Promise<string> => {
      if ('version' in transaction) {
        (transaction as VersionedTransaction).sign([keypair]);
      } else {
        (transaction as Transaction).partialSign(keypair);
      }
      const raw = transaction.serialize();
      return connection.sendRawTransaction(raw, options);
    },
  };
}
