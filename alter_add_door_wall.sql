-- ALTER script to add door wall column and enum to existing EventScape database
-- Run this script if you've already created the main schema but need to add the wall column

-- Step 1: Create the door_wall_enum type
CREATE TYPE door_wall_enum AS ENUM ('Top', 'Bottom', 'Left', 'Right');

-- Step 2: Add the wall column to venue_doors table
ALTER TABLE venue_doors
ADD COLUMN wall door_wall_enum NOT NULL DEFAULT 'Left';

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'venue_doors' AND column_name = 'wall';
