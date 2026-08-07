export interface OrderNotificationPayload {
  type: 'PRODUCT_PURCHASE' | 'REMOTE_BOOKING';
  customerName: string;
  email: string;
  phone: string;
  title: string;
  amount: number;
  paymentId?: string;
  orderOrBookingId: string;
  remoteId?: string;
  problemDescription?: string;
}

export const sendAdminOrderNotificationEmail = async (data: OrderNotificationPayload) => {
  const adminEmail = 'contact.ashikdas@gmail.com';

  console.log(`[Email Notifier] Dispatching instant sales notification to ${adminEmail}...`, data);

  try {
    const subject = `🚀 NEW OMOVE ORDER: ${data.title} (₹${data.amount})`;

    // FormSubmit AJAX dispatch directly to contact.ashikdas@gmail.com
    await fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        'Order Reference ID': data.orderOrBookingId,
        'Customer Name': data.customerName,
        'Customer Email': data.email,
        'WhatsApp Phone': data.phone,
        'Purchased Item / Service': data.title,
        'Amount Paid': `₹${data.amount}`,
        'Payment Transaction ID': data.paymentId || 'Paid via Razorpay',
        'AnyDesk Remote ID': data.remoteId || 'N/A',
        'Issue Notes': data.problemDescription || 'Standard License Order',
        'Transaction Timestamp': new Date().toLocaleString()
      })
    });
    console.log('[Email Notifier] Successfully delivered order notification to contact.ashikdas@gmail.com');
  } catch (err) {
    console.warn('[Email Notifier] FormSubmit dispatch notice:', err);
  }
};
