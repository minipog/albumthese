# albumthese ✨ - CLI Photo Gallery Generator

**`albumthese`** is a lightweight command-line interface (CLI) tool designed to quickly generate a responsive, modern, masonry-style photo gallery with an integrated lightbox from a simple directory of images.

## 🚀 Features

- **Fast Thumbnail Generation:** Uses the high-performance sharp library to create optimized WebP thumbnails.
- **Responsive Masonry Layout:** Generates a clean HTML file with embedded styles for a beautiful gallery that adapts to any screen size.
- **Full-Screen Lightbox:** Implements a click-to-open lightbox modal for full-size viewing.
- **Keyboard Navigation:** Allows users to close the lightbox with **Escape** and navigate images with **ArrowLeft/ArrowRight** keys.
- **Sorting:** Allows sorting images by filename or modification date.
- **Safe Execution:** Includes a _--clean_ flag to safely manage the output directory, preventing accidental file overwrites.
- **Customizable:** Easily set the album title, thumbnail size, and input/output directories.

---

## 📦 Installation & Quick Run

Since this is a command-line utility, you can run it directly without a permanent install using `npx` or `pnpm dlx`.

### Quick Run

Run the tool on the fly using your package manager:

| Package Manager | Command Example       |
| :-------------- | :-------------------- |
| **pnpm**        | `pnpm dlx albumthese` |
| **npm**         | `npx albumthese`      |

### Global Installation

To install the tool globally and run it using just the command name:

```bash
pnpm install -g albumthese
# OR
npm install -g albumthese
```

---

## 🛠️ Usage

### 1. Prepare Your Images

Place all your source images (JPEG, PNG, etc.) into a single directory.  
The default input directory is `./images`.

### 2. Run the Generator

The most basic command uses the default settings:

```bash
npx albumthese
# This will read images from ./images and create the gallery in ./album
```

### Options

| Flag           | Alias | Default            | Description                                                      |
| -------------- | ----- | ------------------ | ---------------------------------------------------------------- |
| `--input <d>`  | `-i`  | `images`           | The source directory containing your full-size images.           |
| `--output <d>` | `-o`  | `album`            | The destination directory for the generated gallery and assets.  |
| `--name <t>`   | `-n`  | `My Photo Gallery` | The HTML page title for the gallery.                             |
| `--size <px>`  | `-s`  | `300`              | The maximum width (in pixels) for the generated thumbnails.      |
| `--sort <m>`   | `-r`  | `date`             | Sorts images by 'filename' (A-Z) or 'date' (modification time).  |
| `--clean`      | —     | `false`            | Deletes the output directory before starting (use with caution). |

---

### Example

Generate an album titled **"Mountain Views"** from a custom input folder `photos/` and save it into `web/`, cleaning the output folder first, and sorting by filename:

```bash
pnpm dlx albumthese -i photos -o web -n "Mountain Views" --clean --sort filename
```

---

## 🧑‍💻 Contributing

We welcome contributions! Please open an issue or submit a Pull Request on GitHub.

### Local Development

Clone the repository and install dependencies:

```bash
pnpm install
```

Run the tool locally:

```bash
pnpm run album -- -i [your-test-image-dir] -o [test-output-dir]
```

---

## ⚖️ License

This project is licensed under the MIT License.
