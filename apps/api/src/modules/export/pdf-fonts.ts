import { createRequire } from 'node:module'
import pdfmake from 'pdfmake'

const require = createRequire(import.meta.url)

// Roboto из pdfmake поддерживает кириллицу; Helvetica (стандартный PDF-шрифт) — нет.
const robotoFonts = require('pdfmake/fonts/Roboto.js') as {
  Roboto: {
    normal: string
    bold: string
    italics: string
    bolditalics: string
  }
}

pdfmake.setFonts(robotoFonts)

export { pdfmake }
