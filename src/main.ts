/**
 * Copyright © 2025 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { SerialInterface } from './serial'
import { noStorageAlert } from './dialogs'
import { IdbStorage } from './idb-store'
import { assert } from './utils'

window.addEventListener('error', event =>
  window.alert(`ERROR: ${event.filename}:${event.lineno}:${event.colno}: ${event.message}`))
window.addEventListener('unhandledrejection', event => window.alert(`ERROR - Unhandled Rejection: ${event.reason}`) )

// GitHub pages doesn't automatically redirect to HTTPS, but we need it for certain JS APIs to work (e.g. crypto)
if (location.protocol.toLowerCase() === 'http:' && location.hostname.toLowerCase() !== 'localhost')
  location.replace( 'https:' + location.href.substring(location.protocol.length) )

if (module.hot) module.hot.accept()  // for the parcel development environment

// https://getbootstrap.com/docs/5.3/customize/color-modes/#javascript
const setTheme = () => document.documentElement.setAttribute('data-bs-theme',
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme)
window.addEventListener('DOMContentLoaded', setTheme)

export class GlobalContext {
  readonly storage
  readonly header
  readonly main
  readonly footer
  private idCounter :number = 0
  constructor(storage :IdbStorage) {
    this.storage = storage
    const htmlHeader = document.querySelector('header')
    const htmlMain = document.querySelector('main')
    const htmlFooter = document.querySelector('footer')
    assert(htmlHeader instanceof HTMLElement && htmlMain instanceof HTMLElement && htmlFooter instanceof HTMLElement)
    this.header = htmlHeader
    this.main = htmlMain
    this.footer = htmlFooter
  }
  genId() :string { return `_genId_${this.idCounter++}_` }
  scrollTo(target :HTMLElement) {
    setTimeout(() => {  // don't scroll until rendered
      target.style.setProperty('scroll-margin-top',    `${this.header.getBoundingClientRect().height+5}px`)
      //target.style.setProperty('scroll-margin-bottom', `${this.footer.getBoundingClientRect().height+5}px`)  // footer is not sticky
      target.style.setProperty('scroll-margin-bottom', '5px')  // footer is not sticky
      target.scrollIntoView({ block: 'nearest', behavior: 'auto' })
    }, 1)
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  let storage :IdbStorage
  try { storage = await IdbStorage.open() }
  catch (ex) {
    console.error(ex)
    document.querySelector('main')?.appendChild(noStorageAlert())
    return
  }

  const ctx = new GlobalContext(storage)
  const ser = await SerialInterface.new(ctx)
  ctx.main.appendChild(ser.el)
})
