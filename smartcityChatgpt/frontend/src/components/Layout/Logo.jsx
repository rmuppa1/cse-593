import { Building2 } from 'lucide-react';
export default function Logo({ light = false }) {
  return <span className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${light ? 'text-white' : 'text-forest-900'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-white/15' : 'bg-forest-700 text-white'}`}><Building2 size={19} /></span><span className="text-lg">SmartCity <span className={light ? 'text-coral-100' : 'text-coral-600'}>Hub</span></span></span>;
}

