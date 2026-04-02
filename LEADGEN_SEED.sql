-- ================================================================
-- CORALÉA CRM — LEAD GEN SEED DATA
-- Correlates with existing guests: Hartfield, Marchetti, Mehta, Ashworth
-- Run AFTER supabase-schema.sql AND CORALEA_MIGRATION.sql
-- ================================================================

-- ================================================================
-- 1. PROFILES (staff who appear as assignees)
-- ================================================================
-- Note: These reference auth.users so we insert placeholder UUIDs.
-- Replace with real auth user IDs after creating staff logins,
-- OR skip this block and use unassigned leads (assigned_to = NULL).

-- ================================================================
-- 2. INQUIRY LEADS
-- 22 leads across all tiers, sources, and event types.
-- Hot leads link to upcoming events matching existing guest profiles.
-- UTM data reflects realistic Google/Instagram ad campaigns.
-- ================================================================

INSERT INTO public.inquiry_leads (
  first_name, last_name, email, phone, whatsapp_opted, country,
  event_type, event_date, guest_count, event_duration, catering_style,
  budget_range, timeline, preferences,
  source, how_found_us, utm_source, utm_medium, utm_campaign,
  lead_score, lead_tier, status, notes, form_data
) VALUES

-- ── HOT LEADS (score 85+) ──────────────────────────────────────

-- #1 — Destination wedding, large group, high budget, urgent (Hartfield referral)
('Alexandra', 'Pemberton', 'alexandra.pemberton@hargrove.co.uk',
 '+44 7700 900142', true, 'United Kingdom',
 'wedding', CURRENT_DATE + 68, 72, 'multi_day', 'plated',
 '35k_plus', '1_3m',
 '["beachfront","sunset","photography","floral","music","accommodation","yacht"]'::jsonb,
 'event_builder', 'referral', NULL, NULL, NULL,
 94, 'hot', 'contacted',
 'Referred by James Hartfield (platinum). Bride flew in from London. Very decisive — wants Saturday sunset ceremony on beach. Quote requested for Caribbean Sunset package + live band + photography.',
 '{"guests":72,"preferences":["beachfront","sunset","photography","floral","music","accommodation","yacht"],"country":"United Kingdom","how_found":"referral","raw_notes":"James told us you are the only place worth considering in Barbados."}'::jsonb),

-- #2 — Corporate retreat, large group, high budget, booking urgently
('Marcus', 'Delacroix', 'mdelacroix@blackwoodcapital.com',
 '+1 212 555 0174', true, 'United States',
 'corporate', CURRENT_DATE + 22, 38, 'multi_day', 'plated',
 '35k_plus', 'asap',
 '["pool","transport","spa","accommodation"]'::jsonb,
 'event_builder', 'google', 'google', 'cpc', 'coralea-corporate-retreat-barbados',
 91, 'hot', 'tour_scheduled',
 'MD of private equity fund. Booking Q2 offsite for senior partners. Full property buyout discussed. Tour scheduled for Thursday at 4pm.',
 '{"guests":38,"gclid":"CjwKCAiA9vS6BhA9EiwAJpnXwxYz","how_found":"google"}'::jsonb),

-- #3 — Intimate elopement, very high score, responds on WhatsApp
('Isabelle', 'Fontaine', 'isabelle.fontaine@me.com',
 '+33 6 12 34 56 78', true, 'France',
 'elopement', CURRENT_DATE + 41, 8, '2_nights', 'tasting',
 '15k_35k', '1_3m',
 '["beachfront","sunset","photography","floral"]'::jsonb,
 'event_builder', 'instagram', 'instagram', 'paid', 'coralea-weddings-ig-story',
 87, 'hot', 'proposal_sent',
 'Parisian couple eloping in secret — maximum discretion requested. Proposal sent. Awaiting deposit confirmation.',
 '{"guests":8,"fbclid":"FBCLID_892xk","how_found":"instagram"}'::jsonb),

