// tslint:disable:max-file-line-count

/*
 * Copyright (C) 2015 - 2017 Juergen Zimmermann, Hochschule Karlsruhe
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

import * as moment from 'moment'
import 'moment/locale/de'

import {isBlank, isEmpty, isPresent} from '../../shared'

moment.locale('de')

export declare type GeschlechtType = 'M' | 'W'
export declare type FamilienstandType = 'L' | 'VH' | 'G' | 'VW'
export declare interface Umsatz {
    betrag: number|undefined,
    waehrung: string|undefined,
}
export declare interface Adresse {
    plz: string|undefined
    ort: string|undefined
}

/**
 * Gemeinsame Datenfelder unabh&auml;ngig, ob die Kundedaten von einem Server
 * (z.B. RESTful Web Service) oder von einem Formular kommen.
 */
export interface KundeShared {
    _id?: string|undefined
    nachname?: string|undefined
    email: string|undefined
    newsletter: boolean|undefined
    geburtsdatum: string|undefined
    umsatz: Umsatz
    homepage: string|undefined
    geschlecht: GeschlechtType|undefined
    familienstand: FamilienstandType|undefined
    adresse: Adresse
}

/**
 * Daten vom und zum REST-Server:
 * <ul>
 *  <li> Arrays f&uuml;r mehrere Werte, die in einem Formular als Checkbox
 *       dargestellt werden.
 *  <li> Daten mit Zahlen als Datentyp, die in einem Formular nur als
 *       String handhabbar sind.
 * </ul>
 */
export interface KundeServer extends KundeShared {
    interessen?: Array<string>|undefined
    waehrung?: string|undefined
}

/**
 * Daten aus einem Formular:
 * <ul>
 *  <li> je 1 Control fuer jede Checkbox und
 *  <li> au&szlig;erdem Strings f&uuml;r Eingabefelder f&uuml;r Zahlen.
 * </ul>
 */
export interface KundeForm extends KundeShared {
    sport?: boolean
    lesen?: boolean
    reisen?: boolean
    waehrung: string
    plz: string
    ort: string
}

/**
 * Model als Plain-Old-JavaScript-Object (POJO) fuer die Daten *UND*
 * Functions fuer Abfragen und Aenderungen.
 */
export class Kunde {
    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem RESTful Web
     * Service kommen.
     * @param kunde JSON-Objekt mit Daten vom RESTful Web Server
     * @return Das initialisierte Kunde-Objekt
     */
    static fromServer(kundeServer: KundeServer) {
        let geburtsdatum: moment.Moment|undefined
        if (isPresent(kundeServer.geburtsdatum)) {
            const tmp = kundeServer.geburtsdatum as string
            geburtsdatum = moment(tmp)
        }
        const kunde = new Kunde(
            kundeServer._id, kundeServer.nachname, kundeServer.email, kundeServer.newsletter,
            geburtsdatum, kundeServer.umsatz, kundeServer.waehrung, kundeServer.homepage,
            kundeServer.geschlecht, kundeServer.familienstand, kundeServer.adresse, kundeServer.interessen)
        console.log('Kunde.fromServer(): kunde=', kunde)
        return kunde
    }

    /**
     * Ein Kunde-Objekt mit JSON-Daten erzeugen, die von einem Formular kommen.
     * @param kunde JSON-Objekt mit Daten vom Formular
     * @return Das initialisierte Kunde-Objekt
     */
    static fromForm(kundeForm: KundeForm) {
        const interessen: Array<string> = []
        if (kundeForm.sport) {
            interessen.push('S')
        }
        if (kundeForm.lesen) {
            interessen.push('L')
        }
        if (kundeForm.reisen) {
            interessen.push('R')
        }
        const adresse: Adresse = {
            plz: kundeForm.plz,
            ort: kundeForm.ort,
        }

        const geburtsdatumMoment = isEmpty(kundeForm.geburtsdatum) ?
            undefined :
            moment(kundeForm.geburtsdatum as string)

        // const rabatt = kundeForm.rabatt === undefined ? 0 : kundeForm.rabatt / 100
        const kunde = new Kunde(
            kundeForm._id, kundeForm.nachname, kundeForm.email, kundeForm.newsletter,
            geburtsdatumMoment, kundeForm.umsatz, kundeForm.waehrung, kundeForm.homepage,
            kundeForm.geschlecht, kundeForm.familienstand, adresse, interessen)
        console.log('Kunde.fromForm(): kunde=', kunde)
        return kunde
    }

    // http://momentjs.com
    get geburtsdatumFormatted() {
        let result: string|undefined
        if (isPresent(this.geburtsdatum)) {
            const geburtsdatum = this.geburtsdatum as moment.Moment
            result = geburtsdatum.format('Do MMM YYYY')
        }
        return result
    }

    get geburtsdatumFromNow() {
        let result: string|undefined
        if (isPresent(this.geburtsdatum)) {
            const geburtsdatum = this.geburtsdatum as moment.Moment
            result = geburtsdatum.fromNow()
        }
        return result
    }

