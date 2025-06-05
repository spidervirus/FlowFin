const fs = require('fs');
const path = require('path');

// List of files that need to be fixed
const filesToFix = [
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/payslips/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/timesheet/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/transactions/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/quotes/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/manual-journals/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/transactions/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/items/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/invoices/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/customers/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/periods/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/goals/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/chart-of-accounts/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/attendance/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/manual-journals/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/budgets/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/employees/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/periods/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/pay-runs/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/timesheets/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/accounts/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/chart-of-accounts/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/budget/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/payments/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/employees/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/chart-of-accounts/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/quotes/create/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/manual-journals/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/employees/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/ai-features/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/transactions/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/reports/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/settings/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/timesheets/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/accounts/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/accounts/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/quotes/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/budgets/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/pay-runs/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/leave-requests/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/customers/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/items/create/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/invoices/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/customers/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/chart-of-accounts/new/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/customers/[id]/edit/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/invoices/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/payroll/periods/[id]/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/manual-journals/page.tsx',
  '/Users/aman/Documents/GitHub/FlowFin1/src/app/dashboard/sales/items/[id]/edit/page.tsx'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace <DashboardWrapper> with <DashboardWrapper needsSetup={false}>
    content = content.replace(/<DashboardWrapper>/g, '<DashboardWrapper needsSetup={false}>');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixFile);

console.log('\nAll files have been processed!');
console.log('Run `npx tsc -noEmit` to verify the fixes.');