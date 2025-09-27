import path from 'node:path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

export async function parseCliOptions() {
  const DEFAULT_SIZE = 300
  const DEFAULT_SORT = 'date'

  const argv = await yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      description: 'The directory containing the source images.',
      default: 'images',
      type: 'string',
      coerce: (value) => path.resolve(process.cwd(), value),
    })
    .option('output', {
      alias: 'o',
      description: 'The directory where the final gallery will be saved.',
      default: 'album',
      type: 'string',
      coerce: (value) => path.resolve(process.cwd(), value),
    })
    .option('name', {
      alias: 'n',
      description: 'The title for the HTML page.',
      default: 'My Photo Gallery',
      type: 'string',
    })
    .option('size', {
      alias: 's',
      description:
        'The maximum width for generated image thumbnails (in pixels).',
      default: DEFAULT_SIZE,
      type: 'number',
      coerce: (value) => {
        if (typeof value !== 'number' || value <= 0) {
          console.warn(
            `Invalid thumbnail size "${value}" provided. Falling back to default: ${DEFAULT_SIZE}px.`
          )
          return DEFAULT_SIZE
        }
        return value
      },
    })
    .option('sort', {
      alias: 'r',
      description: "Sorts images by 'filename' or 'date' (modification time).",
      default: DEFAULT_SORT,
      type: 'string',
      coerce: (value) => {
        const lcValue = String(value).toLowerCase()
        if (lcValue !== 'filename' && lcValue !== 'date') {
          console.warn(
            `Invalid sort method "${value}" provided. Falling back to default: '${DEFAULT_SORT}'.`
          )
          return DEFAULT_SORT
        }
        return lcValue
      },
    })
    .option('clean', {
      description: 'Deletes the output directory before starting generation.',
      default: false,
      type: 'boolean',
    })
    .help()
    .alias('help', 'h')
    .strict().argv

  return {
    inputDir: argv.input,
    outputDir: argv.output,
    albumName: argv.name,
    thumbnailSize: argv.size,
    sortingMethod: argv.sort,
    clean: argv.clean,
  }
}
