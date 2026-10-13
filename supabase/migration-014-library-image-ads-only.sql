-- Creatively.ai — migration 014: Winning Ads = static image ads from Meta Ad Library only
-- Run once in Supabase (SQL Editor → New query → paste → Run). Safe to run again.
--
-- WHAT IT DOES
-- 1. Removes the video entries (YouTube) and the text-only print entries that
--    the first version of the library added. Only library tables are touched:
--    users' uploaded creatives, analysis reports and credits are NOT affected.
--    (Bookmarks of the removed entries go with them.)
-- 2. Adds the fields needed to trace each ad back to Meta Ad Library.
-- 3. Locks the table to static images: every row must be an image, and a row
--    can only be published when it has a stored image file, a Meta Ad Library
--    link and a recorded media-type check.
--
-- IMPORTANT: do not run supabase/seed-winning-ads.sql again — it contained the
-- videos. (After this migration it would be rejected anyway.)

-- ── 1. Remove the video and text-only entries ───────────────────────────────
delete from public.library_creatives
 where format <> 'image'
    or preview_kind in ('youtube', 'none')
    or slug in (
      'dollar-shave-club-our-blades', 'squatty-potty-unicorn', 'blendtec-will-it-blend-iphone',
      'dominos-pizza-turnaround', 'old-spice-man-your-man', 'poo-pourri-girls-dont-poop',
      'purple-raw-egg-test', 'ikea-bookbook', 'volvo-trucks-epic-split', 'google-parisian-love',
      'slack-so-yeah-we-tried-slack', 'gopro-fireman-saves-kitten', 'cerave-michael-cerave',
      'dove-reverse-selfie', 'liquid-death-iced-tea-grandma', 'peloton-its-you-that-makes-us',
      'warby-parker-eyeballs', 'patagonia-dont-buy-this-jacket', 'volkswagen-think-small', 'kfc-fck-apology'
    );

-- ── 2. Meta Ad Library source fields ────────────────────────────────────────
alter table public.library_creatives
  add column if not exists ad_library_id text,
  add column if not exists ad_library_url text,
  add column if not exists ad_copy text,
  add column if not exists cta_text text,
  add column if not exists image_path text,
  add column if not exists media_check text,          -- how "static image" was confirmed
  add column if not exists media_checked_at timestamptz,
  add column if not exists meta_active boolean,        -- active in Ad Library when last checked via API
  add column if not exists meta_checked_at timestamptz,
  add column if not exists meta_page_id text,
  add column if not exists delivery_start date;

create unique index if not exists library_creatives_ad_library_id_key
  on public.library_creatives (ad_library_id) where ad_library_id is not null;

-- ── 3. Image-only rules ─────────────────────────────────────────────────────
do $$ begin
  alter table public.library_creatives
    add constraint library_image_only check (format = 'image' and preview_kind = 'image');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.library_creatives
    add constraint library_media_check_values
    check (media_check is null or media_check in ('meta_api_image_filter', 'admin_confirmed_in_ad_library'));
exception when duplicate_object then null; end $$;

-- A published entry must have: a stored image, a Meta Ad Library link, and a media check.
do $$ begin
  alter table public.library_creatives
    add constraint library_publish_requirements check (
      not is_published or (
        image_url ~ '^https://'
        and image_path is not null
        and ad_library_url ~ '^https://(www\.)?facebook\.com/ads/library/'
        and media_check is not null
      )
    );
exception when duplicate_object then null; end $$;

-- New entries start hidden; they're published only once they pass the checks above.
alter table public.library_creatives alter column is_published set default false;

-- Image files live in a public Storage bucket the server writes to.
insert into storage.buckets (id, name, public)
values ('library', 'library', true)
on conflict (id) do nothing;
