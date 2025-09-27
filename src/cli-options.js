import path from 'node:path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

export async function parseCliOptions() {
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
      default: 300,
      type: 'number',
    })
    .option('clean', {
      description: 'Deletes the output directory before starting generation.',
      default: false,
      type: 'boolean',
    })
    .check((argv) => {
      if (argv.size <= 0)
        throw new Error('Thumbnail size must be a positive number.')

      return true
    })
    .help()
    .alias('help', 'h')
    .strict().argv

  return {
    inputDir: argv.input,
    outputDir: argv.output,
    albumName: argv.name,
    thumbnailSize: argv.size,
    clean: argv.clean,
  }
}
