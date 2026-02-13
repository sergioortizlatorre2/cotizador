import { NextResponse } from "next/server"
import { readdir, readFile, stat } from "fs/promises"
import { join, relative, extname, basename } from "path"
import JSZip from "jszip"

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "scripts",
  ".turbo",
])

const SKIP_FILES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "arche-salud-cotizador.zip",
])

const EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".css", ".json", ".md", ".html", ".svg", ".ico",
  ".yaml", ".yml", ".toml",
])

const EXACT_FILES = new Set([
  ".gitignore", ".eslintrc", ".env.local", ".env",
])

function shouldInclude(relPath: string): boolean {
  const parts = relPath.split("/")
  for (const part of parts) {
    if (SKIP_DIRS.has(part)) return false
  }
  const filename = basename(relPath)
  if (SKIP_FILES.has(filename)) return false
  if (EXACT_FILES.has(filename)) return true
  const ext = extname(filename)
  if (ext === "") return false
  return EXTENSIONS.has(ext)
}

async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = []
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          const subFiles = await walkDir(fullPath)
          files.push(...subFiles)
        }
      } else if (entry.isFile()) {
        files.push(fullPath)
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return files
}

export async function GET() {
  try {
    // Discover project root
    const cwd = process.cwd()
    const projectDir = cwd

    const allFiles = await walkDir(projectDir)
    const zip = new JSZip()
    let count = 0

    for (const fullPath of allFiles.sort()) {
      const relPath = relative(projectDir, fullPath)
      if (shouldInclude(relPath)) {
        try {
          const content = await readFile(fullPath)
          zip.file(`arche-salud-cotizador/${relPath}`, content)
          count++
        } catch {
          // skip unreadable files
        }
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="arche-salud-cotizador.zip"`,
        "Content-Length": zipBuffer.length.toString(),
        "X-File-Count": count.toString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Error generando ZIP", details: String(error) },
      { status: 500 }
    )
  }
}
