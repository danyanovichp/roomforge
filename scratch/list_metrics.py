import json

file_path = "/Users/danyanovich/.gemini/antigravity/brain/e6341475-99f9-4013-92a3-0a95ab13e294/.system_generated/steps/146/output.txt"
with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

results = data.get('results', [])
metrics_db_id = "32fdfacb-0c82-484f-83d8-5fa39e05ca65"

metrics_pages = []
for item in results:
    if item.get("object") == "page":
        parent = item.get("parent", {})
        if parent.get("type") == "database_id" and parent.get("database_id") == metrics_db_id:
            title = ""
            props = item.get("properties", {})
            for p_name, p_val in props.items():
                if p_val.get("type") == "title":
                    t_list = p_val.get("title", [])
                    if t_list:
                        title = t_list[0].get("plain_text", "")
                        break
            metrics_pages.append((item.get("id"), title, item.get("last_edited_time")))

print(f"Total metrics pages: {len(metrics_pages)}")
for it in metrics_pages:
    print(f"ID: {it[0]}, Title: '{it[1]}', Edited: {it[2]}")
