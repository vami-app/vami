import { cookies } from "next/headers";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata = {
  title: "Inkwell — Read and write stories",
  description: "A quiet place to read, write, and share ideas.",
};

/**
 * @param {{ children: React.ReactNode }} props
 */
export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value || "system";
  const isDark = themeCookie === "dark";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable}${isDark ? " dark" : ""}`}
    >
      <body>
        <AuthProvider>
          <ThemeProvider initialTheme={themeCookie}>
            <SocketProvider>{children}</SocketProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
