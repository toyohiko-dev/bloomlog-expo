alter table activity_logs
drop constraint if exists activity_logs_acquisition_method_check;

alter table activity_logs
add constraint activity_logs_acquisition_method_check
check (
  acquisition_method is null
  or acquisition_method in ('purchase', 'exchange', 'gift', 'other')
);
