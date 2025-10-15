-- Add role column to public.users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'employee_role';

-- Update existing admin users to have admin_role
UPDATE "public"."users" 
SET "role" = 'admin_role' 
WHERE "is_admin" = true;

-- Update existing non-admin users to have employee_role
UPDATE "public"."users" 
SET "role" = 'employee_role' 
WHERE "is_admin" = false OR "is_admin" IS NULL;

-- Add constraint to ensure role is one of the valid values
ALTER TABLE "public"."users" 
ADD CONSTRAINT "users_role_check" 
CHECK ("role" IN ('admin_role', 'employee_role', 'authenticated'));
