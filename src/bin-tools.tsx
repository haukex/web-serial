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
import { cleanHexStr, str2ui8 } from './utils'
import { jsx } from './jsx-dom'

export class BinaryTools {
  readonly el :HTMLElement
  constructor(target :HTMLElement) {

    this.el = <div class="card card-body py-2 d-flex flex-row flex-wrap overflow-auto"></div>

    const update = (txt :string) => {
      const infos :[string, string][] = []
      if (txt) {
        const cs = cleanHexStr(txt)
        if (cs) infos.push(['bigint(be)', BigInt('0x'+cs).toString()])
        const d = new DataView(str2ui8(txt).buffer)
        if (d.byteLength==1)
          infos.push(['int8', d.getInt8(0).toString()], ['uint8', d.getUint8(0).toString()])
        else if (d.byteLength==2) {
          infos.push(['int16be', d.getInt16(0, false).toString()], ['uint16be', d.getUint16(0, false).toString()],
            ['int16le', d.getInt16(0, true).toString()], ['uint16le', d.getUint16(0, true).toString()])
          if (typeof d.getFloat16 === 'function')
            infos.push(['float16be',d.getFloat16(0, false).toString()], ['float16le',d.getFloat16(0, true).toString()])
        }
        else if (d.byteLength==4)
          infos.push(['int32be', d.getInt32(0, false).toString()], ['uint32be', d.getUint32(0, false).toString()],
            ['int32le', d.getInt32(0, true).toString()], ['uint32le', d.getUint32(0, true).toString()],
            ['float32be',d.getFloat32(0, false).toString()], ['float32le',d.getFloat32(0, true).toString()])
        else if (d.byteLength==8)
          infos.push(['int64be', d.getBigInt64(0, false).toString()], ['uint64be', d.getBigUint64(0, false).toString()],
            ['int64le', d.getBigInt64(0, true).toString()], ['uint64le', d.getBigUint64(0, true).toString()],
            ['float64be',d.getFloat64(0, false).toString()], ['float64le',d.getFloat64(0, true).toString()])
      }
      if (infos.length) {
        const seen = new Set<string>()
        this.el.replaceChildren(...infos.flatMap(([lbl,val],i) => {
          if (seen.has(val)) return []
          seen.add(val)
          return ( i ? [<div class="mx-2 text-secondary">•</div>] : [] ).concat(
            [ <div><span class="text-secondary-emphasis">{lbl}:</span> {val}</div> ] )
        }))
      }
      else this.el.innerText = 'Select bytes to see information'
    }
    update('')

    document.addEventListener('selectionchange', () => {
      let selected :string = ''
      /* Check if something was selected - we only handle simple selections with one range,
       * and only selections of texts that are entirely within the target element */
      const selection = window.getSelection()
      if ( selection && selection.rangeCount==1
          && target.contains(selection.getRangeAt(0).commonAncestorContainer) )
        selected = selection.toString()
      update(selected)
    })

  }
}