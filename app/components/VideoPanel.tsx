"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoPanel({
  localStream,
  remoteStream,
  onDrop,
  pip,
  cameraOn,
  audioOn,
  onTogglePiP,
  onToggleCamera,
  onToggleAudio,
}: {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onDrop: () => void; // stop video streams but keep connection
  pip?: boolean; // whether panel is PiP
  cameraOn?: boolean;
  audioOn?: boolean;
  onTogglePiP: () => void; // toggle pip/full
  onToggleCamera: () => void;
  onToggleAudio: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = localRef.current;
    if (!v) return;
    if (v.srcObject !== localStream) {
      // clear then reattach to force browser to rebind the MediaStream
      v.srcObject = null;
      v.srcObject = localStream;
      // give DOM a tick before attempting playback
      setTimeout(() => {
        v.play?.().catch(() => {});
      }, 0);
    }
  }, [localStream, pip]);

  useEffect(() => {
    const v = remoteRef.current;
    if (!v) return;
    if (v.srcObject !== remoteStream) {
      // clear then reattach to force browser to rebind the MediaStream
      v.srcObject = null;
      v.srcObject = remoteStream;
      // give DOM a tick before attempting playback
      setTimeout(() => {
        v.play?.().catch(() => {});
      }, 0);
    }
  }, [remoteStream, pip]);

  // Drag state for PiP
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (!pip) return;
    const el = (e.target as HTMLElement).closest(".pip") as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pip || !dragRef.current) return;
    const d = dragRef.current;
    setPos({ x: d.origX + (e.clientX - d.startX), y: d.origY + (e.clientY - d.startY) });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!pip) return;
    dragRef.current = null;
  }

  // PiP styles: fixed small window; when dragged we use left/top from pos
  if (pip) {
    return (
      <div
        className="pip fixed z-60 rounded-lg shadow-lg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          left: pos ? pos.x : undefined,
          top: pos ? pos.y : undefined,
          right: pos ? undefined : 12,
          bottom: pos ? undefined : 12,
          width: 320,
          height: 200,
          background: "var(--bg)",
          overflow: "hidden",
          border: "1px solid var(--border-strong)",
        }}
      >
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          style={{ background: "var(--surface-alt)" }}
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center p-2" style={{ color: "var(--fg-subtle)" }}>
            Waiting for video…
          </div>
        )}
        <div style={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 6 }}>
          <button
            onClick={onToggleAudio}
            className="rounded-full p-1"
            style={{ background: "var(--bg-elevated)", color: "var(--fg)" }}
            title={audioOn ? "Unmute" : "Mute"}
            aria-label="Toggle mute"
          >
            {audioOn ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 9v6h4l5 5V4l-5 5H9z" strokeWidth="1.5"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 1l22 22" strokeWidth="1.5"/></svg>
            )}
          </button>

          <button
            onClick={onToggleCamera}
            className="rounded-full p-1"
            style={{ background: "var(--bg-elevated)", color: "var(--fg)" }}
            title={cameraOn ? "Turn camera off" : "Turn camera on"}
            aria-label="Toggle camera"
          >
            {cameraOn ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M23 7l-7 5h4a2 2 0 0 1 2 2v4" strokeWidth="1.5"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="1.5"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 1l22 22" strokeWidth="1.5"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="1.5"/></svg>
            )}
          </button>

          <button
            onClick={onTogglePiP}
            className="rounded-full p-1"
            style={{ background: "var(--bg-elevated)", color: "var(--fg)" }}
            title="Maximize"
            aria-label="Maximize"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="1.5"/></svg>
          </button>

          <button
            onClick={onDrop}
            className="rounded-full p-1"
            style={{ background: "var(--danger)", color: "white" }}
            title="Drop video"
            aria-label="Drop video"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" strokeWidth="1.5"/><line x1="6" y1="6" x2="18" y2="18" strokeWidth="1.5"/></svg>
          </button>
        </div>

        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="rounded-lg object-cover"
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 110,
            height: 80,
            border: "1px solid var(--border-strong)",
            background: "var(--bg-input)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-60 flex flex-col"
      style={{ background: "var(--bg)", minHeight: 0 }}
    >
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        {/* Remote (full screen) */}
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          style={{ background: "var(--surface-alt)" }}
        />
        {!remoteStream && (
          <div
            className="absolute inset-0 flex items-center justify-center p-4"
            style={{ color: "var(--fg-subtle)" }}
          >
            Waiting for stranger&rsquo;s video…
          </div>
        )}

        {/* Local (picture-in-picture) */}
        <video
          ref={localRef}
          autoPlay
          playsInline
          muted
          className="rounded-lg object-cover"
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            width: "20vw",
            maxWidth: 240,
            height: "30vh",
            maxHeight: 320,
            border: "1px solid var(--border-strong)",
            background: "var(--bg-input)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Controls - placed in a responsive footer that wraps on small screens */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 p-3"
        style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}
      >
        <button
          onClick={onToggleAudio}
          className="rounded-full p-2"
          style={{ background: "var(--bg-input)", color: "var(--fg)" }}
          title={audioOn ? "Unmute" : "Mute"}
          aria-label="Toggle mute"
        >
          {audioOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 9v6h4l5 5V4l-5 5H9z" strokeWidth="1.5"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 1l22 22" strokeWidth="1.5"/></svg>
          )}
        </button>

        <button
          onClick={onToggleCamera}
          className="rounded-full p-2"
          style={{ background: "var(--bg-input)", color: "var(--fg)" }}
          title={cameraOn ? "Turn camera off" : "Turn camera on"}
          aria-label="Toggle camera"
        >
          {cameraOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M23 7l-7 5h4a2 2 0 0 1 2 2v4" strokeWidth="1.5"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="1.5"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 1l22 22" strokeWidth="1.5"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2" strokeWidth="1.5"/></svg>
          )}
        </button>

        <button
          onClick={onTogglePiP}
          className="rounded-full p-2"
          style={{ background: "var(--bg-input)", color: "var(--fg)" }}
          title="PiP"
          aria-label="PiP"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="1.5"/><rect x="8" y="8" width="8" height="6" strokeWidth="1.5"/></svg>
        </button>

        <button
          onClick={onDrop}
          className="rounded-full p-2"
          style={{ background: "var(--danger)", color: "white" }}
          title="Drop video"
          aria-label="Drop video"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18" strokeWidth="1.5"/><line x1="6" y1="6" x2="18" y2="18" strokeWidth="1.5"/></svg>
        </button>
      </div>
    </div>
  );
}