import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import type { IndexedTree, IndexedReport } from '../../../lib/schemas';
import { invoiceFormSchema } from '../schemas';
import { useAdmin } from '../admin-context';
import { Button } from '../../../components/ui/button';
import { Field, SelectField } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import { formatTokenAmount, utcDay } from '../../../chain/amounts';
import { REPORT_PAGE_SIZE, useTreeReports } from '../../trees/use-tree-reports';
import { ReportDetails } from '../../trees/components/report-details';
export function ReportsPanel({ tree }: { tree: IndexedTree }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const query = useTreeReports(tree.address, page, open);
  const uninvoiced =
    query.data?.reports.filter(
      (report) =>
        !report.invoiceIssued &&
        report.pricing?.method === 'quarter-hour' &&
        report.pricing?.amount !== null &&
        report.pricing,
    ) ?? [];
  return (
    <div className="space-y-4 border-t border-black/10 pt-4">
      <Button
        variant="secondary"
        disabled={query.isFetching}
        onClick={() => {
          setOpen(true);
          if (open) void query.refetch();
        }}
      >
        Load reports & invoices
      </Button>
      <ErrorMessage error={query.error} />
      {query.isFetching && <p className="text-sm">Loading reports…</p>}
      {query.data && (
        <>
          <p className="text-sm">{query.data.total} production reports</p>
          <div className="space-y-4 text-sm">
            {query.data.reports.map((report) => (
              <div
                key={report.address}
                className="rounded-xl border border-black/10 p-3 bg-zinc-50"
              >
                <ReportDetails report={report} />
              </div>
            ))}
          </div>
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
          {uninvoiced.length > 0 && (
            <InvoiceForm
              key={uninvoiced.map((report) => report.address).join(',')}
              tree={tree}
              reports={uninvoiced}
            />
          )}
        </>
      )}
    </div>
  );
}
function InvoiceForm({
  tree,
  reports,
}: {
  tree: IndexedTree;
  reports: IndexedReport[];
}) {
  const { disabled, wallet, transaction } = useAdmin();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<
    z.input<typeof invoiceFormSchema>,
    unknown,
    z.output<typeof invoiceFormSchema>
  >({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      report: reports[0]?.address ?? '',
      amount: reports[0]?.pricing?.amount
        ? formatTokenAmount(reports[0].pricing.amount)
        : '0',
    },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        const report = reports.find((report) => report.address === data.report);
        if (report)
          transaction.mutate({
            action: 'issueInvoice',
            tree,
            report,
            amount: data.amount,
          });
      })}
    >
      <fieldset
        disabled={disabled || tree.creator !== wallet}
        className="max-w-md space-y-4 disabled:opacity-60"
      >
        <SelectField
          label="Report"
          {...register('report')}
          onChange={(event) => {
            setValue('report', event.target.value);
            const selected = reports.find(
              (report) => report.address === event.target.value,
            );
            setValue(
              'amount',
              selected?.pricing?.amount
                ? formatTokenAmount(selected.pricing.amount)
                : '0',
            );
          }}
          error={errors.report?.message}
        >
          {reports.map((report) => (
            <option key={report.address} value={report.address}>
              {utcDay(report.dayStartTs)} · {report.totalWh} Wh
            </option>
          ))}
        </SelectField>
        <Field
          label="Final invoice amount (USDC)"
          {...register('amount')}
          error={errors.amount?.message}
        />
        <p className="text-xs text-zinc-500">
          Prefilled from the backend’s 15-minute spot-price calculation. Review
          before signing; the final amount cannot be changed once issued. Zero
          is allowed.
        </p>
        <Button type="submit">Issue invoice</Button>
      </fieldset>
    </form>
  );
}
