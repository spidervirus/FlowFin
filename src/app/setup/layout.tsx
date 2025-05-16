export const metadata = {
  title: "Account Setup - FlowFin",
  description: "Set up your financial management system",
};

export default function SetupWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="setup-wizard-layout">{children}</div>;
}
