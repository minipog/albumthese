#!/usr/bin/env node
import path from 'node:path'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import { parseCliOptions } from './cli-options.js'

const COMPATIBLE_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
])

const ASSETS_DIR = 'assets'
const IMAGES_DIR = path.join(ASSETS_DIR, 'images')
const THUMBS_DIR = path.join(ASSETS_DIR, 'thumbnails')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function loadStaticContent() {
  const [htmlTemplate, cssContent, jsContent] = await Promise.all(
    ['template.html', 'style.css', 'script.js'].map((file) =>
      fs.readFile(path.join(__dirname, file), 'utf-8')
    )
  )

  return { htmlTemplate, cssContent, jsContent }
}

async function getFileStats(dir) {
  const files = await fs.readdir(dir)

  const fileStatsPromises = files
    .filter((file) =>
      COMPATIBLE_IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())
    )
    .map(async (file) => {
      const inputPath = path.join(dir, file)
      const parsedPath = path.parse(file)

      try {
        const stats = await fs.stat(inputPath)

        return {
          name: file,
          baseName: parsedPath.name,
          inputPath: inputPath,
          mtime: stats.mtimeMs,
        }
      } catch (error) {
        console.warn(`Could not read stats for ${file}: ${error.message}`)
        return null
      }
    })

  const fileStats = await Promise.all(fileStatsPromises)

  return fileStats.filter((stat) => stat !== null)
}

function sortFiles(files, method) {
  console.log(`Sorting ${files.length} files by ${method}...`)
  if (method === 'date') {
    // Sort ascending by modification time (Oldest first)
    files.sort((a, b) => a.mtime - b.mtime)
    return
  }

  files.sort((a, b) => a.name.localeCompare(b.name))
}

async function cleanDirectory(dir) {
  try {
    await fs.access(dir, fsConstants.F_OK)
    console.log(`🧹 Deleting existing output directory: ${dir}`)
    await fs.rm(dir, { recursive: true, force: true })
    console.log('✅ Directory deleted.')
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

async function setupDirectories(outputDir, imagesDir, thumbsDir, isCleanRun) {
  if (!isCleanRun) {
    try {
      await fs.access(outputDir, fsConstants.F_OK)
      throw new Error(
        `Output directory "${outputDir}" already exists. Please remove it or run with the --clean flag to overwrite.`
      )
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  console.log(`Creating output directory structure...`)
  await Promise.all([
    fs.mkdir(thumbsDir, { recursive: true }),
    fs.mkdir(imagesDir, { recursive: true }),
  ])
}

function createImagePaths(filesWithStats, imagesDir, thumbsDir) {
  return filesWithStats.map((fileData) => {
    const thumbFileName = `thumbnail-${fileData.baseName}.webp`

    return {
      fileName: fileData.baseName,
      inputPath: fileData.inputPath,
      fullImagePath: path.join(imagesDir, fileData.name),
      thumbnailPath: path.join(thumbsDir, thumbFileName),
      relativeFullImagePath: path.join(IMAGES_DIR, fileData.name),
      relativeThumbnailPath: path.join(THUMBS_DIR, thumbFileName),
    }
  })
}

async function copyFullSizeImages(paths) {
  console.log('Copying full-size images for lightbox...')
  await Promise.all(
    paths.map((img) => fs.copyFile(img.inputPath, img.fullImagePath))
  )
}

async function createImageThumbnails(paths, opts) {
  console.log('Generating thumbnails...')
  await Promise.all(
    paths.map((img) =>
      sharp(img.inputPath)
        .resize(opts.thumbnailSize)
        .webp({ quality: 92 })
        .toFile(img.thumbnailPath)
    )
  )
}

async function writeStaticAssets(cssContent, jsContent, assetsDir) {
  console.log('Writing static assets...')
  await Promise.all([
    fs.writeFile(path.join(assetsDir, 'style.css'), cssContent),
    fs.writeFile(path.join(assetsDir, 'script.js'), jsContent),
  ])
}

function createAlbumHTML(imagePaths, opts, htmlTemplate) {
  console.log('Generating HTML...')
  const imageElements = imagePaths
    .map(
      (image) => `
      <figure class="gallery-item">
        <a href="${image.relativeFullImagePath}">
          <img src="${image.relativeThumbnailPath}" alt="${image.fileName}" loading="lazy" decoding="async" />
        </a>
      </figure>`
    )
    .join('')

  let html = htmlTemplate
    .replace(/{{PAGE_TITLE}}/g, opts.albumName)
    .replace('<!-- {{ALBUM_CONTENT}} -->', imageElements)

  return html
}

async function main() {
  const opts = await parseCliOptions()
  const { htmlTemplate, cssContent, jsContent } = await loadStaticContent()

  const filesWithStats = await getFileStats(opts.inputDir)
  if (filesWithStats.length === 0)
    throw new Error(`No compatible images found in "${opts.inputDir}".`)

  sortFiles(filesWithStats, opts.sortingMethod)

  console.log(`Found ${filesWithStats.length} compatible images.`)

  if (opts.clean) {
    await cleanDirectory(opts.outputDir)
  }

  const assetsDir = path.join(opts.outputDir, ASSETS_DIR)
  const imagesDir = path.join(opts.outputDir, IMAGES_DIR)
  const thumbsDir = path.join(opts.outputDir, THUMBS_DIR)

  await setupDirectories(opts.outputDir, imagesDir, thumbsDir, opts.clean)

  const imagePaths = createImagePaths(filesWithStats, imagesDir, thumbsDir)

  await writeStaticAssets(cssContent, jsContent, assetsDir)
  await copyFullSizeImages(imagePaths)
  await createImageThumbnails(imagePaths, opts)

  const htmlContent = createAlbumHTML(imagePaths, opts, htmlTemplate)
  await fs.writeFile(path.join(opts.outputDir, 'index.html'), htmlContent)

  console.log('✨ Done! Your album is ready.')
}

main().catch((error) => {
  console.error('\n❌ An error occurred:')
  if (error.code !== 'YARGS_PARSE_FAILED') {
    console.error(error)
  }
  process.exit(1)
})
