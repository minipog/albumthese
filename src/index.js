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
const IMAGES_DIR = 'images'
const THUMBS_DIR = 'thumbnails'

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

async function getCompatibleFiles(dir) {
  const files = await fs.readdir(dir)
  return files.filter((file) =>
    COMPATIBLE_IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())
  )
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

function createImagePaths(files, opts, imagesDir, thumbsDir) {
  return files.map((file) => {
    const fileData = path.parse(file)

    return {
      fileName: fileData.name,
      inputPath: path.join(opts.inputDir, file),
      fullImagePath: path.join(imagesDir, file),
      relativeFullImagePath: path.join(ASSETS_DIR, IMAGES_DIR, file),
      thumbnailPath: path.join(thumbsDir, `thumbnail-${fileData.name}.webp`),
      relativeThumbnailPath: path.join(
        ASSETS_DIR,
        THUMBS_DIR,
        `thumbnail-${fileData.name}.webp`
      ),
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

  const files = await getCompatibleFiles(opts.inputDir)
  if (files.length === 0)
    throw new Error(`No compatible images found in "${opts.inputDir}".`)

  if (opts.clean) {
    await cleanDirectory(opts.outputDir)
  }

  const assetsDir = path.join(opts.outputDir, ASSETS_DIR)
  const imagesDir = path.join(assetsDir, IMAGES_DIR)
  const thumbsDir = path.join(assetsDir, THUMBS_DIR)

  await setupDirectories(opts.outputDir, imagesDir, thumbsDir, opts.clean)

  console.log(`Found ${files.length} compatible images.`)

  const imagePaths = createImagePaths(files, opts, imagesDir, thumbsDir)

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
