DO $$
DECLARE
  demo_id UUID := '00000000-0000-0000-0000-000000000000';
  demo_email TEXT := 'demo@learnsacademy.com';
BEGIN
  -- Re-ensure auth.users entry with explicit extensions schema references
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_id) THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
      role, confirmation_token, email_change, email_change_token_new, recovery_token, aud, is_sso_user
    )
    VALUES (
      demo_id, '00000000-0000-0000-0000-000000000000', demo_email,
      extensions.crypt('demo123', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Admin"}',
      now(), now(), 'authenticated', '', '', '', '', 'authenticated', false
    );
  ELSE
    UPDATE auth.users 
    SET encrypted_password = extensions.crypt('demo123', extensions.gen_salt('bf')),
        updated_at = now(),
        raw_user_meta_data = '{"full_name":"Demo Admin"}',
        email_confirmed_at = now()
    WHERE id = demo_id;
  END IF;

  -- Ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = demo_id) THEN
    INSERT INTO public.profiles (id, full_name, email, account_type, status)
    VALUES (demo_id, 'Demo Admin', demo_email, 'admin', 'active');
  END IF;

  -- Grant admin role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = demo_id AND role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (demo_id, 'admin');
  END IF;
END $$;