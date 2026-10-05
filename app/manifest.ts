import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paul's Home Repair",
    short_name: "Paul's Repair",
    description: "Home repairs, renovation, carpentry and maintenance in Ulaanbaatar. Request a free quote.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1317",
    theme_color: "#0e1317",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a visit", url: "/book" },
      { name: "Services", url: "/#services" },
    ],
  };
}
