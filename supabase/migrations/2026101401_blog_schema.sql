-- Shared helpers ------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles ------------------------------------------------------------------

alter table public.profiles
  add column username text unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  add column bio text
    check (char_length(bio) <= 160);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, avatar_url, bio) on public.profiles to authenticated;

-- Posts ---------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  slug text not null check (char_length(slug) between 1 and 120),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  excerpt text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, slug)
);

create index posts_published_at_idx
  on public.posts (published_at desc)
  where status = 'published';

create trigger posts_set_updated_at
  before update of title, slug, content, excerpt, cover_image_url, status on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone, drafts by their author"
  on public.posts for select
  to anon, authenticated
  using (status = 'published' or (select auth.uid()) = author_id);

create policy "Users can create their own posts"
  on public.posts for insert
  to authenticated
  with check ((select auth.uid()) = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using ((select auth.uid()) = author_id);

-- Counters are maintained by triggers only.
revoke insert, update on public.posts from anon, authenticated;
grant insert (author_id, title, slug, content, excerpt, cover_image_url, status, published_at)
  on public.posts to authenticated;
grant update (title, slug, content, excerpt, cover_image_url, status, published_at)
  on public.posts to authenticated;

-- Comments ------------------------------------------------------------------

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index comments_parent_id_idx on public.comments (parent_id);
create index comments_author_id_idx on public.comments (author_id);

create trigger comments_set_updated_at
  before update of body on public.comments
  for each row execute function public.set_updated_at();

create function public.validate_comment_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent record;
begin
  if new.parent_id is null then
    return new;
  end if;

  select post_id, parent_id into parent
  from public.comments
  where id = new.parent_id;

  if not found or parent.post_id <> new.post_id then
    raise exception 'Parent comment does not belong to this post';
  end if;

  if parent.parent_id is not null then
    raise exception 'Replies can only be one level deep';
  end if;

  return new;
end;
$$;

create trigger comments_validate_parent
  before insert or update of parent_id on public.comments
  for each row execute function public.validate_comment_parent();

alter table public.comments enable row level security;

create policy "Comments on visible posts are viewable"
  on public.comments for select
  to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

create policy "Users can comment on published posts"
  on public.comments for insert
  to authenticated
  with check (
    (select auth.uid()) = author_id
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );

create policy "Users can update their own comments"
  on public.comments for update
  to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);

create policy "Comment authors and post authors can delete comments"
  on public.comments for delete
  to authenticated
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

revoke insert, update on public.comments from anon, authenticated;
grant insert (post_id, author_id, parent_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;

-- Likes ---------------------------------------------------------------------

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_id_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

create policy "Likes on visible posts are viewable"
  on public.post_likes for select
  to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));

create policy "Users can like published posts"
  on public.post_likes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );

create policy "Users can remove their own likes"
  on public.post_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Follows -------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select
  to anon, authenticated
  using (true);

create policy "Users can follow others"
  on public.follows for insert
  to authenticated
  with check ((select auth.uid()) = follower_id);

create policy "Users can unfollow"
  on public.follows for delete
  to authenticated
  using ((select auth.uid()) = follower_id);

-- Counter triggers ----------------------------------------------------------

create function public.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.update_post_like_count();

create function public.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  else
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger comments_count
  after insert or delete on public.comments
  for each row execute function public.update_post_comment_count();

revoke execute on function public.update_post_like_count() from public, anon, authenticated;
revoke execute on function public.update_post_comment_count() from public, anon, authenticated;

-- Views (one per viewer per day, Asia/Seoul) --------------------------------

create table public.post_views (
  post_id uuid not null references public.posts (id) on delete cascade,
  viewer_key text not null,
  view_date date not null default (now() at time zone 'Asia/Seoul')::date,
  primary key (post_id, viewer_key, view_date)
);

alter table public.post_views enable row level security;
-- No policies: rows are only written through record_post_view().

create function public.record_post_view(p_post_id uuid, p_anon_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_author uuid;
  v_viewer text;
  v_inserted integer;
begin
  select author_id into v_author
  from public.posts
  where id = p_post_id and status = 'published';

  if not found or v_author = auth.uid() then
    return;
  end if;

  if auth.uid() is not null then
    v_viewer := 'user:' || auth.uid()::text;
  elsif p_anon_key ~ '^[0-9a-f-]{36}$' then
    v_viewer := 'anon:' || p_anon_key;
  else
    return;
  end if;

  insert into public.post_views (post_id, viewer_key)
  values (p_post_id, v_viewer)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.posts set view_count = view_count + 1 where id = p_post_id;
  end if;
end;
$$;

revoke execute on function public.record_post_view(uuid, text) from public;
grant execute on function public.record_post_view(uuid, text) to anon, authenticated;
