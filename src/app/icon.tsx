import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
          borderRadius: "50%",
          border: "1.5px solid #111111",
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#111111" }} />
      </div>
    ),
    { ...size }
  );
}
