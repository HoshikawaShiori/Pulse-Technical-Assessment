"use client";

import { useEffect, useRef } from "react";

export default function VideoPanel({
  localStream,
  remoteStream,
  onEnd,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEnd: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteRef.current.srcObject !== remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
  <div className="absolute inset-0 z-30 flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="relative flex-1">
        {/* Remote (full screen) */}
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            style={{ background: "var(--surface-alt)" }}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: "var(--fg-subtle)" }}>
              Waiting for stranger&rsquo;s video…
            </div>
          )}
        {/* Local (picture-in-picture) */}
         <video
           ref={localRef}
           autoPlay
           playsInline
           muted
           className="absolute bottom-4 right-4 h-40 w-28 rounded-lg object-cover"
           style={{ border: "1px solid var(--border-strong)", background: "var(--bg-input)" }}
         />
      </div>
       <div className="flex justify-center p-4" style={{ background: "var(--bg-elevated)" }}>
         <button
           onClick={onEnd}
           className="rounded-full px-8 py-3 font-semibold"
           style={{ background: "var(--danger)", color: "white" }}
         >
           End video
         </button>
       </div>
    </div>
  );
}
