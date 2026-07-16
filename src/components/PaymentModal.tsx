import { useState, useEffect, useRef } from 'react';
import { Crown, X, CheckCircle } from 'lucide-react';

export default function PaymentModal({
  amount,
  programId,
  programName,
  onClose,
  onSuccess,
}: {
  amount: number;
  programId?: string;
  programName?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [msg, setMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handlePay = async () => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 9) { setMsg('ENTER A VALID M-PESA NUMBER'); return; }
    setStep('processing');
    setMsg('Sending payment request...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: clean, amount, programId, programName }),
      });
      const data = await res.json();
      if (data.error) { setStep('error'); setMsg(data.error.toUpperCase()); return; }
      const cid = data.CheckoutRequestID;
      if (!cid) { setStep('error'); setMsg('PAYMENT REQUEST FAILED'); return; }
      setMsg('CHECK YOUR PHONE AND ENTER YOUR M-PESA PIN...');
      pollRef.current = setInterval(async () => {
        try {
          const q = await fetch('/api/mpesa/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ checkoutRequestId: cid }),
          });
          const qd = await q.json();
          if (qd.ResultCode === '0' || qd.ResultCode === 0) {
            clearInterval(pollRef.current);
            setStep('success');
            setMsg('PAYMENT SUCCESSFUL');
            onSuccess();
          } else if (qd.ResultCode && qd.ResultCode !== '1037') {
            clearInterval(pollRef.current);
            setStep('error');
            setMsg((qd.ResultDesc || 'PAYMENT FAILED').toUpperCase());
          }
        } catch {}
      }, 2000);
    } catch (e: any) {
      setStep('error');
      setMsg((e.message || 'REQUEST FAILED').toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-[24px] p-6 animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--amber-soft)' }}
            >
              <Crown size={22} style={{ color: 'var(--amber)' }} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-anton text-lg text-white uppercase">UNLOCK</h3>
              <p className="t-label mt-0.5" style={{ color: 'var(--text-3)' }}>
                {programName || 'PREMIUM'} &mdash; KES {amount.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface-2)' }}
          >
            <X size={18} style={{ color: 'var(--text-3)' }} />
          </button>
        </div>

        {step === 'form' && (
          <div className="space-y-5">
            <div>
              <label className="t-label block mb-2" style={{ color: 'var(--text-3)' }}>
                M-PESA PHONE NUMBER
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                  style={{ color: 'var(--text-3)' }}
                >
                  +254
                </span>
                <input
                  type="tel"
                  value={phone.replace(/^0/, '').replace(/^254/, '')}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="712 345 678"
                  className="field pl-14"
                />
              </div>
            </div>
            {msg && (
              <p className="text-xs font-bold text-center" style={{ color: 'var(--red)' }}>
                {msg}
              </p>
            )}
            <button
              onClick={handlePay}
              className="btn w-full py-4"
            >
              PAY KES {amount.toLocaleString()}
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-10 space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--red-soft)' }}
            >
              <div
                className="w-8 h-8 border-3 border-[var(--red)] border-t-transparent rounded-full animate-spin"
                style={{ borderWidth: 3 }}
              />
            </div>
            <div>
              <p className="font-anton text-lg text-white uppercase">PROCESSING</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>
                {msg}
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-10 space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--green-soft)' }}
            >
              <CheckCircle size={32} style={{ color: 'var(--green)' }} strokeWidth={2} />
            </div>
            <div>
              <p className="font-anton text-lg text-white uppercase">SUCCESS</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                {msg}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn w-full py-3.5"
              style={{ fontSize: '0.7rem' }}
            >
              CONTINUE
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-10 space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'var(--red-soft)' }}
            >
              <X size={32} style={{ color: 'var(--red)' }} strokeWidth={2} />
            </div>
            <div>
              <p className="font-anton text-lg text-white uppercase">FAILED</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                {msg}
              </p>
            </div>
            <button
              onClick={() => { setStep('form'); setMsg(''); }}
              className="btn w-full py-3.5"
              style={{ fontSize: '0.7rem' }}
            >
              TRY AGAIN
            </button>
          </div>
        )}

        <div
          className="flex items-center justify-center gap-2 mt-5 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="t-label" style={{ color: 'var(--text-3)' }}>
            POWERED BY
          </span>
          <span className="font-bold text-sm" style={{ color: 'var(--green)' }}>
            M-PESA
          </span>
        </div>
      </div>
    </div>
  );
}
