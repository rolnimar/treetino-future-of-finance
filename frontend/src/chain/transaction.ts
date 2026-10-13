import { type Connection, type Transaction } from '@solana/web3.js';
import type { ConnectedWallet } from './wallet';
/** Signs and submits a frontend-built transaction; authentication is handled by its caller. */
export async function sendWalletTransaction(
  connection: Connection,
  connected: ConnectedWallet,
  transaction: Transaction,
  submitted: (signature: string) => void,
  signal?: AbortSignal,
) {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed');
  transaction.recentBlockhash = blockhash;
  signal?.throwIfAborted();
  let signature: string;
  if (connected.signTransaction) {
    const signed = await connected.signTransaction(transaction);
    signal?.throwIfAborted();
    signature = await connection.sendRawTransaction(signed.serialize(), {
      preflightCommitment: 'confirmed',
      skipPreflight: true,
      maxRetries: 3,
    });
  } else {
    signature = await connected.sendTransaction(transaction, connection, {
      preflightCommitment: 'confirmed',
      skipPreflight: true,
      maxRetries: 3,
    });
  }
  submitted(signature);
  // HTTP polling avoids a separate browser WebSocket subscription.
  for (let attempt = 0; attempt < 60; attempt++) {
    signal?.throwIfAborted();
    const {
      value: [status],
    } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    if (status?.err)
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    if (
      status?.confirmationStatus === 'confirmed' ||
      status?.confirmationStatus === 'finalized'
    )
      return signature;
    if (
      !status &&
      (await connection.getBlockHeight('confirmed')) > lastValidBlockHeight
    )
      throw new Error(
        'Transaction expired before confirmation. Refresh before trying again.',
      );
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(
    'Confirmation is taking longer than expected. Check the transaction link before retrying.',
  );
}
