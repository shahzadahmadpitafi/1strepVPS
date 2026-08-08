import { useState, useEffect, useCallback, useRef } from "react";
import { loadStripeTerminal, Terminal, Reader } from "@stripe/terminal-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, CreditCard, Check, AlertCircle, RefreshCw, Smartphone, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StripeTerminalReaderProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  totalAmount: number;
  cartItems: Array<{ productId: string; quantity: number }>;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

type ReaderStatus = 'disconnected' | 'discovering' | 'connecting' | 'connected' | 'collecting' | 'processing';

export default function StripeTerminalReader({
  onPaymentSuccess,
  onPaymentError,
  totalAmount,
  cartItems,
  isProcessing,
  setIsProcessing,
}: StripeTerminalReaderProps) {
  const { toast } = useToast();
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [connectedReader, setConnectedReader] = useState<Reader | null>(null);
  const [readerStatus, setReaderStatus] = useState<ReaderStatus>('disconnected');
  const [discoveredReaders, setDiscoveredReaders] = useState<Reader[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [useSimulator, setUseSimulator] = useState(true);
  const terminalRef = useRef<Terminal | null>(null);

  const fetchConnectionToken = useCallback(async () => {
    try {
      const response = await apiRequest("POST", "/api/stripe-terminal/connection-token");
      const data = await response.json();
      return data.secret;
    } catch (error) {
      console.error("Failed to fetch connection token:", error);
      throw error;
    }
  }, []);

  const unexpectedDisconnect = useCallback(() => {
    setConnectedReader(null);
    setReaderStatus('disconnected');
    toast({
      title: "Reader Disconnected",
      description: "The card reader was disconnected unexpectedly. Please reconnect.",
      variant: "destructive",
    });
  }, [toast]);

  // Auto-connect to reader once terminal is initialized
  const autoConnectReader = useCallback(async (term: Terminal) => {
    setReaderStatus('discovering');
    try {
      // First try simulated reader for testing/development
      const discoverResult = await term.discoverReaders({ simulated: true });
      
      if ('discoveredReaders' in discoverResult && discoverResult.discoveredReaders.length > 0) {
        setReaderStatus('connecting');
        const connectResult = await term.connectReader(discoverResult.discoveredReaders[0]);
        
        if ('reader' in connectResult && connectResult.reader) {
          setConnectedReader(connectResult.reader);
          setReaderStatus('connected');
          toast({
            title: "Reader Connected",
            description: "Simulated card reader ready for testing",
          });
          return;
        }
      }
      
      // If simulated fails, try hardware readers
      const hardwareResult = await term.discoverReaders({ simulated: false });
      
      if ('discoveredReaders' in hardwareResult && hardwareResult.discoveredReaders.length > 0) {
        setReaderStatus('connecting');
        const connectResult = await term.connectReader(hardwareResult.discoveredReaders[0]);
        
        if ('reader' in connectResult && connectResult.reader) {
          setConnectedReader(connectResult.reader);
          setReaderStatus('connected');
          setUseSimulator(false);
          toast({
            title: "Reader Connected",
            description: `Connected to ${connectResult.reader.label || 'Hardware Reader'}`,
          });
          return;
        }
      }
      
      // No readers found
      setReaderStatus('disconnected');
    } catch (error) {
      console.error("Auto-connect failed:", error);
      setReaderStatus('disconnected');
    }
  }, [toast]);

  useEffect(() => {
    const initTerminal = async () => {
      try {
        const stripeTerminal = await loadStripeTerminal();
        if (!stripeTerminal) {
          console.error("Failed to load Stripe Terminal");
          setIsInitializing(false);
          return;
        }

        const term = stripeTerminal.create({
          onFetchConnectionToken: fetchConnectionToken,
          onUnexpectedReaderDisconnect: unexpectedDisconnect,
        });

        setTerminal(term);
        terminalRef.current = term;
        setIsInitializing(false);
        
        // Auto-connect after initialization
        autoConnectReader(term);
      } catch (error) {
        console.error("Failed to initialize Stripe Terminal:", error);
        setIsInitializing(false);
      }
    };

    initTerminal();

    return () => {
      if (terminalRef.current) {
        terminalRef.current.disconnectReader();
      }
    };
  }, [fetchConnectionToken, unexpectedDisconnect, autoConnectReader]);

  const discoverReaders = async () => {
    if (!terminal) return;

    setReaderStatus('discovering');
    setDiscoveredReaders([]);

    try {
      const discoverResult = await terminal.discoverReaders({
        simulated: useSimulator,
      });

      if ('error' in discoverResult && discoverResult.error) {
        console.error("Discovery error:", discoverResult.error);
        toast({
          title: "Discovery Failed",
          description: discoverResult.error.message || "Could not find card readers",
          variant: "destructive",
        });
        setReaderStatus('disconnected');
        return;
      }

      if ('discoveredReaders' in discoverResult) {
        setDiscoveredReaders(discoverResult.discoveredReaders);
        
        if (discoverResult.discoveredReaders.length === 0) {
          toast({
            title: "No Readers Found",
            description: useSimulator 
              ? "Simulated reader not available" 
              : "Make sure your card reader is powered on and nearby",
          });
          setReaderStatus('disconnected');
        } else if (discoverResult.discoveredReaders.length === 1) {
          await connectToReader(discoverResult.discoveredReaders[0]);
        } else {
          setReaderStatus('disconnected');
        }
      }
    } catch (error: any) {
      console.error("Discovery error:", error);
      setReaderStatus('disconnected');
    }
  };

  const connectToReader = async (reader: Reader) => {
    if (!terminal) return;

    setReaderStatus('connecting');

    try {
      const connectResult = await terminal.connectReader(reader);

      if ('error' in connectResult && connectResult.error) {
        console.error("Connection error:", connectResult.error);
        toast({
          title: "Connection Failed",
          description: connectResult.error.message || "Could not connect to reader",
          variant: "destructive",
        });
        setReaderStatus('disconnected');
        return;
      }

      if ('reader' in connectResult && connectResult.reader) {
        setConnectedReader(connectResult.reader);
        setReaderStatus('connected');
        toast({
          title: "Reader Connected",
          description: `Connected to ${connectResult.reader.label || 'Card Reader'}`,
        });
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      setReaderStatus('disconnected');
    }
  };

  const disconnectReader = async () => {
    if (!terminal) return;

    try {
      await terminal.disconnectReader();
      setConnectedReader(null);
      setReaderStatus('disconnected');
      toast({
        title: "Reader Disconnected",
        description: "Card reader has been disconnected",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const collectPayment = async () => {
    if (!terminal || !connectedReader) {
      toast({
        title: "No Reader Connected",
        description: "Please connect a card reader first",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Add items to cart before processing payment",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setReaderStatus('collecting');

    try {
      const intentResponse = await apiRequest("POST", "/api/stripe-terminal/create-payment-intent", {
        items: cartItems,
        currency: 'gbp',
      });
      
      const intentData = await intentResponse.json();
      
      if (!intentData.clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      const collectResult = await terminal.collectPaymentMethod(intentData.clientSecret);

      if ('error' in collectResult && collectResult.error) {
        throw new Error(collectResult.error.message || "Failed to collect payment");
      }

      setReaderStatus('processing');

      if ('paymentIntent' in collectResult && collectResult.paymentIntent) {
        const processResult = await terminal.processPayment(collectResult.paymentIntent);

        if ('error' in processResult && processResult.error) {
          throw new Error(processResult.error.message || "Payment processing failed");
        }

        if ('paymentIntent' in processResult && processResult.paymentIntent) {
          if (processResult.paymentIntent.status === 'succeeded') {
            setReaderStatus('connected');
            onPaymentSuccess(processResult.paymentIntent.id);
          } else if (processResult.paymentIntent.status === 'requires_capture') {
            const captureResponse = await apiRequest("POST", "/api/stripe-terminal/capture-payment", {
              paymentIntentId: processResult.paymentIntent.id,
            });
            const captureData = await captureResponse.json();
            
            if (captureData.status === 'succeeded') {
              setReaderStatus('connected');
              onPaymentSuccess(processResult.paymentIntent.id);
            } else {
              throw new Error("Payment capture failed");
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setReaderStatus('connected');
      onPaymentError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelCollection = async () => {
    if (!terminal) return;

    try {
      await terminal.cancelCollectPaymentMethod();
      setReaderStatus('connected');
      setIsProcessing(false);
      toast({
        title: "Payment Cancelled",
        description: "Card collection was cancelled",
      });
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const getStatusBadge = () => {
    switch (readerStatus) {
      case 'connected':
        return <Badge className="bg-green-600"><Wifi className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'discovering':
        return <Badge className="bg-blue-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Searching...</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Connecting...</Badge>;
      case 'collecting':
        return <Badge className="bg-purple-600"><CreditCard className="w-3 h-3 mr-1 animate-pulse" /> Tap/Insert Card</Badge>;
      case 'processing':
        return <Badge className="bg-orange-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing...</Badge>;
      default:
        return <Badge variant="secondary"><WifiOff className="w-3 h-3 mr-1" /> Disconnected</Badge>;
    }
  };

  if (isInitializing || (readerStatus === 'discovering' && !connectedReader)) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="font-medium">
            {isInitializing ? 'Initialising card reader...' : 'Connecting to reader...'}
          </span>
          <span className="text-sm text-muted-foreground">This may take a moment</span>
        </CardContent>
      </Card>
    );
  }

  if (!terminal) {
    return (
      <Card className="border-dashed border-red-300">
        <CardContent className="flex items-center justify-center p-6 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>Card reader not available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Card Reader
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connectedReader ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={discoverReaders}
                  disabled={readerStatus === 'discovering' || readerStatus === 'connecting'}
                  className="flex-1 gap-2"
                  variant="outline"
                  data-testid="button-discover-readers"
                >
                  {readerStatus === 'discovering' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {useSimulator ? "Connect Simulated Reader" : "Search for Readers"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={useSimulator ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseSimulator(true)}
                  className="flex-1"
                  data-testid="button-simulator-mode"
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  Simulator
                </Button>
                <Button
                  variant={!useSimulator ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseSimulator(false)}
                  className="flex-1"
                  data-testid="button-hardware-mode"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Hardware
                </Button>
              </div>

              {discoveredReaders.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Select a reader:</p>
                  {discoveredReaders.map((reader) => (
                    <Button
                      key={reader.id}
                      variant="outline"
                      onClick={() => connectToReader(reader)}
                      className="w-full justify-start"
                      data-testid={`button-reader-${reader.id}`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {reader.label || reader.id}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-medium">{connectedReader.label || 'Card Reader'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnectReader}
                  data-testid="button-disconnect-reader"
                >
                  Disconnect
                </Button>
              </div>

              {readerStatus === 'collecting' || readerStatus === 'processing' ? (
                <div className="text-center p-6 bg-gradient-to-b from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
                  <CreditCard className="w-16 h-16 mx-auto mb-3 text-purple-600 animate-pulse" />
                  <p className="font-semibold text-lg">
                    {readerStatus === 'collecting' ? 'Tap, Insert, or Swipe Card' : 'Processing...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total: £{totalAmount.toFixed(2)}
                  </p>
                  {readerStatus === 'collecting' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelCollection}
                      className="mt-4"
                      data-testid="button-cancel-collection"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={collectPayment}
                  disabled={isProcessing || cartItems.length === 0}
                  className="w-full h-14 text-lg gap-2 bg-green-600 hover:bg-green-700"
                  data-testid="button-collect-payment"
                >
                  <CreditCard className="w-5 h-5" />
                  Collect Payment (£{totalAmount.toFixed(2)})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
