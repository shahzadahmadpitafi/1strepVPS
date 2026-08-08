import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Check, AlertCircle, RefreshCw, Wifi, Radio, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface SquareCardReaderProps {
  onPaymentSuccess: (paymentId: string, isSquare?: boolean) => void;
  onPaymentError: (error: string) => void;
  totalAmount: number;
  cartItems: Array<{
    productId: string;
    name: string;
    quantity: number;
    size?: string;
    color?: string;
    price: number;
  }>;
  customerEmail?: string;
  orderType?: string;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

type Mode = 'detecting' | 'terminal' | 'web_card';
type TerminalStatus = 'idle' | 'creating' | 'waiting' | 'paid' | 'error' | 'cancelled';
type WebStatus = 'loading' | 'ready' | 'processing' | 'paid' | 'error';

declare global {
  interface Window { Square?: any; }
}

export default function SquareCardReader({
  onPaymentSuccess,
  onPaymentError,
  totalAmount,
  cartItems,
  customerEmail,
  orderType = 'epos',
  isProcessing,
  setIsProcessing,
}: SquareCardReaderProps) {
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>('detecting');
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus>('idle');
  const [webStatus, setWebStatus] = useState<WebStatus>('loading');

  const [terminalDevice, setTerminalDevice] = useState<{ id: string; name: string } | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const initLockRef = useRef(false);
  const [squareConfig, setSquareConfig] = useState<{ applicationId: string; locationId: string } | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  // Suppress Square SDK internal unhandled rejections
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      if (r && typeof r === 'object' && (
        r.type === 'InitializationTimeoutError' ||
        String(r.type || '').toLowerCase().includes('square')
      )) { e.preventDefault(); }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  // Step 1: detect terminal device (env var first, then listed devices)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Check config for pre-configured terminal device ID
        const cfgRes = await fetch('/api/square/config');
        const cfg = await cfgRes.json();
        if (cancelled) return;

        if (cfg.terminalDeviceId) {
          setTerminalDevice({ id: cfg.terminalDeviceId, name: 'Card Reader' });
          setMode('terminal');
          return;
        }

        // Fall back to listing paired devices from Square Dashboard
        const devRes = await fetch('/api/square/terminal/devices');
        const devData = await devRes.json();
        if (cancelled) return;

        const allDevices: any[] = devData.devices || [];
        const paired = allDevices.find((d: any) =>
          d.status?.category === 'AVAILABLE' || d.components?.some((c: any) => c.type === 'CARD_READER')
        ) || allDevices[0];

        if (paired) {
          setTerminalDevice({
            id: paired.id,
            name: paired.attributes?.name || paired.name || 'Card Reader',
          });
          setMode('terminal');
        } else {
          setMode('web_card');
          loadSquareConfig();
        }
      } catch {
        if (!cancelled) { setMode('web_card'); loadSquareConfig(); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── TERMINAL FLOW ───────────────────────────────────────────────

  const startTerminalPayment = useCallback(async () => {
    if (!terminalDevice) return;
    setIsProcessing(true);
    setTerminalStatus('creating');
    setErrorMessage(null);

    const itemsSummary = cartItems
      .map(i => `${i.name}${i.size ? ` (${i.size})` : ''} x${i.quantity}`)
      .join(', ')
      .substring(0, 500);

    try {
      const res = await apiRequest('POST', '/api/square/terminal/checkout', {
        amount: totalAmount,
        currency: 'GBP',
        deviceId: terminalDevice.id,
        referenceId: `epos-${Date.now()}`,
        note: itemsSummary,
        customerEmail,
      });
      const data = await res.json();
      if (!data.success || !data.checkoutId) throw new Error(data.error || 'Failed to create checkout');

      setCheckoutId(data.checkoutId);
      setTerminalStatus('waiting');
      startPolling(data.checkoutId);
    } catch (err: any) {
      setIsProcessing(false);
      setTerminalStatus('error');
      setErrorMessage(err.message || 'Could not start payment on terminal');
      onPaymentError(err.message || 'Terminal checkout failed');
    }
  }, [terminalDevice, totalAmount, cartItems, customerEmail, setIsProcessing, onPaymentError]);

  const startPolling = useCallback((cId: string) => {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/square/terminal/checkout/${cId}`);
        const data = await res.json();
        const st: string = data.status || '';

        if (st === 'COMPLETED') {
          stopPoll();
          setTerminalStatus('paid');
          setIsProcessing(false);
          const paymentId = data.paymentIds?.[0] || cId;
          toast({ title: 'Payment Complete', description: `${formatCurrency(totalAmount)} paid via card` });
          onPaymentSuccess(paymentId, true);
        } else if (st === 'CANCELED' || st === 'CANCEL_REQUESTED') {
          stopPoll();
          setIsProcessing(false);
          setTerminalStatus('cancelled');
          setErrorMessage('Payment was cancelled on the terminal.');
        } else if (st === 'CHECKOUT_VS_PAYMENT_MISMATCH' || st === 'ERROR') {
          stopPoll();
          setIsProcessing(false);
          setTerminalStatus('error');
          setErrorMessage('Payment failed on the terminal. Please try again.');
          onPaymentError('Terminal payment error');
        }
      } catch { /* ignore transient poll errors */ }
    }, 2500);
  }, [stopPoll, totalAmount, toast, onPaymentSuccess, onPaymentError, setIsProcessing]);

  const cancelTerminalCheckout = useCallback(async () => {
    if (!checkoutId) { setTerminalStatus('idle'); setIsProcessing(false); return; }
    try {
      await apiRequest('POST', `/api/square/terminal/checkout/${checkoutId}/cancel`, {});
    } catch { /* best-effort */ }
    stopPoll();
    setTerminalStatus('idle');
    setCheckoutId(null);
    setIsProcessing(false);
  }, [checkoutId, stopPoll, setIsProcessing]);

  // ─── WEB CARD FALLBACK ───────────────────────────────────────────

  async function loadSquareConfig() {
    try {
      const res = await fetch('/api/square/config');
      const data = await res.json();
      if (data.configured) setSquareConfig(data);
      else setWebStatus('error');
    } catch { setWebStatus('error'); }
  }

  const loadSquareSDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.Square) { resolve(); return; }
      const existing = document.querySelector('script[src*="squarecdn"]') as HTMLScriptElement | null;
      if (existing) {
        const wait = setInterval(() => { if (window.Square) { clearInterval(wait); resolve(); } }, 200);
        setTimeout(() => { clearInterval(wait); reject(new Error('Square SDK load timeout')); }, 15000);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://web.squarecdn.com/v1/square.js';
      script.async = true;
      script.onload = () => {
        const wait = setInterval(() => { if (window.Square) { clearInterval(wait); resolve(); } }, 200);
        setTimeout(() => { clearInterval(wait); reject(new Error('Square SDK load timeout')); }, 15000);
      };
      script.onerror = () => reject(new Error('Failed to load Square SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const initWebCard = useCallback(async (retry = 0) => {
    if (!squareConfig || initLockRef.current) return;
    initLockRef.current = true;
    try {
      await loadSquareSDK();
      if (!window.Square) throw new Error('Square SDK not available');
      if (cardRef.current) { try { await cardRef.current.destroy(); } catch {} cardRef.current = null; }
      const payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
      paymentsRef.current = payments;
      const card = await payments.card();
      const waitContainer = () => new Promise<HTMLDivElement>((res, rej) => {
        if (cardContainerRef.current) { res(cardContainerRef.current); return; }
        let n = 0;
        const t = setInterval(() => {
          n++;
          if (cardContainerRef.current) { clearInterval(t); res(cardContainerRef.current); }
          else if (n > 50) { clearInterval(t); rej(new Error('Container not found')); }
        }, 100);
      });
      const container = await waitContainer();
      await card.attach(container);
      cardRef.current = card;
      setWebStatus('ready');
      initLockRef.current = false;
    } catch (err: any) {
      initLockRef.current = false;
      console.error(`Square web card init error (attempt ${retry + 1}):`, err);
      if (retry < 2) {
        setTimeout(() => initWebCard(retry + 1), (retry + 1) * 2000);
      } else {
        setWebStatus('error');
        setErrorMessage('Card form could not load. Please try again.');
      }
    }
  }, [squareConfig, loadSquareSDK]);

  useEffect(() => {
    if (mode !== 'web_card' || !squareConfig) return;
    initLockRef.current = false;
    const t = setTimeout(() => initWebCard(0), 500);
    return () => clearTimeout(t);
  }, [mode, squareConfig, initWebCard]);

  useEffect(() => {
    return () => {
      if (cardRef.current) { try { cardRef.current.destroy(); } catch {} cardRef.current = null; }
      initLockRef.current = false;
    };
  }, []);

  const handleWebPayment = useCallback(async () => {
    if (!cardRef.current) return;
    setIsProcessing(true);
    setWebStatus('processing');
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== 'OK') throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
      const res = await apiRequest('POST', '/api/square/payment', {
        sourceId: result.token,
        amount: totalAmount,
        currency: 'GBP',
        customerEmail,
        orderId: `${orderType}-${Date.now()}`,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Payment failed');
      setWebStatus('paid');
      setIsProcessing(false);
      toast({ title: 'Payment Complete', description: `${formatCurrency(totalAmount)} paid via card` });
      onPaymentSuccess(data.paymentId || data.payment?.id, true);
    } catch (err: any) {
      setWebStatus('ready');
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment failed');
      onPaymentError(err.message || 'Payment failed');
    }
  }, [totalAmount, customerEmail, orderType, setIsProcessing, toast, onPaymentSuccess, onPaymentError]);

  const retryWebInit = useCallback(() => {
    setWebStatus('loading');
    setErrorMessage(null);
    initLockRef.current = false;
    initWebCard(0);
  }, [initWebCard]);

  // ─── RENDER ──────────────────────────────────────────────────────

  const headerBadge = () => {
    if (mode === 'detecting') return null;
    if (mode === 'terminal') {
      if (terminalStatus === 'paid') return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" /> Paid</Badge>;
      if (terminalStatus === 'waiting' || terminalStatus === 'creating') return <Badge className="bg-emerald-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      if (terminalStatus === 'idle') return <Badge className="bg-emerald-700"><Wifi className="w-3 h-3 mr-1" /> Terminal Ready</Badge>;
    }
    if (mode === 'web_card') {
      if (webStatus === 'paid') return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" /> Paid</Badge>;
      if (webStatus === 'ready') return <Badge className="bg-emerald-600"><Wifi className="w-3 h-3 mr-1" /> Ready</Badge>;
    }
    return null;
  };

  return (
    <Card className="w-full bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-white">
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            Tap / Insert Card
          </span>
          {headerBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">

        {/* ── DETECTING ── */}
        {mode === 'detecting' && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            <p className="text-white/70 text-sm">Checking for card reader...</p>
          </div>
        )}

        {/* ── TERMINAL FLOW ── */}
        {mode === 'terminal' && terminalStatus === 'idle' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-emerald-900/30 rounded-lg border border-emerald-700/50">
              <div className="relative w-16 h-16 mx-auto mb-3">
                <CreditCard className="h-16 w-16 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Wifi className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-emerald-300 font-medium mb-1">{terminalDevice?.name || 'Card Reader'} Ready</p>
              <div className="flex justify-center gap-3 text-xs text-white/60 mt-2">
                <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> Contactless</span>
                <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Chip &amp; PIN</span>
                <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile Pay</span>
              </div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-1 text-white border-white/30">
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
            <Button
              onClick={startTerminalPayment}
              disabled={isProcessing || cartItems.length === 0}
              className="w-full gap-2 bg-emerald-600 text-white"
              size="lg"
              data-testid="button-tap-insert-card"
            >
              <CreditCard className="h-5 w-5" />
              Charge {formatCurrency(totalAmount)} on Terminal
            </Button>
          </div>
        )}

        {mode === 'terminal' && terminalStatus === 'creating' && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
            <p className="text-white/70 text-sm">Sending to terminal...</p>
          </div>
        )}

        {mode === 'terminal' && terminalStatus === 'waiting' && (
          <div className="space-y-4">
            <div className="text-center p-6 bg-emerald-900/30 rounded-lg border border-emerald-700/50">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full animate-ping" />
                </div>
                <CreditCard className="h-16 w-16 mx-auto mb-3 text-emerald-400 relative z-10" />
              </div>
              <h3 className="font-semibold text-emerald-200 text-lg mt-2">Waiting for Card</h3>
              <p className="text-sm text-emerald-300/80 mt-1">Ask customer to tap, insert, or swipe their card on the terminal</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-1 text-white border-white/30">
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
            <Button variant="destructive" onClick={cancelTerminalCheckout} className="w-full">
              Cancel Payment
            </Button>
          </div>
        )}

        {mode === 'terminal' && terminalStatus === 'paid' && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-400">Payment Complete</h3>
              <p className="text-sm text-white/60">{formatCurrency(totalAmount)} paid via terminal</p>
            </div>
          </div>
        )}

        {mode === 'terminal' && (terminalStatus === 'error' || terminalStatus === 'cancelled') && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-400">
                {terminalStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
              </h3>
              <p className="text-sm text-white/60">{errorMessage || 'Something went wrong. Please try again.'}</p>
            </div>
            <Button onClick={() => { setTerminalStatus('idle'); setErrorMessage(null); setCheckoutId(null); setIsProcessing(false); }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {/* ── WEB CARD FALLBACK ── */}
        {mode === 'web_card' && webStatus !== 'paid' && webStatus !== 'error' && (
          <div className="space-y-3">
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-1 text-white border-white/30">
                {formatCurrency(totalAmount)}
              </Badge>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-600/50 relative">
              {webStatus === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-lg z-10 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <p className="text-white/70 text-sm">Loading card form...</p>
                </div>
              )}
              <div ref={cardContainerRef} id="card-container" className="min-h-[50px]" />
            </div>
            {errorMessage && <p className="text-red-400 text-sm text-center">{errorMessage}</p>}
            <Button
              onClick={handleWebPayment}
              disabled={isProcessing || cartItems.length === 0 || webStatus === 'processing' || webStatus === 'loading'}
              className="w-full gap-2 bg-emerald-600 text-white"
              size="lg"
              data-testid="button-pay-card"
            >
              {webStatus === 'processing' ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="h-5 w-5" /> Pay {formatCurrency(totalAmount)}</>
              )}
            </Button>
          </div>
        )}

        {mode === 'web_card' && webStatus === 'paid' && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-400">Payment Complete</h3>
              <p className="text-sm text-white/60">{formatCurrency(totalAmount)} paid via card</p>
            </div>
          </div>
        )}

        {mode === 'web_card' && webStatus === 'error' && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-400">Payment Error</h3>
              <p className="text-sm text-white/60">{errorMessage || 'Unable to load payment form'}</p>
            </div>
            <Button onClick={retryWebInit} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-white/40 pt-2 border-t border-white/10">
          Powered by Square
        </div>
      </CardContent>
    </Card>
  );
}
