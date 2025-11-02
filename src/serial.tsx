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
import { Collapse } from 'bootstrap'

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

class SerialSettings {
  readonly el :HTMLElement
  readonly btnExpand :HTMLButtonElement
  private readonly selBaudRate
  private readonly dataBits7
  private readonly dataBits8
  private readonly stopBits1
  private readonly stopBits2
  private readonly selParity
  private readonly selFlowCtrl
  constructor(ctx :GlobalContext) {
    this.selBaudRate = safeCastElement(HTMLSelectElement,
      <select class="form-select" id={ctx.genId()}>
        <option value="921600">921600</option>
        <option value="460800">460800</option>
        <option value="230400">230400</option>
        <option value="115200" selected>115200</option>
        <option value="57600">57600</option>
        <option value="38400">38400</option>
        <option value="19200">19200</option>
        <option value="9600">9600</option>
        <option value="4800">4800</option>
      </select>)
    this.dataBits7 = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" value="7" name="dataBits" id={ctx.genId()} />)
    this.dataBits8 = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" value="8" name="dataBits" id={ctx.genId()} checked />)
    this.stopBits1 = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" value="1" name="stopBits" id={ctx.genId()} checked />)
    this.stopBits2 = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="radio" value="2" name="stopBits" id={ctx.genId()} />)
    this.selParity = safeCastElement(HTMLSelectElement,
      <select class="form-select" id={ctx.genId()}>
        <option value="none" selected>None</option>
        <option value="even">Even</option>
        <option value="odd">Odd</option>
      </select>)
    this.selFlowCtrl = safeCastElement(HTMLSelectElement,
      <select class="form-select" id={ctx.genId()}>
        <option value="none" selected>None</option>
        <option value="hardware">Hardware</option>
      </select>)
    this.el =
      <div class="collapse" id={ctx.genId()}>
        <div class="card card-body gap-2">
          <div class="input-group"><label class="input-group-text" for={this.selBaudRate.id}>Baud Rate</label>{this.selBaudRate}</div>
          <div class="input-group">
            <span class="input-group-text">Data Bits</span>
            <div class="input-group-text flex-grow-1 flex-shrink-1"><div class="form-check">
              {this.dataBits7}<label class="form-check-label" for={this.dataBits7.id}>7</label>
            </div></div>
            <div class="input-group-text flex-grow-1 flex-shrink-1"><div class="form-check">
              {this.dataBits8}<label class="form-check-label" for={this.dataBits8.id}>8</label>
            </div></div>
          </div>
          <div class="input-group">
            <span class="input-group-text">Stop Bits</span>
            <div class="input-group-text flex-grow-1 flex-shrink-1"><div class="form-check">
              {this.stopBits1}<label class="form-check-label" for={this.stopBits1.id}>1</label>
            </div></div>
            <div class="input-group-text flex-grow-1 flex-shrink-1"><div class="form-check">
              {this.stopBits2}<label class="form-check-label" for={this.stopBits2.id}>2</label>
            </div></div>
          </div>
          <div class="input-group"><label class="input-group-text" for={this.selParity.id}>Parity</label>{this.selParity}</div>
          <div class="input-group"><label class="input-group-text" for={this.selFlowCtrl.id}>Flow Control</label>{this.selFlowCtrl}</div>
        </div>
      </div>
    this.btnExpand = safeCastElement(HTMLButtonElement,
      <button class="btn btn-outline-primary" type="button"
        data-bs-toggle="collapse" data-bs-target={'#'+this.el.id} aria-expanded="false" aria-controls={this.el.id}>
        <i class="bi-sliders me-1"/> Serial Options</button>)
    this.el.addEventListener('show.bs.collapse', () => {
      this.btnExpand.classList.add('btn-primary')
      this.btnExpand.classList.remove('btn-outline-primary')
    })
    this.el.addEventListener('hidden.bs.collapse', () => {
      this.btnExpand.classList.add('btn-outline-primary')
      this.btnExpand.classList.remove('btn-primary')
    })
  }
  getOptions() :SerialOptions {
    const baud = Number.parseInt(this.selBaudRate.value)
    return {
      baudRate: Number.isFinite(baud) ? baud : 115200,
      dataBits: this.dataBits7.checked ? 7 : 8,
      stopBits: this.stopBits2.checked ? 2 : 1,
      parity: this.selParity.value==='even' ? 'even' : this.selParity.value==='odd' ? 'odd' : 'none',
      flowControl: this.selFlowCtrl.value==='hardware' ? 'hardware' : 'none'
    }
  }
  setDisabled(disabled :boolean = true) {
    //this.btnExpand.disabled = disabled
    this.selBaudRate.disabled = disabled
    this.dataBits7.disabled = disabled
    this.dataBits8.disabled = disabled
    this.stopBits1.disabled = disabled
    this.stopBits2.disabled = disabled
    this.selParity.disabled = disabled
    this.selFlowCtrl.disabled = disabled
  }
  hide() {
    Collapse.getOrCreateInstance(this.el, { toggle: false }).hide()
  }
}

