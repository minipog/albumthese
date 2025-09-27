#!/usr/bin/env node
import path from 'node:path'
import fs from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'

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

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PAGE_TITLE}}</title>
    <style>
      /* {{CSS_CONTENT}} */
    </style>
  </head>
  <body>
    <main class="masonry-gallery">
      <!-- {{GALLERY_CONTENT}} -->
    </main>
  </body>
</html>`

const CSS_TEMPLATE = `
*,*::before,*::after{box-sizing:border-box}
:root{--gap:1.25rem}
body{font-family:sans-serif;background-color:#f0f0f0;margin:0;padding:var(--gap)}
.masonry-gallery{max-width:80rem;margin-inline:auto;column-count:3;column-gap:var(--gap)}
.gallery-item{break-inside:avoid;margin:0 0 var(--gap);overflow:hidden;border-radius:.5rem;box-shadow:0 4px 8px rgba(0,0,0,.1)}
.gallery-item img{width:100%;height:auto;display:block}
@media(max-width:62.5em){.masonry-gallery{column-count:2}}
@media(max-width:31.25em){.masonry-gallery{column-count:1}}
`

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

async function setupDirectories(outputDir, assetsDir, isCleanRun) {
  if (!isCleanRun) {
    try {
      await fs.access(outputDir, fsConstants.F_OK)
      // If access doesn't throw, the directory exists, and we stop.
      throw new Error(
        `Output directory "${outputDir}" already exists. Please remove it or run with the --clean flag to overwrite.`
      )
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  await fs.mkdir(assetsDir, { recursive: true })
  console.log(`Created output directory: ${outputDir}`)
}

function generateImagePaths(files, opts) {
  const assetsDir = path.join(opts.outputDir, 'assets')

  return files.map((file) => {
    const fileData = path.parse(file)
    return {
      fileName: fileData.name,
      inputPath: path.join(opts.inputDir, file),
      thumbnailPath: path.join(assetsDir, `thumbnail-${fileData.name}.webp`),
      // Relative path for use in HTML <img> src attribute
      relativeThumbnailPath: path.join(
        'assets',
        `thumbnail-${fileData.name}.webp`
      ),
    }
  })
}

async function createImageThumbnails(paths, opts) {
  console.log('Generating thumbnails...')
  const promises = paths.map((img) =>
    sharp(img.inputPath)
      .resize(opts.thumbnailSize)
      .webp({ quality: 92 })
      .toFile(img.thumbnailPath)
  )

  await Promise.all(promises)
  console.log('All thumbnails created!')
}

function generateGalleryHTML(imagePaths, opts) {
  console.log('Generating HTML...')
  const imageElements = imagePaths
    .map(
      (image) => `
      <figure class="gallery-item">
        <img src="${image.relativeThumbnailPath}" alt="${image.fileName}" loading="lazy" decoding="async" />
      </figure>`
    )
    .join('')

  return HTML_TEMPLATE.replace(/{{PAGE_TITLE}}/g, opts.albumName)
    .replace('/* {{CSS_CONTENT}} */', CSS_TEMPLATE)
    .replace('<!-- {{GALLERY_CONTENT}} -->', imageElements)
}

async function main() {
  const opts = await parseCliOptions()

  if (opts.clean) {
    await cleanDirectory(opts.outputDir)
  }

  const files = await getCompatibleFiles(opts.inputDir)
  if (files.length === 0)
    throw new Error(`No compatible images found in "${opts.inputDir}".`)

  console.log(`Found ${files.length} compatible images.`)

  const assetsDir = path.join(opts.outputDir, 'assets')
  await setupDirectories(opts.outputDir, assetsDir, opts.clean)

  const imagePaths = generateImagePaths(files, opts)
  await createImageThumbnails(imagePaths, opts)

  const htmlContent = generateGalleryHTML(imagePaths, opts)
  await fs.writeFile(path.join(opts.outputDir, 'index.html'), htmlContent)

  console.log('✨ Done! Your gallery is ready.')
}

main().catch((error) => {
  console.error('\n❌ An error occurred:')
  if (error.code !== 'YARGS_PARSE_FAILED') {
    console.error(error)
  }
  process.exit(1)
})
