import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Thisness: identity resolution for imperfect observations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The share card: the mark, the name, the claim.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "#ffffff", padding: 72, fontFamily: "sans-serif", color: "#333" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#333", color: "#fff", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700 }}>T</div>
          <div style={{ fontSize: 40, fontWeight: 600 }}>Thisness</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 70, lineHeight: 1.08, letterSpacing: -2, maxWidth: 940 }}>Identity resolution for imperfect observations</div>
          <div style={{ fontSize: 28, color: "#777" }}>Evidence, stable identities, reversible history. pip install thisness</div>
        </div>
        <div style={{ fontSize: 22, color: "#999", fontFamily: "monospace" }}>thisness.dev</div>
      </div>
    ),
    size,
  );
}
