-- 11.10: a doctor outside residency may be a generalist or a specialist.
-- Adding an enum value cannot share a transaction with its first use, so the rules that
-- reference 'specialist' live in the next migration.
alter type public.professional_status add value if not exists 'specialist';