-- #4 — Wedding, correlates to existing Marchetti anniversary (gold guest Sofia)
-- Sofia's sister is getting married — referred by Sofia
('Valentina', 'Marchetti', 'valentina.marchetti@gmail.com',
 '+39 347 555 0211', true, 'Italy',
 'wedding', CURRENT_DATE + 118, 45, 'multi_day', 'buffet',
 '15k_35k', '3_6m',
 '["beachfront","sunset","floral","music","photography","spa"]'::jsonb,
 'quick_form', 'referral', NULL, NULL, NULL,
 88, 'hot', 'new',
 'Sister of Sofia Marchetti (gold guest). Referred directly. Wants similar vibe to Sofia and husband''s anniversary visit.',
 '{"preferred_dates":"June 2026","how_found":"referral"}'::jsonb),

-- ── WARM LEADS (score 65–84) ───────────────────────────────────

-- #5 — Corporate retreat, Google Ads
('Priya', 'Nair', 'p.nair@axiomglobal.com',
 '+1 416 555 0193', false, 'Canada',
 'corporate', CURRENT_DATE + 55, 25, 'full_day', 'plated',
 '15k_35k', '3_6m',
 '["pool","transport","accommodation"]'::jsonb,
 'event_builder', 'google', 'google', 'cpc', 'coralea-corporate-retreat-barbados',
 78, 'warm', 'contacted',
 'HR Director planning leadership summit. Compared with two other Barbados venues. Sent venue guide. Follow up call booked for Friday.',
 '{"guests":25,"gclid":"CjwKCAiA8Qt1","how_found":"google"}'::jsonb),

-- #6 — Private celebration (milestone birthday), Instagram
('Thomas', 'Whitmore', 'thomas.whitmore@whitmoregroup.com',
 '+1 305 555 0167', true, 'United States',
 'celebration', CURRENT_DATE + 33, 18, 'full_day', 'cocktail',
 '5k_15k', '1_3m',
 '["yacht","sunset","music","pool"]'::jsonb,
 'event_builder', 'instagram', 'instagram', 'paid', 'coralea-celebrations-ig-reel',
 74, 'warm', 'contacted',
 '50th birthday celebration. Interested in yacht charter add-on. Warm but price-sensitive — sent breakdown of what''s included.',
 '{"guests":18,"fbclid":"FBCLID_550ty","how_found":"instagram"}'::jsonb),

-- #7 — Wellness retreat group, Meta Ads
('Camille', 'Dubois', 'camille.dubois@wellnessco.fr',
 '+33 1 45 67 89 23', false, 'France',
 'wellness', CURRENT_DATE + 78, 12, '2_nights', 'plated',
 '15k_35k', '3_6m',
 '["spa","beachfront","pool","sunset"]'::jsonb,
 'event_builder', 'instagram', 'meta', 'paid', 'coralea-wellness-retreat-meta',
 72, 'warm', 'nurturing',
 'Running a corporate wellness programme for a Paris-based tech company. Wants full spa access for 12 participants over 2 nights.',
 '{"guests":12,"fbclid":"FBCLID_773wl","how_found":"instagram"}'::jsonb),

-- #8 — Destination wedding, referral (Rajesh Mehta referred colleague)
('Arjun', 'Sharma', 'arjun.sharma@techventures.in',
 '+91 98112 55678', true, 'India',
 'wedding', CURRENT_DATE + 145, 55, 'multi_day', 'plated',
 '35k_plus', '3_6m',
 '["beachfront","photography","floral","accommodation","transport"]'::jsonb,
 'quick_form', 'referral', NULL, NULL, NULL,
 76, 'warm', 'new',
 'Referred by Rajesh Mehta (gold guest). Destination wedding for Indian family — 55 guests travelling from Mumbai. Very interested in full buyout.',
 '{"preferred_dates":"November 2026","how_found":"referral"}'::jsonb),

