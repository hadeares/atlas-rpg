import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atlas das Cinzas',
  description: 'Motor de campanha hexagonal para As Cinzas Sob o Céu Morto'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
