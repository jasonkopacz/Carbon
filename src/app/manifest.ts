import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carbon Grid",
    short_name: "Carbon Grid",
    description: "Live carbon intensity by grid region",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
    ],
  };
}
