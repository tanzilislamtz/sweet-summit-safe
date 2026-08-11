-- Seed a demo administrator account for preview and exploration
-- Note: auth schema operations usually require higher privileges, 
-- but this migration follows standard Supabase patterns.

DO $$
DECLARE
  demo_id UUID := '00000000-0000-0000-0000-000000000000';
  demo_email TEXT := 'demo@learnsacademy.com';
BEGIN
  -- 1. Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_id) THEN
    INSERT INTO auth.users (
      id, 
      instance_id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      created_at, 
      updated_at, 
      role, 
      confirmation_token, 
      email_change, 
      email_change_token_new, 
      recovery_token
    )
    VALUES (
      demo_id,
      '00000000-0000-0000-0000-000000000000',
      demo_email,
      crypt('demo123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Admin"}',
      now(),
      now(),
      'authenticated',
      '',
      '',
      '',
      ''
    );
  END IF;

  -- 2. Ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = demo_id) THEN
    INSERT INTO public.profiles (id, full_name, email, account_type, status)
    VALUES (demo_id, 'Demo Admin', demo_email, 'admin', 'active');
  END IF;

  -- 3. Grant admin role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = demo_id AND role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (demo_id, 'admin');
  END IF;

END $$;
