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
import { userInput } from './dialogs'

// https://developer.chrome.com/docs/capabilities/serial
// https://stackblitz.com/edit/typescript-web-serial?file=index.ts

export function portString(p :SerialPort) :string {
  const inf = p.getInfo()
  const usb = inf.usbVendorId && inf.usbProductId
    ? `USB Device ${inf.usbVendorId.toString(16).padStart(4,'0')}:${inf.usbProductId.toString(16).padStart(4,'0')}` : null
  return inf.bluetoothServiceClassId
    ? `Bluetooth ID: ${typeof inf.bluetoothServiceClassId === 'number'
      ? inf.bluetoothServiceClassId.toString(16).padStart(4,'0') : inf.bluetoothServiceClassId}`
      + ( usb ? ` (${usb})` : '' )
    : usb ?? '(unknown device)'
}

export class SerialInterface {
  readonly el :HTMLElement
  private readonly btnRequest :HTMLButtonElement
  private readonly btnAddBlue :HTMLButtonElement
  private readonly ulPorts :HTMLDivElement

  /** **Must** call {@link initialize} on new objects! */
  constructor(_ctx :GlobalContext) {
    this.btnRequest = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-secondary">
        <i class="bi-plus-circle me-1"/> Request New Port</button>)
    this.btnAddBlue = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-secondary">
        <i class="bi-bluetooth me-1"/> Add custom Bluetooth UUID</button>)
    this.ulPorts = safeCastElement(HTMLDivElement, <div class="list-group">{this.btnRequest}{this.btnAddBlue}</div>)
    this.el = 'serial' in navigator
      ? <div class="container border rounded p-3">
        <div class="d-flex flex-column gap-2">
          {this.ulPorts}
        </div>
      </div>
      : <div class="alert alert-danger" role="alert">Web Serial API is not supported in this browser.
        (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility" target="_blank"
        class="ms-1">Browser compatibility table</a>)</div>
  }

  private securityError(ex :DOMException) {
    const divAlert = <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>Serial Port Access Denied ({ex.message})</strong>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    this.el.appendChild(divAlert)
  }

  private async redrawPorts() :Promise<void> {
    let ports :SerialPort[]
    try { ports = await navigator.serial.getPorts() }
    catch (ex) {
      if (ex instanceof DOMException && ex.name === 'SecurityError') { this.securityError(ex); return }
      else { console.error(ex); return }
    }
    const buttons = ports.map(port => {
      const btnPort = safeCastElement(HTMLButtonElement,
        <button type="button" class="list-group-item list-group-item-action"><i class="bi-plug me-1"/> {portString(port)}</button>)
      if (port.connected)
        btnPort.addEventListener('click' , () => this.connect(port))
      else btnPort.disabled = true
      return btnPort
    })
    this.ulPorts.replaceChildren(...buttons, this.btnRequest, this.btnAddBlue)
  }

  private async connect(port :SerialPort) {
    console.debug('connect', portString(port))  //TODO
    alert(`Connect to ${portString(port)} not yet implemented`)
  }

  async initialize() :Promise<this> {
    if (!('serial' in navigator)) return this

    navigator.serial.addEventListener('connect', ({ target: port }) => {
      // A port that the user has previously given permission for has appeared
      console.debug('connect', port instanceof SerialPort ? portString(port) : port)
      return this.redrawPorts()
    })
    navigator.serial.addEventListener('disconnect', ({ target: port }) => {
      console.debug('disconnect', port instanceof SerialPort ? portString(port) : port)
      return this.redrawPorts()
    })
    await this.redrawPorts()

    const bluetoothUuids :Set<string> = new Set()  //TODO Later: Save in storage
    this.btnRequest.addEventListener('click', async () => {
      let port :SerialPort|null = null
      try { port = await navigator.serial.requestPort({ allowedBluetoothServiceClassIds: Array.from(bluetoothUuids) }) }
      catch (ex) {
        if (ex instanceof DOMException && ex.name === 'NotFoundError') {/* user canceled, ignore */}
        else if (ex instanceof DOMException && ex.name === 'SecurityError') { this.securityError(ex) }
        else console.error(ex)
      }
      await this.redrawPorts()
      if (port!=null) await this.connect(port)
    })
    this.btnAddBlue.addEventListener('click', async () => {
      // The user entering a string that is not a UUID apparently causes requestPort() to completely blow up, so be restrictive
      const uuid = (await userInput('Add custom Bluetooth Service Class ID',
        { pattern: '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$',
          placeholder: '12345678-12ab-34cd-56ef-ab0123456789' })).trim().toLowerCase()
      if (uuid.match(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/)) {
        bluetoothUuids.add(uuid)
        console.log('UUIDs', bluetoothUuids)
      }
    })

    return this
  }

}
