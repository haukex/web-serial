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

export function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg) }

/** Exactly the same as `assert`, but label paranoid checks as such (i.e. they could be removed someday) */
export function paranoia(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg) }

export const ui8str = (bs :Uint8Array) => Array.prototype.map.call(bs, (b :number) => b.toString(16).padStart(2,'0')).join('')

export const cleanHexStr = (txt :string) => {
  txt = txt.trim()
  if (txt.startsWith('0x')) txt = txt.substring(2)
  return txt.toLowerCase().replaceAll(/[^0-9a-f]/g, '')
}

export const str2ui8 = (txt :string) => new Uint8Array( cleanHexStr(txt).match(/.{1,2}/g)?.map(h => parseInt(h, 16)) ?? [] )
