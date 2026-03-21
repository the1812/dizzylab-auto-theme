import { readFile, watch, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { compileAsync } from 'sass'

const packageJsonPath = new URL('./package.json', import.meta.url)
const scssPath = new URL('./dizzylab.scss', import.meta.url)
const userStylePath = new URL('./dizzylab.user.css', import.meta.url)
const rootDirPath = fileURLToPath(new URL('.', import.meta.url))
const scssFilePath = fileURLToPath(scssPath)

const readPackageJson = async () =>
  JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
    version: string
  }

const buildUserStyle = async () => {
  const [{ version }, { css }] = await Promise.all([
    readPackageJson(),
    compileAsync(scssFilePath, {
      style: 'expanded',
      sourceMap: false,
    }),
  ])

  const style = `
/* ==UserStyle==
@name        dizzylab auto theme
@description dizzylab 自适应主题
@namespace   the1812
@version     ${version}
@author      Grant Howard
@homepageURL https://github.com/the1812/dizzylab-auto-theme/
@supportURL  https://github.com/the1812/dizzylab-auto-theme/issues
@updateURL   https://cdn.jsdelivr.net/gh/the1812/dizzylab-auto-theme@master/dizzylab.user.css
@license     MIT
==/UserStyle== */

@-moz-document domain("www.dizzylab.net") {
  ${css}
}
`.trim()

  await writeFile(userStylePath, style)
  console.log('Built dizzylab.user.css')
}

const shouldRebuild = (filename: string) =>
  filename.endsWith('.scss') || filename === 'package.json'

const watchUserStyle = async () => {
  await buildUserStyle()

  const controller = new AbortController()
  let rebuildTimer: ReturnType<typeof setTimeout> | undefined

  const stopWatching = () => controller.abort()

  process.on('SIGINT', stopWatching)
  process.on('SIGTERM', stopWatching)

  try {
    for await (const event of watch(rootDirPath, {
      recursive: true,
      signal: controller.signal,
    })) {
      if (typeof event.filename !== 'string') {
        continue
      }

      if (!shouldRebuild(event.filename)) {
        continue
      }

      if (rebuildTimer) {
        clearTimeout(rebuildTimer)
      }

      rebuildTimer = setTimeout(() => {
        void buildUserStyle().catch((error: unknown) => {
          console.error('Build failed')
          console.error(error)
        })
      }, 50)
    }
  } catch (error) {
    if (!(error instanceof Error) || error.name !== 'AbortError') {
      throw error
    }
  }
}

if (process.argv.includes('--watch')) {
  await watchUserStyle()
} else {
  await buildUserStyle()
}
