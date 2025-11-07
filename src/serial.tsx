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
import { jsx, jsxFragment, safeCastElement } from './jsx-dom'
import { GlobalContext } from './main'
import { userInput } from './dialogs'
import { Collapse } from 'bootstrap'

// spell-checker: ignore BTUUID RFCOMM

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
  private readonly inpBaudRate
  private readonly dataBits7
  private readonly dataBits8
  private readonly stopBits1
  private readonly stopBits2
  private readonly selParity
  private readonly selFlowCtrl
  private readonly selEncoding
  constructor(ctx :GlobalContext) {
    const datalistBaud = safeCastElement(HTMLDataListElement,
      <datalist id={ctx.genId()}>
        <option value="921600" />
        <option value="460800" />
        <option value="230400" />
        <option value="115200" />
        <option value="57600" />
        <option value="38400" />
        <option value="19200" />
        <option value="9600" />
        <option value="4800" />
      </datalist>)
    this.inpBaudRate = safeCastElement(HTMLInputElement,
      <input class="form-control" list={datalistBaud.id} id={ctx.genId()} type="number" min="1" value="115200"/>)
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
    //TODO Later: Could list a whole lot more Encodings from https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings
    this.selEncoding = safeCastElement(HTMLSelectElement,
      <select class="form-select" id={ctx.genId()}>
        <option value="utf-8" selected>UTF-8</option>
        <option value="windows-1252">CP1252 / Latin-1</option>
        <option value="utf-16le">UTF-16 (LE)</option>
        <option value="utf-16be">UTF-16 BE</option>
      </select>)
    this.el =
      <div class="collapse" id={ctx.genId()}>
        <div class="card card-body gap-2">
          <div class="input-group">
            <label class="input-group-text" for={this.inpBaudRate.id}>Baud Rate</label>{this.inpBaudRate}{datalistBaud}</div>
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
          <div class="input-group"><label class="input-group-text" for={this.selEncoding.id}>Input Encoding</label>{this.selEncoding}</div>
        </div>
      </div>
    this.btnExpand = safeCastElement(HTMLButtonElement,
      <button class="btn btn-outline-primary" type="button"
        data-bs-toggle="collapse" data-bs-target={'#'+this.el.id} aria-expanded="false" aria-controls={this.el.id}>
        <i class="bi-sliders me-1"/> Options</button>)
    this.el.addEventListener('show.bs.collapse', () => {
      this.btnExpand.classList.add('btn-primary')
      this.btnExpand.classList.remove('btn-outline-primary')
    })
    this.el.addEventListener('hidden.bs.collapse', () => {
      this.btnExpand.classList.add('btn-outline-primary')
      this.btnExpand.classList.remove('btn-primary')
    })
  }
  getSerialOptions() :SerialOptions {
    return {
      baudRate: Number.isFinite(this.inpBaudRate.valueAsNumber) && this.inpBaudRate.valueAsNumber>0
        ? this.inpBaudRate.valueAsNumber : 115200,
      dataBits: this.dataBits7.checked ? 7 : 8,
      stopBits: this.stopBits2.checked ? 2 : 1,
      parity: this.selParity.value==='even' ? 'even' : this.selParity.value==='odd' ? 'odd' : 'none',
      flowControl: this.selFlowCtrl.value==='hardware' ? 'hardware' : 'none'
    }
  }
  getEncoding() :string {
    return this.selEncoding.value
  }
  setDisabled(disabled :boolean = true) {
    //this.btnExpand.disabled = disabled
    this.inpBaudRate.disabled = disabled
    this.dataBits7.disabled = disabled
    this.dataBits8.disabled = disabled
    this.stopBits1.disabled = disabled
    this.stopBits2.disabled = disabled
    this.selParity.disabled = disabled
    this.selFlowCtrl.disabled = disabled
    this.selEncoding.disabled = disabled
  }
  hide() {
    Collapse.getOrCreateInstance(this.el, { toggle: false }).hide()
  }
}

