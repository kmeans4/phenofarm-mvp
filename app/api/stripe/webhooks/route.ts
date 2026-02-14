import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/stripe/webhooks
 * Handle Stripe webhooks for Connect accounts and payments
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle account.updated - Connect onboarding status changes
  if (event.type === 'account.updated') {
    const account = event.data.object;
    
    try {
      const grower = await db.grower.findFirst({
        where: { stripeAccountId: account.id },
      });

      if (grower) {
        const newStatus = account.details_submitted && account.charges_enabled && account.payouts_enabled
          ? 'active'
          : 'pending';

        // Update the grower record with new status
        await db.grower.update({
          where: { id: grower.id },
          data: {
            stripeAccountStatus: newStatus,
            connectOnboardedAt: newStatus === 'active' && !grower.connectOnboardedAt
              ? new Date()
              : grower.connectOnboardedAt,
          },
        });

        console.log(`Account ${account.id} status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating account status:', error);
    }
  }

  // Handle payment_intent.succeeded - when customer pays
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.Payout;
    
    try {
      // Find the order by payment metadata
      const orderId = paymentIntent.metadata?.orderId;
      
      if (orderId) {
        // Update order payment status
        await db.payment.updateMany({
          where: { transactionId: paymentIntent.id },
          data: { status: 'COMPLETED', paidAt: new Date(paymentIntent.amount_received / 1000) },
        });
        
        // Mark order as paid if all payments are completed
        console.log(`Payment ${paymentIntent.id} succeeded for order ${orderId}`);
      }
    } catch (error) {
      console.error('Error handling payment_intent.succeeded:', error);
    }
  }

  // Handle payout.paid - Stripe payout completed
  if (event.type === 'payout.paid') {
    const payout = event.data.object as Stripe.Payout;
    
    try {
      console.log(`Payout ${payout.id} of $${payout.amount / 100} completed`);
      
      // You could track payout history here if needed
      // For now, just log for audit purposes
    } catch (error) {
      console.error('Error handling payout.paid:', error);
    }
  }

  // Return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}
