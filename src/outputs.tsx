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

const CONTROL_CHAR_MAP = {
  0x00: 'nul', 0x01: 'soh', 0x02: 'stx', 0x03: 'etx', 0x04: 'eot', 0x05: 'enq', 0x06: 'ack', 0x07: 'bel',
  0x08: 'bs',  0x09: 'ht',  0x0a: 'lf',  0x0b: 'vt',  0x0c: 'ff',  0x0d: 'cr',  0x0e: 'ss',  0x0f: 'si',
  0x10: 'dle', 0x11: 'dc1', 0x12: 'dc2', 0x13: 'dc3', 0x14: 'dc4', 0x15: 'nak', 0x16: 'syn', 0x17: 'etb',
  0x18: 'can', 0x19: 'em',  0x1a: 'sub', 0x1b: 'esc', 0x1c: 'fs',  0x1d: 'gs',  0x1e: 'rs',  0x1f: 'us',
  0x20: 'sp',  0x7f: 'del' } as const

abstract class OutputBox<T extends NonNullable<unknown>, U extends Iterable<T>> {
  readonly el :HTMLDivElement
  protected readonly out :HTMLDivElement
  constructor() {
    this.out = safeCastElement(HTMLDivElement, <div class="d-flex flex-column font-monospace text-stroke-body"></div>)
    this.el = safeCastElement(HTMLDivElement, <div class="border rounded p-2 max-vh-50 overflow-auto">{this.out}</div>)
    this.curLine = this.makeNewLine()
  }
  protected curLine :HTMLDivElement
  private makeNewLine() { return safeCastElement(HTMLDivElement, <div class="white-space-pre"></div>) }
  protected newLine() {
    // if the count is zero here, then the line is empty, no sense in making a new line...
    if (!this.count) console.warn('newLine shouldn\'t be called when count is 0')
    this.curLine = this.makeNewLine()
    this.out.appendChild(this.curLine)
    this.count = 0
    //TODO: Trim output size
  }
  protected count :number = 0
  appendRx(items :U) :void {
    for(const item of items) {
      this.count++
      this.appendRxOne(item)
    }
    //TODO: Display sent lines as well?
    //TODO: scroll to bottom (unless user has scrolled elsewhere)
  }
  protected abstract appendRxOne(item :T) :void
  clear() { this.out.replaceChildren() }
}

export class TextOutput extends OutputBox<string, string> {
  private prevCharWasCr :boolean = false
  protected override appendRxOne(item :string) :void {
    const cp = item.codePointAt(0)??0
    if ( this.prevCharWasCr && cp != 0x0A ) this.newLine()  // Anything other than LF after CR: treat CR as NL
    //TODO Later: Tab characters aren't correctly aligned
    this.curLine.appendChild( cp in CONTROL_CHAR_MAP
      ? <span class={`non-printable non-printable-${CONTROL_CHAR_MAP[cp as keyof typeof CONTROL_CHAR_MAP]}`}>{
        cp == 0x20 ? ' ' : cp == 0x09 ? '\t' : '' }</span>
      : cp == 0xFFFD ? <i class="non-printable bi-question-diamond-fill"/>
        : document.createTextNode(item) )
    if ( cp == 0x0A ) this.newLine()  // LF means NL, as in CRLF or plain LF (plain CR is handled above)
    this.prevCharWasCr = cp == 0x0D
    //TODO: Color lines with "error"/"warn"/"fatal"/"critical" etc?
  }
}

export class BinaryOutput extends OutputBox<number, Uint8Array> {
  constructor() {
    super()
    this.out.classList.remove('flex-column')
    this.out.classList.add('flex-wrap','column-gap-4')
  }
  protected override appendRxOne(item :number) :void {
    if (this.count>1) this.curLine.innerText += ' '
    this.curLine.innerText += item.toString(16).padStart(2,'0')
    if (this.count>=8) this.newLine()
  }
}
