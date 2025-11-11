import "./globals.css";
import "@/lib/bootstrap";
import { ThemeProvider } from "@/components/provider/theme";
import { fontSans, fontMono } from "@/lib/fonts";
import { DataStreamProvider } from "@/components/provider/data-stream-provider";

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
        <ThemeProvider>
          <DataStreamProvider>{children}</DataStreamProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
