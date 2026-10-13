import type { Connection } from '@solana/web3.js';

export const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';

const genesisCache = new Map<string, string>();

export async function assertDevnet(connection: Connection) {
  const endpoint = connection.rpcEndpoint;
  let genesis = genesisCache.get(endpoint);
  if (!genesis) {
    try {
      genesis = await connection.getGenesisHash();
      genesisCache.set(endpoint, genesis);
    } catch (err) {
      if (endpoint.includes('devnet')) return;
      throw err;
    }
  }
  if (genesis !== DEVNET_GENESIS && !endpoint.includes('devnet'))
    throw new Error('Select a devnet RPC to use this deployment');
}
