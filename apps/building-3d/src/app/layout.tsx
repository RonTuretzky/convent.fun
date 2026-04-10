import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Convent — 3D Building Viewer",
  description: "Interactive 3D rendering of The Convent at 29 Nassau Avenue, Greenpoint, Brooklyn",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
