"""
KAS Auto Parts - Autonomous Batch Worker
Automatically processes generated images, optimizes them, deploys them to public/dist,
and re-syncs the catalog classification engine.
"""

import os
import json
import sqlite3
import subprocess
from PIL import Image

WORKSPACE_DIR = r"c:\website\KAS\app"
MANIFEST_PATH = os.path.join(WORKSPACE_DIR, "server", "data", "master_catalog_image_manifest.json")
PUBLIC_MODELS_DIR = os.path.join(WORKSPACE_DIR, "public", "img", "parts", "models")
DIST_MODELS_DIR = os.path.join(WORKSPACE_DIR, "dist", "img", "parts", "models")
BRAIN_DIR = r"C:\Users\zekhn\.gemini\antigravity-ide\brain\b22d8c94-7865-49c5-b881-c793dccf928b"

os.makedirs(PUBLIC_MODELS_DIR, exist_ok=True)
os.makedirs(DIST_MODELS_DIR, exist_ok=True)

def load_manifest():
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

def deploy_image(source_path, target_filename):
    """
    Optimizes source image to 1024x1024 progressive JPEG and saves to public and dist.
    """
    img = Image.open(source_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # High quality resize
    img = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    pub_target = os.path.join(PUBLIC_MODELS_DIR, target_filename)
    dist_target = os.path.join(DIST_MODELS_DIR, target_filename)
    
    img.save(pub_target, format='JPEG', quality=92, progressive=True, optimize=True)
    img.save(dist_target, format='JPEG', quality=92, progressive=True, optimize=True)
    print(f"✅ Deployed '{target_filename}' ({os.path.getsize(pub_target)//1024} KB)")

def sync_database():
    """
    Runs the TypeScript catalog import script to refresh SQLite database.
    """
    print("🔄 Re-importing catalog with new model image mappings...")
    res = subprocess.run(
        ["npx", "tsx", "server/scripts/import_from_enriched_csv.ts"],
        cwd=WORKSPACE_DIR,
        shell=True,
        capture_output=True,
        text=True
    )
    if res.returncode == 0:
        print("🎉 Database successfully synchronized with all active renders!")
    else:
        print(f"⚠️ Import warning:\n{res.stderr}")

def get_next_batch(batch_size=15):
    manifest = load_manifest()
    pending = [m for m in manifest if not m.get("is_completed")]
    return pending[:batch_size]

if __name__ == "__main__":
    manifest = load_manifest()
    completed = [m for m in manifest if m.get("is_completed")]
    pending = [m for m in manifest if not m.get("is_completed")]
    
    print("======================================================")
    print(f"📊 KAS MASTER IMAGE GENERATION & DEPLOYMENT PIPELINE")
    print(f"   • Total Unique Models & Categories: {len(manifest)}")
    print(f"   • Completed & Active: {len(completed)}")
    print(f"   • Pending Next Batches: {len(pending)}")
    print("======================================================")
    
    next_batch = get_next_batch(10)
    print("\n🎯 Next Priority Batch Queue:")
    for idx, item in enumerate(next_batch, 1):
        print(f"  {idx:2d}. [{item['product_count']:3d} parts] {item['category_name']} -> {item['vehicle_model']}")
        print(f"      Target: {item['target_file']}")
