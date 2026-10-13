import { Buffer } from 'buffer';

// Anchor Borsh layouts expect Buffer and process in the browser.
if (!('Buffer' in globalThis)) Object.assign(globalThis, { Buffer });
if (!('process' in globalThis)) {
  Object.assign(globalThis, { process: { env: {} } });
}