class BTUUID {
  /* `allowedBluetoothServiceClassIds` containing a string that is not a UUID apparently causes requestPort()
   * to completely blow up, so be restrictive. Apparently even the hex digits being uppercase causes a hard crash.
   * Appears to be this issue: https://issues.chromium.org/issues/328304137 */
  private static readonly REGEX = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/
  static readonly BASE = '00000000-0000-1000-8000-00805F9B34FB'
  static readonly PAT = '^([0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}|(0x)?[0-9a-fA-F]{1,8})$'
  readonly ctx
  private _uuids :string[] = []
  static new(ctx :GlobalContext) :Promise<BTUUID> {
    return new BTUUID(ctx).initialize()
  }
  private constructor(ctx :GlobalContext) { this.ctx = ctx }
  private async initialize() :Promise<this> {
    this._uuids = Array.from( new Set(
      ( await this.ctx.storage.settings.get('bluetoothUuids') ).filter( uuid => uuid.match(BTUUID.REGEX) ) ) )
    this._uuids.sort()
    return this
  }
  get uuids() :string[] { return this._uuids }
  async add(uuid :string) :Promise<boolean> {
    uuid = uuid.trim().toLowerCase()
    /* Handle short form ID (we'll be flexible and allow up to 8 hex digits) - for example, 0x0003 is RFCOMM:
     * https://bitbucket.org/bluetooth-SIG/public/src/797ee709/assigned_numbers/uuids/protocol_identifiers.yaml#lines-39
     * Which, according to the comments here: https://stackoverflow.com/a/21760106 means 00030000-... */
    if (uuid.match(/^(?:0x)?[0-9a-f]{1,8}$/))  //
      uuid = ( uuid.startsWith('0x') ? uuid.substring(2) : uuid ).padEnd(8,'0') + BTUUID.BASE.substring(8).toLowerCase()
    if ( !uuid.match(BTUUID.REGEX) || this._uuids.includes(uuid) ) return false
    this._uuids.push(uuid)
    this._uuids.sort()
    await this.ctx.storage.settings.set('bluetoothUuids', this._uuids)
    console.debug('UUIDs', this._uuids)
    return true
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
  private readonly divConnected :HTMLDivElement

  private readonly divTextOut :HTMLDivElement
  private readonly textOutput :HTMLElement
  private readonly inpSendText :HTMLInputElement
  private readonly selEol :HTMLSelectElement
  private readonly btnSendText :HTMLButtonElement

  private readonly divBinaryOut :HTMLDivElement
  private readonly binaryOutput: HTMLElement
  private readonly inpSendBytes :HTMLInputElement
  private readonly btnSendBytes :HTMLButtonElement

  static new(ctx :GlobalContext) :Promise<SerialInterface> {
    return new SerialInterface(ctx).initialize()
  }

  private constructor(ctx :GlobalContext) {
    this.ctx = ctx
    this.btnRequest = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-primary">
        <i class="bi-plus-circle me-1"/> Request New Port</button>)
    this.btnAddBlue = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-primary">
        <i class="bi-bluetooth me-1"/> Add custom Bluetooth UUID</button>)
    this.ulPorts = safeCastElement(HTMLDivElement,
      <div class="list-group collapse show" aria-expanded="true" id={ctx.genId()}>{this.btnRequest}{this.btnAddBlue}</div>)
    const btnShowPorts = safeCastElement(HTMLButtonElement,
      <button class="btn btn-success flex-grow-1" type="button"
        data-bs-toggle="collapse" data-bs-target={'#'+this.ulPorts.id} aria-expanded="false" aria-controls={this.ulPorts.id}>
        <i class="bi-plug-fill me-1"/>Ports</button>)
    this.ulPorts.addEventListener('show.bs.collapse', () => {
      btnShowPorts.classList.add('btn-success')
      btnShowPorts.classList.remove('btn-outline-success')
    })
    this.ulPorts.addEventListener('hidden.bs.collapse', () => {
      btnShowPorts.classList.add('btn-outline-success')
      btnShowPorts.classList.remove('btn-success')
    })
    this.settings = new SerialSettings(ctx)
    this.btnDisconnect = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-danger flex-grow-1" disabled><i class="bi-x-octagon me-1"/> Disconnect</button>)
    this.settings.btnExpand.classList.add('flex-grow-1')

