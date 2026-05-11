"use client";

import { useEffect, useState } from "react";

function formatRelative(date: Date) {
  const now = Date.now();
  const deltaSeconds = Math.round((now - date.getTime()) / 1000);

  if (deltaSeconds < 5) return "just now";

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60 * 60, "minute"],
    [60 * 60 * 24, "hour"],
    [60 * 60 * 24 * 7, "day"],
    [60 * 60 * 24 * 30, "week"],
    [60 * 60 * 24 * 365, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let unit: Intl.RelativeTimeFormatUnit = "second";
  let value = deltaSeconds;

  for (let i = 0; i < divisions.length; i++) {
    const [seconds, u] = divisions[i];
    if (Math.abs(deltaSeconds) < seconds) {
      unit = u;
      break;
    }
    value = Math.round(deltaSeconds / seconds);
  }

  // rtf expects negative for past times
  return rtf.format(-value, unit);
}

export default function LocalTime({ iso }: { iso?: string | null }) {
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!iso) return;

    // Update once a minute to keep relative text accurate
    const interval = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [iso]);

  if (!iso) {
    return <span>Never</span>;
  }

  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return <span>Invalid date</span>;
  }

  const relative = formatRelative(d);
  const title = d.toLocaleString();

  return <time dateTime={iso} title={title}>{relative}</time>;
}