-- #9 — Villa stay, Google organic
('Catherine', 'Holloway', 'c.holloway@chadwicklaw.com',
 '+44 20 7946 1133', false, 'United Kingdom',
 'villa_stay', CURRENT_DATE + 29, 4, '2_nights', 'plated',
 '5k_15k', '1_3m',
 '["pool","sunset","spa"]'::jsonb,
 'quick_form', 'google', 'google', 'organic', NULL,
 69, 'warm', 'contacted',
 'Partner at London law firm. Looking for Oceanfront Villa for anniversary with husband. Checked availability — Villa 02 available.',
 '{"preferred_dates":"Early May 2026","how_found":"google"}'::jsonb),

-- #10 — Private celebration, Instagram
('Noah', 'Beaumont', 'noah.beaumont@designstudio.ca',
 '+1 604 555 0144', true, 'Canada',
 'celebration', CURRENT_DATE + 62, 22, 'full_day', 'cocktail',
 '5k_15k', '3_6m',
 '["pool","sunset","photography","music"]'::jsonb,
 'event_builder', 'instagram', 'instagram', 'paid', 'coralea-celebrations-ig-reel',
 71, 'warm', 'new',
 'Engagement party for 22 guests. Creative director — very visual, interested in Instagram-worthy setup.',
 '{"guests":22,"fbclid":"FBCLID_229ab","how_found":"instagram"}'::jsonb),

-- ── COLD LEADS (score 45–64) ───────────────────────────────────

-- #11 — Early exploration, wedding, Google
('Emma', 'Richardson', 'emma.r@outlook.com',
 NULL, false, 'United States',
 'wedding', NULL, 30, NULL, NULL,
 '5k_15k', '6_plus',
 '["beachfront","sunset","floral"]'::jsonb,
 'event_builder', 'google', 'google', 'cpc', 'coralea-wedding-venue-barbados',
 48, 'cold', 'nurturing',
 'Very early stage. Just got engaged. Not ready to book — added to long-term nurture.',
 '{"guests":30,"how_found":"google"}'::jsonb),

-- #12 — Small celebration, Instagram
('Liam', 'Torres', 'liam.torres@gmail.com',
 NULL, false, 'United States',
 'celebration', NULL, 10, NULL, NULL,
 'under_5k', '6_plus',
 '["sunset","pool"]'::jsonb,
 'event_builder', 'instagram', 'instagram', 'organic', NULL,
 45, 'cold', 'new',
 'Small group, limited budget. Likely not a good fit for full events — added to newsletter.',
 '{"guests":10,"how_found":"instagram"}'::jsonb),

-- #13 — Wellness, email newsletter
('Sophia', 'Clarke', 'sophia.clarke@wellness.co.uk',
 '+44 7911 123456', false, 'United Kingdom',
 'wellness', NULL, 8, NULL, NULL,
 'under_5k', '6_plus',
 '["spa","beachfront"]'::jsonb,
 'quick_form', 'email', 'email', 'newsletter', 'coralea-winter-promo',
 52, 'cold', 'nurturing',
 'Enquiry via newsletter. Looking for individual wellness packages not group.',
 '{"preferred_dates":"Flexible","how_found":"email"}'::jsonb),

-- #14 — Corporate, referral but no budget confirmed
('David', 'Chen', 'd.chen@startupco.sg',
 NULL, false, 'Singapore',
 'corporate', NULL, 15, NULL, NULL,
 '5k_15k', '6_plus',
 '["pool","accommodation"]'::jsonb,
 'event_builder', 'referral', NULL, NULL, NULL,
 54, 'cold', 'new',
 'Early stage startup team offsite. Budget may not align with property rates.',
 '{"guests":15,"how_found":"referral"}'::jsonb),

