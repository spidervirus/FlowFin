-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES notification_templates(id),
  status TEXT NOT NULL,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (type, subject, body) VALUES
('trial_ending', 'Your Trial is Ending Soon', 
'Dear {{user_name}},

Your trial period for FlowFin will end on {{trial_end_date}}. To continue enjoying our premium features, please upgrade your subscription.

Current Plan Features:
{{plan_features}}

Upgrade now to keep access to all features: {{upgrade_url}}

Best regards,
The FlowFin Team'),

('payment_failed', 'Action Required: Payment Failed', 
'Dear {{user_name}},

We were unable to process your payment for your FlowFin subscription. Please update your payment information to avoid any service interruption.

Update your payment details here: {{billing_url}}

If you need assistance, please contact our support team.

Best regards,
The FlowFin Team'),

('subscription_canceled', 'Subscription Cancellation Confirmed', 
'Dear {{user_name}},

Your FlowFin subscription has been canceled and will end on {{end_date}}. You can continue using your premium features until then.

We''re sorry to see you go. If you change your mind, you can reactivate your subscription anytime: {{reactivate_url}}

Best regards,
The FlowFin Team'),

('subscription_renewed', 'Subscription Renewed Successfully', 
'Dear {{user_name}},

Your FlowFin subscription has been successfully renewed. Your next billing date is {{next_billing_date}}.

Plan: {{plan_name}}
Amount: ${{amount}}

View your billing details here: {{billing_url}}

Thank you for your continued support!

Best regards,
The FlowFin Team')
ON CONFLICT (type) DO UPDATE
SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  updated_at = NOW();

-- Create function to send notification
CREATE OR REPLACE FUNCTION send_subscription_notification(
  p_user_id UUID,
  p_template_type TEXT,
  p_metadata JSONB
)
RETURNS void AS $$
DECLARE
  v_template notification_templates%ROWTYPE;
  v_user_email TEXT;
  v_status TEXT;
  v_error TEXT;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM notification_templates
  WHERE type = p_template_type;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template type % not found', p_template_type;
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- TODO: Implement actual email sending logic here
  -- This would typically involve calling an external email service
  -- For now, we just log the attempt
  v_status := 'pending';
  v_error := NULL;

  -- Log the notification
  INSERT INTO notification_logs (
    user_id,
    template_id,
    status,
    error,
    metadata
  ) VALUES (
    p_user_id,
    v_template.id,
    v_status,
    v_error,
    p_metadata
  );

END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial ending notification
CREATE OR REPLACE FUNCTION notify_trial_ending()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'trialing' AND 
     NEW.current_period_end <= NOW() + INTERVAL '3 days' AND
     (OLD.current_period_end IS NULL OR OLD.current_period_end <> NEW.current_period_end)
  THEN
    PERFORM send_subscription_notification(
      NEW.user_id,
      'trial_ending',
      jsonb_build_object(
        'trial_end_date', NEW.current_period_end,
        'plan_id', NEW.plan_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription notifications
DROP TRIGGER IF EXISTS subscription_notification_trigger ON subscriptions;
CREATE TRIGGER subscription_notification_trigger
  AFTER INSERT OR UPDATE
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_trial_ending();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Service role can manage notification templates" ON notification_templates;
CREATE POLICY "Service role can manage notification templates"
  ON notification_templates FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage notification logs" ON notification_logs;
CREATE POLICY "Service role can manage notification logs"
  ON notification_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view their own notification logs" ON notification_logs;
CREATE POLICY "Users can view their own notification logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create rollback function
CREATE OR REPLACE FUNCTION rollback_subscription_notifications()
RETURNS void AS $$
BEGIN
  -- Drop triggers
  DROP TRIGGER IF EXISTS subscription_notification_trigger ON subscriptions;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS notify_trial_ending();
  DROP FUNCTION IF EXISTS send_subscription_notification(UUID, TEXT, JSONB);
  
  -- Drop tables
  DROP TABLE IF EXISTS notification_logs;
  DROP TABLE IF EXISTS notification_templates;
END;
$$ LANGUAGE plpgsql; 