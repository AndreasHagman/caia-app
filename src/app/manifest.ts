import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caia",
    short_name: "Caia",
    description: "Nova Scotia Duck Tolling Retriever — training, tricks, and memories",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#5F8663",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
