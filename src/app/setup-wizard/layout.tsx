export const metadata = {
  title: 'Account Setup - FlowFin',
  description: 'Set up your financial management system',
};

export default function SetupWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="setup-wizard-layout">
          {children}
        </div>
      </body>
    </html>
  );
} 