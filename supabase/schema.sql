


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "dashboard";


ALTER SCHEMA "dashboard" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "google";


ALTER SCHEMA "google" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "import";


ALTER SCHEMA "import" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "jibble";


ALTER SCHEMA "jibble" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "neon_auth";


ALTER SCHEMA "neon_auth" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "quickbooks";


ALTER SCHEMA "quickbooks" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "dashboard"."employee_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'dispatcher',
    'office',
    'technician',
    'contractor',
    'other'
);


ALTER TYPE "dashboard"."employee_role" OWNER TO "postgres";


CREATE TYPE "google"."assignment_status" AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "google"."assignment_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_context"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'admin_role')::text, true);
END;
$$;


ALTER FUNCTION "public"."set_admin_context"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_service_role_context"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', '{"role": "service_role"}', true);
END;
$$;


ALTER FUNCTION "public"."set_service_role_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_context"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
END;
$$;


ALTER FUNCTION "public"."set_user_context"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_last_updated"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_last_updated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "quickbooks"."qbo_rotate_token"("p_realm_id" "text", "p_access_token" "text", "p_refresh_token" "text", "p_scope" "text", "p_expires_at" timestamp with time zone, "p_refresh_token_expires_at" timestamp with time zone, "p_environment" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'quickbooks', 'public'
    AS $$
declare
  v_msg text;
begin
  -- Deactivate old active tokens for this realm/environment
  update quickbooks.tokens
  set is_active = false, last_updated = now()
  where realm_id = p_realm_id
    and environment = p_environment
    and is_active = true;

  -- Insert new active token
  insert into quickbooks.tokens (
    realm_id, access_token, refresh_token, scope,
    expires_at, refresh_token_expires_at, environment,
    is_active, created_at, last_updated
  )
  values (
    p_realm_id, p_access_token, p_refresh_token, p_scope,
    p_expires_at, p_refresh_token_expires_at, p_environment,
    true, now(), now()
  );

  -- Log the rotation
  v_msg := format('Refreshed token for realm %s at %s', p_realm_id, now());
  insert into quickbooks.token_audit (realm_id, action, message)
  values (p_realm_id, 'refresh', v_msg);

  return v_msg;

exception
  when others then
    insert into quickbooks.token_audit (realm_id, action, message)
    values (p_realm_id, 'error', sqlerrm);
    raise;
end;
$$;


