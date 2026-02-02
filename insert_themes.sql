-- Insert Theme Categories
INSERT INTO theme_categories (category_name) VALUES 
  ('Wedding'),
  ('Corporate'),
  ('Birthday'),
  ('Anniversary'),
  ('Graduation'),
  ('Retirement'),
  ('Engagement'),
  ('Promotion'),
  ('Holiday'),
  ('Themed Party')
ON CONFLICT (category_name) DO NOTHING;

-- Insert Decoration Styles
INSERT INTO decoration_styles (style_name) VALUES
  ('Minimalist'),
  ('Vintage'),
  ('Modern'),
  ('Rustic'),
  ('Glamorous'),
  ('Tropical'),
  ('Industrial'),
  ('Romantic'),
  ('Bohemian'),
  ('Art Deco')
ON CONFLICT (style_name) DO NOTHING;

-- Insert Lighting Styles
INSERT INTO lighting_styles (style_name) VALUES
  ('Warm White'),
  ('Cool White'),
  ('RGB LED'),
  ('Fairy Lights'),
  ('Neon'),
  ('Spotlights'),
  ('Ambient'),
  ('Strobe'),
  ('Candlelight Effect'),
  ('Natural Daylight')
ON CONFLICT (style_name) DO NOTHING;