export class SerialInterface {
  readonly ctx :GlobalContext
  readonly el :HTMLElement
  private readonly btnRequest :HTMLButtonElement
  private readonly btnAddBlue :HTMLButtonElement
  private buttons :HTMLButtonElement[] = []
  private readonly ulPorts :HTMLDivElement
  private readonly settings :SerialSettings
  private readonly btnDisconnect :HTMLButtonElement

  /** **Must** call {@link initialize} on new objects! */
  constructor(ctx :GlobalContext) {
    this.ctx = ctx
    this.btnRequest = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-primary">
        <i class="bi-plus-circle me-1"/> Request New Port</button>)
    this.btnAddBlue = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-primary">
        <i class="bi-bluetooth me-1"/> Add custom Bluetooth UUID</button>)
    this.ulPorts = safeCastElement(HTMLDivElement,
      <div class="list-group collapse show" aria-expanded="true" id={ctx.genId()}>{this.btnRequest}{this.btnAddBlue}</div>)
    const btnConnect = safeCastElement(HTMLButtonElement,
      <button class="btn btn-success flex-grow-1" type="button"
        data-bs-toggle="collapse" data-bs-target={'#'+this.ulPorts.id} aria-expanded="false" aria-controls={this.ulPorts.id}>
        <i class="bi-plug-fill me-1"/>Connect</button>)
    this.ulPorts.addEventListener('show.bs.collapse', () => {
      btnConnect.classList.add('btn-success')
      btnConnect.classList.remove('btn-outline-success')
    })
    this.ulPorts.addEventListener('hidden.bs.collapse', () => {
      btnConnect.classList.add('btn-outline-success')
      btnConnect.classList.remove('btn-success')
    })
    this.settings = new SerialSettings(ctx)
    this.btnDisconnect = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-danger flex-grow-1" disabled><i class="bi-x-octagon me-1"/> Disconnect</button>)
    this.settings.btnExpand.classList.add('flex-grow-1')
    this.el = 'serial' in navigator
      ? <div class="container border rounded p-3">
        <div class="d-flex flex-column gap-2">
          <div class="d-flex flex-wrap gap-2">
            {btnConnect} {this.settings.btnExpand} {this.btnDisconnect}
          </div>
          {this.ulPorts}
          {this.settings.el}
        </div>
      </div>
      : <div class="alert alert-danger" role="alert">Web Serial API is not supported in this browser.
        (<a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"
        target="_blank">Browser compatibility table</a>)</div>
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
    this.buttons = ports.map(port => {
      const btnPort = safeCastElement(HTMLButtonElement,
        <button type="button" class="list-group-item list-group-item-action"><i class="bi-plug me-1"/> {portString(port)}</button>)
      if (port.connected) {
        btnPort.addEventListener('click' , () => this.connect(port))
        btnPort.classList.add('list-group-item-success')
      }
      else {
        btnPort.disabled = true
        btnPort.classList.add('list-group-item-warning')
      }
      return btnPort
    })
    this.ulPorts.replaceChildren(...this.buttons, this.btnRequest, this.btnAddBlue)
    this.updateState()
  }

  private async connect(port :SerialPort) {
    const opt = this.settings.getOptions()
    console.debug('connect', portString(port), opt)
    this.settings.hide()
    Collapse.getOrCreateInstance(this.ulPorts, { toggle: false }).hide()
    this.updateState({ connected: true })
    setTimeout(() => this.updateState({ connected: false }), 5_000)  //TODO
    //alert(`Connect to ${portString(port)} not yet implemented`)
  }

  private connected :boolean = false
  private updateState(state ?:{ connected :boolean }) {
    const connected = state ? state.connected : this.connected
    this.settings.setDisabled(connected)
    this.btnRequest.disabled = connected
    this.buttons.forEach(btn => btn.disabled = connected)
    this.btnDisconnect.disabled = !connected
    this.connected = connected
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
      const uuid = (await userInput(this.ctx, 'Add custom Bluetooth Service Class ID',
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
