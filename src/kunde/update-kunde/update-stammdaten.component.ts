/*
 * Copyright (C) 2015 - 2016 Juergen Zimmermann, Hochschule Karlsruhe
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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Component, Input, OnInit} from '@angular/core'
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms'
import {Router} from '@angular/router'

import {HOME_PATH} from '../../app/root.routing'
import {isBlank, log} from '../../shared'
import {Kunde} from '../shared'
import {KundeService} from '../shared/kunde.service'

/**
 * Komponente f&uuml;r das Tag <code>hs-stammdaten</code>
 */
@Component({
    selector: 'hs-update-stammdaten',
    templateUrl: './update-stammdaten.component.html',
})
export default class UpdateStammdatenComponent implements OnInit {
    // <hs-update-stammdaten [kunde]="...">
    @Input() kunde: Kunde

    form: FormGroup
    nachname: FormControl
    familienstand: FormControl
    adresse: FormControl

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly kundeService: KundeService,
        private readonly router: Router) {
        console.log('UpdateStammdatenComponent.constructor()')
    }

    /**
     * Das Formular als Gruppe von Controls initialisieren und mit den
     * Stammdaten des zu &auml;ndernden Kunden vorbelegen.
     */
    @log
    ngOnInit() {
        console.log('kunde=', this.kunde)

        // Definition und Vorbelegung der Eingabedaten
        this.nachname = new FormControl(this.kunde.nachname, Validators.compose([
            Validators.required, Validators.minLength(2),
            Validators.pattern(/^\w.*$/),
        ]))
        // this.art = new FormControl(this.buch.art, Validators.required)
        this.familienstand = new FormControl(this.kunde.familienstand)
        this.adresse = new FormControl(this.kunde.adresse)
        // this.datum = new Control(this.buch.datum.toISOString())

        this.form = this.formBuilder.group({
            // siehe formControlName innerhalb von @Component({template: ...})
            nachname: this.nachname,
            familienstand: this.familienstand,
            adresse: this.adresse,
            // datum: this.datum
        })
    }

    /**
     * Die aktuellen Stammdaten f&uuml;r das angezeigte Kunde-Objekt
     * zur&uuml;ckschreiben.
     * @return false, um das durch den Button-Klick ausgel&ouml;ste Ereignis
     *         zu konsumieren.
     */
    @log
    onUpdate() {
        if (this.form.pristine) {
            console.log('keine Aenderungen')
            return
        }

        if (isBlank(this.kunde)) {
            console.error('kunde === undefined/null')
            return
        }

        // rating, preis und rabatt koennen im Formular nicht geaendert werden
        this.kunde.updateStammdaten(
            this.nachname.value, undefined, undefined,
            undefined, this.familienstand.value) // , this.buch.datum, this.buch.preis,
            // this.buch.rabatt)
        console.log('kunde=', this.kunde)

        const successFn = () => {
            console.log(`UpdateStammdaten: successFn: path: ${HOME_PATH}`)
            this.router.navigate([HOME_PATH])
        }
        const errorFn: (status: number, text: string) => void | undefined =
            undefined as any
        this.kundeService.update(this.kunde, successFn, errorFn)

        // damit das (Submit-) Ereignis konsumiert wird und nicht an
        // uebergeordnete Eltern-Komponenten propagiert wird bis zum
        // Refresh der gesamten Seite
        return false
    }

    toString() {
        return 'UpdateStammdatenComponent'
    }
}
