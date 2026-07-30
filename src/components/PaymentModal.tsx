import { useState, useEffect, useRef } from 'react';
import { Crown, X, CheckCircle, Smartphone, CreditCard } from 'lucide-react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_def8e817b833e83cc10e038b85e8ca8d262b6d6f';

type Method = 'mpesa' | 'paystack';

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
  const [method, setMethod] = useState<Method>('paystack');
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleMpesaPay = async () => {
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
      const ref = data.reference;
      if (!cid) { setStep('error'); setMsg('PAYMENT REQUEST FAILED'); return; }
      setMsg('CHECK YOUR PHONE AND ENTER YOUR M-PESA PIN...');
      pollRef.current = setInterval(async () => {
        try {
          const q = await fetch('/api/mpesa/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ checkoutRequestId: cid, reference: ref }),
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

  const handlePaystackPay = async () => {
    setStep('processing');
    setMsg('Initializing payment...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, programId, programName }),
      });
      const data = await res.json();
      if (data.error) { setStep('error'); setMsg(data.error.toUpperCase()); return; }

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: user.email || 'customer@comrades.com',
          amount: Math.round(amount * 100),
          currency: 'KES',
          ref: data.reference,
          metadata: { programId, programName },
          callback: async (response: any) => {
            setMsg('Verifying payment...');
            try {
              const vres = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reference: response.reference }),
              });
              const vdata = await vres.json();
              if (vdata.verified) {
                setStep('success');
                setMsg('PAYMENT SUCCESSFUL');
                onSuccess();
              } else {
                setStep('error');
                setMsg(vdata.message?.toUpperCase() || 'VERIFICATION FAILED');
              }
            } catch {
              setStep('error');
              setMsg('VERIFICATION FAILED');
            }
          },
          onClose: () => {
            setStep('form');
            setMsg('');
          },
        });
        handler.openIframe();
      } else {
        window.location.href = data.authorization_url;
      }
    } catch (e: any) {
      setStep('error');
      setMsg((e.message || 'PAYMENT FAILED').toUpperCase());
    }
  };

  const handlePay = () => {
    if (method === 'mpesa') handleMpesaPay();
    else handlePaystackPay();
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
            <div className="flex gap-2">
              <button
                onClick={() => { setMethod('paystack'); setMsg(''); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wider transition-all min-h-[44px]"
                style={
                  method === 'paystack'
                    ? { background: 'var(--red)', color: '#fff', boxShadow: 'var(--shadow-red)' }
                    : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                }
              >
                <CreditCard size={16} /> PAYSTACK
              </button>
              <button
                onClick={() => { setMethod('mpesa'); setMsg(''); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold tracking-wider transition-all min-h-[44px]"
                style={
                  method === 'mpesa'
                    ? { background: 'var(--green)', color: '#fff', boxShadow: '0 4px 16px rgba(0,210,106,0.25)' }
                    : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                }
              >
                <Smartphone size={16} /> M-PESA
              </button>
            </div>

            {method === 'mpesa' && (
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
            )}

            {method === 'paystack' && (
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                Pay securely with Paystack — cards, mobile money, or bank transfer.
              </p>
            )}

            {msg && (
              <p className="text-xs font-bold text-center" style={{ color: 'var(--red)' }}>
                {msg}
              </p>
            )}
            <button
              onClick={handlePay}
              className="btn w-full py-4"
            >
              {method === 'mpesa' ? `PAY WITH M-PESA` : `PAY KES ${amount.toLocaleString()}`}
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
          className="flex items-center justify-center gap-3 mt-5 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="t-label" style={{ color: 'var(--text-3)' }}>
            POWERED BY
          </span>
          <span className="font-bold text-sm" style={{ color: 'var(--purple)' }}>PAYSTACK</span>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>&</span>
          <span className="font-bold text-sm" style={{ color: 'var(--green)' }}>M-PESA</span>
        </div>
      </div>
    </div>
  );
}
