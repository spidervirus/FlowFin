export const metadata = {
  title: 'Setup - FlowFin',
  description: 'Set up your financial management system',
};

export default function StaticSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="static-setup-layout">
      {children}
    </div>
  );
} 