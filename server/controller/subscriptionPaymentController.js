 const Razorpay = require('razorpay');
const database = require('../config/database');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: 'rzp_test_Rmoh4WhxaIg16m',
  key_secret: 'xH15K2IZJvoNp4taKXGhdUDD',
});

// Create Razorpay order for subscription
const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan_id } = req.body;
    const { id: userId, pg_id: userPgId } = req.user;

    if (!plan_id) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get plan details
    const [plans] = await database.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = plans[0];

    // Check if user has a PG - refresh from database if needed
    let finalPgId = userPgId;
    if (!finalPgId) {
      // Try to get pg_id from database
      const [users] = await database.query('SELECT pg_id FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].pg_id) {
        finalPgId = users[0].pg_id;
      } else {
        return res.status(400).json({ error: 'Please create a PG first before subscribing' });
      }
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(plan.price * 100), // Convert to paise
      currency: 'INR',
      receipt: `plan_${plan_id}_pg_${finalPgId}_${Date.now()}`,
      notes: {
        plan_id: plan_id.toString(),
        pg_id: finalPgId.toString(),
        user_id: userId.toString(),
        plan_name: plan.name,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
      },
    });
  } catch (error) {
    console.error('Create subscription order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// Verify payment and create subscription
const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature, plan_id } = req.body;
    const { id: userId, pg_id: userPgId } = req.user;

    if (!order_id || !payment_id || !signature || !plan_id) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Verify payment signature using Razorpay
    const crypto = require('crypto');
    const text = `${order_id}|${payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', razorpay.key_secret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get pg_id from database (in case token doesn't have it updated)
    let finalPgId = userPgId;
    if (!finalPgId) {
      const [users] = await database.query('SELECT pg_id FROM users WHERE id = ?', [userId]);
      if (users.length > 0 && users[0].pg_id) {
        finalPgId = users[0].pg_id;
      } else {
        // Try to get from Razorpay order notes as fallback
        try {
          const order = await razorpay.orders.fetch(order_id);
          if (order.notes && order.notes.pg_id) {
            finalPgId = parseInt(order.notes.pg_id);
          }
        } catch (rzpError) {
          console.error('Error fetching Razorpay order:', rzpError);
        }
      }
    }

    if (!finalPgId) {
      return res.status(400).json({ error: 'PG ID not found. Please create a PG first.' });
    }

    // Validate that PG exists in database
    const [pgCheck] = await database.query('SELECT id, name FROM pgs WHERE id = ?', [finalPgId]);
    if (pgCheck.length === 0) {
      console.error(`PG ID ${finalPgId} does not exist in database`);
      return res.status(404).json({ 
        error: 'PG not found. Please create a PG first before subscribing.',
        details: `PG ID ${finalPgId} does not exist in the database.`
      });
    }

    console.log(`Creating subscription for PG ID ${finalPgId} (${pgCheck[0].name})`);

    // Get plan details
    const [plans] = await database.query('SELECT * FROM plans WHERE id = ?', [plan_id]);
    if (plans.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = plans[0];

    // Calculate dates
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days);

    // Create subscription
    let subscriptionId;
    try {
      const [result] = await database.query(
        'INSERT INTO pg_subscriptions (pg_id, plan_id, start_date, expiry_date, custom_price) VALUES (?, ?, ?, ?, ?)',
        [finalPgId, plan_id, startDate.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0], plan.price]
      );
      subscriptionId = result.insertId;
      
      // Activate subscription: Change subscription_status from TRIAL to ACTIVE
      await database.query(
        `UPDATE pgs 
         SET subscription_status = 'ACTIVE' 
         WHERE id = ?`,
        [finalPgId]
      );
      console.log(`Subscription activated for PG ${finalPgId}: Changed status from TRIAL to ACTIVE`);
    } catch (subscriptionError) {
      // Handle foreign key constraint error specifically
      if (subscriptionError.code === 'ER_NO_REFERENCED_ROW_2' || subscriptionError.errno === 1452) {
        return res.status(400).json({ 
          error: 'PG not found in database',
          details: `The PG ID ${finalPgId} does not exist. Please create a PG first before subscribing.`,
          message: 'Please go to PG Management and create your PG, then try subscribing again.'
        });
      }
      throw subscriptionError; // Re-throw if it's a different error
    }

    // Create invoice with payment details
    try {
      await database.query(
        `INSERT INTO invoices (pg_id, amount, status, invoice_date, due_date, order_id, payment_id, razorpay_order_id, razorpay_payment_id, transaction_id) 
         VALUES (?, ?, "paid", ?, ?, ?, ?, ?, ?, ?)`,
        [
          finalPgId, 
          plan.price, 
          startDate.toISOString().split('T')[0], 
          expiryDate.toISOString().split('T')[0],
          order_id,
          payment_id,
          order_id, // razorpay_order_id (same as order_id)
          payment_id, // razorpay_payment_id (same as payment_id)
          payment_id // transaction_id (using payment_id)
        ]
      );
    } catch (invoiceError) {
      // If invoice columns don't exist yet, create without payment details
      console.log('Invoice table may not have payment columns, creating basic invoice:', invoiceError);
      await database.query(
        'INSERT INTO invoices (pg_id, amount, status, invoice_date, due_date) VALUES (?, ?, "paid", ?, ?)',
        [userPgId, plan.price, startDate.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0]]
      );
    }

    // Get user and PG details for email
    const [users] = await database.query(
      'SELECT name, email, phone FROM users WHERE id = ?',
      [userId]
    );
    const [pgs] = await database.query(
      'SELECT name, address FROM pgs WHERE id = ?',
      [finalPgId]
    );

    const user = users[0] || {};
    const pg = pgs[0] || {};

    // Send email notification (if email exists)
    if (user.email) {
      try {
        // Simple email sending using console for now (can be replaced with nodemailer)
        const emailSubject = `Subscription Successful - ${plan.name}`;
        const emailBody = `
Dear ${user.name},

Congratulations! Your subscription to ${plan.name} has been successfully activated.

Subscription Details:
- Plan: ${plan.name}
- Amount: ₹${plan.price}
- Start Date: ${startDate.toISOString().split('T')[0]}
- Expiry Date: ${expiryDate.toISOString().split('T')[0]}
- Duration: ${plan.duration_days} days

PG Details:
- PG Name: ${pg.name || 'N/A'}
- Location: ${pg.address || 'N/A'}

Payment Details:
- Order ID: ${order_id}
- Payment ID: ${payment_id}
- Transaction Date: ${new Date().toLocaleString('en-IN')}

You can now access your dashboard and start managing your PG efficiently.

Thank you for choosing PG Pilot!

Best Regards,
PG Pilot Team
        `;

        // Log email (in production, send actual email using nodemailer)
        console.log('=== EMAIL NOTIFICATION ===');
        console.log('To:', user.email);
        console.log('Subject:', emailSubject);
        console.log('Body:', emailBody);
        console.log('========================');

        // TODO: Implement actual email sending using nodemailer
        // const nodemailer = require('nodemailer');
        // const transporter = nodemailer.createTransport({...});
        // await transporter.sendMail({
        //   from: 'support@pgpilot.com',
        //   to: user.email,
        //   subject: emailSubject,
        //   text: emailBody,
        //   html: emailBody.replace(/\n/g, '<br>')
        // });
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the payment if email fails
      }
    }

    // Log payment details for reference
    console.log('Payment Details Stored:', {
      order_id,
      payment_id,
      subscription_id: subscriptionId,
      pg_id: finalPgId,
      plan_id,
      amount: plan.price,
      date: startDate.toISOString().split('T')[0]
    });

    res.json({
      message: 'Payment verified and subscription created successfully',
      subscription_id: subscriptionId,
      expiry_date: expiryDate.toISOString().split('T')[0],
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
      },
    });
    } catch (error) {
      console.error('Verify payment error:', error);
      
      // Handle foreign key constraint error specifically
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        return res.status(400).json({ 
          error: 'PG not found in database',
          details: `The PG ID ${finalPgId} does not exist. Please create a PG first before subscribing.`,
          message: 'Please go to PG Management and create your PG, then try subscribing again.'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to verify payment',
        details: error.message 
      });
    }
};

// Get Razorpay key for frontend
const getRazorpayKey = async (req, res) => {
  res.json({ key: razorpay.key_id });
};

module.exports = {
  createSubscriptionOrder,
  verifyPayment,
  getRazorpayKey,
};

