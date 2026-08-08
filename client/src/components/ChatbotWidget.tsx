import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if chatbot is visible in settings
  const { data: settings } = useQuery({ queryKey: ["/api/site-settings"] });
  const chatbotVisible = (settings as any)?.chatbotVisible !== false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation when opened
  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
  }, [isOpen]);

  const initializeConversation = async () => {
    try {
      setIsInitializing(true);
      
      const sessionId = localStorage.getItem("chatbot_session_id") || crypto.randomUUID();
      localStorage.setItem("chatbot_session_id", sessionId);

      const response = await fetch("/api/chatbot/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create conversation");

      const conversation = await response.json();
      
      // Fetch previous messages
      const messagesResponse = await fetch(
        `/api/chatbot/conversation/${conversation.id}/messages`,
        { credentials: "include" }
      );
      
      let previousMessages: any[] = [];
      if (messagesResponse.ok) {
        previousMessages = await messagesResponse.json();
        setMessages(previousMessages.map((m: any) => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(m.createdAt || Date.now()),
        })));
      }

      setConversationId(conversation.id);

      // Add welcome message if no previous messages
      if (previousMessages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content: "Hello! Welcome to 1stRep Support. I'm here to help you with any questions about our products, orders, shipping, returns, or sizing. How can I assist you today?",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to initialize conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !conversationId || isInitializing) return;

    const userMessage = input.trim();
    setInput("");
    setShowContactForm(false);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        },
      ]);

      if (data.needsContactForm) {
        setShowContactForm(true);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitContactForm = async () => {
    if (!contactFormData.email || !contactFormData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/chatbot/unanswered-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          question: messages[messages.length - 2]?.content || contactFormData.message,
          userEmail: contactFormData.email,
          userName: contactFormData.name,
          contactFormData: JSON.stringify(contactFormData),
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to submit contact form");

      setShowContactForm(false);
      setContactFormData({ name: "", email: "", message: "" });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thank you for your message! Our team will review your query and respond to you via email shortly.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Failed to submit contact form:", error);
      toast({
        title: "Error",
        description: "Failed to submit your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Don't render if chatbot is hidden by admin
  if (!chatbotVisible) {
    return null;
  }

  if (!isOpen) {
    return (
      <div
        className="fixed right-4 z-[99999] bottom-[88px] md:right-4 md:bottom-4"
      >
        {/* Mobile: Small icon button */}
        <Button
          onClick={() => setIsOpen(true)}
          data-testid="button-open-chatbot"
          className="md:hidden group relative h-11 w-11 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 rounded-full p-0"
        >
          <MessageCircle className="h-4 w-4 text-white" />
          <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white" />
        </Button>
        
        {/* Desktop: Compact icon button with tooltip */}
        <Button
          onClick={() => setIsOpen(true)}
          data-testid="button-open-chatbot-desktop"
          className="hidden md:flex group relative h-12 w-12 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 rounded-full p-0"
          title="Need Help? Chat with us"
        >
          <MessageCircle className="h-5 w-5 text-white" />
          <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Card 
        className="fixed z-[99999] shadow-2xl flex flex-col overflow-hidden border-2 border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 right-2 left-2 bottom-20 top-20 md:right-6 md:left-auto md:bottom-6 md:top-auto md:w-[380px] md:h-[600px]"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            {/* Agent Avatar with Online Status */}
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base text-white font-semibold">1stRep Support Team</CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-xs text-white/90">Online now</p>
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-white hover:bg-white/20 shrink-0"
            data-testid="button-close-chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4 py-4">
            <div className="space-y-4">
              {isInitializing && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "bg-slate-700/50 text-white border border-white/10 backdrop-blur-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === "user" ? "text-white/70" : "text-white/50"}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <p className="text-sm text-white/70">Typing...</p>
                    </div>
                  </div>
                </div>
              )}

              {showContactForm && (
                <div className="bg-slate-700/50 border border-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-white">Get in touch with our team</p>
                  <Input
                    placeholder="Your name"
                    value={contactFormData.name}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, name: e.target.value })
                    }
                    className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    data-testid="input-contact-name"
                  />
                  <Input
                    placeholder="Your email *"
                    type="email"
                    value={contactFormData.email}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, email: e.target.value })
                    }
                    className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    data-testid="input-contact-email"
                  />
                  <Input
                    placeholder="Additional details"
                    value={contactFormData.message}
                    onChange={(e) =>
                      setContactFormData({ ...contactFormData, message: e.target.value })
                    }
                    className="bg-slate-800/50 border-white/20 text-white placeholder:text-white/50"
                    data-testid="input-contact-message"
                  />
                  <Button
                    onClick={handleSubmitContactForm}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    data-testid="button-submit-contact"
                  >
                    Submit
                  </Button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-4 border-t border-white/10 bg-slate-800/50">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isInitializing}
              className="flex-1 bg-slate-700/50 border-white/20 text-white placeholder:text-white/50"
              data-testid="input-chatbot-message"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || isInitializing}
              size="icon"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
              data-testid="button-send-message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
