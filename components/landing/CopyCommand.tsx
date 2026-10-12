"use client";

import { useState } from "react";
import { Icon } from "../Icon";

export function CopyCommand({ command, className = "cta dark" }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(command);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {}
      }}
      aria-label={`Copy ${command}`}
    >
      <code>{command}</code>
      <Icon name={copied ? "check" : "copy"} size={15} />
    </button>
  );
}
