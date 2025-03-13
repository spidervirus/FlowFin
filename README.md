# FlowFin - Personal Finance Management

FlowFin is a comprehensive personal finance management application built with Next.js, Supabase, and open source technologies.

## Features

- **Dashboard**: Get an overview of your financial health with charts and summaries
- **Transactions**: Track your income and expenses
- **Accounts**: Manage multiple financial accounts
- **Categories**: Organize transactions with customizable categories
- **Reports**: Generate financial reports and insights
- **AI Features**: Leverage AI for financial insights and automation

### AI Features

FlowFin includes several AI-powered features:

1. **Spending Insights**: Analyze your spending patterns and get personalized recommendations
2. **Smart Budgeting**: Get AI-powered budget suggestions based on your financial data
3. **Future Forecasting**: Predict future expenses and income based on historical data
4. **Receipt Scanner**: Automatically extract data from receipt images and create transactions

## Receipt Scanner

The Receipt Scanner feature uses Tesseract OCR (an open source OCR engine) to extract data from receipt images and PDFs. It can identify:

- Merchant name
- Date of purchase
- Total amount
- Individual line items with descriptions and amounts

### How it works

1. Upload a receipt image or PDF
2. The OCR engine extracts the text from the image
3. Text processing algorithms identify key information like merchant, date, and amounts
4. Review and edit the extracted data if needed
5. Select an account and category
6. Create a transaction with all the line items

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/flowfin.git
   cd flowfin
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The application requires several tables in your Supabase database. Migration files are provided in the `supabase/migrations` directory.

To apply the migrations:

1. Install the Supabase CLI
2. Link your project: `supabase link --project-ref your-project-ref`
3. Apply migrations: `supabase db push`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
