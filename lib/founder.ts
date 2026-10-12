// Everything the "Meet the founder" section shows, in one place.
// To change the Instagram account, edit FOUNDER.instagramUrl and .instagramHandle only.
// To change the photo, replace public/founder/maxim.webp/.jpg (800×1000) and
// maxim-sm.webp/.jpg (480×600), same names, 4:5 portrait, face in the upper half.

export const FOUNDER = {
  name: "Maxim Ostaficiuc",
  title: "Founder of Creatively.ai",
  mission: "I'm on a mission to build the best marketing software in the world.",
  instagramUrl: "https://www.instagram.com/maxostfiy",
  instagramHandle: "@maxostfiy",
  portrait: {
    webp: "/founder/maxim.webp",
    jpg: "/founder/maxim.jpg",
    webpSm: "/founder/maxim-sm.webp",
    jpgSm: "/founder/maxim-sm.jpg",
    alt: "Maxim Ostaficiuc, founder of Creatively.ai, in a black polo shirt",
  },
} as const;
