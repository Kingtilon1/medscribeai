import './globals.css'
import AppBar from '../app/components/AppBar'
export const metadata = {
  title: "MedscribeAI",
  description: "Patient care, made easy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppBar providerName="Dr. John Doe" />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
