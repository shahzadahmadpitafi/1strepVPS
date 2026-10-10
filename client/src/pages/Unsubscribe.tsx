import { useMemo, useState } from "react";
import HeaderClean from "@/components/HeaderClean";
import { Button } from "@/components/ui/button";

type Status = "idle" | "working" | "done" | "error";

export default function Unsubscribe() {
  const { email, token } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return { email: params.get("e") || "", token: params.get("t") || "" };
  }, []);
  const [status, setStatus] = useState<Status>("idle");

  const hasLink = !!email && !!token;

  const confirmUnsubscribe = async () => {
    setStatus("working");
    try {
      const res = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderClean />
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="bg-white rounded-md shadow-sm p-8 text-center">
          <h1 className="text-3xl font-bold text-black mb-4" data-testid="text-unsubscribe-title">
            {status === "done" ? "You're unsubscribed" : "Unsubscribe from 1stRep emails"}
          </h1>

          {status === "done" && (
            <p className="text-gray-700" data-testid="text-unsubscribe-done">
              {email} will no longer receive marketing emails from us. You'll still get emails about
              any orders you place.
            </p>
          )}

          {status !== "done" && hasLink && (
            <>
              <p className="text-gray-700 mb-6">
                Stop marketing emails to <strong>{email}</strong>?
              </p>
              <Button onClick={confirmUnsubscribe} disabled={status === "working"} data-testid="button-confirm-unsubscribe">
                {status === "working" ? "Unsubscribing..." : "Yes, unsubscribe me"}
              </Button>
              {status === "error" && (
                <p className="text-red-600 mt-4 text-sm" data-testid="text-unsubscribe-error">
                  Something went wrong. Please try again, or email info@1strep.com and we'll remove you.
                </p>
              )}
            </>
          )}

          {status !== "done" && !hasLink && (
            <p className="text-gray-700" data-testid="text-unsubscribe-invalid">
              This unsubscribe link is incomplete. Please use the link from the bottom of one of our
              emails, or email info@1strep.com and we'll remove you.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
