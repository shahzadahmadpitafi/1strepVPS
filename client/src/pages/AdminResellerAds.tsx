import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Play, Square, Trash2, Upload, Video, Image as ImageIcon, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ResellerAd {
  id: string;
  resellerId: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  isActive: boolean;
}

interface ResellerAdRow {
  resellerId: string;
  businessName: string;
  ad: ResellerAd | null;
  isOnline: boolean;
}

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv)$/i;

function mediaTypeFromFilename(name: string): "image" | "video" {
  return VIDEO_EXT.test(name) ? "video" : "image";
}

function ResellerAdRowCard({ row }: { row: ResellerAdRow }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const objectPathRef = useRef<string | null>(null);
  const filenameRef = useRef<string>("");
  const [busy, setBusy] = useState<"play" | "stop" | "remove" | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/reseller-ads"] });

  const saveAdMutation = useMutation({
    mutationFn: async ({ mediaType, mediaUrl }: { mediaType: "image" | "video"; mediaUrl: string }) => {
      const res = await apiRequest("PUT", `/api/admin/reseller-ads/${row.resellerId}`, {
        mediaType,
        mediaUrl,
        isActive: true,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ad uploaded", description: `Set for ${row.businessName}. Press Play to push it to their EPOS.` });
      invalidate();
    },
    onError: () => toast({ title: "Upload failed", description: "Could not save the ad.", variant: "destructive" }),
  });

  const playMutation = useMutation({
    mutationFn: async () => {
      setBusy("play");
      const res = await apiRequest("POST", `/api/admin/reseller-ads/${row.resellerId}/play`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setBusy(null);
      toast({
        title: data.online ? "Ad is now playing" : "Ad sent",
        description: data.online
          ? `Live on ${row.businessName}'s EPOS now.`
          : `${row.businessName}'s EPOS isn't currently connected — it'll play once the terminal reconnects.`,
      });
    },
    onError: () => { setBusy(null); toast({ title: "Couldn't play ad", variant: "destructive" }); },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      setBusy("stop");
      await apiRequest("POST", `/api/admin/reseller-ads/${row.resellerId}/stop`, {});
    },
    onSuccess: () => { setBusy(null); toast({ title: "Ad stopped" }); },
    onError: () => { setBusy(null); toast({ title: "Couldn't stop ad", variant: "destructive" }); },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      setBusy("remove");
      await apiRequest("DELETE", `/api/admin/reseller-ads/${row.resellerId}`, undefined);
    },
    onSuccess: () => { setBusy(null); invalidate(); },
    onError: () => { setBusy(null); toast({ title: "Couldn't remove ad", variant: "destructive" }); },
  });

  const getUploadParameters = async (file?: any) => {
    const filename = file?.name || file?.data?.name || `ad_${Date.now()}`;
    filenameRef.current = filename;
    const res = await apiRequest("POST", "/api/admin/objects/upload", { filename });
    const data = await res.json();
    objectPathRef.current = data.objectPath;
    return { method: "PUT" as const, url: data.uploadURL };
  };

  const handleUploadComplete = () => {
    if (!objectPathRef.current) return;
    saveAdMutation.mutate({
      mediaType: mediaTypeFromFilename(filenameRef.current),
      mediaUrl: objectPathRef.current,
    });
  };

  return (
    <Card data-testid={`card-reseller-ad-${row.resellerId}`}>
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-[10rem]">
          <Circle className={`w-2.5 h-2.5 shrink-0 ${row.isOnline ? "fill-emerald-500 text-emerald-500" : "fill-muted text-muted-foreground"}`} />
          <div>
            <p className="font-semibold" data-testid={`text-business-name-${row.resellerId}`}>{row.businessName}</p>
            <p className="text-xs text-muted-foreground">{row.isOnline ? "EPOS online" : "EPOS offline"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-[14rem]">
          {row.ad ? (
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/40 min-w-0">
              {row.ad.mediaType === "video" ? <Video className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ImageIcon className="w-4 h-4 shrink-0 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground truncate max-w-[16rem]">{row.ad.mediaUrl.split("/").pop()}</span>
              <Badge variant="secondary" className="shrink-0">{row.ad.mediaType}</Badge>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No ad uploaded</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={52428800}
            onGetUploadParameters={getUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="h-9"
          >
            <Upload className="w-4 h-4 mr-2" />
            {row.ad ? "Replace" : "Upload"}
          </ObjectUploader>

          <Button
            size="sm"
            variant="default"
            disabled={!row.ad || busy === "play"}
            onClick={() => playMutation.mutate()}
            data-testid={`button-play-${row.resellerId}`}
          >
            <Play className="w-4 h-4 mr-1.5" />
            Play
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={busy === "stop"}
            onClick={() => stopMutation.mutate()}
            data-testid={`button-stop-${row.resellerId}`}
          >
            <Square className="w-4 h-4 mr-1.5" />
            Stop
          </Button>

          {row.ad && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy === "remove"}
              onClick={() => removeMutation.mutate()}
              data-testid={`button-remove-${row.resellerId}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminResellerAds() {
  const [, setLocation] = useLocation();

  const { data: authUser, isLoading: authLoading } = useQuery<{ id: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: rows = [], isLoading } = useQuery<ResellerAdRow[]>({
    queryKey: ["/api/admin/reseller-ads"],
    enabled: authUser?.role === "admin",
    refetchInterval: 15000,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">Reseller EPOS Ads</h1>
            <p className="text-muted-foreground">
              Upload a video or image per reseller, then press Play to push it live on their EPOS right now.
              Resellers cannot start, choose, or upload their own ads — this is admin-only.
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {isLoading && <p className="text-muted-foreground">Loading resellers…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="text-muted-foreground">No resellers found.</p>
          )}
          {rows.map((row) => (
            <ResellerAdRowCard key={row.resellerId} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}
