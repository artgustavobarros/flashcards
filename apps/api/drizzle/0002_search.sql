-- The Cards search ignores accents: lower(unaccent(text)) on both sides (cards/cards.service.ts).
-- unaccent is a trusted extension, so the database owner can create it without superuser.
CREATE EXTENSION IF NOT EXISTS unaccent;
