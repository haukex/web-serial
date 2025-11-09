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
import { BinaryOutput, TextOutput } from './outputs'
import { BinaryInput, TextInput } from './inputs'
import { BluetoothUuidStore } from './bt-uuid'
import { SerialSettings } from './settings'
import { GlobalContext } from './main'
import { userInput } from './dialogs'
import { Collapse } from 'bootstrap'
import { ui8str } from './utils'

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
  readonly ctx :GlobalContext
  readonly el :HTMLElement
  private readonly btnRequest :HTMLButtonElement
  private readonly btnAddBlue :HTMLButtonElement
  private readonly btnBTScan :HTMLButtonElement
  private buttons :HTMLButtonElement[] = []
  private readonly ulPorts :HTMLDivElement
  private readonly settings :SerialSettings
  private readonly btnDisconnect :HTMLButtonElement
  private readonly divConnected :HTMLDivElement

  private readonly textOutput :TextOutput
  private readonly textInput :TextInput

  private readonly binaryOutput: BinaryOutput
  private readonly binaryInput :BinaryInput

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
        <i class="bi-bluetooth"/><i class="bi-node-plus me-1"/> Add custom Bluetooth UUID</button>)
    this.btnBTScan = safeCastElement(HTMLButtonElement,
      <button type="button" class="list-group-item list-group-item-action list-group-item-primary" disabled>
        <i class="bi-bluetooth"/><i class="bi-patch-question me-1"/> Scan for Bluetooth devices</button>)
    this.ulPorts = safeCastElement(HTMLDivElement,
      <div class="list-group collapse show" aria-expanded="true" id={ctx.genId()}>
        {this.btnRequest}{this.btnAddBlue}{this.btnBTScan}</div>)
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

    this.textOutput = new TextOutput()
    this.textInput = new TextInput(ctx)

    this.binaryOutput = new BinaryOutput()
    this.binaryInput = new BinaryInput(ctx)

    const panelText = <div class="tab-pane fade show active" id={ctx.genId()} role="tabpanel">
      <div class="d-flex flex-column gap-2">{this.textOutput.el}{this.textInput.el}</div></div>
    const panelBinary = <div class="tab-pane fade" id={ctx.genId()} role="tabpanel">
      <div class="d-flex flex-column gap-2">{this.binaryOutput.el}{this.binaryInput.el}</div></div>
    const tabText = <button type="button" role="tab" class="nav-link active" id={ctx.genId()}
      data-bs-toggle="tab" data-bs-target={'#'+panelText.id} aria-controls={panelText.id} aria-selected="true">Text</button>
    const tabBinary = <button type="button" role="tab" class="nav-link" id={ctx.genId()}
      data-bs-toggle="tab" data-bs-target={'#'+panelBinary.id} aria-controls={panelBinary.id} aria-selected="false">Binary</button>
    panelText.setAttribute('aria-labelledby', tabText.id)
    panelBinary.setAttribute('aria-labelledby', tabBinary.id)
    tabText.addEventListener('shown.bs.tab', () => this.textOutput.shown())
    tabBinary.addEventListener('shown.bs.tab', () => this.binaryOutput.shown())
    this.divConnected = safeCastElement(HTMLDivElement,
      <div class="container border rounded p-3 collapse">
        <nav><div class="nav nav-tabs mb-2" role="tablist">{tabText}{tabBinary}</div></nav>
        <div class="tab-content">{panelText}{panelBinary}</div>
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
      btnPort.addEventListener('click' , () => this.connect(port))
      btnPort.classList.add(port.connected ? 'list-group-item-success' : 'list-group-item-warning')
      return btnPort
    })
    this.ulPorts.replaceChildren(...this.buttons, this.btnRequest, this.btnAddBlue, this.btnBTScan)
    this.updateState()
  }

  private async initialize() :Promise<this> {
    if (!('serial' in navigator)) return this

    navigator.serial.addEventListener('connect', ({ target: port }) => {
      // A port that the user has previously given permission for has appeared
      console.debug('connect event', port instanceof SerialPort ? portString(port) : port)
      return this.redrawPorts()
    })
    navigator.serial.addEventListener('disconnect', ({ target: port }) => {
      console.debug('disconnect event', port instanceof SerialPort ? portString(port) : port)
      return this.redrawPorts()
    })
    await this.redrawPorts()

    const btUuid = await BluetoothUuidStore.new(this.ctx)
    this.btnRequest.addEventListener('click', async () => {
      let port :SerialPort|null = null
      try { port = await navigator.serial.requestPort({ allowedBluetoothServiceClassIds: btUuid.uuids }) }
      catch (ex) {
        if (ex instanceof DOMException && ex.name === 'NotFoundError') {/* user canceled, ignore */}
        else if (ex instanceof DOMException && ex.name === 'SecurityError') { this.securityError(ex) }
        else console.error(ex)
      }
      await this.redrawPorts()
      if (port!=null) await this.connect(port)
    })
    this.btnAddBlue.addEventListener('click', async () =>
      btUuid.add( (await userInput(this.ctx, {
        title: <><i class="bi-bluetooth me-1"/> Add custom Bluetooth Service Class ID</>,
        message: btUuid.uuids.length ? <div>Already defined:<ul>{btUuid.uuids.map(uuid => <li>{uuid.toUpperCase()}</li>)}</ul></div> : '',
        pattern: BluetoothUuidStore.PAT, placeholder: BluetoothUuidStore.BASE.toUpperCase() })) ) )

    if ('bluetooth' in navigator) {
      this.btnBTScan.addEventListener('click', async () => {
        let bt = null
        try { bt = await navigator.bluetooth.requestDevice({ acceptAllDevices: true }) }
        catch (ex) {
          if (ex instanceof DOMException && ex.name === 'NotFoundError') {/* Assume cancelled, though the docs don't say that. */}
          else if (ex instanceof DOMException && ex.name === 'SecurityError') { alert(`Bluetooth Access Denied: ${String(ex)}`) }
          else console.error(ex)
        }
        if (bt!=null) alert(`You selected the device "${bt.name}" with ID "${bt.id}".`)
      })
      this.btnBTScan.disabled = false
    }

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
    this.textInput.setDisabled(!connected)
    this.binaryInput.setDisabled(!connected)
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

    const readTextLoop = async () => {
      try {
        while (true) {
          let rv :ReadableStreamReadResult<string>
          try { rv = await textReader.read() }
          /* Since this is a `tee`ed reader, assume that we should be getting the same errors as the other one, so handle them there. */
          catch (ex) { console.debug('Breaking readTextLoop because', ex); break }
          if (rv.value!=undefined) this.textOutput.appendRx(rv.value)
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
          if (rv.value!=undefined) this.binaryOutput.appendRx(rv.value)
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

    const txEncoder = new TextEncoder()  // always UTF-8
    const txDecoder = new TextDecoder('UTF-8', { fatal: false, ignoreBOM: false })
    const writeToPort = async (data :Uint8Array|string) => {
      if (port.writable==null) throw new Error('write on closed port')
      if (!data.length) return
      const bytesWriter = port.writable.getWriter()
      const out = typeof data === 'string' ? txEncoder.encode(data) : data
      await bytesWriter.write(out)
      bytesWriter.releaseLock()
      if (typeof data === 'string') {
        console.debug('wrote string', JSON.stringify(data))
        this.textOutput.appendTx(data)
        this.binaryOutput.appendTx(out)
      } else {
        console.debug('wrote bytes', ui8str(data))
        this.textOutput.appendTx(txDecoder.decode(data))
        this.binaryOutput.appendTx(data)
      }
    }
    this.textInput.writer = writeToPort
    this.binaryInput.writer = writeToPort

    const closeHandler = async () => {
      console.debug('closing')
      keepReading = false
      this.btnDisconnect.removeEventListener('click', closeHandler)
      this.textInput.writer = null
      this.binaryInput.writer = null
      //TODO Later: Consider that users might still want to see the output upon disconnect
      this.textOutput.clear()
      this.binaryOutput.clear()
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
