import os

import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL")


def update_document_status(document_id: str, status: str, **fields) -> None:
    columns = ["status"] + list(fields.keys())
    values = [status] + list(fields.values())
    assignments = ", ".join(f"{column} = %s" for column in columns)

    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"UPDATE documents SET {assignments} WHERE id = %s",
                (*values, document_id),
            )
        connection.commit()
