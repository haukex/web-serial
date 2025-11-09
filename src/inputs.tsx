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

type InputWriter<T extends NonNullable<unknown>> = (data :T) => Promise<void>

const MAX_HISTORY_SIZE = 1000

abstract class InputBox<T extends NonNullable<unknown>> {
  readonly el :HTMLFormElement
  protected readonly inpGrp :HTMLDivElement
  protected readonly input :HTMLInputElement
  protected readonly button :HTMLButtonElement
  private _writer :InputWriter<T>|null = null
  constructor(ctx :GlobalContext, label :string) {
    this.button = safeCastElement(HTMLButtonElement,
      <button type="submit" class="btn btn-outline-primary" id={ctx.genId()} disabled><i class="bi-send me-1"/>
        <span class="d-none d-md-inline">Send </span>{label}</button>)
    this.input = safeCastElement(HTMLInputElement,
      <input class="form-control font-monospace" type="text" aria-describedby={this.button.id} autocomplete="off" />)
    this.inpGrp = safeCastElement(HTMLDivElement, <div class="input-group">{this.input}{this.button}</div>)
    this.el = safeCastElement(HTMLFormElement, <form>{this.inpGrp}</form>)

    const history :string[] = []  // could perhaps store this in the storage someday
    let historyIndex = -1
    let currentInput = ''
    this.el.addEventListener('submit', async event => {
      event.preventDefault()
      if (!this._writer) throw new Error('Attempt to send when no writer set; shouldn\'t happen!')
      if (!this.el.checkValidity()) return
      await this._writer(this.getTxData())
      // add current input to history
      const hi = history.indexOf(this.input.value)
      if (hi>-1) history.splice(hi, 1)
      history.unshift(this.input.value)
      if (history.length>MAX_HISTORY_SIZE) history.pop()
      // clear the input box
      this.clear()
      historyIndex = -1
      currentInput = ''
    })
    this.input.addEventListener('keydown', event => {
      if (event.defaultPrevented) return
      if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key=='ArrowUp') {
        if (historyIndex<0) currentInput = this.input.value
        if (++historyIndex>=history.length) historyIndex=history.length-1
        else this.input.value = history[historyIndex] ?? ''
        event.preventDefault()
        event.stopPropagation()
      }
      else if (event.key=='ArrowDown') {
        if (historyIndex>=0) {
          if (--historyIndex<0) this.input.value = currentInput
          else this.input.value = history[historyIndex] ?? ''
        }
        event.preventDefault()
        event.stopPropagation()
      }
    })
  }
  set writer(w :InputWriter<T>|null) {
    this._writer = w
    if (!w) {
      this.clear()
      this.setDisabled(true)
    }
  }
  setDisabled(disabled :boolean = true) {
    this.input.readOnly = disabled
    this.button.disabled = disabled
  }
  clear() { this.input.value = '' }
  protected abstract getTxData() :T
}

export class TextInput extends InputBox<string> {
  constructor(ctx :GlobalContext) {
    super(ctx, 'UTF-8')
    this.input.name = 'transmit-text-input'
    const lblEol = <span class="d-none d-md-inline me-1">CRLF</span>
    const dropBtn = safeCastElement(HTMLButtonElement,
      <button type="button" class="btn btn-outline-primary dropdown-toggle dropdown-toggle-split"
        data-bs-toggle="dropdown" aria-expanded="false">
        <span class="visually-hidden">Line Endings: </span> {lblEol}
      </button>)
    const dropEol = safeCastElement(HTMLUListElement,
      <ul class="dropdown-menu">{ ['CRLF','LF','CR','None'].map(e => {
        const inpRadio = safeCastElement(HTMLInputElement, <input class="form-check-input"
          type="radio" name="radio-tx-eol" id={ctx.genId()} value={e} checked={e==='CRLF'} />)
        inpRadio.addEventListener('change', () => { if (inpRadio.checked) lblEol.innerText = e })
        return <li class="dropdown-item" onclick={()=>inpRadio.click()}><div class="form-check">
          {inpRadio} <label class="form-check-label" for={inpRadio.id}>{e}</label> </div></li>
      }) } </ul>)
    this.inpGrp.insertBefore(dropBtn, this.button)
    this.inpGrp.insertBefore(dropEol, this.button)
  }
  protected override getTxData() :string {
    let eol
    switch (new FormData(this.el).get('radio-tx-eol')) {
      case 'LF': eol = '\n'; break
      case 'CR': eol = '\r'; break
      case 'None': eol = ''; break
      case null: default: eol = '\r\n'
    }
    return this.input.value+eol
  }
}

export class BinaryInput extends InputBox<Uint8Array> {
  constructor(ctx :GlobalContext) {
    super(ctx, 'Bytes')
    this.input.name = 'transmit-bytes-input'
    this.input.pattern = '^(0x)?([0-9a-fA-F]{2} ?)+$'
  }
  protected override getTxData() :Uint8Array {
    let txt = this.input.value.trim()
    if (txt.startsWith('0x')) txt = txt.substring(2)
    return new Uint8Array( txt.toLowerCase().replace(/[^0-9a-f]/g, '').match(/.{1,2}/g)?.map(h => parseInt(h, 16)) ?? [] )
  }
}