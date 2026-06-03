import sqlite3

db_path = "/Users/danyanovich/code projects/future projects/unboring_life/data/ops-ui.sqlite"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [row[0] for row in cursor.fetchall()]

keywords = ["момент", "moment", "монет", "коин", "snapshot", "срез", "история"]

for table in tables:
    print(f"\n--- Searching in table: {table} ---")
    # Get columns
    cursor.execute(f"PRAGMA table_info({table});")
    columns = [row[1] for row in cursor.fetchall()]
    
    # Construct a search query OR fetch rows and search in Python to be safe and simple
    cursor.execute(f"SELECT * FROM {table};")
    rows = cursor.fetchall()
    
    match_count = 0
    for row_idx, row in enumerate(rows):
        row_str = str(row).lower()
        found = [kw for kw in keywords if kw in row_str]
        if found:
            match_count += 1
            if match_count <= 10:
                print(f"Row {row_idx}: Matched keywords {found}")
                # Print truncated row
                print(f"  {str(row)[:300]}...")
    print(f"Total matches in {table}: {match_count} / {len(rows)}")

conn.close()