-- #15 — Villa stay, just browsing
('Olivia', 'Grant', 'olivia.grant@personal.com',
 NULL, false, 'Australia',
 'villa_stay', NULL, 2, NULL, NULL,
 'under_5k', 'flexible',
 '["pool","sunset"]'::jsonb,
 'quick_form', 'google', 'google', 'organic', NULL,
 46, 'cold', 'nurturing',
 'Honeymoon enquiry but budget below property minimum. Sent general information pack.',
 '{"preferred_dates":"Flexible 2026","how_found":"google"}'::jsonb),

-- ── RECENTLY CONVERTED (for showing full funnel) ──────────────

-- #16 — Booking confirmed — correlates to the existing Hartfield stays
-- (A Hartfield family member booked through the event builder)
('Victoria', 'Hartfield', 'victoria.hartfield@privatemail.com',
 '+1 (212) 555 0192', true, 'United States',
 'celebration', CURRENT_DATE - 18, 16, 'full_day', 'plated',
 '15k_35k', 'asap',
 '["beachfront","sunset","photography","yacht","spa"]'::jsonb,
 'event_builder', 'referral', NULL, NULL, NULL,
 90, 'hot', 'booking_confirmed',
 'James Hartfield''s daughter — 30th birthday celebration. Confirmed booking. Full Caribbean Sunset package + yacht charter + photography. Total $28,500.',
 '{"guests":16,"how_found":"referral"}'::jsonb),

-- #17 — Tour completed, proposal sent, awaiting decision
('Sebastian', 'Kline', 's.kline@klinehospitality.com',
 '+1 786 555 0201', true, 'United States',
 'corporate', CURRENT_DATE - 5, 30, 'multi_day', 'plated',
 '35k_plus', '1_3m',
 '["pool","accommodation","transport","spa"]'::jsonb,
 'event_builder', 'google', 'google', 'cpc', 'coralea-corporate-retreat-barbados',
 89, 'hot', 'proposal_sent',
 'CEO of boutique hotel group. Toured property last week — very impressed with Grand Villa setup. Proposal sent: $42K for 3-night buyout.',
 '{"guests":30,"gclid":"CjwKCAiA7Rp9"}'::jsonb),

-- #18 — Lost (for completeness of funnel data)
('Michael', 'Foster', 'm.foster@corp.com',
 NULL, false, 'United States',
 'corporate', NULL, 20, NULL, NULL,
 '15k_35k', '1_3m',
 '["pool","accommodation"]'::jsonb,
 'event_builder', 'google', 'google', 'cpc', 'coralea-corporate-retreat-barbados',
 78, 'warm', 'lost',
 'Chose a Turks & Caicos property instead. Cited flight connectivity as primary reason. Added to re-engagement at 6 months.',
 '{"guests":20}'::jsonb),

-- #19 — Elopement, recently arrived via Instagram story
('Margot', 'Leclerc', 'margot.leclerc@gmail.com',
 '+33 6 87 65 43 21', true, 'France',
 'elopement', CURRENT_DATE + 51, 6, '2_nights', 'tasting',
 '5k_15k', '3_6m',
 '["beachfront","sunset","photography","floral"]'::jsonb,
 'event_builder', 'instagram', 'instagram', 'paid', 'coralea-weddings-ig-story',
 74, 'warm', 'new',
 'Saw Isabelle Fontaine''s (lead #3) Instagram story about Barbados. Interested in similar elopement package.',
 '{"guests":6,"fbclid":"FBCLID_441zq"}'::jsonb),

-- #20 — Anniversary villa stay (correlates to Sofia Marchetti — she''s returning)
('Sofia', 'Marchetti', 'sofia.marchetti@euromail.eu',
 '+39 02 555 0182', true, 'Italy',
 'villa_stay', CURRENT_DATE + 72, 2, '2_nights', 'tasting',
 '5k_15k', '1_3m',
 '["spa","sunset","beachfront"]'::jsonb,
 'quick_form', 'returning', NULL, NULL, NULL,
 82, 'warm', 'booking_confirmed',
 'Returning gold guest — anniversary stay. Booked Oceanfront Villa 02. Pre-arrival preferences on file. No synthetic fragrances.',
 '{"preferred_dates":"June 2026","how_found":"returning"}'::jsonb),

