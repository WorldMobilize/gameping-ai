import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email verified — GamePing AI",
  robots: { index: false, follow: false },
};

export default function VerifySuccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen flex-1">{children}</div>;
}
