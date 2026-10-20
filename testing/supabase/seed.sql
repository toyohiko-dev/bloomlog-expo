-- Synthetic reference data only. No auth users, private logs, URLs or photos copied.
insert into public.events(id,name,slug,start_date,end_date)
values ('10000000-0000-4000-8000-000000000001','TEST ONLY - BloomLog','bloomlog-test','2027-01-01','2027-12-31');
insert into public.countries(id,name_ja,code)
values ('20000000-0000-4000-8000-000000000001','テスト国','ZZ');
insert into public.areas(id,event_id,name,slug)
values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','テストエリア','test-area');
insert into public.spots(id,event_id,area_id,country_id,name,slug,spot_type)
values ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','テストスポット','test-spot','pavilion');
insert into public.pavilions(id,name,official_name,area_id,country_id,spot_id)
values ('50000000-0000-4000-8000-000000000001','テスト館','テスト館','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001');
insert into public.pavilion_aliases(pavilion_id,alias)
values ('50000000-0000-4000-8000-000000000001','ダミー館');