-- #21 — New hot lead arrived today (for dashboard urgency)
('Jonathan', 'Ashby', 'j.ashby@ashbyventures.io',
 '+1 646 555 0188', true, 'United States',
 'wedding', CURRENT_DATE + 84, 60, 'multi_day', 'plated',
 '35k_plus', '1_3m',
 '["beachfront","sunset","photography","floral","music","accommodation","yacht","transport"]'::jsonb,
 'event_builder', 'google', 'google', 'cpc', 'coralea-wedding-venue-barbados',
 95, 'hot', 'new',
 'NEW HOT LEAD — submitted 40 minutes ago. VC founder, NYC. 60-guest destination wedding. Full buyout likely. Respond immediately.',
 '{"guests":60,"gclid":"CjwKCAiA9Zx8","how_found":"google"}'::jsonb),

-- #22 — Charlotte Ashworth returning (silver guest, wellness)
('Charlotte', 'Ashworth', 'cashworth@londonholdings.co.uk',
 '+44 20 7946 0892', false, 'United Kingdom',
 'wellness', CURRENT_DATE + 35, 4, '2_nights', 'plated',
 '5k_15k', '1_3m',
 '["spa","beachfront","sunset","pool"]'::jsonb,
 'quick_form', 'returning', NULL, NULL, NULL,
 72, 'warm', 'contacted',
 'Returning silver guest. Loved her first visit. Bringing 3 friends this time for a girls'' wellness break.',
 '{"preferred_dates":"May 2026","how_found":"returning"}'::jsonb);


-- ================================================================
-- 3. AD CAMPAIGNS (correlated to UTM sources in leads above)
-- ================================================================
INSERT INTO public.ad_campaigns (
  name, platform, status, objective,
  daily_budget_usd, total_spend_usd, start_date,
  impressions, clicks, leads_total, leads_qualified,
  tours_booked, bookings_confirmed, revenue_usd, notes
) VALUES
('Barbados Wedding Venue — Google Search', 'google', 'active',
 'Lead generation — destination wedding couples',
 120, 3840, CURRENT_DATE - 32,
 48200, 892, 8, 6, 3, 2, 71000,
 'Targeting: destination wedding + Barbados, Caribbean wedding venue. Top keywords converting: "luxury wedding barbados", "private beach wedding caribbean".'),

('Corporate Retreat Caribbean — Google Search', 'google', 'active',
 'Lead generation — corporate event planners',
 80, 2560, CURRENT_DATE - 32,
 31400, 544, 5, 4, 2, 1, 42000,
 'Targeting: corporate retreat + Caribbean, team offsite. Strong CTR on "all-inclusive corporate retreat barbados".'),

('Coraléa Weddings — Instagram Stories', 'instagram', 'active',
 'Awareness + lead gen — engaged couples 28-45',
 60, 1920, CURRENT_DATE - 32,
 182000, 1240, 6, 4, 1, 1, 28500,
 'Creative: sunset ceremony clips + couple testimonials. Best performing: 15-sec reel showing beach setup. Cost per lead significantly lower than Google.'),

('Celebrations & Events — Instagram Reels', 'instagram', 'active',
 'Lead generation — milestone celebrations',
 40, 1280, CURRENT_DATE - 32,
 94000, 687, 3, 2, 0, 0, 0,
 'Targeting: birthday celebrations, anniversaries, milestone events 30-55. Still in learning phase — CPL improving week on week.'),

('Wellness Retreat — Meta Audience Network', 'meta', 'paused',
 'Lead generation — wellness travellers',
 30, 480, CURRENT_DATE - 16,
 28000, 312, 2, 1, 0, 0, 0,
 'Paused after 2 weeks — audience quality poor. Cost per qualified lead too high vs Google. Revisit with lookalike audience.'),

