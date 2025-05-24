import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
]);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionChange(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.trial_will_end':
          await handleTrialEnding(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return NextResponse.json(
        { error: 'Webhook handler failed' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
  
  if (customerResponse.deleted) {
    console.error('Customer has been deleted');
    return;
  }

  const userId = customerResponse.metadata.supabaseUid;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  const subscriptionData = {
    subscription_id: subscription.id,
    plan_id: subscription.items.data[0].price.id,
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date(),
  };

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      ...subscriptionData,
    })
    .eq('user_id', userId);

  // Reset usage limits if subscription is active
  if (subscription.status === 'active') {
    await supabase
      .from('usage_limits')
      .upsert({
        user_id: userId,
        reset_date: new Date(subscription.current_period_end * 1000),
        updated_at: new Date(),
      })
      .eq('user_id', userId);
  }
}

async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
  
  if (customerResponse.deleted) {
    console.error('Customer has been deleted');
    return;
  }

  const userId = customerResponse.metadata.supabaseUid;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date(),
    })
    .eq('user_id', userId);
}

async function handleTrialEnding(subscription: Stripe.Subscription) {
  const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
  
  if (customerResponse.deleted) {
    console.error('Customer has been deleted');
    return;
  }

  const userId = customerResponse.metadata.supabaseUid;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  // Get user's email for notification
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  if (userData?.email) {
    // TODO: Send trial ending email notification
    console.log(`Trial ending soon for user ${userData.email}`);
  }
} 