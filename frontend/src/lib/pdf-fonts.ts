import { Font } from "@react-pdf/renderer"

let registered = false

export async function registerFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: "DM Sans",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf",
        fontWeight: 500,
      },
      {
        src: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf",
        fontWeight: 700,
      },
    ],
  })

  Font.register({
    family: "Playfair Display",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf",
        fontWeight: 700,
      },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
}

Font.registerHyphenationCallback((word) => [word])