    this.textOutput = safeCastElement(HTMLPreElement, <pre></pre>)
    this.divTextOut = safeCastElement(HTMLDivElement, <div class="border rounded p-2 max-vh-50 overflow-auto">{this.textOutput}</div>)
    this.btnSendText = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-primary" id={ctx.genId()} disabled><i class="bi-send me-1"/> Send UTF-8</button>)
    this.inpSendText = safeCastElement(HTMLInputElement,
      <input class="form-control" type="text" aria-describedby={this.btnSendText.id}/>)
    this.selEol = safeCastElement(HTMLSelectElement,
      <select class="form-select flex-grow-0 flex-shrink-0" style="min-width: 6rem">
        <option value="CRLF" selected>CRLF</option>
        <option value="LF">LF</option>
        <option value="CR">CR</option>
        <option value="none">None</option>
      </select>)

    this.binaryOutput = safeCastElement(HTMLPreElement, <pre></pre>)
    this.divBinaryOut = safeCastElement(HTMLDivElement, <div class="border rounded p-2 max-vh-50 overflow-auto">{this.binaryOutput}</div>)
    this.btnSendBytes = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-primary" id={ctx.genId()} disabled><i class="bi-send me-1"/> Send Bytes</button>)
    this.inpSendBytes = safeCastElement(HTMLInputElement,
      <input class="form-control" type="text" pattern="^(0x)?([0-9a-fA-F]{2} ?)+$" aria-describedby={this.btnSendBytes.id}/>)

    const idNavTextTab = ctx.genId()
    const idNavText = ctx.genId()
    const idNavBinaryTag = ctx.genId()
    const idNavBinary = ctx.genId()
    this.divConnected = safeCastElement(HTMLDivElement,
      <div class="container border rounded p-3 collapse">
        <nav>
          <div class="nav nav-tabs mb-2" role="tablist">
            <button type="button" role="tab" class="nav-link active" id={idNavTextTab}
              data-bs-toggle="tab" data-bs-target={'#'+idNavText} aria-controls={idNavText} aria-selected="true">Text</button>
            <button type="button" role="tab" class="nav-link" id={idNavBinaryTag}
              data-bs-toggle="tab" data-bs-target={'#'+idNavBinary} aria-controls={idNavBinary} aria-selected="false">Binary</button>
          </div>
        </nav>
        <div class="tab-content">
          <div class="tab-pane fade show active" id={idNavText} role="tabpanel" aria-labelledby={idNavTextTab} tabindex="0">
            <div class="d-flex flex-column gap-2">
              {this.divTextOut}
              <div class="input-group">{this.inpSendText}{this.selEol}{this.btnSendText}</div>
            </div>
          </div>
          <div class="tab-pane fade" id={idNavBinary} role="tabpanel" aria-labelledby={idNavBinaryTag} tabindex="0">
            <div class="d-flex flex-column gap-2">
              {this.divBinaryOut}
              <div class="input-group">{this.inpSendBytes}{this.btnSendBytes}</div>
            </div>
          </div>
        </div>
      </div>)
    this.el = 'serial' in navigator
      ? <div class="d-flex flex-column gap-3">
        <div class="container border rounded p-3">
          <div class="d-flex flex-column gap-2">
            <div class="d-flex flex-wrap gap-2">
              {btnShowPorts} {this.settings.btnExpand} {this.btnDisconnect}
            </div>
            {this.ulPorts}
            {this.settings.el}
          </div>
        </div>
        {this.divConnected}
      </div>
      : <div class="alert alert-danger" role="alert">
        <i class="bi-exclamation-octagon me-2" />
        <strong class="me-1">Web Serial API is not supported in this browser.</strong><hr/>
        The <em>Web Serial API</em> is an experimental technology that does not appear to be supported by your browser.
        Please see the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility"
          target="_blank">browser compatibility table</a>.</div>
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

