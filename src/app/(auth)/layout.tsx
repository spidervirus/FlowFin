import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata = {
  title: 'FlowFin - Authentication',
  description: 'Sign in or sign up to FlowFin',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </>
  );
}
