# Encryption at rest

User content is encrypted at rest using Laravel's built-in `encrypted` /
`encrypted:array` casts (AES-256-CBC, keyed by `APP_KEY`). A stolen database
dump, raw backup, or direct DB access sees only ciphertext. Encryption is
transparent to application code — models return plaintext automatically.

## Threat model

This is **at-rest** encryption, not zero-knowledge. It protects against DB
theft, backups, and anyone reading the raw tables. It does **not** hide data
from application code (the running app holds `APP_KEY`). No admin screen exposes
another user's task or finance content, so admins cannot view it through the UI.

## What is encrypted

Free-text / personal content and JSON blobs:

- **Tasks:** `title`, `description`, `recurrence_config`; **Subtasks:** `title`
- **Categories:** `name`, `description`
- **Workspaces / Boards:** `name`, `description`; **Swimlanes:** `name`
- **Activity logs:** `old_values`, `new_values`; **Users:** `tutorial_progress`
- **Finance:** transaction `description`/`notes`/`payment_method`; account
  `name`/`label`/`account_number`/`notes`; category/budget/savings-goal/loan
  `name` (+ savings-goal/loan `notes`); report `payload`

## What stays plaintext (by design)

Structural / queryable columns: all foreign keys, `status`, `priority`, `type`,
dates (`due_date`, `occurred_at`), `is_active`, `color`, `currency`, `position`,
numeric `amount`/balance decimals (needed for `SUM`/reports), `users.email`
(login identifier), `users.name`, `tags.name`, `invite_codes.code`,
`activity_logs.description`, and `finance_transactions.metadata` (queried in SQL
via JSON-path inside the reporting aggregations).

Because encrypted columns cannot be used in SQL `WHERE`/`LIKE`/`ORDER BY`, search
and sort over them run in PHP — see `app/Support/EncryptedSearch.php`.

## ⚠️ Key management

**Losing `APP_KEY` means all encrypted data is permanently unrecoverable.**

- Back up `APP_KEY` in a secure secret store before enabling encryption in any
  environment. There is no recovery path and no admin override.
- To rotate the key: generate a new `APP_KEY`, move the old key into
  `APP_PREVIOUS_KEYS` (comma-separated) so existing ciphertext still decrypts,
  then re-encrypt data with the new key. `config/app.php` already wires
  `previous_keys`.

## Rollout sequence (per environment)

Run these in order — the widening migration MUST precede the backfill (encrypted
ciphertext does not fit in `varchar` and is not valid JSON):

1. **Snapshot the database** (rollback point).
2. **Back up `APP_KEY`** to your secret store.
3. Deploy the code (models now carry the encrypted casts).
4. `php artisan migrate` — runs `..._widen_columns_for_encryption`
   (`string`/`json` → `text` for every encrypted column).
5. `php artisan encrypt:existing-data --dry-run` — reports how many legacy
   plaintext values would be encrypted, writing nothing.
6. `php artisan encrypt:existing-data --force` — encrypts existing rows in
   place. **Idempotent:** already-encrypted values are detected (MAC-verified
   decrypt probe) and skipped, so re-runs are safe no-ops.
7. Open traffic.

Options: `--table=<name>` restricts to one table; `--dry-run` previews;
`--force` skips the confirmation prompt (CI / non-interactive).

## Tests

`tests/Feature/EncryptionAtRestTest.php` asserts ciphertext at rest + plaintext
through the model + backfill idempotency. `tests/Feature/EncryptedSearchTest.php`
covers the PHP-level search/sort/uniqueness that replaced the SQL predicates.

> Note: the backend suite currently boots only against MySQL (some pre-existing
> migrations use MySQL-only DDL that SQLite can't run). Run encryption tests
> against the dev MySQL database, e.g.
> `DB_CONNECTION=mysql DB_DATABASE=todo_app_test php artisan test tests/Feature/EncryptionAtRestTest.php`.
