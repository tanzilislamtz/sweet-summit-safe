-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator'))
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ shared updated_at ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  account_type text NOT NULL DEFAULT 'student' CHECK (account_type IN ('student','tutor','parent')),
  class_level text,
  institute text,
  phone text,
  location text,
  language text NOT NULL DEFAULT 'en',
  points integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','banned')),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- new user -> profile (+ first user becomes admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,''),'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'account_type','student')
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ACADEMIC CONTENT ============
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  name_bn text,
  emoji text,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short text,
  region text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chapters_subject_idx ON public.chapters(subject_id);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  board_id uuid REFERENCES public.boards(id) ON DELETE SET NULL,
  qtype text NOT NULL DEFAULT 'mcq' CHECK (qtype IN ('mcq','cq','written')),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer,
  explanation text,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  year integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_subject_idx ON public.questions(subject_id);
CREATE INDEX questions_chapter_idx ON public.questions(chapter_id);

CREATE TABLE public.mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'model' CHECK (category IN ('model','chapter','subject','previous')),
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  total_questions integer NOT NULL DEFAULT 25,
  marks integer NOT NULL DEFAULT 25,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  description text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ SOCIAL ============
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  kind text NOT NULL DEFAULT 'learning' CHECK (kind IN ('learning','question','seeking-tutor','offering-tutor','seeking-student')),
  title text,
  body text NOT NULL,
  tag text,
  media_url text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published','pending','hidden','removed')),
  likes integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_status_idx ON public.posts(status);

CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text NOT NULL,
  batch text,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public','private')),
  tagline text,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','archived','blocked')),
  member_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','moderator','tutor','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- ============ TUTORS ============
CREATE TABLE public.tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  headline text,
  subjects text[] NOT NULL DEFAULT '{}',
  board text,
  experience text,
  location text,
  mode text NOT NULL DEFAULT 'Both' CHECK (mode IN ('Online','In-person','Both')),
  fee integer NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  reviews integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'week' CHECK (availability IN ('today','busy','week')),
  verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tutor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  subjects text[] NOT NULL DEFAULT '{}',
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ MARKETING / SYSTEM ============
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  image_url text,
  cta_label text,
  cta_url text,
  sponsor text,
  placement text NOT NULL DEFAULT 'feed' CHECK (placement IN ('feed','sidebar','quiz','group')),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','student','tutor','parent')),
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ GRANTS + RLS for content tables ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['subjects','boards','chapters','questions','mock_tests','posts','post_reports','study_groups','group_members','tutors','tutor_applications','ads','announcements','app_settings','admin_audit_log']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "staff read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "staff manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE TRIGGER %1$s_touch BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t)
      ;
  END LOOP;
END $$;

-- audit log has no updated_at; drop that trigger
DROP TRIGGER IF EXISTS admin_audit_log_touch ON public.admin_audit_log;
DROP TRIGGER IF EXISTS group_members_touch ON public.group_members;
DROP TRIGGER IF EXISTS app_settings_touch ON public.app_settings;
CREATE TRIGGER app_settings_touch BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- audit log: admin-only
DROP POLICY "staff read admin_audit_log" ON public.admin_audit_log;
DROP POLICY "staff manage admin_audit_log" ON public.admin_audit_log;
CREATE POLICY "admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff write audit" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- settings + ads: admin-only writes
DROP POLICY "staff manage app_settings" ON public.app_settings;
CREATE POLICY "admins manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY "staff manage ads" ON public.ads;
CREATE POLICY "admins manage ads" ON public.ads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PUBLIC / USER-FACING READ POLICIES ============
GRANT SELECT ON public.subjects, public.boards, public.chapters, public.questions, public.mock_tests, public.posts, public.study_groups, public.tutors, public.ads, public.announcements TO anon;

CREATE POLICY "public read subjects" ON public.subjects FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public read boards" ON public.boards FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public read chapters" ON public.chapters FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public read questions" ON public.questions FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public read mock tests" ON public.mock_tests FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "public read posts" ON public.posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "public read groups" ON public.study_groups FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "public read tutors" ON public.tutors FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public read ads" ON public.ads FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "public read announcements" ON public.announcements FOR SELECT TO anon, authenticated USING (is_active);

CREATE POLICY "authors read own posts" ON public.posts FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "authors write posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors update own posts" ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors delete own posts" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "users file reports" ON public.post_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "users read own reports" ON public.post_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE POLICY "users create groups" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "owners read own groups" ON public.study_groups FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "owners update own groups" ON public.study_groups FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "members read membership" ON public.group_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "members join" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "members leave" ON public.group_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users apply as tutor" ON public.tutor_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users read own application" ON public.tutor_applications FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============ SEED ============
INSERT INTO public.subjects (slug, name, name_bn, emoji, color, sort_order) VALUES
 ('math','Mathematics','Math','📐','from-indigo-500 to-purple-500',1),
 ('hmath','Higher Math','Higher Math','∑','from-violet-500 to-fuchsia-500',2),
 ('physics','Physics','Physics','⚛️','from-blue-500 to-cyan-500',3),
 ('chem','Chemistry','Chemistry','🧪','from-emerald-500 to-teal-500',4),
 ('bio','Biology','Biology','🧬','from-rose-500 to-pink-500',5),
 ('english','English','English','🔤','from-amber-500 to-orange-500',6),
 ('bangla','Bangla','Bangla','📖','from-fuchsia-500 to-pink-500',7),
 ('ict','ICT','ICT','💻','from-sky-500 to-indigo-500',8);

INSERT INTO public.boards (slug, name, short, region) VALUES
 ('dhaka','Dhaka Board','DHA','Central'),
 ('rajshahi','Rajshahi Board','RAJ','North'),
 ('chattogram','Chattogram Board','CTG','South-East'),
 ('sylhet','Sylhet Board','SYL','North-East'),
 ('khulna','Khulna Board','KHU','South-West'),
 ('barisal','Barisal Board','BAR','South'),
 ('jashore','Jashore Board','JAS','West'),
 ('cumilla','Cumilla Board','CUM','East'),
 ('dinajpur','Dinajpur Board','DIN','North-West');

INSERT INTO public.app_settings (key, value, description) VALUES
 ('site', '{"name":"Learns Academy","tagline":"Learn together, grow faster","support_email":"support@learnsacademy.com"}', 'General site identity'),
 ('features', '{"ai_assistant":true,"group_study":true,"mock_test":true,"messaging":true,"ads":true}', 'Feature toggles'),
 ('moderation', '{"auto_hide_reported":false,"post_approval_required":false,"message_request_limit":3}', 'Moderation rules'),
 ('ai', '{"model":"google/gemini-2.5-flash","default_language":"en","daily_limit":50}', 'AI assistant configuration');

INSERT INTO public.announcements (title, body, audience) VALUES
 ('Welcome to Learns Academy','Explore practice sets, mock tests, study groups and verified tutors.','all');
