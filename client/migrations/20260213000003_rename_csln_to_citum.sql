-- Migration to rename csln column to citum if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='styles' AND COLUMN_NAME='csln') THEN
        ALTER TABLE styles RENAME COLUMN csln TO citum;
    END IF;
END $$;
