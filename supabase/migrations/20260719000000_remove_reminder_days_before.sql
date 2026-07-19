-- reminder_days_before was only ever read by the SMS-reminder cron logic,
-- which has been removed. Nothing else references it (confirmed by search
-- across the whole app before writing this).

alter table app_settings drop column if exists reminder_days_before;
