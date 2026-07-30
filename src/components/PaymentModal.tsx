import { useState } from 'react';
import { Crown, X, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_def8e817b833e83cc10e038b85e8ca8d262b6d6f';

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
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [msg, setMsg] = useState('');

  const handlePay = async () => {
    setStep('processing');
    setMsg('Initializing payment...');
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, programId, programName, email: user.email }),
      });
      const data = await res.json();
      if (data.error) { setStep('error'); setMsg(data.error.toUpperCase()); return; }

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
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              Pay with Paystack — cards, M-Pesa, mobile money, or bank transfer.
            </p>
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
          <span className="font-bold text-sm" style={{ color: 'var(--purple)' }}>
            PAYSTACK
          </span>
        </div>
      </div>
    </div>
  );
}
