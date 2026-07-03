import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS 홈 화면 아이콘 (PNG)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1b5cf5",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 512 512" fill="#ffffff">
          <path d="M300 96 L168 292 h74 l-30 124 162-212 h-86 z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
