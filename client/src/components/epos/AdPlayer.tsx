import { X } from "lucide-react";

interface AdPlayerProps {
  mediaType: "image" | "video";
  mediaUrl: string;
  onExit: () => void;
}

// Full-screen ad playback on the reseller's EPOS. Only ever appears because an
// admin pushed a "play" event over the socket — there is no reseller-facing
// control to start or choose this. Staff can still tap anywhere to dismiss it
// (e.g. a customer walks up to check out); the admin can also stop it remotely.
export default function AdPlayer({ mediaType, mediaUrl, onExit }: AdPlayerProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer select-none"
      onClick={onExit}
      data-testid="reseller-ad-player"
    >
      {mediaType === "video" ? (
        <video
          className="w-full h-full object-contain"
          src={mediaUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          src={mediaUrl}
          alt="Advertisement"
          className="w-full h-full object-contain"
        />
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onExit(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70"
        data-testid="button-close-ad"
        aria-label="Close ad"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
