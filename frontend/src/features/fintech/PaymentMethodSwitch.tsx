export function PaymentMethodSwitch({
  method,
  onChange,
  disabled = false,
}: {
  method: 'card' | 'usdc';
  onChange: (method: 'card' | 'usdc') => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Payment method" className="flex gap-2">
      {(['card', 'usdc'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={method === value}
          disabled={disabled}
          onClick={() => onChange(value)}
          className={`flex-1 rounded-xl border p-3 text-sm font-semibold disabled:opacity-50 ${method === value ? 'border-blue-700 bg-blue-50 text-blue-900' : 'border-zinc-200 bg-white text-zinc-600'}`}
        >
          {value === 'card' ? 'Card' : 'Direct USDC'}
        </button>
      ))}
    </div>
  );
}