ALTER FUNCTION "quickbooks"."qbo_rotate_token"("p_realm_id" "text", "p_access_token" "text", "p_refresh_token" "text", "p_scope" "text", "p_expires_at" timestamp with time zone, "p_refresh_token_expires_at" timestamp with time zone, "p_environment" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "dashboard"."auth_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_user_id" "text" NOT NULL,
    "email" character varying(320),
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "scope" "text",
    "token_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dashboard"."auth_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dashboard"."auth_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dashboard"."auth_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dashboard"."auth_verification_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" character varying(320) NOT NULL,
    "token" "text" NOT NULL,
    "type" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dashboard"."auth_verification_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dashboard"."logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "message" "text",
    "user_id" "uuid",
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dashboard"."logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dashboard"."time_clock_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "clock_in" timestamp with time zone NOT NULL,
    "clock_out" timestamp with time zone,
    "lunch_start" timestamp with time zone,
    "lunch_end" timestamp with time zone,
    "total_hours" numeric(10,2),
    "suspicious" boolean DEFAULT false NOT NULL,
    "employee_note" "text",
    "last_edited_at" timestamp with time zone,
    "last_edited_by" "uuid",
    "approved_by_admin" boolean DEFAULT false NOT NULL,
    "approved_by_payroll" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dashboard"."time_clock_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "dashboard"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text",
    "mobile_phone" "text",
    "home_phone" "text",
    "email" character varying(320) NOT NULL,
    "username" character varying(100),
    "password_hash" "text",
    "role" "dashboard"."employee_role" DEFAULT 'technician'::"dashboard"."employee_role" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "on_leave" boolean DEFAULT false NOT NULL,
    "hours_worked_this_week" numeric(10,2) DEFAULT 0 NOT NULL,
    "hours_worked_last_week" numeric(10,2) DEFAULT 0 NOT NULL,
    "pay_rate" numeric(10,2),
    "admin_notes" "text",
    "employee_notes" "text",
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "dashboard"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "google"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "google_event_id" "text" NOT NULL,
    "calendar_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false NOT NULL,
    "status" "text",
    "qbo_customer_id" "text",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "google"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "google"."calendars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "calendar_id" "text" NOT NULL,
    "summary" "text",
    "description" "text",
    "time_zone" "text",
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "google"."calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "google"."employee_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "available" boolean DEFAULT true NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "google"."employee_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "google"."work_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calendar_event_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sequence_order" integer,
    "status" "google"."assignment_status" DEFAULT 'assigned'::"google"."assignment_status" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "admin_notes" "text",
    "employee_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "google"."work_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jibble"."time_punches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text",
    "timesheet_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "punch_type" "text" NOT NULL,
    "punched_at" timestamp with time zone NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "jibble"."time_punches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jibble"."timesheets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "external_id" "text",
    "user_id" "uuid" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "total_hours" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "jibble"."timesheets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "neon_auth"."users_sync" (
    "raw_json" "jsonb" NOT NULL,
    "id" "text" NOT NULL,
    "name" "text",
    "email" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "neon_auth"."users_sync" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_user_id" "text" NOT NULL,
    "email" "public"."citext",
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp with time zone,
    "scope" "text",
    "token_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."auth_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_token" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."auth_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_verification_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "public"."citext" NOT NULL,
    "token" "text" NOT NULL,
    "type" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "consumed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."auth_verification_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kv_store_d9b518ae" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);


ALTER TABLE "public"."kv_store_d9b518ae" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."time_clock_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "clock_in" timestamp with time zone NOT NULL,
    "clock_out" timestamp with time zone,
    "lunch_start" timestamp with time zone,
    "lunch_end" timestamp with time zone,
    "total_hours" numeric(10,2),
    "suspicious" boolean DEFAULT false NOT NULL,
    "employee_note" "text",
    "last_edited_at" timestamp with time zone,
    "last_edited_by" "uuid",
    "approved_by_admin" boolean DEFAULT false NOT NULL,
    "approved_by_payroll" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."time_clock_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission" "text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "country" "text",
    "mobile_phone" "text",
    "home_phone" "text",
    "email" "public"."citext" NOT NULL,
    "username" "public"."citext",
    "password_hash" "text",
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "on_leave" boolean DEFAULT false NOT NULL,
    "hours_worked_this_week" numeric(10,2) DEFAULT 0 NOT NULL,
    "hours_worked_last_week" numeric(10,2) DEFAULT 0 NOT NULL,
    "pay_rate" numeric(10,2),
    "admin_notes" "text",
    "employee_notes" "text",
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "google_id" character varying(255),
    "profile_picture" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."companies" (
    "realm_id" "text" NOT NULL,
    "name" "text",
    "country" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."customers" (
    "id" "text" NOT NULL,
    "realm_id" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "given_name" "text",
    "family_name" "text",
    "company_name" "text",
    "primary_email_addr" "text",
    "mobile_phone" "text",
    "primary_phone" "text",
    "alternate_phone" "text",
    "fax" "text",
    "website" "text",
    "bill_line1" "text",
    "bill_line2" "text",
    "bill_city" "text",
    "bill_state" "text",
    "bill_postal_code" "text",
    "bill_country" "text",
    "ship_line1" "text",
    "ship_line2" "text",
    "ship_city" "text",
    "ship_state" "text",
    "ship_postal_code" "text",
    "ship_country" "text",
    "taxable" boolean,
    "balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "sync_token" "text",
    "metadata" "jsonb",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."estimates" (
    "id" "text" NOT NULL,
    "realm_id" "text" NOT NULL,
    "doc_number" "text",
    "txn_date" "date",
    "expiration_date" "date",
    "total_amt" numeric(14,2) DEFAULT 0 NOT NULL,
    "status" "text",
    "customer_id" "text",
    "customer_ref_name" "text",
    "email_status" "text",
    "print_status" "text",
    "currency_ref" "text",
    "exchange_rate" numeric(14,6),
    "bill_line1" "text",
    "bill_line2" "text",
    "bill_city" "text",
    "bill_state" "text",
    "bill_postal_code" "text",
    "bill_country" "text",
    "ship_line1" "text",
    "ship_line2" "text",
    "ship_city" "text",
    "ship_state" "text",
    "ship_postal_code" "text",
    "ship_country" "text",
    "private_note" "text",
    "memo" "text",
    "sync_token" "text",
    "metadata_create_time" timestamp with time zone,
    "metadata_last_updated_time" timestamp with time zone,
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "txn_tax_detail" "jsonb",
    "linked_txn" "jsonb"
);


ALTER TABLE "quickbooks"."estimates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."estimates_line_items" (
    "id" bigint NOT NULL,
    "estimate_id" "text" NOT NULL,
    "line_num" integer,
    "detail_type" "text",
    "item_ref_id" "text",
    "item_ref_name" "text",
    "description" "text",
    "service_date" "date",
    "qty" numeric(14,4),
    "unit_price" numeric(14,6),
    "amount" numeric(14,2),
    "tax_code_ref_id" "text",
    "tax_code_ref_name" "text",
    "class_ref_id" "text",
    "class_ref_name" "text",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."estimates_line_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "quickbooks"."estimates_line_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "quickbooks"."estimates_line_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "quickbooks"."estimates_line_items_id_seq" OWNED BY "quickbooks"."estimates_line_items"."id";



CREATE TABLE IF NOT EXISTS "quickbooks"."invoices" (
    "id" "text" NOT NULL,
    "realm_id" "text" NOT NULL,
    "doc_number" "text",
    "txn_date" "date",
    "due_date" "date",
    "customer_id" "text",
    "customer_ref_name" "text",
    "total_amt" numeric(14,2) DEFAULT 0 NOT NULL,
    "balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "currency_ref" "text",
    "exchange_rate" numeric(14,6),
    "bill_line1" "text",
    "bill_line2" "text",
    "bill_city" "text",
    "bill_state" "text",
    "bill_postal_code" "text",
    "bill_country" "text",
    "ship_line1" "text",
    "ship_line2" "text",
    "ship_city" "text",
    "ship_state" "text",
    "ship_postal_code" "text",
    "ship_country" "text",
    "email_status" "text",
    "print_status" "text",
    "private_note" "text",
    "memo" "text",
    "status" "text",
    "sync_token" "text",
    "metadata_create_time" timestamp with time zone,
    "metadata_last_updated_time" timestamp with time zone,
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "txn_tax_detail" "jsonb",
    "linked_txn" "jsonb"
);


ALTER TABLE "quickbooks"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."invoices_line_items" (
    "id" bigint NOT NULL,
    "invoice_id" "text" NOT NULL,
    "line_num" integer,
    "detail_type" "text",
    "item_ref_id" "text",
    "item_ref_name" "text",
    "description" "text",
    "service_date" "date",
    "qty" numeric(14,4),
    "unit_price" numeric(14,6),
    "amount" numeric(14,2),
    "tax_code_ref_id" "text",
    "tax_code_ref_name" "text",
    "class_ref_id" "text",
    "class_ref_name" "text",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."invoices_line_items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "quickbooks"."invoices_line_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "quickbooks"."invoices_line_items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "quickbooks"."invoices_line_items_id_seq" OWNED BY "quickbooks"."invoices_line_items"."id";



CREATE TABLE IF NOT EXISTS "quickbooks"."items" (
    "id" "text" NOT NULL,
    "realm_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text",
    "description" "text",
    "type" "text",
    "active" boolean DEFAULT true NOT NULL,
    "taxable" boolean,
    "unit_price" numeric(14,2),
    "sales_price" numeric(14,2),
    "qty_on_hand" numeric(18,4),
    "income_account_ref_id" "text",
    "expense_account_ref_id" "text",
    "asset_account_ref_id" "text",
    "sync_token" "text",
    "metadata" "jsonb",
    "last_synced" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL,
    "track_qty_on_hand" boolean,
    "inv_start_date" "date"
);


ALTER TABLE "quickbooks"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."jobs" (
    "id" "text" NOT NULL,
    "request_id" "text" NOT NULL,
    "company_id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "payload" "text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "error" "text",
    "scheduled_for" timestamp without time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."sync_state" (
    "tenant_id" "text" NOT NULL,
    "last_full_at" timestamp without time zone,
    "last_cdc_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp without time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."sync_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."tenants" (
    "id" "text" NOT NULL,
    "realm_id" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "quickbooks"."token_audit" (
    "id" bigint NOT NULL,
    "realm_id" "text" NOT NULL,
    "action" "text" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "quickbooks"."token_audit" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "quickbooks"."token_audit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "quickbooks"."token_audit_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "quickbooks"."token_audit_id_seq" OWNED BY "quickbooks"."token_audit"."id";



CREATE TABLE IF NOT EXISTS "quickbooks"."tokens" (
    "id" bigint NOT NULL,
    "realm_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text" NOT NULL,
    "token_type" "text",
    "scope" "text" DEFAULT ''::"text",
    "expires_at" timestamp with time zone,
    "refresh_token_expires_at" timestamp with time zone,
    "environment" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."tokens" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "quickbooks"."tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "quickbooks"."tokens_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "quickbooks"."tokens_id_seq" OWNED BY "quickbooks"."tokens"."id";



CREATE TABLE IF NOT EXISTS "quickbooks"."webhook_events" (
    "id" bigint NOT NULL,
    "realm_id" "text",
    "entity_name" "text",
    "entity_id" "text",
    "action" "text",
    "payload" "jsonb",
    "processed" boolean DEFAULT false NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "quickbooks"."webhook_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "quickbooks"."webhook_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "quickbooks"."webhook_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "quickbooks"."webhook_events_id_seq" OWNED BY "quickbooks"."webhook_events"."id";



ALTER TABLE ONLY "quickbooks"."estimates_line_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"quickbooks"."estimates_line_items_id_seq"'::"regclass");



ALTER TABLE ONLY "quickbooks"."invoices_line_items" ALTER COLUMN "id" SET DEFAULT "nextval"('"quickbooks"."invoices_line_items_id_seq"'::"regclass");



ALTER TABLE ONLY "quickbooks"."token_audit" ALTER COLUMN "id" SET DEFAULT "nextval"('"quickbooks"."token_audit_id_seq"'::"regclass");



ALTER TABLE ONLY "quickbooks"."tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"quickbooks"."tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "quickbooks"."webhook_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"quickbooks"."webhook_events_id_seq"'::"regclass");



ALTER TABLE ONLY "dashboard"."auth_providers"
    ADD CONSTRAINT "auth_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dashboard"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dashboard"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "dashboard"."auth_verification_tokens"
    ADD CONSTRAINT "auth_verification_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dashboard"."auth_verification_tokens"
    ADD CONSTRAINT "auth_verification_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "dashboard"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dashboard"."time_clock_entries"
    ADD CONSTRAINT "time_clock_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dashboard"."auth_providers"
    ADD CONSTRAINT "uq_provider_identity" UNIQUE ("provider", "provider_user_id");



ALTER TABLE ONLY "dashboard"."auth_providers"
    ADD CONSTRAINT "uq_user_provider" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "dashboard"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "dashboard"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "dashboard"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "google"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "google"."calendars"
    ADD CONSTRAINT "calendars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "google"."employee_availability"
    ADD CONSTRAINT "employee_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "google"."work_assignments"
    ADD CONSTRAINT "uq_event_employee" UNIQUE ("calendar_event_id", "employee_id");



ALTER TABLE ONLY "google"."calendars"
    ADD CONSTRAINT "uq_google_calendar" UNIQUE ("user_id", "calendar_id");



ALTER TABLE ONLY "google"."calendar_events"
    ADD CONSTRAINT "uq_google_event" UNIQUE ("google_event_id");



ALTER TABLE ONLY "google"."work_assignments"
    ADD CONSTRAINT "work_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jibble"."time_punches"
    ADD CONSTRAINT "time_punches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jibble"."timesheets"
    ADD CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_providers"
    ADD CONSTRAINT "auth_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."auth_verification_tokens"
    ADD CONSTRAINT "auth_verification_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_verification_tokens"
    ADD CONSTRAINT "auth_verification_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."kv_store_d9b518ae"
    ADD CONSTRAINT "kv_store_d9b518ae_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."time_clock_entries"
    ADD CONSTRAINT "time_clock_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_providers"
    ADD CONSTRAINT "uq_provider_identity" UNIQUE ("provider", "provider_user_id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "uq_user_permission" UNIQUE ("user_id", "permission");



ALTER TABLE ONLY "public"."auth_providers"
    ADD CONSTRAINT "uq_user_provider" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_google_id_key" UNIQUE ("google_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "quickbooks"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("realm_id");



ALTER TABLE ONLY "quickbooks"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."estimates_line_items"
    ADD CONSTRAINT "estimates_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."estimates"
    ADD CONSTRAINT "estimates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."invoices_line_items"
    ADD CONSTRAINT "invoices_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."sync_state"
    ADD CONSTRAINT "sync_state_pkey" PRIMARY KEY ("tenant_id");



ALTER TABLE ONLY "quickbooks"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."tenants"
    ADD CONSTRAINT "tenants_realm_id_key" UNIQUE ("realm_id");



ALTER TABLE ONLY "quickbooks"."token_audit"
    ADD CONSTRAINT "token_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."tokens"
    ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "quickbooks"."estimates_line_items"
    ADD CONSTRAINT "uq_estimate_line" UNIQUE ("estimate_id", "line_num", "item_ref_id");



ALTER TABLE ONLY "quickbooks"."invoices_line_items"
    ADD CONSTRAINT "uq_invoice_line" UNIQUE ("invoice_id", "line_num", "item_ref_id");



ALTER TABLE ONLY "quickbooks"."jobs"
    ADD CONSTRAINT "uq_job_when" UNIQUE ("company_id", "type", "scheduled_for");



ALTER TABLE ONLY "quickbooks"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_logs_event_created" ON "dashboard"."logs" USING "btree" ("event_type", "created_at");



CREATE INDEX "idx_time_clock_payroll" ON "dashboard"."time_clock_entries" USING "btree" ("approved_by_payroll");



CREATE INDEX "idx_time_clock_user_in" ON "dashboard"."time_clock_entries" USING "btree" ("user_id", "clock_in");



CREATE INDEX "idx_assignments_employee" ON "google"."work_assignments" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_availability_range" ON "google"."employee_availability" USING "btree" ("employee_id", "start_time", "end_time");



CREATE INDEX "idx_google_calendars_user" ON "google"."calendars" USING "btree" ("user_id");



CREATE INDEX "idx_google_events_calendar" ON "google"."calendar_events" USING "btree" ("calendar_id");



CREATE INDEX "idx_google_events_time" ON "google"."calendar_events" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_work_assignments_employee" ON "google"."work_assignments" USING "btree" ("employee_id");



CREATE INDEX "idx_auth_providers_user" ON "public"."auth_providers" USING "btree" ("user_id");



CREATE INDEX "idx_auth_sessions_user" ON "public"."auth_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_auth_sessions_user_id" ON "public"."auth_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_time_clock_entries_user_id" ON "public"."time_clock_entries" USING "btree" ("user_id");



CREATE INDEX "idx_time_clock_payroll" ON "public"."time_clock_entries" USING "btree" ("approved_by_payroll");



CREATE INDEX "idx_time_clock_user_date" ON "public"."time_clock_entries" USING "btree" ("user_id", "clock_in");



CREATE INDEX "idx_user_permissions_user" ON "public"."user_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_user_permissions_user_id" ON "public"."user_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_users_auth_uid" ON "public"."users" USING "btree" ("id") WHERE ("id" IS NOT NULL);



CREATE INDEX "idx_users_google_id" ON "public"."users" USING "btree" ("google_id");



CREATE INDEX "idx_verification_email_type" ON "public"."auth_verification_tokens" USING "btree" ("email", "type");



CREATE INDEX "kv_store_d9b518ae_key_idx" ON "public"."kv_store_d9b518ae" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_d9b518ae_key_idx1" ON "public"."kv_store_d9b518ae" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_d9b518ae_key_idx2" ON "public"."kv_store_d9b518ae" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_d9b518ae_key_idx3" ON "public"."kv_store_d9b518ae" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "idx_customers_display_name" ON "quickbooks"."customers" USING "btree" ("display_name");



CREATE INDEX "idx_invoices_doc_number" ON "quickbooks"."invoices" USING "btree" ("doc_number");



CREATE INDEX "idx_qb_customers_email" ON "quickbooks"."customers" USING "btree" ("primary_email_addr");



CREATE INDEX "idx_qb_customers_name" ON "quickbooks"."customers" USING "btree" ("display_name");



CREATE INDEX "idx_qb_customers_realm" ON "quickbooks"."customers" USING "btree" ("realm_id");



CREATE INDEX "idx_qb_estimate_lines_estimate" ON "quickbooks"."estimates_line_items" USING "btree" ("estimate_id");



CREATE INDEX "idx_qb_estimate_lines_item" ON "quickbooks"."estimates_line_items" USING "btree" ("item_ref_id");



CREATE INDEX "idx_qb_estimates_customer" ON "quickbooks"."estimates" USING "btree" ("customer_id");



CREATE INDEX "idx_qb_estimates_doc_number" ON "quickbooks"."estimates" USING "btree" ("doc_number");



CREATE INDEX "idx_qb_estimates_realm" ON "quickbooks"."estimates" USING "btree" ("realm_id");



CREATE INDEX "idx_qb_estimates_txn_date" ON "quickbooks"."estimates" USING "btree" ("txn_date");



CREATE INDEX "idx_qb_invoice_lines_invoice" ON "quickbooks"."invoices_line_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_qb_invoice_lines_item" ON "quickbooks"."invoices_line_items" USING "btree" ("item_ref_id");



CREATE INDEX "idx_qb_invoices_customer" ON "quickbooks"."invoices" USING "btree" ("customer_id");



CREATE INDEX "idx_qb_invoices_customer_date" ON "quickbooks"."invoices" USING "btree" ("customer_id", "txn_date");



CREATE INDEX "idx_qb_invoices_doc_number" ON "quickbooks"."invoices" USING "btree" ("doc_number");



CREATE INDEX "idx_qb_invoices_realm" ON "quickbooks"."invoices" USING "btree" ("realm_id");



CREATE INDEX "idx_qb_invoices_txn_date" ON "quickbooks"."invoices" USING "btree" ("txn_date");



CREATE INDEX "idx_qb_items_name" ON "quickbooks"."items" USING "btree" ("name");



CREATE INDEX "idx_qb_items_realm" ON "quickbooks"."items" USING "btree" ("realm_id");



CREATE INDEX "idx_qb_items_sku" ON "quickbooks"."items" USING "btree" ("sku");



CREATE INDEX "idx_qb_tokens_realm_active" ON "quickbooks"."tokens" USING "btree" ("realm_id", "is_active");



CREATE INDEX "idx_qb_webhooks_processed" ON "quickbooks"."webhook_events" USING "btree" ("processed", "entity_name");



CREATE OR REPLACE TRIGGER "trg_google_calendar_events_last_updated" BEFORE UPDATE ON "google"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_google_calendars_last_updated" BEFORE UPDATE ON "google"."calendars" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_google_employee_availability_last_updated" BEFORE UPDATE ON "google"."employee_availability" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_google_work_assignments_last_updated" BEFORE UPDATE ON "google"."work_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_auth_providers_last_updated" BEFORE UPDATE ON "public"."auth_providers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_auth_sessions_last_updated" BEFORE UPDATE ON "public"."auth_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_auth_verification_tokens_last_updated" BEFORE UPDATE ON "public"."auth_verification_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_time_clock_entries_last_updated" BEFORE UPDATE ON "public"."time_clock_entries" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_user_permissions_last_updated" BEFORE UPDATE ON "public"."user_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_users_last_updated" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_companies_last_updated" BEFORE UPDATE ON "quickbooks"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_customers_last_updated" BEFORE UPDATE ON "quickbooks"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_estimate_lines_last_updated" BEFORE UPDATE ON "quickbooks"."estimates_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_estimates_last_updated" BEFORE UPDATE ON "quickbooks"."estimates" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_invoice_lines_last_updated" BEFORE UPDATE ON "quickbooks"."invoices_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_invoices_last_updated" BEFORE UPDATE ON "quickbooks"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_items_last_updated" BEFORE UPDATE ON "quickbooks"."items" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_tokens_last_updated" BEFORE UPDATE ON "quickbooks"."tokens" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



CREATE OR REPLACE TRIGGER "trg_qb_webhook_events_last_updated" BEFORE UPDATE ON "quickbooks"."webhook_events" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_last_updated"();



ALTER TABLE ONLY "dashboard"."auth_providers"
    ADD CONSTRAINT "auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "dashboard"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "dashboard"."auth_verification_tokens"
    ADD CONSTRAINT "auth_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "dashboard"."logs"
    ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "dashboard"."time_clock_entries"
    ADD CONSTRAINT "time_clock_entries_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "dashboard"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "dashboard"."time_clock_entries"
    ADD CONSTRAINT "time_clock_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "google"."calendar_events"
    ADD CONSTRAINT "calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "google"."calendars"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "google"."calendar_events"
    ADD CONSTRAINT "calendar_events_qbo_customer_id_fkey" FOREIGN KEY ("qbo_customer_id") REFERENCES "quickbooks"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "google"."calendars"
    ADD CONSTRAINT "calendars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "google"."employee_availability"
    ADD CONSTRAINT "employee_availability_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "google"."work_assignments"
    ADD CONSTRAINT "work_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "dashboard"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "google"."work_assignments"
    ADD CONSTRAINT "work_assignments_calendar_event_id_fkey" FOREIGN KEY ("calendar_event_id") REFERENCES "google"."calendar_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "google"."work_assignments"
    ADD CONSTRAINT "work_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jibble"."time_punches"
    ADD CONSTRAINT "time_punches_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "jibble"."timesheets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jibble"."time_punches"
    ADD CONSTRAINT "time_punches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jibble"."timesheets"
    ADD CONSTRAINT "timesheets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dashboard"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_providers"
    ADD CONSTRAINT "auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_sessions"
    ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_verification_tokens"
    ADD CONSTRAINT "auth_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."time_clock_entries"
    ADD CONSTRAINT "time_clock_entries_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."time_clock_entries"
    ADD CONSTRAINT "time_clock_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."customers"
    ADD CONSTRAINT "customers_realm_id_fkey" FOREIGN KEY ("realm_id") REFERENCES "quickbooks"."companies"("realm_id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."estimates"
    ADD CONSTRAINT "estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "quickbooks"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "quickbooks"."estimates_line_items"
    ADD CONSTRAINT "estimates_line_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "quickbooks"."estimates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."estimates_line_items"
    ADD CONSTRAINT "estimates_line_items_item_ref_id_fkey" FOREIGN KEY ("item_ref_id") REFERENCES "quickbooks"."items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "quickbooks"."estimates"
    ADD CONSTRAINT "estimates_realm_id_fkey" FOREIGN KEY ("realm_id") REFERENCES "quickbooks"."companies"("realm_id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."invoices"
    ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "quickbooks"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "quickbooks"."invoices_line_items"
    ADD CONSTRAINT "invoices_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "quickbooks"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."invoices_line_items"
    ADD CONSTRAINT "invoices_line_items_item_ref_id_fkey" FOREIGN KEY ("item_ref_id") REFERENCES "quickbooks"."items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "quickbooks"."invoices"
    ADD CONSTRAINT "invoices_realm_id_fkey" FOREIGN KEY ("realm_id") REFERENCES "quickbooks"."companies"("realm_id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."items"
    ADD CONSTRAINT "items_realm_id_fkey" FOREIGN KEY ("realm_id") REFERENCES "quickbooks"."companies"("realm_id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."tokens"
    ADD CONSTRAINT "tokens_realm_id_fkey" FOREIGN KEY ("realm_id") REFERENCES "quickbooks"."companies"("realm_id") ON DELETE CASCADE;



ALTER TABLE ONLY "quickbooks"."webhook_events"
    ADD CONSTRAINT "webhook_events_realm_id_fkey" FOREIGN KEY ("realm_id") REFERENCES "quickbooks"."companies"("realm_id") ON DELETE SET NULL;



CREATE POLICY "Admin role can manage all permissions" ON "public"."user_permissions" USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can view all time entries" ON "public"."time_clock_entries" FOR SELECT USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can view all users" ON "public"."users" FOR SELECT USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Service role full access to auth providers" ON "public"."auth_providers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to kv store" ON "public"."kv_store_d9b518ae" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to permissions" ON "public"."user_permissions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to sessions" ON "public"."auth_sessions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to time entries" ON "public"."time_clock_entries" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to users" ON "public"."users" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to verification tokens" ON "public"."auth_verification_tokens" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create own time entries" ON "public"."time_clock_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own sessions" ON "public"."auth_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can update own time entries" ON "public"."time_clock_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own permissions" ON "public"."user_permissions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can view own sessions" ON "public"."auth_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own time entries" ON "public"."time_clock_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."auth_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_verification_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kv_store_d9b518ae" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_clock_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admin role can manage customers" ON "quickbooks"."customers" USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can manage estimates" ON "quickbooks"."estimates" USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can manage invoices" ON "quickbooks"."invoices" USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can manage items" ON "quickbooks"."items" USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can manage tenants" ON "quickbooks"."tenants" USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can read sync state" ON "quickbooks"."sync_state" FOR SELECT USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can read token audit" ON "quickbooks"."token_audit" FOR SELECT USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Admin role can read webhook events" ON "quickbooks"."webhook_events" FOR SELECT USING (("auth"."role"() = 'admin_role'::"text"));



CREATE POLICY "Authenticated users can read QB data" ON "quickbooks"."customers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read QB data" ON "quickbooks"."estimates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read QB data" ON "quickbooks"."invoices" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read QB data" ON "quickbooks"."items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read companies" ON "quickbooks"."companies" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read customers" ON "quickbooks"."customers" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read estimate line items" ON "quickbooks"."estimates_line_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read estimates" ON "quickbooks"."estimates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read invoice line items" ON "quickbooks"."invoices_line_items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read invoices" ON "quickbooks"."invoices" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read items" ON "quickbooks"."items" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read jobs" ON "quickbooks"."jobs" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Service role full access" ON "quickbooks"."customers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "quickbooks"."estimates" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "quickbooks"."invoices" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "quickbooks"."items" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to companies" ON "quickbooks"."companies" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to customers" ON "quickbooks"."customers" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to estimate line items" ON "quickbooks"."estimates_line_items" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to estimates" ON "quickbooks"."estimates" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to invoice line items" ON "quickbooks"."invoices_line_items" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to invoices" ON "quickbooks"."invoices" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to items" ON "quickbooks"."items" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to jobs" ON "quickbooks"."jobs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to sync state" ON "quickbooks"."sync_state" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to tenants" ON "quickbooks"."tenants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to token audit" ON "quickbooks"."token_audit" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access to webhook events" ON "quickbooks"."webhook_events" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role only access to tokens" ON "quickbooks"."tokens" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "quickbooks"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."estimates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."estimates_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."invoices_line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."sync_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."token_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "quickbooks"."webhook_events" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "quickbooks"."tokens";






GRANT USAGE ON SCHEMA "dashboard" TO "service_role";
GRANT USAGE ON SCHEMA "dashboard" TO "authenticated";
GRANT USAGE ON SCHEMA "dashboard" TO "admin_role";
GRANT USAGE ON SCHEMA "dashboard" TO "employee_role";



GRANT USAGE ON SCHEMA "google" TO "service_role";
GRANT USAGE ON SCHEMA "google" TO "authenticated";
GRANT USAGE ON SCHEMA "google" TO "admin_role";
GRANT USAGE ON SCHEMA "google" TO "employee_role";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "admin_role";
GRANT USAGE ON SCHEMA "public" TO "employee_role";



GRANT USAGE ON SCHEMA "quickbooks" TO "service_role";
GRANT USAGE ON SCHEMA "quickbooks" TO "authenticated";
GRANT USAGE ON SCHEMA "quickbooks" TO "admin_role";
GRANT USAGE ON SCHEMA "quickbooks" TO "employee_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_admin_context"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_admin_context"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_admin_context"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_service_role_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_service_role_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_service_role_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_context"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_context"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_context"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_last_updated"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_last_updated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_last_updated"() TO "service_role";



GRANT ALL ON FUNCTION "quickbooks"."qbo_rotate_token"("p_realm_id" "text", "p_access_token" "text", "p_refresh_token" "text", "p_scope" "text", "p_expires_at" timestamp with time zone, "p_refresh_token_expires_at" timestamp with time zone, "p_environment" "text") TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";















GRANT ALL ON TABLE "public"."auth_providers" TO "anon";
GRANT ALL ON TABLE "public"."auth_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_providers" TO "service_role";



GRANT ALL ON TABLE "public"."auth_sessions" TO "anon";
GRANT ALL ON TABLE "public"."auth_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."auth_verification_tokens" TO "anon";
GRANT ALL ON TABLE "public"."auth_verification_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_verification_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."kv_store_d9b518ae" TO "anon";
GRANT ALL ON TABLE "public"."kv_store_d9b518ae" TO "authenticated";
GRANT ALL ON TABLE "public"."kv_store_d9b518ae" TO "service_role";



GRANT ALL ON TABLE "public"."time_clock_entries" TO "anon";
GRANT ALL ON TABLE "public"."time_clock_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."time_clock_entries" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."companies" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."customers" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."estimates" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."estimates_line_items" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."invoices" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."invoices_line_items" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."items" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."jobs" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."sync_state" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."tenants" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."token_audit" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."tokens" TO "service_role";



GRANT ALL ON TABLE "quickbooks"."webhook_events" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "quickbooks" GRANT ALL ON TABLES TO "service_role";




























RESET ALL;
