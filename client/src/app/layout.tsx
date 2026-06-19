import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeBrandingProvider } from "@/components/ThemeProvider";
import { PWARegistration } from "@/components/PWARegistration";

export const metadata: Metadata = {
  title: "CyberKavach — Digital Operations Hub",
  description: "Centralized, role-based digital operating system for the CyberKavach Club",
  manifest: "/manifest.json",
  icons: {
    icon: "/ck-logo.svg",
    shortcut: "/ck-logo.svg",
    apple: "/ck-logo.svg",
  },
  other: {
    "theme-color": "#CCFF00",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <ThemeBrandingProvider>
            <AuthProvider>
              {children}
              <PWARegistration />
            </AuthProvider>
          </ThemeBrandingProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
