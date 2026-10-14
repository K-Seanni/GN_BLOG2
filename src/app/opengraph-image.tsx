import { ImageResponse } from "next/og";

export const alt = "GN Blog — write like you code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const line = "rgba(0,0,0,0.07)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#fafafa",
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          color: "#0a0a0a",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 20, height: 20, background: "#0a0a0a", marginRight: 16 }} />
          gn/blog
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 112,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1.05,
            }}
          >
            write like
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 112,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1.05,
            }}
          >
            you code.
            <div style={{ width: 28, height: 100, background: "#0a0a0a", marginLeft: 20 }} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#52525b",
          }}
        >
          <span>$ post --share --follow --discuss</span>
          <span>blog platform for makers</span>
        </div>
      </div>
    ),
    size,
  );
}
