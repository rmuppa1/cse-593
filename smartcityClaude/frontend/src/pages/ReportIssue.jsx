import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createRequest } from '../services/requestService';
import { errorMessage } from '../services/api';
import { REQUEST_TYPES } from '../utils/constants';
import Button from '../components/UI/Button';
import Alert from '../components/UI/Alert';

const STEPS = ['Category', 'Details', 'Location', 'Review'];

export default function ReportIssue() {
  const [params] = useSearchParams();
  const initialType = REQUEST_TYPES[params.get('type')] ? params.get('type') : '';
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [f, setF] = useState({ type: initialType, title: '', description: '', location: '', latitude: '', longitude: '' });
  const [error, setError] = useState('');
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const canNext = [!!f.type, f.title.trim() && f.description.trim(), !!f.location.trim(), true][step];

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation is not supported by your browser.');
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setF((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
          location: p.location || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }));
        setGeoBusy(false);
      },
      () => { setError('Could not get your location. Please type the address instead.'); setGeoBusy(false); }
    );
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      setDone(await createRequest(f));
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-3 text-xl font-bold">Report submitted</h1>
        <p className="mt-2 text-sm text-slate-600">Reference #{done.id}. We'll update the status as city staff work on it.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/my-requests" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Track my reports</Link>
          <Button variant="secondary" onClick={() => { setDone(null); setBusy(false); setStep(0); setF({ type: '', title: '', description: '', location: '', latitude: '', longitude: '' }); }}>Report another</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">Report an issue</h1>
      <ol className="mb-6 flex gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 rounded-full py-1 text-center text-xs font-medium ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>{s}</li>
        ))}
      </ol>

      <div className="card space-y-4 p-6">
        <Alert>{error}</Alert>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(REQUEST_TYPES).map(([k, t]) => (
              <button key={k} onClick={() => setF({ ...f, type: k })}
                className={`rounded-xl border-2 p-4 text-center transition ${f.type === k ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="text-3xl">{t.icon}</div>
                <div className="mt-1 text-sm font-medium">{t.label}</div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <>
            <div><label className="label">Short title</label><input className="input" maxLength={100} placeholder="e.g. Deep pothole near bus stop" value={f.title} onChange={set('title')} /></div>
            <div><label className="label">Description</label><textarea rows={5} className="input" placeholder="What's wrong, how bad is it, any safety risk?" value={f.description} onChange={set('description')} /></div>
          </>
        )}

        {step === 2 && (
          <>
            <div><label className="label">Address or landmark</label><input className="input" placeholder="e.g. 120 Main St, near the bus stop" value={f.location} onChange={set('location')} /></div>
            <Button variant="secondary" onClick={useMyLocation} disabled={geoBusy}>{geoBusy ? 'Locating…' : '📍 Use my current location'}</Button>
            {f.latitude && <p className="text-xs text-slate-500">Coordinates attached: {f.latitude}, {f.longitude}</p>}
          </>
        )}

        {step === 3 && (
          <dl className="space-y-2 text-sm">
            <div><dt className="text-slate-500">Category</dt><dd className="font-medium">{REQUEST_TYPES[f.type].icon} {REQUEST_TYPES[f.type].label}</dd></div>
            <div><dt className="text-slate-500">Title</dt><dd className="font-medium">{f.title}</dd></div>
            <div><dt className="text-slate-500">Description</dt><dd className="whitespace-pre-wrap">{f.description}</dd></div>
            <div><dt className="text-slate-500">Location</dt><dd className="font-medium">{f.location}</dd></div>
          </dl>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => { setError(''); setStep(step + 1); }}>Next</Button>
          ) : (
            <Button disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit report'}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
