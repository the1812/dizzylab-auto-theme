const fs = require('fs')
const code = fs.readFileSync('dizzylab.css', { encoding: 'utf-8'})
const style = `
/* ==UserStyle==
@name        dizzylab auto theme
@description dizzylab 自适应主题
@namespace   the1812
@version     1.0.1
@author      Grant Howard
@homepageURL https://github.com/the1812/dizzylab-auto-theme/
@supportURL  https://github.com/the1812/dizzylab-auto-theme/issues
@updateURL   https://cdn.jsdelivr.net/gh/the1812/dizzylab-auto-theme@master/dizzylab.user.css
@license     MIT
==/UserStyle== */

@-moz-document domain("www.dizzylab.net") {
  ${code}
}
`.trim()
fs.writeFileSync('dizzylab.user.css', style)
