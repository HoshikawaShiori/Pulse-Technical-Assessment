"use client";

import { useState } from "react";

export default function EntryGate({
  onReady,
}: {
  onReady: (lat: number, lng: number) => void;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [error, setError] = useState<string>("");

  function enter() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location access.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => onReady(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is required to place you on the map."
            : "Couldn't get your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-fg">Pulse</h1>
        <p className="mt-2 max-w-sm text-fg-muted">
          A living globe of anonymous strangers. Drop onto the map and connect.
        </p>
      </div>

      <button
        onClick={enter}
        disabled={status === "locating"}
        className="rounded-full bg-brand px-8 py-3 font-semibold text-brand-on transition hover:bg-brand-hover disabled:opacity-60"
      >
        {status === "locating" ? "Locating…" : "Enter Pulse"}
      </button>

      {status === "error" && (
        <p className="max-w-sm text-center text-sm text-danger">{error}</p>
      )}

      <p className="max-w-sm text-center text-xs text-fg-muted">
        Your dot is placed 1–3&nbsp;km from your real location.
        Nothing is stored — closing the tab ends everything.
      </p>
    </div>
  );
}