# Recurring Transactions

FlowFin supports recurring transactions, allowing you to set up scheduled transactions for regular income or expenses such as bills, subscriptions, or salary payments.

## Features

- Create recurring transactions with various frequency options (daily, weekly, bi-weekly, monthly, quarterly, yearly)
- Set optional end dates for recurring transactions
- View and manage all recurring transactions in a dedicated tab
- Automatic creation of transaction instances based on the schedule

## How It Works

When you create a recurring transaction, the system will:

1. Create the initial transaction immediately
2. Schedule future occurrences based on the frequency you select
3. Automatically create new transaction instances when the scheduled date arrives
4. Update account balances accordingly

## Setting Up Recurring Transactions

1. Go to the Transactions page
2. Click "Add Transaction"
3. Fill in the transaction details as usual
4. Toggle "Make this a recurring transaction"
5. Select the frequency and start date
6. Optionally set an end date
7. Save the transaction

## Managing Recurring Transactions

You can manage your recurring transactions from the "Recurring" tab on the Transactions page. From there, you can:

- View all your recurring transactions
- Edit a recurring transaction
- Delete a recurring transaction (this will stop future occurrences but won't delete past transactions)

## Setting Up the Cron Job

To ensure recurring transactions are processed automatically, you need to set up a cron job that calls the processing endpoint regularly. Here's how to do it:

### Using a Cron Service (e.g., Vercel Cron Jobs)

If you're hosting on Vercel, you can use Vercel Cron Jobs:

1. Add the following to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-recurring-transactions?api_key=YOUR_API_KEY",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This will run the job daily at midnight.

### Using an External Cron Service

You can also use services like Upstash, Cronhooks, or EasyCron:

1. Set up an account with the service
2. Create a new cron job that makes a GET request to:
   `https://your-domain.com/api/cron/process-recurring-transactions?api_key=YOUR_API_KEY`
3. Set the schedule (daily is recommended)

### Environment Variables

Make sure to set the following environment variable:

- `CRON_API_KEY`: A secure random string that will be used to authenticate the cron job requests

## Technical Implementation

The recurring transactions feature consists of:

1. Database fields for storing recurring transaction information
2. UI components for creating and managing recurring transactions
3. API endpoints for handling recurring transactions
4. A scheduled task for processing recurring transactions

### Database Schema

The following fields were added to the transactions table:

- `is_recurring`: Boolean indicating if this is a recurring transaction
- `recurrence_frequency`: The frequency of recurrence (daily, weekly, biweekly, monthly, quarterly, yearly)
- `recurrence_start_date`: The date when the recurring schedule starts
- `recurrence_end_date`: Optional date when the recurring schedule ends
- `next_occurrence_date`: The date of the next scheduled occurrence
- `parent_transaction_id`: For transaction instances, references the original recurring transaction

### API Endpoints

- `POST /api/transactions`: Creates a new transaction, with support for recurring options
- `GET /api/transactions/recurring`: Fetches all recurring transactions
- `DELETE /api/transactions/recurring`: Deletes a recurring transaction
- `GET /api/cron/process-recurring-transactions`: Processes due recurring transactions (called by cron job) 