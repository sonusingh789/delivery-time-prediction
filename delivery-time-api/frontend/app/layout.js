import "./globals.css";

export const metadata = {
  title: " Food Delivery Time Prediction",
  description:
    "Predict food delivery arrival times with a trained machine learning model.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
