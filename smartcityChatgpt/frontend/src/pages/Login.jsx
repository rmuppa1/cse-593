import { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/Layout/Logo.jsx';
import Spinner from '../components/UI/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { name: '', email: '', password: '', requestedRole: 'CITIZEN', department: '' };
const departments = ['Public Works', 'Water Services', 'Public Safety', 'Parks and Recreation', 'Transportation', 'Neighborhood Services', 'Environmental Services'];

export default function Login() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState(emptyForm); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  const { login, register } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'register') {
        const result = await register(form);
        toast.success(result.message, { duration: 6000 });
        setMode('login'); setForm((current) => ({ ...current, password: '' }));
        return;
      }
      const user = await login({ email: form.email, password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname || (['ADMIN', 'MANAGER'].includes(user.role) ? '/admin' : '/'));
    } catch (err) {
      const message = err.response?.data?.message || (err.request ? 'Cannot reach the city API. Make sure the backend is running on port 5003.' : 'We could not sign you in');
      toast.error(message);
    } finally { setLoading(false); }
  };
  const demo = (email) => { setMode('login'); setForm({ ...emptyForm, email, password: 'Password123!' }); };
  const switchMode = () => { setMode(mode === 'login' ? 'register' : 'login'); setForm(emptyForm); };

  return <div className="grid min-h-screen bg-sand lg:grid-cols-2">
    <div className="relative hidden overflow-hidden bg-forest-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="mesh absolute inset-0 opacity-70" /><div className="relative"><Link to="/"><Logo light /></Link></div>
      <div className="relative max-w-xl"><p className="eyebrow !text-coral-100">Welcome home</p><h1 className="mt-4 font-display text-6xl leading-tight">A better city starts with neighbors like you.</h1><div className="mt-10 space-y-4 text-sm text-forest-100/75"><p className="flex items-center gap-3"><CheckCircle2 className="text-coral-500" />Get city updates that actually matter to you</p><p className="flex items-center gap-3"><CheckCircle2 className="text-coral-500" />Track every report from submission to resolution</p><p className="flex items-center gap-3"><CheckCircle2 className="text-coral-500" />Find new ways to connect with your community</p></div></div>
      <p className="relative text-xs text-white/40">Secure access powered by your city.</p>
    </div>
    <div className="flex items-center justify-center px-5 py-12"><div className="w-full max-w-md"><div className="mb-9 lg:hidden"><Link to="/"><Logo /></Link></div><p className="eyebrow">SmartCity account</p><h2 className="mt-2 font-display text-4xl text-forest-900">{mode === 'login' ? 'Good to see you.' : 'Apply to join.'}</h2><p className="mt-3 text-sm text-slate-500">{mode === 'login' ? 'Sign in to see your events, reports, and updates.' : 'Choose how you will participate. A city administrator will review your application.'}</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {mode === 'register' && <>
          <div><label className="label">Full name</label><div className="relative"><UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input className="field !pl-12" name="name" value={form.name} onChange={update} required placeholder="Your name" /></div></div>
          <div><label className="label">Apply as</label><div className="grid grid-cols-2 gap-3">
            <label className={`cursor-pointer rounded-xl border-2 p-4 text-sm transition ${form.requestedRole === 'CITIZEN' ? 'border-forest-600 bg-forest-50' : 'border-slate-200 bg-white'}`}><input className="sr-only" type="radio" name="requestedRole" value="CITIZEN" checked={form.requestedRole === 'CITIZEN'} onChange={update} /><span className="block font-bold">Citizen</span><span className="mt-1 block text-xs text-slate-500">Events and requests</span></label>
            <label className={`cursor-pointer rounded-xl border-2 p-4 text-sm transition ${form.requestedRole === 'MANAGER' ? 'border-forest-600 bg-forest-50' : 'border-slate-200 bg-white'}`}><input className="sr-only" type="radio" name="requestedRole" value="MANAGER" checked={form.requestedRole === 'MANAGER'} onChange={update} /><span className="block font-bold">Dept. manager</span><span className="mt-1 block text-xs text-slate-500">Manage city work</span></label>
          </div></div>
          {form.requestedRole === 'MANAGER' && <div><label className="label">Department</label><select className="field" name="department" value={form.department} onChange={update} required><option value="">Choose a department</option>{departments.map((department) => <option key={department}>{department}</option>)}</select></div>}
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">An administrator must approve your application before you can sign in.</p>
        </>}
        <div><label className="label">Email address</label><div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input className="field !pl-12" type="email" name="email" value={form.email} onChange={update} required placeholder="you@example.com" /></div></div>
        <div><div className="flex justify-between"><label className="label">Password</label>{mode === 'login' && <button type="button" className="mb-2 text-xs font-bold text-forest-700">Forgot password?</button>}</div><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input className="field !px-12" type={show ? 'text' : 'password'} name="password" value={form.password} onChange={update} required minLength={mode === 'register' ? 8 : 1} placeholder="••••••••" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
        <button disabled={loading} className="btn-primary w-full">{loading ? <Spinner /> : <>{mode === 'login' ? 'Sign in' : 'Submit application'}<ArrowRight size={17} /></>}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">{mode === 'login' ? 'New to SmartCity Hub?' : 'Already applied?'} <button className="font-bold text-forest-700" onClick={switchMode}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      {mode === 'login' && <div className="mt-8 border-t border-slate-200 pt-6"><p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">Approved demo accounts</p><div className="grid grid-cols-3 gap-2"><button onClick={() => demo('citizen@example.com')} className="rounded-xl border bg-white px-2 py-2.5 text-xs font-bold text-slate-600">Citizen</button><button onClick={() => demo('admin@smartcity.gov')} className="rounded-xl border bg-white px-2 py-2.5 text-xs font-bold text-slate-600">Admin</button><button onClick={() => demo('manager@smartcity.gov')} className="rounded-xl border bg-white px-2 py-2.5 text-xs font-bold text-slate-600">Manager</button></div></div>}
    </div></div>
  </div>;
}
