export const theme = {
  colors: {
    primary: "#FF4D00",
    primaryHover: "#E04400",
    dark: "#0D1B2A",
    text: "#6B7280",
    bgLight: "#F7F8FA",
    white: "#FFFFFF",
    success: "#16A34A",
  },
  fonts: {
    logo: "Bebas Neue",
    body: "Inter",
  },
} as const;

// Video format: vertical for Reels/Stories
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;
export const VIDEO_FPS = 30;
export const DURATION_IN_FRAMES = 30 * VIDEO_FPS; // 30 seconds
