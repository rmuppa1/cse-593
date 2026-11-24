import { SearchX } from 'lucide-react';
export default function EmptyState({ title = 'Nothing here yet', message = 'Try adjusting your filters or check back soon.' }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><SearchX className="mx-auto mb-4 h-9 w-9 text-slate-400" /><h3 className="font-bold text-ink">{title}</h3><p className="mt-1 text-sm text-slate-500">{message}</p></div>;
}