  private async initialize() :Promise<this> {
    if (!('serial' in navigator)) return this

    navigator.serial.addEventListener('connect', ({ target: port }) => {
      // A port that the user has previously given permission for has appeared
      console.debug('connect event', port instanceof SerialPort ? portString(port) : port)
      return this.redrawPorts()
      //TODO Later: Auto-(re-)connect to a port if it was just disconnected?
    })
    navigator.serial.addEventListener('disconnect', ({ target: port }) => {
      console.debug('disconnect event', port instanceof SerialPort ? portString(port) : port)
      return this.redrawPorts()
    })
    await this.redrawPorts()

    const btuuid = await BTUUID.new(this.ctx)
    this.btnRequest.addEventListener('click', async () => {
      let port :SerialPort|null = null
      try { port = await navigator.serial.requestPort({ allowedBluetoothServiceClassIds: btuuid.uuids }) }
      catch (ex) {
        if (ex instanceof DOMException && ex.name === 'NotFoundError') {/* user canceled, ignore */}
        else if (ex instanceof DOMException && ex.name === 'SecurityError') { this.securityError(ex) }
        else console.error(ex)
      }
      await this.redrawPorts()
      if (port!=null && port.connected) await this.connect(port)
    })
    this.btnAddBlue.addEventListener('click', async () =>
      btuuid.add( (await userInput(this.ctx, {
        title: <><i class="bi-bluetooth me-1"/> Add custom Bluetooth Service Class ID</>,
        message: btuuid.uuids.length ? <div>Already defined:<ul>{btuuid.uuids.map(uuid => <li>{uuid.toUpperCase()}</li>)}</ul></div> : '',
        pattern: BTUUID.PAT, placeholder: BTUUID.BASE.toUpperCase() })) ) )

    let btPermission :PermissionStatus|null = null
    try { btPermission = await navigator.permissions.query({ name: 'bluetooth' as PermissionName }) }
    catch (_) {/* Browser probably doesn't know about "bluetooth" permission name */}
    if ( btPermission!=null && btPermission.state!=='granted' )
      this.el.appendChild(<div class="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>No Bluetooth permissions (yet).</strong><hr/>
        You need to grant this page/app/browser permissions to use Bluetooth in order to be able to access Bluetooth serial ports.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>)

    return this
  }

  private securityError(ex :DOMException) {
    const divAlert = <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong>Serial Port Access Denied ({ex.message})</strong>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
    this.el.appendChild(divAlert)
  }

  private connected :boolean = false
  private updateState(state ?:{ connected :boolean }) {
    const connected = state ? state.connected : this.connected
    this.settings.setDisabled(connected)
    this.btnRequest.disabled = connected
    this.buttons.forEach(btn => btn.disabled = connected)
    this.btnDisconnect.disabled = !connected
    this.btnDisconnect.classList.toggle('btn-danger', connected)
    this.btnDisconnect.classList.toggle('btn-outline-danger', !connected)
    this.btnSendText.disabled = !connected
    this.btnSendBytes.disabled = !connected
    this.connected = connected
    const collPorts = Collapse.getOrCreateInstance(this.ulPorts, { toggle: false })
    const collConn = Collapse.getOrCreateInstance(this.divConnected, { toggle: false })
    if (state && state.connected) {
      this.settings.hide()
      collPorts.hide()
      collConn.show()
    } else if (state && !state.connected) {
      collPorts.show()
      collConn.hide()
    }
  }

