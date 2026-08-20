# Key Rotation Runbook

Two independent rotation scenarios. Read the one that matches what broke, follow the numbered steps, and stop if any step's verify result is wrong.

## Section 1 — Master key rotation (Fernet MASTER_KEY)

`encrypt_user_key` / `decrypt_user_key` (backend/shared/crypto.py) wrap each per-user Fernet key with a single `MASTER_KEY` Fernet key from `config.py`. There is no automatic rotation: changing `MASTER_KEY` invalidates every stored `users.encryption_key`, so rotate only via the field re-encryption procedure in Section 2.

1. Generate a new `MASTER_KEY` with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
2. Bump `NEW_KEY_VERSION` in the re-encryption script and set `users.key_version` accordingly (migration `009_add_key_version.sql` tracks the scheme version)
3. Follow Section 2 steps 1-8 to re-encrypt every row before swapping `MASTER_KEY` in the app/Render env vars
4. Swap `MASTER_KEY` in the env, deploy, verify against a sample of rows

Hard warning:
- **Losing or replacing `MASTER_KEY` without first re-encrypting rows permanently breaks decryption for every stored `encryption_key`.** There is no recovery after the key is changed.
- Keep the old `MASTER_KEY` backed up until no row still decrypts under it (for example, after a full user-level field re-encryption from Section 2).

## Section 2 — User-level Fernet key rotation / field re-encryption

Needed when the per-user Fernet key itself changes, or when the encryption scheme for a specific field changes. The infrastructure exists but the work is manual and per-migration.

Pre-reqs:
- `users.key_version` exists to track which scheme version each user's data is under (added in migration `009_add_key_version.sql`)
- `backend/scripts/reencrypt_template.py` is the scaffold

Steps:

1. Back up the table that holds the affected field first
   - Use a `pg_dump` or a snapshot in Neon, and record the backup name with the date
2. Copy the template: `cp backend/scripts/reencrypt_template.py backend/scripts/reencrypt_<description>.py`
3. Fill in `_decrypt_old` and `_encrypt_new` for the specific old-scheme decrypt and new-scheme encrypt
4. Confirm the constants at the top: `FIELD`, `KEY_VERSION_COLUMN`, `NEW_KEY_VERSION`
5. Run dry-run against production data and review the failure summary
   - `uv run python -m scripts.reencrypt_<description> --table users --dry-run`
   - Every expected failure should be explainable. Abort if the failure list contains rows that should have transformed cleanly
6. Test the real run against a copy of the DB first
   - Never run the write path against production until the copy run matches the dry-run result
7. Run for real
   - `uv run python -m scripts.reencrypt_<description> --table users --batch-size 100`
8. Verify a sample of rows after the run
   - Pick rows from the start, middle and end of the table and confirm each decrypts with the new scheme and has the expected `key_version`
9. If `NEW_KEY_VERSION` was bumped, spot-check the column values match it

Hard warnings:
- **Always dry-run before a real run.** The failure summary is the only early signal.
- **Always back up the table before a real run.** A bad transform corrupts data in place.
- **Never run against production without testing against a copy of the DB first.** Copy = same data, same schema, rerun the dry-run and the write run there.

## Section 3 — What NOT to do

- Do **not** delete rows to "solve" an incompatible encryption format once real users exist. That was only acceptable back when the DB had zero real users (verified in the migration). With real accounts, deletion destroys user data irrecoverably.
- Do **not** ship a code change that alters decrypt behavior without first checking whether existing rows will still decrypt correctly. Run the dry-run and the copy-of-DB test from Section 2 before the deploy, and check the legacy-format rows specifically.