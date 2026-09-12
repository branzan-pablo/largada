-- Cache auth.uid() once per statement instead of evaluating it for every row.
-- UPDATE/ALL policies also receive an explicit WITH CHECK so ownership cannot
-- be reassigned through an otherwise valid update.

ALTER POLICY "Users can update own profile" ON public.profiles
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can read own recommendation logs" ON public.race_recommendation_logs
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own subscription" ON public.organizer_subscriptions
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own payment customer" ON public.payment_customers
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own payment orders" ON public.payment_orders
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own radar analyses" ON public.radar_analyses
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own radar profile" ON public.radar_profiles
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can upsert own radar profile" ON public.radar_profiles
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own radar profile" ON public.radar_profiles
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own RSVPs" ON public.rsvps
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can delete own RSVPs" ON public.rsvps
  USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can create suggestions" ON public.race_suggestions
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own suggestions" ON public.race_suggestions
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

ALTER POLICY "Admins can update suggestions" ON public.race_suggestions
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

ALTER POLICY "Admins can insert races" ON public.races
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

ALTER POLICY "Admins can update races" ON public.races
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

ALTER POLICY "Admins can read ai call logs" ON public.ai_call_logs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

-- Merge overlapping SELECT policies so PostgreSQL evaluates one permissive
-- expression per table and role.
DROP POLICY "Admins can manage affiliate rules" ON public.affiliate_rules;
DROP POLICY "Anyone can read active rules" ON public.affiliate_rules;

CREATE POLICY "Active rules or admins can read" ON public.affiliate_rules
  FOR SELECT TO anon, authenticated
  USING (
    active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert affiliate rules" ON public.affiliate_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update affiliate rules" ON public.affiliate_rules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete affiliate rules" ON public.affiliate_rules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );

DROP POLICY "Admins can read clicks" ON public.link_clicks;
DROP POLICY "Owners can read own race clicks" ON public.link_clicks;

CREATE POLICY "Admins and owners can read clicks" ON public.link_clicks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.races
      WHERE races.id = link_clicks.race_id
        AND races.created_by = (SELECT auth.uid())
    )
  );

DROP POLICY "Admins can read all views" ON public.race_views;
DROP POLICY "Owners can read own race views" ON public.race_views;

CREATE POLICY "Admins and owners can read race views" ON public.race_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.races
      WHERE races.id = race_views.race_id
        AND races.created_by = (SELECT auth.uid())
    )
  );