  private async connect(port :SerialPort) {
    const opt = this.settings.getSerialOptions()
    console.debug('open', portString(port), opt)
    this.updateState({ connected: true })

    try { await port.open(opt) }
    catch (ex) {
      alert(`Failed to open serial port: ${String(ex)}`)
      this.updateState({ connected: false })
      return
    }

    // https://developer.chrome.com/docs/capabilities/serial

    let keepReading = true
    let textReader :ReadableStreamDefaultReader<string>
    let bytesReader :ReadableStreamDefaultReader<Uint8Array>

    const ui8str = (b :Uint8Array) => Array.prototype.map.call(b, (x :number) => x.toString(16).padStart(2,'0')).join('')

    const rxText = (text :string) => {
      //TODO: Switching tabs does weird stuff with the contents
      this.textOutput.innerText += text
      //TODO: scroll to bottom (unless user has scrolled elsewhere)
      //TODO: Trim output size
    }
    const rxBytes = (bytes :Uint8Array) => {
      //TODO: Same as text output above
      this.binaryOutput.innerText += ui8str(bytes)+'\n'
    }

    const readTextLoop = async () => {
      try {
        while (true) {
          let rv :ReadableStreamReadResult<string>
          try { rv = await textReader.read() }
          /* Since this is a teed reader, assume that we should be getting the same errors as the other one, so handle them there. */
          catch (ex) { console.debug('Breaking readTextLoop because', ex); break }
          if (rv.value!=undefined) rxText(rv.value)
          if (rv.done) break
        }
      } finally { textReader.releaseLock() }
    }
    const readBytesLoop = async () => {
      try {
        while (true) {
          let rv :ReadableStreamReadResult<Uint8Array>
          try { rv = await bytesReader.read() }
          /* If port.readable is still set afterwards, this is non-fatal, such as a buffer overflow, framing error, or parity error. */
          catch (ex) { console.warn('Breaking readBytesLoop because', ex); break }
          if (rv.value!=undefined) rxBytes(rv.value)
          if (rv.done) break
        }
      } finally { bytesReader.releaseLock() }
    }

    const readUntilClosed = async () => {
      while (port.readable && keepReading) {
        const [readRaw, readTxt] = port.readable.tee()
        bytesReader = readRaw.getReader()
        const textDecoder = new TextDecoderStream(this.settings.getEncoding(), { fatal: false, ignoreBOM: false })
        const txtClosed = readTxt.pipeTo(textDecoder.writable as WritableStream<Uint8Array>)
        textReader = textDecoder.readable.getReader()
        await Promise.all([ readTextLoop(), readBytesLoop(),
          txtClosed.catch((ex :unknown) => { console.debug('Ignoring', ex) /* Ignore this error as per Chrome docs */ }) ])
      }
      if (keepReading) {  // user didn't disconnect, so the device must have
        keepReading = false  // ensure there aren't any recursive calls (shouldn't be; just in case)
        setTimeout(closeHandler)  // don't await to prevent deadlock
      }
      await port.close()
    }
    const readUntilClosedPromise = readUntilClosed()

    const encoder = new TextEncoder()
    const writeString = async (s :string) => {
      if (port.writable==null) throw new Error('write on closed port')
      const bytesWriter = port.writable.getWriter()
      await bytesWriter.write(encoder.encode(s))
      bytesWriter.releaseLock()
      console.debug('wrote text', s)
    }
    const writeBytes = async (b :Uint8Array) => {
      if (port.writable==null) throw new Error('write on closed port')
      const bytesWriter = port.writable.getWriter()
      await bytesWriter.write(b)
      bytesWriter.releaseLock()
      console.debug('wrote bytes', ui8str(b))
    }

    //TODO: support enter key in text boxes
    const sendTextHandler = async () => {
      let eol = '\r\n'
      switch (this.selEol.value) {
        case 'LF': eol = '\n'; break
        case 'CR': eol = '\r'; break
        case 'none': eol = ''; break
      }
      await writeString(this.inpSendText.value+eol)
      this.inpSendText.value = ''
    }
    this.btnSendText.addEventListener('click', sendTextHandler)

    const sendBytesHandler = async () => {
      let txt = this.inpSendBytes.value.trim()
      if (txt.startsWith('0x')) txt = txt.substring(2)
      await writeBytes(new Uint8Array(
        txt.toLowerCase().replace(/[^0-9a-f]/g, '').match(/.{1,2}/g)?.map(h => parseInt(h, 16)) ?? [] ))
      this.inpSendBytes.value = ''
    }
    this.btnSendBytes.addEventListener('click', sendBytesHandler)

    const closeHandler = async () => {
      console.debug('closing')
      keepReading = false
      this.btnSendText.removeEventListener('click', sendTextHandler)
      this.btnSendBytes.removeEventListener('click', sendBytesHandler)
      this.btnDisconnect.removeEventListener('click', closeHandler)
      this.inpSendText.value = ''
      this.inpSendBytes.value = ''
      this.textOutput.innerText = ''
      this.binaryOutput.innerText = ''
      // the following two may fail if the remote device disconnected
      try { await textReader.cancel() } catch (ex) { console.debug('Ignoring', ex) }
      try { await bytesReader.cancel() } catch (ex) { console.debug('Ignoring', ex) }
      await readUntilClosedPromise
      console.debug('closed', portString(port))
      this.updateState({ connected: false })
    }
    this.btnDisconnect.addEventListener('click', closeHandler)

  }

}
