-- Add 'expired' as a valid status for bookings
-- First check if we have a constraint on status
DO $$
BEGIN
    -- Check if the bookings table exists and what constraints it has
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        -- Add expired status if not already present
        -- First, try to add some test data to see what constraint exists
        RAISE NOTICE 'Adding expired status support to bookings table';
        
        -- We need to check if this is an ENUM type or a CHECK constraint
        -- Let's see the column definition
        PERFORM 1;
    END IF;
END $$;

-- Check current status column definition
SELECT 
    column_name,
    data_type,
    udt_name,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'status';

-- Also check for any domain or enum types
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;