    /**
     * Abfrage, ob im Kundenachname der angegebene Teilstring enthalten ist. Dabei
     * wird nicht auf Gross-/Kleinschreibung geachtet.
     * @param nachname Zu &uuml;berpr&uuml;fender Teilstring
     * @return true, falls der Teilstring im Kundenachname enthalten ist. Sonst
     *         false.
     */
    containsNachname(nachname: string) {
        let result = true
        if (isPresent(this.nachname)) {
            const tmp = this.nachname as string
            result = tmp.toLowerCase().includes(nachname.toLowerCase())
        }
        return result
    }

    /**
     * Aktualisierung der Stammdaten des Kunde-Objekts.
     * @param nachname Der neue Kundenachname
     * @param email Die neue Email
     * @param newsletter Die neue Newsletterentscheidung
     * @param homepage Die neue Homepage
     * @param familienstand Der neue Familienstand
     */
    updateStammdaten(
        nachname: string, email: string|undefined,
        newsletter: boolean|undefined, homepage: string|undefined,
        familienstand: FamilienstandType|undefined) {
        this.nachname = nachname
        this.email = email
        this.newsletter = newsletter
        this.homepage = homepage
        this.familienstand = familienstand
    }

    /**
     * Abfrage, ob es zum Kunden auch Interessen gibt.
     * @return true, falls es mindestens eine Interesse gibt. Sonst false.
     */
    hasInteressen() {
        if (isBlank(this.interessen)) {
            return false
        }
        const tmpInteressen = this.interessen as Array<string>
        return tmpInteressen.length !== 0
    }

    /**
     * Abfrage, ob es zum Kunden die angegebene Interesse gibt.
     * @param interesse die zu &uuml;berpr&uuml;fende Interesse
     * @return true, falls es die Interesse gibt. Sonst false.
     */
    hasInteresse(interesse: string) {
        if (isBlank(this.interessen)) {
            return false
        }
        const tmpInteressen = this.interessen as Array<string>
        return tmpInteressen.includes(interesse)
    }

    /**
     * Aktualisierung der Interessen des Kunde-Objekts.
     * @param sport ist das Schlagwort 'Sport' gesetzt
     * @param lesen ist das Schlagwort 'Lesen' gesetzt
     * @param reisen ist das Schlagwort 'Reisen' gesetzt
     */
    updateInteressen(sport: boolean, lesen: boolean, reisen: boolean) {
        this.resetInteressen()
        if (sport) {
            this.addInteresse('S')
        }
        if (lesen) {
            this.addInteresse('L')
        }
        if (reisen) {
            this.addInteresse('R')
        }
    }

    /**
     * Konvertierung des Kundeobjektes in ein JSON-Objekt f&uuml;r den RESTful
     * Web Service.
     * @return Das JSON-Objekt f&uuml;r den RESTful Web Service
     */
    toJSON(): KundeServer {
        const geburtsdatum = this.geburtsdatum === undefined ?
            undefined :
            this.geburtsdatum.format('YYYY-MM-DD')
        return {
            _id: this._id,
            nachname: this.nachname,
            email: this.email,
            newsletter: this.newsletter,
            geburtsdatum,
            umsatz: this.umsatz,
            homepage: this.homepage,
            geschlecht: this.geschlecht,
            familienstand: this.familienstand,
            interessen: this.interessen,
            adresse: this.adresse,
        }
    }

    toString() {
        return JSON.stringify(this, null, 2)
    }

    // wird aufgerufen von fromServer() oder von fromForm()
    private constructor(
        // tslint:disable-next-line:variable-name
        public _id: string|undefined, public nachname: string|undefined,
        public email: string|undefined, public newsletter: boolean|undefined,
        public geburtsdatum: moment.Moment|undefined, public umsatz: Umsatz,
        public waehrung: string|undefined, public homepage: string|undefined,
        public geschlecht: GeschlechtType|undefined, public familienstand: FamilienstandType|undefined,
        public adresse: Adresse, public interessen: Array<string>|undefined) {

        this._id = _id || undefined
        this.nachname = nachname || undefined
        this.email = email || undefined
        this.newsletter = newsletter || undefined
        this.geburtsdatum =
            isPresent(geburtsdatum) ? geburtsdatum : moment(new Date().toISOString())
        this.umsatz = umsatz || undefined
        this.waehrung = waehrung || undefined
        this.homepage = homepage || undefined
        this.geschlecht = geschlecht || undefined
        this.familienstand = familienstand || undefined
        this.adresse = adresse || undefined
        this.interessen = interessen || undefined

        if (isBlank(interessen)) {
            this.interessen = []
        } else {
            const tmpInteressen = interessen as Array<string>
            this.interessen = tmpInteressen
        }
    }

    private resetInteressen() {
        this.interessen = []
    }

    private addInteresse(interesse: string) {
        if (isBlank(this.interessen)) {
            this.interessen = []
        }
        const tmpInteressen = this.interessen as Array<string>
        tmpInteressen.push(interesse)
    }
}