('Coraléa Winter Promo — Email Newsletter', 'email', 'completed',
 'Re-engagement — past enquiries and newsletter list',
 0, 0, CURRENT_DATE - 45,
 0, 0, 1, 0, 0, 0, 0,
 'Sent to 340 subscribers. 1 new enquiry. Low conversion but zero cost — continue quarterly.');


-- ================================================================
-- 4. VENUE AVAILABILITY
-- Realistic calendar blocks correlating to confirmed leads above.
-- ================================================================
INSERT INTO public.venue_availability (venue_area, date, status, notes) VALUES

-- Pemberton wedding (lead #1) — blocked 3 days
('property', CURRENT_DATE + 67, 'hold',    'Courtesy hold — Pemberton wedding enquiry (72 guests)'),
('property', CURRENT_DATE + 68, 'hold',    'Courtesy hold — Pemberton wedding enquiry (72 guests)'),
('property', CURRENT_DATE + 69, 'hold',    'Courtesy hold — Pemberton wedding enquiry (72 guests)'),

-- Delacroix corporate (lead #2) — confirmed, blocked
('property', CURRENT_DATE + 21, 'booked',  'Delacroix / Blackwood Capital — corporate retreat (38 pax)'),
('property', CURRENT_DATE + 22, 'booked',  'Delacroix / Blackwood Capital — corporate retreat (38 pax)'),
('property', CURRENT_DATE + 23, 'booked',  'Delacroix / Blackwood Capital — corporate retreat (38 pax)'),

-- Fontaine elopement (lead #3) — proposal sent, soft hold
('beach',    CURRENT_DATE + 41, 'hold',    'Soft hold — Fontaine elopement (8 guests). Proposal out.'),
('beach',    CURRENT_DATE + 42, 'hold',    'Soft hold — Fontaine elopement (8 guests).'),

-- Victoria Hartfield confirmed celebration (lead #16) — past, booked
('property', CURRENT_DATE - 18, 'booked',  'CONFIRMED — Victoria Hartfield 30th birthday. $28,500. Completed.'),
('property', CURRENT_DATE - 17, 'booked',  'CONFIRMED — Victoria Hartfield 30th birthday. Completed.'),

-- Kline corporate (lead #17) — proposal sent, strong hold
('property', CURRENT_DATE + 14, 'hold',    'Priority hold — Kline Hospitality corporate (30 pax). Proposal $42K pending.'),
('property', CURRENT_DATE + 15, 'hold',    'Priority hold — Kline Hospitality corporate.'),
('property', CURRENT_DATE + 16, 'hold',    'Priority hold — Kline Hospitality corporate.'),

-- Sofia Marchetti anniversary return (lead #20) — confirmed
('villa_ocean', CURRENT_DATE + 72, 'booked', 'CONFIRMED — Sofia Marchetti anniversary. Villa 02. Returning gold guest.'),
('villa_ocean', CURRENT_DATE + 73, 'booked', 'CONFIRMED — Sofia Marchetti anniversary. Villa 02.'),

-- Ashby wedding (lead #21) — auto-hold triggered by hot lead score
('property', CURRENT_DATE + 84, 'hold',    'Auto-hold: hot lead — Ashby wedding enquiry (60 guests, score 95). Expires 48hrs.'),
('property', CURRENT_DATE + 85, 'hold',    'Auto-hold: hot lead — Ashby wedding enquiry.'),
('property', CURRENT_DATE + 86, 'hold',    'Auto-hold: hot lead — Ashby wedding enquiry.'),

-- Maintenance block (realistic)
('pavilion', CURRENT_DATE + 7,  'maintenance', 'Spa pavilion — annual deep clean and equipment service'),
('pavilion', CURRENT_DATE + 8,  'maintenance', 'Spa pavilion — equipment service'),

-- Peak season block already sold (historical)
('property', CURRENT_DATE - 45, 'booked',  'New Year buyout — fully confirmed. Completed.'),
('property', CURRENT_DATE - 44, 'booked',  'New Year buyout — fully confirmed. Completed.'),
('property', CURRENT_DATE - 43, 'booked',  'New Year buyout — fully confirmed. Completed.')

ON CONFLICT (venue_area, date) DO NOTHING;


-- ================================================================
-- 5. EVENT PROPOSALS
-- Linked to the hot leads that have progressed to proposal stage.
-- Uses gen_random_uuid() for lead_id lookup via subquery.
-- ================================================================

INSERT INTO public.event_proposals (
  lead_id, version, package_name, add_ons,
  total_usd, deposit_usd, sent_at, accepted_at, notes
)
SELECT
  id,
  1,
  'The Caribbean Sunset Collection',
  '[{"id":"photography","name":"Photography (8 hours)","price":3500},{"id":"live_band","name":"Live Band (4 hours)","price":3200},{"id":"florals_arch","name":"Ceremony arch florals","price":1200}]'::jsonb,
  30400,
  9120,
  NOW() - INTERVAL '2 days',
  NULL,
  'Pemberton wedding — 72 guests. Package + photography + band + florals. Date held. Awaiting deposit.'
FROM public.inquiry_leads
WHERE email = 'alexandra.pemberton@hargrove.co.uk'
LIMIT 1;

INSERT INTO public.event_proposals (
  lead_id, version, package_name, add_ons,
  total_usd, deposit_usd, sent_at, accepted_at, notes
)
SELECT
  id,
  1,
  'The Grand Buyout',
  '[{"id":"dj","name":"DJ (5 hours)","price":1500},{"id":"photo_booth","name":"Photo booth (3 hours)","price":950}]'::jsonb,
  42000,
  12600,
  NOW() - INTERVAL '4 days',
  NULL,
  'Kline corporate — 3-night full buyout. Grand Buyout package + AV add-ons. Tour completed. Decision expected this week.'
FROM public.inquiry_leads
WHERE email = 's.kline@klinehospitality.com'
LIMIT 1;

INSERT INTO public.event_proposals (
  lead_id, version, package_name, add_ons,
  total_usd, deposit_usd, sent_at, accepted_at, notes
)
SELECT
  id,
  1,
  'The Intimate Collection',
  '[{"id":"photography","name":"Photography (8 hours)","price":3500},{"id":"florals_arch","name":"Ceremony arch florals","price":1200}]'::jsonb,
  13200,
  3960,
  NOW() - INTERVAL '1 day',
  NULL,
  'Fontaine elopement — 8 guests. Intimate Collection + photography + arch florals. Maximum discretion noted.'
FROM public.inquiry_leads
WHERE email = 'isabelle.fontaine@me.com'
LIMIT 1;

-- Victoria Hartfield — ACCEPTED (confirmed booking)
INSERT INTO public.event_proposals (
  lead_id, version, package_name, add_ons,
  total_usd, deposit_usd, sent_at, accepted_at, notes
)
SELECT
  id,
  1,
  'The Caribbean Sunset Collection',
  '[{"id":"photography","name":"Photography (8 hours)","price":3500},{"id":"yacht_half","name":"Yacht charter (half-day)","price":2200}]'::jsonb,
  28500,
  8550,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '17 days',
  'Victoria Hartfield 30th birthday — ACCEPTED. Deposit paid. Event completed successfully.'
FROM public.inquiry_leads
WHERE email = 'victoria.hartfield@privatemail.com'
LIMIT 1;


-- ================================================================
-- 6. TOUR RECORDS
-- Written into inquiry_leads fields (tour_requested / tour_scheduled_at / tour_completed)
-- ================================================================

-- Delacroix — tour scheduled (upcoming Thursday)
UPDATE public.inquiry_leads
SET
  tour_requested    = true,
  tour_scheduled_at = (CURRENT_DATE + 4 + INTERVAL '16 hours')::timestamptz,
  status            = 'tour_scheduled',
  notes             = '[Tour: in_person] Site visit — Marcus Delacroix & 2 partners. Prepare Grand Villa and pavilion. Arrange sunset drinks on beach.'
WHERE email = 'mdelacroix@blackwoodcapital.com';

-- Kline — tour completed (5 days ago)
UPDATE public.inquiry_leads
SET
  tour_requested    = true,
  tour_scheduled_at = (CURRENT_DATE - 5 + INTERVAL '15 hours')::timestamptz,
  tour_completed    = true,
  status            = 'proposal_sent',
  notes             = '[Tour: sunset_tour] Tour completed — extremely positive. Sebastian loved the Grand Villa pool setup and sunset from the beach. Proposal sent same evening.'
WHERE email = 's.kline@klinehospitality.com';

-- Victoria Hartfield — tour completed and event done
UPDATE public.inquiry_leads
SET
  tour_requested    = true,
  tour_scheduled_at = (CURRENT_DATE - 22 + INTERVAL '17 hours')::timestamptz,
  tour_completed    = true,
  first_contacted_at = NOW() - INTERVAL '23 days',
  response_time_mins = 8
WHERE email = 'victoria.hartfield@privatemail.com';

-- Pemberton — virtual tour completed
UPDATE public.inquiry_leads
SET
  tour_requested    = true,
  tour_scheduled_at = (CURRENT_DATE - 1 + INTERVAL '14 hours')::timestamptz,
  tour_completed    = true,
  first_contacted_at = NOW() - INTERVAL '3 days',
  response_time_mins = 12,
  notes = '[Tour: virtual] Video call — Alexandra and fiancé joined from London. Walked through beach, pavilion, and villa options. Very enthusiastic. Proposal being prepared.'
WHERE email = 'alexandra.pemberton@hargrove.co.uk';


-- ================================================================
-- 7. RESPONSE TIME & FIRST CONTACT STAMPS
-- Realistic contact records for contacted/progressed leads
-- ================================================================
UPDATE public.inquiry_leads SET
  first_contacted_at = created_at + INTERVAL '7 minutes',
  response_time_mins = 7
WHERE email = 'mdelacroix@blackwoodcapital.com';

UPDATE public.inquiry_leads SET
  first_contacted_at = created_at + INTERVAL '11 minutes',
  response_time_mins = 11
WHERE email = 'isabelle.fontaine@me.com';

UPDATE public.inquiry_leads SET
  first_contacted_at = created_at + INTERVAL '4 hours 22 minutes',
  response_time_mins = 262
WHERE email = 'p.nair@axiomglobal.com';

UPDATE public.inquiry_leads SET
  first_contacted_at = created_at + INTERVAL '1 hour 48 minutes',
  response_time_mins = 108
WHERE email = 'thomas.whitmore@whitmoregroup.com';

UPDATE public.inquiry_leads SET
  first_contacted_at = created_at + INTERVAL '2 hours 15 minutes',
  response_time_mins = 135
WHERE email = 'c.holloway@chadwicklaw.com';

UPDATE public.inquiry_leads SET
  first_contacted_at = created_at + INTERVAL '18 minutes',
  response_time_mins = 18
WHERE email = 'sofia.marchetti@euromail.eu'
  AND event_type = 'villa_stay';


-- ================================================================
-- VERIFY
-- ================================================================
SELECT
  lead_tier,
  status,
  COUNT(*) AS count,
  ROUND(AVG(lead_score)) AS avg_score
FROM public.inquiry_leads
GROUP BY lead_tier, status
ORDER BY lead_tier, status;

SELECT
  platform,
  SUM(leads_total) AS leads,
  SUM(bookings_confirmed) AS bookings,
  SUM(revenue_usd) AS revenue
FROM public.ad_campaigns
GROUP BY platform
ORDER BY revenue DESC;

SELECT COUNT(*) AS proposals FROM public.event_proposals;
SELECT COUNT(*) AS availability_blocks FROM public.venue_availability;
