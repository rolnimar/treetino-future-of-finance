import { useState } from 'react';
import type {
  ClientSession,
  IndexedReport,
  IndexedTree,
} from '../../../lib/schemas';
import { Button } from '../../../components/ui/button';
import { ErrorMessage, AddressLink } from '../../../components/ui/feedback';
import { formatTokenAmount } from '../../../chain/amounts';
import { REPORT_PAGE_SIZE, useTreeReports } from '../../trees/use-tree-reports';
import { ReportDetails } from '../../trees/components/report-details';

export function TreeInvoices({
  tree,
  wallet,
  balance,
  disabled,
  onPay,
  clientSession,
}: {
  tree: IndexedTree;
  wallet: string | undefined;
  balance: string;
  disabled: boolean;
  onPay: (report: IndexedReport, amount: string) => void;
  clientSession?: ClientSession;
}) {
  const [open, setOpen] = useState(!!clientSession);
  const [page, setPage] = useState(0);
  const query = useTreeReports(tree.address, page, open, clientSession);
  return (
    <div className="mt-5 space-y-3 border-t border-black/10 pt-4">
      <p className="text-xs text-zinc-500">Client wallet</p>
      <AddressLink address={tree.client} />
      <Button variant="secondary" onClick={() => setOpen(!open)}>
        {open ? 'Hide' : 'View'} production & invoices
      </Button>
      {open && (
        <>
          <ErrorMessage error={query.error} />
          {query.isPending && (
            <p className="text-sm">Loading production and invoices…</p>
          )}
          {query.data && (
            <>
              <p className="text-sm">
                {query.data.total} reports · Page {page + 1}
              </p>
              {!query.data.reports.length && (
                <p className="text-sm text-zinc-500">
                  No completed daily reports have been indexed yet.
                </p>
              )}
              {query.data.reports.map((report) => {
                const remaining = BigInt(report.due) - BigInt(report.paid);
                const canPay =
                  report.invoiceIssued &&
                  remaining > 0n &&
                  wallet === tree.client;
                const sufficientBalance = BigInt(balance) >= remaining;
                return (
                  <div
                    key={report.address}
                    className="space-y-3 rounded-xl border border-black/10 bg-zinc-50 p-3"
                  >
                    <ReportDetails report={report} />
                    {canPay && (
                      <>
                        <Button
                          disabled={disabled || !sufficientBalance}
                          onClick={() => onPay(report, remaining.toString())}
                        >
                          Pay {formatTokenAmount(remaining.toString())} EURTree
                        </Button>
                        {!sufficientBalance && (
                          <p className="text-xs text-red-700">
                            Insufficient EURTree balance. Use the demo faucet
                            below.
                          </p>
                        )}
                      </>
                    )}
                    {report.invoiceIssued && remaining === 0n && (
                      <p className="text-sm font-bold text-emerald-700">
                        Invoice settled
                      </p>
                    )}
                    {report.invoiceIssued &&
                      remaining > 0n &&
                      wallet !== tree.client && (
                        <p className="text-xs text-zinc-500">
                          Connect the client wallet to pay this invoice.
                        </p>
                      )}
                  </div>
                );
              })}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  disabled={page === 0 || query.isFetching}
                  onClick={() => setPage(page - 1)}
                >
                  Previous reports
                </Button>
                <Button
                  variant="secondary"
                  disabled={
                    query.isFetching ||
                    (page + 1) * REPORT_PAGE_SIZE >= query.data.total
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Next reports
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
