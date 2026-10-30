import { createFileRoute } from "@tanstack/react-router";
import "bootstrap/dist/css/bootstrap.min.css";
import CinemaApp from "@/components/CinemaApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CineBook – Đặt vé xem phim trực tuyến" },
      { name: "description", content: "Chọn phim, suất chiếu, ghế và nhận vé QR chỉ trong 4 bước." },
      { property: "og:title", content: "CineBook  Đặt vé xem phim trực tuyến" },
      { property: "og:description", content: "Chọn phim, suất chiếu, ghế và nhận vé QR chỉ trong 4 bước." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CinemaApp,
});
