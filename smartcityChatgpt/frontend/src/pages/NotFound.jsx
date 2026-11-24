import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
export default function NotFound() { return <div className="page-wrap grid min-h-[600px] place-items-center py-16 text-center"><div><p className="font-display text-8xl text-forest-200">404</p><h1 className="mt-3 text-3xl font-bold">This street doesn’t exist.</h1><p className="mt-3 text-slate-500">Let’s get you back to familiar ground.</p><Link to="/" className="btn-primary mt-7"><ArrowLeft size={17} />Back home</Link></div></div>; }

