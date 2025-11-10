import "./globals.css";
import "@/lib/bootstrap";
import { ThemeProvider } from "@/components/theme";
import { fontSans, fontMono } from "@/lib/fonts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
