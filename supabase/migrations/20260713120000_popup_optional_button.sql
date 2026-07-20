-- Button is optional: leave button_text empty to hide the button entirely
-- (the poster itself stays clickable and opens link_url).
alter table public.homepage_popups alter column button_text drop not null;
alter table public.homepage_popups alter column button_text drop default;
update public.homepage_popups set button_text = null where btrim(coalesce(button_text,'')) = '';
