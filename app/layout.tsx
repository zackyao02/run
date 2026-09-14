import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "用一下｜把知识变成行动",
  description: "有原文依据、能逐步执行、能留下结果的知乎知识 Run。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
