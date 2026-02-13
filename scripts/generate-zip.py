import os
import zipfile
import subprocess

# Discover project root: check CWD and common paths
PROJECT_DIR = None
for candidate in [os.getcwd(), "/vercel/share/v0-project", "/home/user/project"]:
    if os.path.isdir(candidate) and os.path.exists(os.path.join(candidate, "package.json")):
        PROJECT_DIR = candidate
        break

# If still not found, walk up from CWD
if PROJECT_DIR is None:
    d = os.getcwd()
    while d != "/":
        if os.path.exists(os.path.join(d, "package.json")):
            PROJECT_DIR = d
            break
        d = os.path.dirname(d)

# Last resort: just use CWD
if PROJECT_DIR is None:
    PROJECT_DIR = os.getcwd()

print(f"CWD: {os.getcwd()}")
print(f"Project dir: {PROJECT_DIR}")

# Debug: list top level
print("\n=== Top-level contents ===")
try:
    for item in sorted(os.listdir(PROJECT_DIR)):
        print(f"  {item}")
except Exception as e:
    print(f"  Error: {e}")

# Also try listing CWD if different
if os.getcwd() != PROJECT_DIR:
    print(f"\n=== CWD contents ===")
    for item in sorted(os.listdir(os.getcwd())):
        print(f"  {item}")

OUTPUT_PATH = os.path.join(PROJECT_DIR, "public", "arche-salud-cotizador.zip")

SKIP_DIRS = {"node_modules", ".next", ".git", ".vercel"}
SKIP_FILES = {"pnpm-lock.yaml", "package-lock.json", "arche-salud-cotizador.zip"}
EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".css", ".json", ".md", ".html", ".svg", ".ico",
    ".yaml", ".yml", ".toml",
}
EXACT_FILES = {".gitignore", ".eslintrc", ".env.local", ".env", "Dockerfile"}

def should_include(rel_path):
    parts = rel_path.split(os.sep)
    for part in parts:
        if part in SKIP_DIRS or part == "scripts":
            return False
    filename = os.path.basename(rel_path)
    if filename in SKIP_FILES:
        return False
    if filename in EXACT_FILES:
        return True
    _, ext = os.path.splitext(filename)
    return ext in EXTENSIONS

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

print("\n=== Building ZIP ===")
file_count = 0

try:
    result = subprocess.run(
        ["find", PROJECT_DIR, "-type", "f",
         "-not", "-path", "*/node_modules/*",
         "-not", "-path", "*/.next/*",
         "-not", "-path", "*/.git/*"],
        capture_output=True, text=True, timeout=30
    )
    all_files = [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
    print(f"find returned {len(all_files)} files")

    with zipfile.ZipFile(OUTPUT_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for full_path in sorted(all_files):
            rel_path = os.path.relpath(full_path, PROJECT_DIR)
            if should_include(rel_path):
                arcname = os.path.join("arche-salud-cotizador", rel_path)
                try:
                    zf.write(full_path, arcname)
                    file_count += 1
                    print(f"  + {rel_path}")
                except Exception as e:
                    print(f"  SKIP {rel_path}: {e}")

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"\nZIP generado: {OUTPUT_PATH}")
    print(f"Archivos incluidos: {file_count}")
    print(f"Tamano: {size_kb:.1f} KB")
except Exception as e:
    print(f"ERROR: {e}")
