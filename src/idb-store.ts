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
import { openDB, DBSchema, IDBPDatabase } from 'idb'

// spell-checker: ignore IDBP

const IDB_NAME = 'haukex-Web-Serial'

interface ISettings {
  bluetoothUuids :string[]
}
const DEFAULT_SETTINGS :ISettings = {
  bluetoothUuids: []
}
function isISettings(o :unknown) :o is ISettings {
  return !!( o && typeof o === 'object'
    && Object.keys(o).length===1 && 'bluetoothUuids' in o
    && Array.isArray(o.bluetoothUuids) && o.bluetoothUuids.every(s => typeof s === 'string')
  )
}

interface MyDB extends DBSchema {
  general :{ key :string, value :ISettings },
}

class Settings {
  static KEY = 'settings'
  private readonly db
  constructor(db :IDBPDatabase<MyDB>) { this.db = db }
  async get<K extends keyof ISettings = keyof ISettings>(key :K) :Promise<ISettings[K]> {
    const sett = await this.db.get('general', Settings.KEY)
    return isISettings(sett) ? sett[key] : DEFAULT_SETTINGS[key]
  }
  async set<K extends keyof ISettings = keyof ISettings>(key :K, val :ISettings[K]) :Promise<void> {
    const trans = this.db.transaction('general', 'readwrite')
    const cur = await trans.store.openCursor(Settings.KEY)
    if (cur && isISettings(cur.value)) {
      const sett = JSON.parse(JSON.stringify(cur.value)) as ISettings
      sett[key] = val
      await Promise.all([ cur.update(sett), trans.done ])
    }
    else {
      const sett = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as ISettings
      sett[key] = val
      await Promise.all([ trans.store.add(sett, Settings.KEY), trans.done ])
    }
  }
}

export class IdbStorage {
  // https://github.com/jakearchibald/idb#readme
  static async open() {
    const storage = new IdbStorage(await openDB<MyDB>(IDB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('general', {})
      }
    }))
    return storage
  }
  readonly settings
  private constructor(db :IDBPDatabase<MyDB>) {
    this.settings = new Settings(db)
  }
}
