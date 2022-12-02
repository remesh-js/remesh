const fs = require('fs/promises')
const globby = require('globby')
const path = require('path')
const fsSync = require('fs')

const IMPORT_EXPORT_REGEXP =
  /(import|export)\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g

const getStat = (fielname) => {
  try {
    return fsSync.statSync(fielname)
  } catch (_) {
    return fsSync.statSync(`${fielname}.js`)
  }
}

const replaceImportStatement = (source, dirname) => {
  const addMjs = (_, module) => {
    // module is not relative path
    if (!module.startsWith('.')) {
      return `"${module}"`
    }

    const pathname = path.join(dirname, module)
    const stat = getStat(pathname)

    // module is directory
    if (stat.isDirectory()) {
      if (module.endsWith('/')) {
        return `"${module}index.mjs"`
      }
      return `"${module}/index.mjs"`
    }

    // otherwise
    return `"${module}.mjs"`
  }

  return source.replace(IMPORT_EXPORT_REGEXP, (value) => {
    return value.replace(/"(.*)"/, addMjs).replace(/'(.*)'/, addMjs)
  })
}
const replaceFiles = async () => {
  const files = await globby('./packages/**/*/esm/**/*.js', {
    absolute: true,
    ignore: ['**/*/node_modules/**/*'],
  })

  await Promise.all(
    files.map(async (file) => {
      try {
        const dirname = path.dirname(file)
        const sourceCode = await fs.readFile(file, 'utf-8')
        const newSourceCode = replaceImportStatement(sourceCode, dirname)
        await fs.writeFile(file.replace('.js', '.mjs'), newSourceCode, 'utf-8')
        console.log(`done: ${file}`)
      } catch (error) {
        console.log(`fail:${file}\n${error.stack || error.message}`)
        throw error
      }
    }),
  )

  await Promise.all(
    files.map(async (file) => {
      await fs.unlink(file)
    }),
  )
}

const main = async () => {
  const startTime = Date.now()
  await replaceFiles()
  console.log(`All done in ${(Date.now() - startTime).toFixed(2)}ms!`)
}

main()
