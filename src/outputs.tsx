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

const CONTROL_CHAR_MAP = {  // see styles.scss
  0x00: 'nul', 0x01: 'soh', 0x02: 'stx', 0x03: 'etx', 0x04: 'eot', 0x05: 'enq', 0x06: 'ack', 0x07: 'bel',
  0x08: 'bs',  0x09: 'ht',  0x0a: 'lf',  0x0b: 'vt',  0x0c: 'ff',  0x0d: 'cr',  0x0e: 'ss',  0x0f: 'si',
  0x10: 'dle', 0x11: 'dc1', 0x12: 'dc2', 0x13: 'dc3', 0x14: 'dc4', 0x15: 'nak', 0x16: 'syn', 0x17: 'etb',
  0x18: 'can', 0x19: 'em',  0x1a: 'sub', 0x1b: 'esc', 0x1c: 'fs',  0x1d: 'gs',  0x1e: 'rs',  0x1f: 'us',
  0x20: 'sp',  0x7f: 'del' } as const

/* When the output divs are large, switching tabs produces "[Violation] Forced reflow while executing JavaScript took <N>ms"
 * so for now, I've reduced the scroll-back buffer size here: */
const MAX_OUTPUTS = 100

abstract class OutputBox<T extends NonNullable<unknown>, U extends Iterable<T>> {
  readonly el :HTMLDivElement
  readonly ctx :GlobalContext
  readonly maxOutputs :number
  protected readonly out :HTMLDivElement
  private _curRxLine :HTMLDivElement|null = null
  protected get curRxLine() :HTMLDivElement {
    if (this._curRxLine==null) this._curRxLine = this._newLine('rx')
    return this._curRxLine
  }
  private _countInRxLine :number = 0
  protected get countInRxLine() { return this._countInRxLine }
  private scrolledToBottom = true
  constructor(ctx :GlobalContext, maxOutputs :number) {
    this.ctx = ctx
    this.maxOutputs = maxOutputs
    this.out = safeCastElement(HTMLDivElement, <div class="d-flex flex-column" tabindex="0"></div>)
    this.el = safeCastElement(HTMLDivElement, <div class="border rounded p-2 max-vh-50 overflow-auto">{this.out}</div>)
    /* NOTE scrollend is not implemented in Safari, but neither is the Web Serial API, so it should be fine.
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollend_event#browser_compatibility */
    this.el.addEventListener('scrollend', () =>
      this.scrolledToBottom = this.el.scrollHeight - this.el.clientHeight - this.el.scrollTop < 1 )
  }
  private maybeScrollToBottom() {
    if (this.scrolledToBottom)
      // Note this will fire the scrollend handler too, but that's ok, since its result will be `true` anyway.
      setTimeout(() => this.el.scrollTop = this.el.scrollHeight, 1)  // wait for any newly added element to be rendered
  }
  shown() { this.maybeScrollToBottom() }
  private _newLine(type :'rx'|'tx') :HTMLDivElement {
    const line = safeCastElement(HTMLDivElement,
      <div class="white-space-pre font-monospace text-stroke-body flex-grow-1"></div>)
    const icon = type=='rx'
      ? <i class="text-info bi-box-arrow-in-down-right"/>
      : <i class="text-primary bi-box-arrow-up-right"/>
    this.out.appendChild(<div class="d-flex flex-row flex-nowrap"><div class="pe-2">{icon}</div>{line}</div>)
    while(this.out.childElementCount>this.maxOutputs && this.out.firstElementChild)
      this.out.removeChild(this.out.firstElementChild)
    this.maybeScrollToBottom()
    return line
  }
  protected newRxLine() :HTMLElement {
    if (!this._countInRxLine) {
      console.warn('newLine shouldn\'t be called when count is 0')
      return this.curRxLine  // no sense in making a new line
    }
    this._countInRxLine = 0
    return this._curRxLine = this._newLine('rx')
  }
  protected newTxLine() :HTMLElement { return this._newLine('tx') }
  appendRx(items :U) {
    for(const item of items) {
      this.appendRxOne(item)
      this._countInRxLine++
    }
  }
  abstract appendTx(items :U) :void
  protected abstract appendRxOne(item :T) :void
  clear() {
    this.out.replaceChildren()
    this._curRxLine = null
    this._countInRxLine = 0
  }
}

