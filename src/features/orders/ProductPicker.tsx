import { useEffect, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '../../lib/api';

export interface VariantOption {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: string;
}

interface ProductPickerProps {
  id: string;
  value: string;
  onChange: (variantId: string) => void;
}

export function ProductPicker({ id, value, onChange }: ProductPickerProps) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<VariantOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VariantOption | null>(null);

  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api<VariantOption[]>(`/shopify/variants?search=${encodeURIComponent(term)}`)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [term]);

  function choose(option: VariantOption) {
    setSelected(option);
    onChange(option.variantId);
  }

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {selected.productTitle}
              {selected.variantTitle !== 'Default Title' && <span className="text-slate-500"> · {selected.variantTitle}</span>}
            </p>
            <p className="text-xs text-slate-500">
              Variant ID {selected.variantId} · {Number(selected.price).toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-slate-600 underline-offset-4 hover:underline"
            onClick={() => {
              setSelected(null);
              onChange('');
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id={id}
              placeholder="Search products by name…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="bg-white pl-9"
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />}
          </div>
          {results.length > 0 && (
            <ul className="max-h-60 divide-y overflow-auto rounded-md border bg-white">
              {results.map((option) => (
                <li key={option.variantId}>
                  <button
                    type="button"
                    onClick={() => choose(option)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {option.productTitle}
                        {option.variantTitle !== 'Default Title' && <span className="text-slate-500"> · {option.variantTitle}</span>}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {option.sku ? `SKU ${option.sku} · ` : ''}ID {option.variantId}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      {Number(option.price).toFixed(2)}
                      {option.variantId === value && <Check className="size-4 text-emerald-600" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && term && results.length === 0 && (
            <p className="text-xs text-slate-500">No products match “{term}”.</p>
          )}
        </>
      )}
    </div>
  );
}
