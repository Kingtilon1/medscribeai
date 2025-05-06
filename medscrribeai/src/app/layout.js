import './globals.css'
export const metadata = {
  title: "MedscribeAI",
  description: "Patient care, made easy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
