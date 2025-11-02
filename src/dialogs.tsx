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
import { Modal } from 'bootstrap'

export function userInput(ctx :GlobalContext, title :string, options :{ pattern ?:string, placeholder ?:string }={}) :Promise<string> {
  const inpText = safeCastElement(HTMLInputElement, <input type="text" class="form-control" required></input>)
  if (options.pattern) inpText.pattern = options.pattern
  if (options.placeholder) inpText.placeholder = options.placeholder
  const form = safeCastElement(HTMLFormElement, <form class="needs-validation">{inpText}</form>)
  const btnOk = safeCastElement(HTMLButtonElement, <button type="button" class="btn btn-primary">OK</button>)
  const backdropId = ctx.genId()
  const dialog = <div class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false"
    tabindex="-1" aria-labelledby={backdropId} aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id={backdropId}><i class="bi-input-cursor-text me-1"/> {title}</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          {form}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          {btnOk}
        </div>
      </div>
    </div>
  </div>
  document.body.appendChild(dialog)
  const modal = new Modal(dialog)
  let result :string = ''
  btnOk.addEventListener('click', () => {
    if (form.checkValidity()) {
      result = inpText.value
      modal.hide()
    }
    form.classList.add('was-validated')
  })
  return new Promise<string>(resolve => {
    dialog.addEventListener('hidden.bs.modal', () => {
      modal.dispose()
      document.body.removeChild(dialog)
      resolve(result)
    })
    modal.show()
  })
}