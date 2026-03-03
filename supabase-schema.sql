-- ============================================
-- CORALÉA PRIVATE RETREAT - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GUESTS TABLE
-- ============================================
CREATE TABLE guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  nationality TEXT,
  passport_number TEXT,
  vip_tier TEXT DEFAULT 'standard' CHECK (vip_tier IN ('standard', 'silver', 'gold', 'platinum')),
  arrival_preference TEXT,
  dietary_requirements TEXT,
  pillow_preference TEXT,
  room_temperature NUMERIC(4,1),
  preferred_activities TEXT[],
  allergies TEXT,
  anniversary_date DATE,
  birthday DATE,
  preferred_currency TEXT DEFAULT 'USD',
  notes TEXT,
  total_stays INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  last_stay DATE,
  discretion_level TEXT DEFAULT 'standard' CHECK (discretion_level IN ('standard', 'high', 'maximum'))
);

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
CREATE TABLE reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  accommodation_type TEXT NOT NULL CHECK (accommodation_type IN ('private_suite', 'oceanfront_villa', 'grand_villa')),
  room_number TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INTEGER DEFAULT 2,
  children INTEGER DEFAULT 0,
  nightly_rate NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('enquiry', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  special_requests TEXT,
  occasion TEXT,
  arrival_method TEXT DEFAULT 'commercial_flight' CHECK (arrival_method IN ('commercial_flight', 'private_jet', 'yacht', 'helicopter', 'other')),
  concierge_notes TEXT,
  pre_arrival_completed BOOLEAN DEFAULT false
);

-- ============================================
-- EXPERIENCES TABLE
-- ============================================
CREATE TABLE experiences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  experience_type TEXT NOT NULL CHECK (experience_type IN ('yacht_charter', 'spa_treatment', 'dining', 'excursion', 'wellness', 'event', 'other')),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  duration_hours NUMERIC(5,2),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  vendor TEXT
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'corporate', 'birthday', 'anniversary', 'private_dinner', 'other')),
  date DATE NOT NULL,
  guest_count INTEGER DEFAULT 1,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  budget NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'enquiry' CHECK (status IN ('enquiry', 'planning', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  total_revenue NUMERIC(12,2)
);

-- ============================================
-- HURRICANE ALERTS TABLE
-- ============================================
CREATE TABLE hurricane_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  storm_name TEXT NOT NULL,
  category INTEGER DEFAULT 1,
  status TEXT DEFAULT 'watch' CHECK (status IN ('watch', 'warning', 'active', 'resolved')),
  eta_hours INTEGER,
  affected_guests INTEGER DEFAULT 0,
  protocols_activated TEXT[] DEFAULT '{}',
  notes TEXT,
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- REVENUE RECORDS TABLE
-- ============================================
CREATE TABLE revenue_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rooms', 'spa', 'dining', 'excursions', 'events', 'other')),
  amount_usd NUMERIC(12,2) NOT NULL,
  amount_local NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  notes TEXT
);

