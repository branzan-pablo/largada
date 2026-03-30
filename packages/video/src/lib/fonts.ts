import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";

export function loadFonts() {
  loadInter("normal", {
    weights: ["400", "600", "700", "900"],
    subsets: ["latin"],
  });
  loadBebasNeue("normal", {
    weights: ["400"],
    subsets: ["latin"],
  });
}
