import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Tasks with auth, pagination and CRUD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="nav">
          <div className="nav-inner">
            <div className="brand">Task Manager</div>
            <div className="nav-actions">
              <a className="btn" href="/dashboard">
                Dashboard
              </a>
            </div>
          </div>
        </div>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
