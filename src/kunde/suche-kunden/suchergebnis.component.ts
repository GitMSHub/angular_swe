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

import {NgLocalization} from '@angular/common'
import {animate, Component, Input, OnInit, state, style, transition, trigger} from '@angular/core'
// Bereitgestellt durch das RouterModule (s. Re-Export im SharedModule)
import {Router} from '@angular/router'

import {DETAILS_KUNDE_PATH} from '../../app/root.routing'
import {AuthService} from '../../auth/auth.service'
import {isString, log} from '../../shared'
import {Kunde} from '../shared'
import {KundeService} from '../shared/kunde.service'

// https://angular.io/docs/ts/latest/guide/animations.html
// auf der Basis von des "Web Animations API"
// alternativ gibt es noch: CSS Transitions und CSS Keyframes
const tableIn = trigger('tableIn', [
    // von ganz links und zunaechst unsichtbar
    // https://www.w3.org/TR/css3-transitions/#animatable-properties
    state('active', style({transform: 'translateX(0)'})),
    // Dauer 500ms
    // http://easings.net Daten kommen zunaechst langsam herein
    transition('void => *', [
        // von ganz links und zunaechst unsichtbar
        // https://www.w3.org/TR/css3-transitions/#animatable-properties
        style({transform: 'translateX(-100%)', opacity: 0}),
        // Dauer 500ms
        // http://easings.net Daten kommen zunaechst langsam herein
        animate('500ms ease-in'),
    ]),
])
const rowOut = trigger('rowOut', [
    transition('* => void', [
        // nach ganz rechts
        animate('500ms ease-out', style({
            transform: 'translateX(100%)',
            opacity: 0,
        })),
    ]),
])

/**
 * Komponente f&uuml;r das Tag <code>hs-suchergebnis</code>, um zun&auml;chst
 * das Warten und danach das Ergebnis der Suche anzuzeigen, d.h. die gefundenen
 * Kunden oder eine Fehlermeldung.
 */
@Component({
    selector: 'hs-suchergebnis',
    templateUrl: './suchergebnis.component.html',
    animations: [tableIn, rowOut],
})
export default class SuchergebnisComponent implements OnInit {
    // Im ganzen Beispiel: lokale Speicherung des Zustands und nicht durch z.B.
    // eine Flux-Bibliothek, wie z.B. Redux http://redux.js.org

    // Property Binding: <hs-suchergebnis [waiting]="...">
    // Decorator fuer ein Attribut. Siehe InputMetadata
    @Input() waiting: boolean

    kunden: Array<Kunde> = []
    errorMsg: string|null = null
    isAdmin: boolean

    constructor(
        private readonly kundeService: KundeService,
        private readonly router: Router,
        private readonly authService: AuthService) {
        console.log('SuchergebnisComponent.constructor()')
    }

    // Attribute mit @Input() sind undefined im Konstruktor.
    // Methode zum "LifeCycle Hook" OnInit: wird direkt nach dem Konstruktor
    // aufgerufen. Entspricht @PostConstruct bei Java.
    // Weitere Methoden zum Lifecycle: ngAfterViewInit(), ngAfterContentInit()
    // https://angular.io/docs/ts/latest/guide/cheatsheet.html
    // Die Ableitung vom Interface OnInit ist nicht notwendig, aber erleichtet
    // IntelliSense bei der Verwendung von TypeScript.
    @log
    ngOnInit() {
        this.observeKunden()
        this.observeError()
        this.isAdmin = this.authService.isAdmin()
    }

    /**
     * Der ausgew&auml;hlte bzw. angeklickte Kunde in der Detailsseite anzeigen.
     * @param kunde Der ausgew&auml;hlte Kunde
     */
    @log
    onSelect(kunde: Kunde) {
        const path = `/${DETAILS_KUNDE_PATH}/${kunde._id}`
        console.log(`path=${path}`)
        this.router.navigate([path])
    }

    /**
     * Den ausgew&auml;hlte bzw. angeklickte Kunde l&ouml;schen.
     * @param kunde Der ausgew&auml;hlte Kunde
     */
    @log
    onRemove(kunde: Kunde) {
        const successFn: () => void | undefined = undefined as any
        const errorFn: (status: number) => void = status => {
            console.error(`Fehler beim Loeschen: status=${status}`)
        }
        this.kundeService.remove(kunde, successFn, errorFn)
        if (this.kunden !== null) {
            const tmp = this.kunden as Array<Kunde>
            this.kunden = tmp.filter((k: Kunde) => k._id !== kunde._id)
        }
    }

    toString() {
        return 'SuchergebnisComponent'
    }

    /**
     * Methode, um den injizierten <code>KundeService</code> zu beobachten,
     * ob es gefundene bzw. darzustellende Kunden gibt, die in der
     * Kindkomponente f&uuml;r das Tag <code>gefundene-kunden</code>
     * dargestellt werden. Diese private Methode wird in der Methode
     * <code>ngOnInit</code> aufgerufen.
     */
    private observeKunden() {
        const next: (kunden: Array<Kunde>) => void = kunden => {
            // zuruecksetzen
            this.waiting = false
            this.errorMsg = null

            this.kunden = kunden
            console.log('SuchErgebnisComponent.observeKunden: this.kunden=',
                        this.kunden)
        }

        // Funktion als Funktionsargument, d.h. Code als Daten uebergeben
        this.kundeService.observeKunden(next)
    }

    /**
     * Methode, um den injizierten <code>KundeService</code> zu beobachten,
     * ob es bei der Suche Fehler gibt, die in der Kindkomponente f&uuml;r das
     * Tag <code>error-message</code> dargestellt werden. Diese private Methode
     * wird in der Methode <code>ngOnInit</code> aufgerufen.
     */
    private observeError() {
        const next: (err: string|number) => void = err => {
            // zuruecksetzen
            this.waiting = false
            this.kunden = []

            console.log('SuchErgebnisComponent.observeError: err=', err)
            if (err === null) {
                this.errorMsg = 'Ein Fehler ist aufgetreten.'
                return
            }

            if (isString(err)) {
                this.errorMsg = err as string
                return
            }

            switch (err) {
                case 404:
                    this.errorMsg = 'Keine Kunden gefunden.'
                    break
                default:
                    this.errorMsg = 'Ein Fehler ist aufgetreten.'
                    break
            }
            console.log(`SuchErgebnisComponent.errorMsg: ${this.errorMsg}`)
        }

        this.kundeService.observeError(next)
    }
}

// tslint:disable-next-line:max-classes-per-file
export class AnzahlLocalization extends NgLocalization {
    public getPluralCategory(count: number) {
        return count === 1 ? 'single' : 'multi'
    }
}
