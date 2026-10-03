import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';
import { errorMessage } from '../services/api';
import { DEPARTMENTS } from '../utils/constants';

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'CITIZEN', department: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const res = await register({
          name: f.name, email: f.email, password: f.password, role: f.role,
          department: f.role === 'MANAGER' ? f.department : undefined,
        });
        setNotice(res.message);
        setMode('login');
        setF({ ...f, password: '' });
        setBusy(false);
        return;
      }
      const u = await login(f.email, f.password);
      navigate(location.state?.from || (u.role === 'CITIZEN' ? '/' : '/admin'), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="mb-1 text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mb-5 text-sm text-slate-500">
          {mode === 'login' ? 'Log in to report issues and join events.' : 'New accounts must be approved by an administrator before first login.'}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Alert>{error}</Alert>
          {notice && <div role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</div>}
          {mode === 'register' && (
            <>
              <div><label className="label">Full name</label><input required className="input" value={f.name} onChange={set('name')} /></div>
              <div>
                <label className="label">I am a</label>
                <select className="input" value={f.role} onChange={set('role')}>
                  <option value="CITIZEN">Citizen</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              {f.role === 'MANAGER' && (
                <div>
                  <label className="label">Department</label>
                  <select required className="input" value={f.department} onChange={set('department')}>
                    <option value="">Select a department…</option>
                    {Object.entries(DEPARTMENTS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
          <div><label className="label">Email</label><input required type="email" className="input" value={f.email} onChange={set('email')} /></div>
          <div>
            <label className="label">Password</label>
            <input required type="password" minLength={mode === 'register' ? 8 : undefined} className="input" value={f.password} onChange={set('password')} />
            {mode === 'register' && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
          <button className="font-medium text-brand-600 hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