export class TextOutput extends OutputBox<string, string> {
  readonly cbShowNonPrintable :HTMLElement
  constructor(ctx :GlobalContext) {
    super(ctx, MAX_OUTPUTS)
    const cb = safeCastElement(HTMLInputElement,
      <input class="form-check-input" type="checkbox" id={ctx.genId()} />)
    this.cbShowNonPrintable = <div class="form-check form-switch">{cb}
      <label class="form-check-label" for={cb.id}>Show non-printable characters</label></div>
    cb.addEventListener('change', () => {
      if (cb.checked) this.out.setAttribute('data-show-non-printable','data-show-non-printable')
      else this.out.removeAttribute('data-show-non-printable') })
  }
  private renderCodePoint(cp :number) :Node {
    return cp in CONTROL_CHAR_MAP
      ? <span class={`non-printable non-printable-${CONTROL_CHAR_MAP[cp as keyof typeof CONTROL_CHAR_MAP]}`}>{
        cp == 0x20 ? ' ' : cp == 0x09 ? '\t' : '' }</span>
      : cp == 0xFFFD ? <i class="non-printable bi-question-diamond-fill"/>
        : document.createTextNode(String.fromCodePoint(cp))
  }
  private prevCharWasCr :boolean = false
  private nextLineIsNew :boolean = false
  protected override appendRxOne(item :string) :void {
    const cp = item.codePointAt(0)??0
    const thisLineIsNew = this.prevCharWasCr && cp != 0x0A  // Anything other than LF after CR: treat CR as NL
    const nextLineWillBeNew = cp == 0x0A    // LF means NL, as in CRLF or plain LF (plain CR is handled above)
    // handle the completion of a line
    if ( thisLineIsNew || nextLineWillBeNew ) {
      this.curRxLine.normalize()
      const line = this.curRxLine.innerText
      console.debug(JSON.stringify(line))
      if (line.search( /\b(?:critical|fatal)\b/i )>=0)
        this.curRxLine.classList.add('text-danger','fw-bold')
      else if (line.search( /\b(?:error)\b/i )>=0)
        this.curRxLine.classList.add('text-danger')
      else if (line.search( /\b(?:warn(?:ing)?)\b/i )>=0)
        this.curRxLine.classList.add('text-warning')
      else if (line.search( /\b(?:notice)\b/i )>=0)
        this.curRxLine.classList.add('text-info')
      else if (line.search( /\b(?:success|good)\b/i )>=0)
        this.curRxLine.classList.add('text-success')
    }
    // handle generation of a new line
    if ( thisLineIsNew || this.nextLineIsNew ) this.newRxLine()
    // update state
    this.nextLineIsNew = nextLineWillBeNew
    this.prevCharWasCr = cp == 0x0D
    // add the character
    //TODO Later: Tab characters aren't correctly aligned
    this.curRxLine.appendChild(this.renderCodePoint(cp))
  }
  override appendTx(items: string) {
    // we can safely assume a single line is sent at a time so we don't need line splitting
    const txLine = this.newTxLine()
    for(const item of items)
      txLine.appendChild(this.renderCodePoint(item.codePointAt(0)??0))
    txLine.normalize()
  }
  override clear() {
    super.clear()
    this.prevCharWasCr = false
    this.nextLineIsNew = false
  }
}

export class BinaryOutput extends OutputBox<number, Uint8Array> {
  constructor(ctx :GlobalContext) {
    super(ctx, MAX_OUTPUTS*10)  // binary takes up a lot more space than text lines, so allow more outputs
    this.out.classList.remove('flex-column')
    this.out.classList.add('flex-wrap','column-gap-4')
  }
  private justTransmitted = false
  protected override appendRxOne(item :number) :void {
    // count is incremented *after* every call
    if (this.countInRxLine>7 || this.justTransmitted) this.newRxLine()  // resets count to 0
    this.justTransmitted = false
    if (this.countInRxLine) this.curRxLine.innerText += ' '
    this.curRxLine.innerText += item.toString(16).padStart(2,'0')
    this.curRxLine.style.setProperty('width', '23ch')  // 8*2 + 7
  }
  override appendTx(items: Uint8Array) {
    let countInTxLine = 0
    let curTxLine :HTMLElement|null = null
    for(const item of items) {
      if (curTxLine==null) {
        curTxLine = this.newTxLine()
        curTxLine.style.setProperty('width', '23ch')
      }
      if (countInTxLine) curTxLine.innerText += ' '
      curTxLine.innerText += item.toString(16).padStart(2,'0')
      if (++countInTxLine>8) {
        countInTxLine = 0
        curTxLine = null
      }
    }
    this.justTransmitted = true
  }
  override clear() {
    super.clear()
    this.justTransmitted = false
  }
}
