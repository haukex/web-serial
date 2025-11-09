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
import { GlobalContext } from './main'

// spell-checker: ignore RFCOMM

export class BluetoothUuidStore {
  /* `allowedBluetoothServiceClassIds` containing a string that is not a UUID apparently causes requestPort()
   * to completely blow up, so be restrictive. Apparently even the hex digits being uppercase causes a hard crash.
   * Appears to be this issue: https://issues.chromium.org/issues/328304137 */
  private static readonly REGEX = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/
  static readonly BASE = '00000000-0000-1000-8000-00805F9B34FB'
  static readonly PAT = '^([0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}|(0x)?[0-9a-fA-F]{1,8})$'
  readonly ctx
  private _uuids :string[] = []
  static new(ctx :GlobalContext) :Promise<BluetoothUuidStore> {
    return new BluetoothUuidStore(ctx).initialize()
  }
  private constructor(ctx :GlobalContext) { this.ctx = ctx }
  private async initialize() :Promise<this> {
    this._uuids = Array.from( new Set(
      ( await this.ctx.storage.settings.get('bluetoothUuids') ).filter( uuid => uuid.match(BluetoothUuidStore.REGEX) ) ) )
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
      uuid = ( uuid.startsWith('0x') ? uuid.substring(2) : uuid ).padEnd(8,'0') + BluetoothUuidStore.BASE.substring(8).toLowerCase()
    if ( !uuid.match(BluetoothUuidStore.REGEX) || this._uuids.includes(uuid) ) return false
    this._uuids.push(uuid)
    this._uuids.sort()
    await this.ctx.storage.settings.set('bluetoothUuids', this._uuids)
    console.debug('UUIDs', this._uuids)
    return true
  }
}
