import os
import time

paths = [
    "/Users/danyanovich/code projects/RoomForge",
    "/Users/danyanovich/code projects/RoomForge/Untitled/roomforge",
    "/Users/danyanovich/code projects/BusinessForge"
]

files = [
    "package.json",
    "src/App.jsx",
    "src/components/PlannerLibrary.jsx",
    "src/components/PlannerScene.jsx",
    "src/data/plannerData.js",
    "src/index.css",
    "src/lib/planner.js",
    "src/lib/russian.js",
    "src/lib/aiPlanner.js"
]

for f in files:
    print(f"\nFile: {f}")
    for p in paths:
        full_path = os.path.join(p, f)
        if os.path.exists(full_path):
            mtime = os.path.getmtime(full_path)
            size = os.path.getsize(full_path)
            print(f"  Path: {p}")
            print(f"    Size: {size} bytes")
            print(f"    Mtime: {time.ctime(mtime)} ({mtime})")
        else:
            print(f"  Path: {p} - DOES NOT EXIST")
