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
import { GlobalContext } from './main'
import { jsx, safeCastElement } from './jsx-dom'

// https://developer.chrome.com/docs/capabilities/serial
// https://stackblitz.com/edit/typescript-web-serial?file=index.ts

export function portString(p :SerialPort) :string {
  const inf = p.getInfo()
  const usb = inf.usbVendorId && inf.usbProductId
    ? `USB Device ${inf.usbVendorId.toString(16).padStart(4,'0')}:${inf.usbProductId.toString(16).padStart(4,'0')}` : null
  return inf.bluetoothServiceClassId
    ? `Bluetooth ID: ${inf.bluetoothServiceClassId.toString(16).padStart(4,'0')}` + ( usb ? ` (${usb})` : '' )
    : usb ?? '(unknown device)'
}

export class SerialInterface {

  readonly el
  private readonly btnRequest :HTMLButtonElement
  private readonly ulPorts :HTMLDivElement

  constructor(_ctx :GlobalContext) {
    this.btnRequest = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action"><i class="bi-plus-circle me-1"/> Request New Port</button>)
    this.ulPorts = safeCastElement(HTMLDivElement, <div class="list-group"></div>)
    this.el = 'serial' in navigator
      ? <div class="container border rounded p-3">
        <div class="d-flex flex-column gap-2">
          {this.ulPorts}
        </div>
      </div>
      : <div class="alert alert-danger" role="alert">No serial port support in this browser!</div>
  }

  private async redrawPorts() {
    const ports = await navigator.serial.getPorts()
    const buttons = ports.map(port => {
      const btnPort = safeCastElement(HTMLButtonElement,
        <button type="button" class="list-group-item list-group-item-action"><i class="bi-plug me-1"/> {portString(port)}</button>)
      btnPort.addEventListener('click' , () => this.connect(port))
      return btnPort
    })
    this.ulPorts.replaceChildren(...buttons, this.btnRequest)
  }

  private async connect(port :SerialPort) {
    console.debug('connect', portString(port))
  }

  async initialize() :Promise<this> {
    if (!('serial' in navigator)) return this

    // A port that the user has previously given permission for has appeared:
    navigator.serial.addEventListener('connect', event => {
      console.debug('connect', event.target instanceof SerialPort ? portString(event.target) : event.target)
      return this.redrawPorts()
    })
    navigator.serial.addEventListener('disconnect', event => {
      console.debug('disconnect', event.target instanceof SerialPort ? portString(event.target) : event.target)
      return this.redrawPorts()
    })
    await this.redrawPorts()

    this.btnRequest.addEventListener('click', async () => {
        let port :SerialPort|null = null
        try { port = await navigator.serial.requestPort() }
        catch (ex) { console.info('navigator.serial.requestPort() failed', ex) }
        await this.redrawPorts()
        if (port!=null) await this.connect(port)
    })

    return this
  }

}
