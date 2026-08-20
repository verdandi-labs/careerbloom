"""
Re-encryption script template
Copy this file and adapt it for a specific future re-encryption migration
Do not run as-is, the placeholder functions raise NotImplementedError
Fill in _decrypt_old and _encrypt_new for the exact old and new key schemes
For the 2026 KMS-to-Fernet migration: _decrypt_old used the old google-cloud-kms client
against the KMS-wrapped ciphertext (backend/shared/crypto.py pre-Fernet), _encrypt_new
is Fernet(MASTER_KEY).encrypt(plaintext) and the NEW_KEY_VERSION is 2
The production DB had no legacy rows, so the migration was not run
Confirm the target table, field, key_version column and new version before running
Run planned changes against a staging copy before touching a live database

Usage
  uv run python scripts/reencrypt_template.py --table users --dry-run
  uv run python scripts/reencrypt_template.py --table users --no-dry-run --batch-size 500
"""

import argparse
import logging
import re

from sqlalchemy import text

from database import global_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reencrypt")

TABLE_RE = re.compile(r"^[a-z_][a-z0-9_]*$")

FIELD = "encryption_key"
KEY_VERSION_COLUMN = "key_version"
NEW_KEY_VERSION = 2
PROGRESS_BATCHES = 1


def _decrypt_old(encrypted_value):
    raise NotImplementedError("fill in for the specific migration")


def _encrypt_new(plaintext_value):
    raise NotImplementedError("fill in for the specific migration")


async def process_batch(session, table, offset, batch_size, dry_run, failures):
    rows = (
        await session.execute(
            text(f'SELECT * FROM "{table}" ORDER BY 1 OFFSET :offset LIMIT :limit'),
            {"offset": offset, "limit": batch_size},
        )
    ).all()

    processed = 0
    for row in rows:
        mapping = row._mapping
        pk = mapping[0]
        pk_column = list(mapping.keys())[0]
        old_value = mapping[FIELD]
        try:
            new_value = _encrypt_new(_decrypt_old(old_value))
        except Exception as exc:
            failures.append((table, pk, str(exc)))
            logger.warning("row %s skipped, error %s", pk, exc)
            continue

        if dry_run:
            logger.info("would update row %s set %s to new value and %s to %s",
                        pk, FIELD, KEY_VERSION_COLUMN, NEW_KEY_VERSION)
        else:
            await session.execute(
                text(f'UPDATE "{table}" SET "{FIELD}" = :new, "{KEY_VERSION_COLUMN}" = :ver WHERE "{pk_column}" = :pk'),
                {"new": new_value, "ver": NEW_KEY_VERSION, "pk": pk},
            )
        processed += 1

    return processed, len(rows)


async def run(table, batch_size, dry_run):
    if not TABLE_RE.match(table):
        raise ValueError(f"invalid table name {table}")

    async with global_engine.begin() as session:
        offset = 0
        processed_total = 0
        errors_total = 0
        failures = []
        while True:
            processed, batch_len = await process_batch(session, table, offset, batch_size, dry_run, failures)
            processed_total += processed
            errors_total += len(failures)
            if batch_len > 0:
                logger.info("progress offset %d processed %d errors %d on %s",
                            offset, processed_total, errors_total, table)
            if batch_len < batch_size or batch_len == 0:
                break
            offset += batch_len
            if processed_total % (batch_size * PROGRESS_BATCHES) == 0:
                logger.info("progress milestone %d rows processed, %d failures so far",
                            processed_total, errors_total)

    message = "dry run, nothing written" if dry_run else "written to database"
    print(f"process finished for table {table} rows processed {processed_total}, failures {errors_total}, {message}")
    if failures:
        print("failures")
        for table_name, pk, error in failures[:20]:
            print(f"  {table_name} pk {pk}: {error}")
        if len(failures) > 20:
            print(f"  and {len(failures) - 20} more failures")


def main():
    parser = argparse.ArgumentParser(description="re-encrypt rows in a table with a new key scheme")
    parser.add_argument("--table", required=True, help="table to process")
    parser.add_argument("--dry-run", action=argparse.BooleanOptionalAction, default=True,
                        help="log changes without writing, default true")
    parser.add_argument("--batch-size", type=int, default=100, help="rows per batch, default 100")
    args = parser.parse_args()

    import asyncio

    asyncio.run(run(args.table, args.batch_size, args.dry_run))


if __name__ == "__main__":
    main()