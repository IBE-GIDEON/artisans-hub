-- Staff helpers are only meaningful for signed-in users.
revoke execute on function public.is_staff(), public.is_owner() from public, anon;
grant execute on function public.is_staff(), public.is_owner() to authenticated;

-- Order lookup requires the full phone number, not just the last 4 digits.
drop function public.find_order(text, text);
create function public.find_order(order_ref text, phone text) returns uuid
language sql stable security definer set search_path = public as $$
  select access_token from public.orders
  where upper(ref) = upper(trim(order_ref))
    and phone = regexp_replace(coalesce(find_order.phone, ''), '\s', '', 'g')
    and length(regexp_replace(coalesce(find_order.phone, ''), '\s', '', 'g')) = 11
  limit 1;
$$;
revoke all on function public.find_order(text, text) from public;
grant execute on function public.find_order(text, text) to anon, authenticated;
