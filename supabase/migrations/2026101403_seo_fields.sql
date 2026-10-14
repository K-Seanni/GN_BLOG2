alter table public.posts
  add column summary text check (char_length(summary) <= 300),
  add column seo_title text check (char_length(seo_title) <= 100),
  add column seo_description text check (char_length(seo_description) <= 300),
  add column og_image_url text,
  add column tags text[] not null default '{}' check (cardinality(tags) <= 5),
  add column reading_minutes integer not null default 1 check (reading_minutes >= 1),
  add column canonical_url text check (canonical_url ~ '^https?://'),
  add column noindex boolean not null default false;

create index posts_tags_idx on public.posts using gin (tags);

grant insert (summary, seo_title, seo_description, og_image_url, tags, reading_minutes, canonical_url, noindex)
  on public.posts to authenticated;
grant update (summary, seo_title, seo_description, og_image_url, tags, reading_minutes, canonical_url, noindex)
  on public.posts to authenticated;

drop trigger posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update of title, slug, content, excerpt, cover_image_url, status, summary, seo_title,
    seo_description, og_image_url, tags, canonical_url, noindex
  on public.posts
  for each row execute function public.set_updated_at();

alter table public.profiles
  add column website_url text
    check (website_url ~ '^https?://' and char_length(website_url) <= 200),
  add column social_links text[] not null default '{}'
    check (cardinality(social_links) <= 5);

grant update (website_url, social_links) on public.profiles to authenticated;

create function public.popular_tags(max_count integer default 30)
returns table (tag text, post_count bigint)
language sql
stable
set search_path = ''
as $$
  select t as tag, count(*) as post_count
  from public.posts p, unnest(p.tags) as t
  where p.status = 'published' and not p.noindex
  group by t
  order by count(*) desc, t
  limit max_count;
$$;

grant execute on function public.popular_tags(integer) to anon, authenticated;
