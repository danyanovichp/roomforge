import filecmp
import os

rf_dir = "/Users/danyanovich/code projects/RoomForge"
bf_dir = "/Users/danyanovich/code projects/BusinessForge"

files = [
    "src/App.jsx",
    "src/components/PlannerLibrary.jsx",
    "src/components/PlannerScene.jsx",
    "src/data/plannerData.js",
    "src/index.css",
    "src/lib/planner.js"
]

for f in files:
    rf_file = os.path.join(rf_dir, f)
    bf_file = os.path.join(bf_dir, f)
    if os.path.exists(rf_file) and os.path.exists(bf_file):
        are_same = filecmp.cmp(rf_file, bf_file, shallow=False)
        print(f"File: {f} -> Same? {are_same}")
        if not are_same:
            # Print sizes
            print(f"  RoomForge size: {os.path.getsize(rf_file)}")
            print(f"  BusinessForge size: {os.path.getsize(bf_file)}")
    else:
        print(f"File: {f} -> One or both do not exist")