-- ============================================
-- STAFF TABLE
-- ============================================
CREATE TABLE staff (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department TEXT CHECK (department IN ('concierge', 'spa', 'dining', 'housekeeping', 'management', 'security', 'maintenance')),
  is_active BOOLEAN DEFAULT true
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hurricane_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust for your auth strategy)
CREATE POLICY "Allow all for authenticated users" ON guests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON reservations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON experiences FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON hurricane_alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON revenue_records FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON staff FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Increment guest stats
-- ============================================
CREATE OR REPLACE FUNCTION increment_guest_stats(guest_id UUID, revenue NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE guests
  SET
    total_stays = total_stays + 1,
    total_revenue = total_revenue + revenue
  WHERE id = guest_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservations_check_in ON reservations(check_in);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_experiences_guest_id ON experiences(guest_id);
CREATE INDEX idx_experiences_date ON experiences(date);
CREATE INDEX idx_revenue_records_date ON revenue_records(date);
CREATE INDEX idx_guests_vip_tier ON guests(vip_tier);
CREATE INDEX idx_guests_email ON guests(email);

-- ============================================
-- SAMPLE DATA (optional - remove in production)
-- ============================================
INSERT INTO guests (first_name, last_name, email, phone, nationality, vip_tier, dietary_requirements, preferred_activities, total_stays, total_revenue, last_stay, discretion_level, notes, preferred_currency) VALUES
('James', 'Hartfield', 'james.hartfield@privatemail.com', '+1 (212) 555-0191', 'American', 'platinum', 'None', ARRAY['Yacht Charter', 'Fine Dining', 'Golf'], 8, 48500, '2024-12-15', 'maximum', 'Prefers Villa 01. Always requests Moet & Chandon on arrival. Very private — no photos, no social media mentions.', 'USD'),
('Sofia', 'Marchetti', 'sofia.marchetti@euromail.eu', '+39 02 555 0182', 'Italian', 'gold', 'Vegan', ARRAY['Spa Treatments', 'Yoga', 'Cultural Tours'], 3, 18200, '2025-01-22', 'high', 'Celebrates anniversary in June. Prefers essential oil treatments — no synthetic fragrances.', 'EUR'),
('Rajesh', 'Mehta', 'r.mehta@consulting.in', '+91 98765 43210', 'Indian', 'gold', 'Vegetarian, No alcohol', ARRAY['Deep Sea Fishing', 'Excursions'], 2, 11400, '2024-11-08', 'standard', 'Travels with executive assistant. Requires business-class private jet coordination.', 'USD'),
('Charlotte', 'Ashworth', 'cashworth@londonholdings.co.uk', '+44 20 7946 0892', 'British', 'silver', 'Gluten-free', ARRAY['Yoga', 'Wellness Journeys', 'Spa Treatments'], 1, 4200, '2025-02-14', 'standard', 'First visit. Came for wellness retreat. Very positive feedback on spa.', 'GBP');

INSERT INTO revenue_records (date, category, amount_usd, amount_local, currency, notes) VALUES
(CURRENT_DATE - INTERVAL '6 days', 'rooms', 4200, 4200, 'USD', 'Suite 03 & 07'),
(CURRENT_DATE - INTERVAL '6 days', 'spa', 580, 580, 'USD', 'Botanical massage x2'),
(CURRENT_DATE - INTERVAL '5 days', 'rooms', 6800, 6800, 'USD', 'Villa 01 + Suite 12'),
(CURRENT_DATE - INTERVAL '5 days', 'dining', 420, 420, 'USD', 'Private terrace dinner'),
(CURRENT_DATE - INTERVAL '4 days', 'rooms', 5200, 5200, 'USD', 'Suite 04 & 09'),
(CURRENT_DATE - INTERVAL '4 days', 'excursions', 1200, 1200, 'USD', 'Sunset yacht charter'),
(CURRENT_DATE - INTERVAL '3 days', 'rooms', 8900, 8900, 'USD', 'Grand Villa + Suite 05'),
(CURRENT_DATE - INTERVAL '3 days', 'spa', 760, 760, 'USD', 'Couples spa experience'),
(CURRENT_DATE - INTERVAL '2 days', 'rooms', 11200, 11200, 'USD', 'Villa 02 + 3 suites'),
(CURRENT_DATE - INTERVAL '2 days', 'dining', 890, 890, 'USD', 'Private chef event'),
(CURRENT_DATE - INTERVAL '1 day', 'rooms', 14500, 14500, 'USD', 'Full weekend occupancy'),
(CURRENT_DATE - INTERVAL '1 day', 'events', 8500, 8500, 'USD', 'Private anniversary dinner'),
(CURRENT_DATE, 'rooms', 12800, 12800, 'USD', 'Current occupancy'),
(CURRENT_DATE, 'spa', 920, 920, 'USD', 'Daily treatments');

-- ============================================
-- SCHEMA ADDITIONS v2 — run after initial setup
-- ============================================

-- Event tasks/checklist for coordination
CREATE TABLE IF NOT EXISTS event_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('venue','catering','florals','entertainment','logistics','accommodation','communications','other')),
  due_date DATE,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Vendors / Caribbean supplier directory
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('florist','caterer','entertainment','transport','yacht','spa_supplier','produce','wine_spirits','linen','av_tech','security','photography','other')),
  island TEXT DEFAULT 'Barbados' CHECK (island IN ('Barbados','Jamaica','Trinidad','Cayman Islands','Saint Lucia','Antigua','Grenada','Other')),
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  preferred BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  import_lead_days INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'BBD',
  notes TEXT,
  last_used DATE
);

-- Vendor orders / import tracking
CREATE TABLE IF NOT EXISTS vendor_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  order_date DATE NOT NULL,
  expected_arrival DATE,
  actual_arrival DATE,
  status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered','in_transit','customs','arrived','delivered','cancelled')),
  tracking_number TEXT,
  origin_island TEXT,
  notes TEXT
);

-- RLS for new tables
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON event_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON vendors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON vendor_orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_vendor_id ON vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_event_id ON vendor_orders(event_id);

-- Sample vendors
INSERT INTO vendors (name, category, island, contact_name, email, phone, preferred, rating, import_lead_days, currency, notes) VALUES
('Island Blooms Barbados', 'florist', 'Barbados', 'Maria Chen', 'maria@islandblooms.bb', '+1 246 555 0121', true, 5, 0, 'BBD', 'Premier floral supplier. Tropical arrangements, imported roses available with 5-day lead.'),
('Silver Moon Yachts', 'yacht', 'Barbados', 'Captain David Ross', 'charters@silvermoon.bb', '+1 246 555 0188', true, 5, 0, 'USD', 'Exclusive charter partner. Fleet of 3 vessels — 45ft, 60ft, 85ft. Captain Ross personally handles Coralea bookings.'),
('Bajan Produce Co.', 'produce', 'Barbados', 'Winston Clarke', 'orders@bajanproduce.bb', '+1 246 555 0155', true, 4, 1, 'BBD', 'Farm-to-table organic produce. Daily delivery. Specialty herbs grown on-site.'),
('Caribbean Fine Wines', 'wine_spirits', 'Barbados', 'Sophie Laurent', 'sophie@caribbeanwines.bb', '+1 246 555 0199', true, 5, 3, 'USD', 'Imported wines and premium spirits. Moët, Dom Pérignon, Opus One stocked. 3-day import for special orders.'),
('Blue Horizon AV', 'av_tech', 'Barbados', 'Marcus Williams', 'info@bluehorizonav.bb', '+1 246 555 0177', false, 4, 0, 'BBD', 'Audio/visual for events. LED walls, lighting rigs, outdoor cinema setup.'),
('Jamaica Exotic Florals', 'florist', 'Jamaica', 'Asha Reid', 'asha@jamaicaflorals.jm', '+1 876 555 0133', false, 4, 5, 'JMD', 'Exotic tropical imports — birds of paradise, anthuriums. 5-day inter-island freight required.') 
ON CONFLICT DO NOTHING;
