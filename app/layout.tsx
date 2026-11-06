import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "가대 LOST & FOUND",
  description: "가톨릭대학교 교내 분실물 통합 서비스",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
