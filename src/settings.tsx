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
import { Collapse } from 'bootstrap'

//TODO Later: Could save serial and other settings in storage (encoding, display non-printable, line endings, ...)

export class SerialSettings {
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
    // In theory I could list a whole lot more Encodings from https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings
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
          <div class="alert alert-warning mb-0" role="alert"><i class="bi-exclamation-triangle me-1"/>
            Note that serial port settings will not take effect for Bluetooth serial ports!
            Only <em>Input Encoding</em> will be applied.</div>
          <div class="input-group">
            <label class="input-group-text" for={this.inpBaudRate.id}>Baud Rate</label>{this.inpBaudRate}{datalistBaud}</div>
          <div class="input-group">
            <span class="input-group-text">Data Bits</span>
            <div class="input-group-text flex-grow-1 flex-shrink-1" onclick={()=>this.dataBits7.click()}><div class="form-check">
              {this.dataBits7}<label class="form-check-label" for={this.dataBits7.id}>7</label>
            </div></div>
            <div class="input-group-text flex-grow-1 flex-shrink-1" onclick={()=>this.dataBits8.click()}><div class="form-check">
              {this.dataBits8}<label class="form-check-label" for={this.dataBits8.id}>8</label>
            </div></div>
          </div>
          <div class="input-group">
            <span class="input-group-text">Stop Bits</span>
            <div class="input-group-text flex-grow-1 flex-shrink-1" onclick={()=>this.stopBits1.click()}><div class="form-check">
              {this.stopBits1}<label class="form-check-label" for={this.stopBits1.id}>1</label>
            </div></div>
            <div class="input-group-text flex-grow-1 flex-shrink-1" onclick={()=>this.stopBits2.click()}><div class="form-check">
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
    this.el.addEventListener('shown.bs.collapse', () => ctx.scrollTo(this.el))
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
