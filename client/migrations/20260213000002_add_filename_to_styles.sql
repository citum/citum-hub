-- Migration to add filename column to styles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='styles' AND COLUMN_NAME='filename') THEN
        ALTER TABLE styles ADD COLUMN filename TEXT UNIQUE;
    END IF;
END $$;
