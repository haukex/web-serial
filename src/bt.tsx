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
import { jsx, safeCastElement } from './jsx-dom'
import { GlobalContext } from './main'

export class WebBluetooth {
  readonly ctx :GlobalContext
  readonly el :HTMLElement
  private readonly btnRequest :HTMLButtonElement

  static new(ctx :GlobalContext) :Promise<WebBluetooth> {
    return new WebBluetooth(ctx).initialize()
  }

  private constructor(ctx :GlobalContext) {
    this.ctx = ctx
    this.btnRequest = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-primary">
        <i class="bi-bluetooth me-1"/> Request Bluetooth Device</button>)
    this.el = 'bluetooth' in navigator
      ? <div class="d-flex flex-column gap-3">
        <div class="container border rounded p-3">
          <div class="d-flex flex-wrap gap-2">
            {this.btnRequest} <div><span class="badge rounded-pill text-bg-danger">Really Alpha</span></div>
          </div>
        </div>
      </div>
      : <div class="alert alert-danger" role="alert">
        <i class="bi-exclamation-octagon me-2" />
        <strong class="me-1">Web Bluetooth API is not supported in this browser.</strong><hr/>
        The <em>Web Bluetooth API</em> is an experimental technology that does not appear to be supported by your browser.
        Please see the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility"
          target="_blank">browser compatibility table</a>.</div>
  }

  private async initialize() :Promise<this> {
    if (!('bluetooth' in navigator)) return this

    this.btnRequest.addEventListener('click', async () => {
      let bt = null
      try { bt = await navigator.bluetooth.requestDevice({ acceptAllDevices: true }) }
      catch (ex) {
        if (ex instanceof DOMException && ex.name === 'NotFoundError') {/* TODO: Does this mean the user canceled like in the Serial API */}
        else if (ex instanceof DOMException && ex.name === 'SecurityError') { this.securityError(ex) }
        else console.error(ex)
      }
      console.log(bt)  //TODO: something useful
    })

    return this
  }

  private securityError(ex :DOMException) {
    const divAlert = <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>Bluetooth Access Denied ({ex.message})</strong>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    this.el.appendChild(divAlert)
  }

}