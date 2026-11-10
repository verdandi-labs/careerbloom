import { Font } from "@react-pdf/renderer";

import dmSans400 from "@/assets/fonts/dm-sans-400.ttf";
import dmSans500 from "@/assets/fonts/dm-sans-500.ttf";
import dmSans700 from "@/assets/fonts/dm-sans-700.ttf";
import playfairDisplay400 from "@/assets/fonts/playfair-display-400.ttf";
import playfairDisplay700 from "@/assets/fonts/playfair-display-700.ttf";

let registered = false;

export async function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "DM Sans",
    fonts: [
      {
        src: dmSans400,
        fontWeight: 400,
      },
      {
        src: dmSans500,
        fontWeight: 500,
      },
      {
        src: dmSans700,
        fontWeight: 700,
      },
    ],
  });

  Font.register({
    family: "Playfair Display",
    fonts: [
      {
        src: playfairDisplay400,
        fontWeight: 400,
      },
      {
        src: playfairDisplay700,
        fontWeight: 700,
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}

Font.registerHyphenationCallback((word) => [word]);
