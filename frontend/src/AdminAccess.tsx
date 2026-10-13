import { lazy, Suspense } from 'react';
import { useAuth } from './features/auth/auth-context';
import { useConnectedWallet } from './features/wallet/use-connected-wallet';
import { Button } from './components/ui/button';
import { ErrorMessage } from './components/ui/feedback';
const AdminWorkspace = lazy(() =>
  import('./features/admin/admin-workspace').then((module) => ({
    default: module.AdminWorkspace,
  })),
);
export function AdminAccess() {
  const auth = useAuth();
  const wallet = useConnectedWallet();
  const connected = !!wallet;
  return (
    <section
      aria-label="Admin access"
      className="border-t border-black/10 py-12"
    >
      <p className="eyebrow text-t-blue">
        {auth.session ? 'ADMIN ACCESS' : 'PUBLIC ACCESS'}
      </p>
      <h2 className="mb-3 text-2xl font-black text-zinc-950">
        {auth.session ? 'Admin workspace' : 'Admin access'}
      </h2>
      {auth.session ? (
        <>
          <p className="mb-6 text-sm text-zinc-600 break-all">
            Signed in as {auth.session.admin.wallet}
          </p>
          <Suspense fallback={<p>Loading admin tools…</p>}>
            <AdminWorkspace />
          </Suspense>
        </>
      ) : (
        <>
          <p className="mb-5 text-sm text-zinc-600">
            {auth.isSigningIn
              ? 'Confirm the message in your wallet to verify admin access.'
              : connected
                ? 'Approved wallets can verify admin access by signing a message.'
                : 'Connect your wallet, then sign in to manage the protocol.'}
          </p>
          <ErrorMessage error={auth.error} />
          {connected && !auth.isSigningIn && (
            <Button variant="secondary" onClick={auth.retry}>
              Sign in as admin
            </Button>
          )}
        </>
      )}
    </section>
  );
}
