-- Supabase Advisor fixes — security + performance.
--
-- Addresses lints surfaced by Security Advisor + Performance Advisor:
--   A. function_search_path_mutable on public.set_updated_at
--   B. public_bucket_allows_listing on product-images / try-on-images
--   C. admin_cancel_appointment unnecessarily exposed to anon role
--   G. auth_rls_initplan — re-evaluation of auth.uid() per row
--   H. multiple_permissive_policies for customers UPDATE (admin + self)
--   I. unindexed_foreign_keys on 4 FK columns
--
-- See PR notes for which lints were skipped on purpose
-- (by-design SECURITY DEFINER + EXECUTE perms on the rpc-based order/
--  appointment functions, and unused_index — those indexes will start
--  getting hit once volume picks up; see docs/scaling.md).

-- ─────────────────────────────────────────────────────────────────────────
-- A. Pin search_path on the trigger helper. Prevents a malicious user from
--    creating a same-named object in their schema and hijacking the lookup.
-- ─────────────────────────────────────────────────────────────────────────
alter function public.set_updated_at() set search_path = '';

-- ─────────────────────────────────────────────────────────────────────────
-- B. Drop broad "public read" policies on storage.objects for the two
--    public buckets. Public buckets serve files via direct URL without
--    consulting RLS, so the policy isn't needed for normal image display.
--    Its only effect today is enabling anonymous list() calls — we don't
--    use list() anywhere (verified via grep) and we don't want anonymous
--    enumeration of uploaded files.
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists "product images public read" on storage.objects;
drop policy if exists "try-on images public read" on storage.objects;

-- ─────────────────────────────────────────────────────────────────────────
-- C. Defense in depth — the admin-only RPC has an internal is_admin()
--    check that raises FORBIDDEN, but there's no reason for unauthenticated
--    clients to be able to invoke it at all. Authenticated stays granted
--    because admin users hit it via the authenticated role through
--    PostgREST. (service_role bypasses EXECUTE checks regardless.)
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.admin_cancel_appointment(uuid) from anon;

-- ─────────────────────────────────────────────────────────────────────────
-- G. RLS initplan optimization. Wrapping auth.uid() in a subquery lets
--    Postgres treat it as an initplan (evaluated once per query) instead
--    of recomputing per row. Same semantics, big win at scale.
--    See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ─────────────────────────────────────────────────────────────────────────

-- orders
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders for select
  using ((select auth.uid()) = user_id or is_admin());

-- order_items
drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select
  using (
    is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = (select auth.uid())
    )
  );

-- appointments
drop policy if exists appointments_owner_read on public.appointments;
create policy appointments_owner_read on public.appointments for select
  using ((select auth.uid()) = user_id or is_admin());

-- customers (self_read + self_update — self_update is replaced in H below)
drop policy if exists customers_self_read on public.customers;
create policy customers_self_read on public.customers for select
  using ((select auth.uid()) = id or is_admin());

-- wishlist_items (3 policies)
drop policy if exists wishlist_self_read on public.wishlist_items;
create policy wishlist_self_read on public.wishlist_items for select
  using ((select auth.uid()) = customer_id or is_admin());

drop policy if exists wishlist_self_insert on public.wishlist_items;
create policy wishlist_self_insert on public.wishlist_items for insert
  with check ((select auth.uid()) = customer_id);

drop policy if exists wishlist_self_delete on public.wishlist_items;
create policy wishlist_self_delete on public.wishlist_items for delete
  using ((select auth.uid()) = customer_id);

-- prescriptions
drop policy if exists prescriptions_owner_read on public.prescriptions;
create policy prescriptions_owner_read on public.prescriptions for select
  using ((select auth.uid()) = customer_id or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- H. customers had two permissive UPDATE policies (customers_self_update
--    for "I can edit my own row" and customers_admin_update for "admin can
--    edit any row"). Postgres OR's permissive policies, so combining them
--    into a single policy is semantically identical but eliminates the
--    multiple_permissive_policies warning and saves one policy check.
-- ─────────────────────────────────────────────────────────────────────────
drop policy if exists customers_self_update on public.customers;
drop policy if exists customers_admin_update on public.customers;
create policy customers_update on public.customers for update
  using ((select auth.uid()) = id or is_admin())
  with check ((select auth.uid()) = id or is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- I. Covering indexes for foreign keys. Without these, deletes / updates
--    on the referenced parent table take a seq scan to find FK references.
--    Cheap to add, only relevant for write paths.
-- ─────────────────────────────────────────────────────────────────────────
create index if not exists appointments_frame_product_id_idx
  on public.appointments(frame_product_id);

create index if not exists marketing_campaigns_created_by_idx
  on public.marketing_campaigns(created_by);

create index if not exists order_items_product_id_idx
  on public.order_items(product_id);

create index if not exists wishlist_items_product_id_idx
  on public.wishlist_items(product_id);
