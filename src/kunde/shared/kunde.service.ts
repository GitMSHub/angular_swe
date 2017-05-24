// tslint:disable:max-file-line-count

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

import {EventEmitter, Inject, Injectable} from '@angular/core'
// Bereitgestellt durch das HttpModule (s. Re-Export im SharedModule)
// HttpModule enthaelt nur Services, keine Komponenten
import {Headers, Http, RequestOptionsArgs, Response, URLSearchParams} from '@angular/http'

import {ChartConfiguration, ChartDataSets} from 'chart.js'
import * as _ from 'lodash'
import * as moment from 'moment'

import {AuthService} from '../../auth/auth.service'
import {BASE_URI, isBlank, isEmpty, isPresent, log, PATH_KUNDE} from '../../shared'
// Aus dem SharedModule als Singleton exportiert
import DiagrammService from '../../shared/diagramm.service'
import {Kunde, KundeForm, KundeServer} from './index'

// Methoden der Klasse Http
//  * get(url, options) – HTTP GET request
//  * post(url, body, options) – HTTP POST request
//  * put(url, body, options) – HTTP PUT request
//  * patch(url, body, options) – HTTP PATCH request
//  * delete(url, options) – HTTP DELETE request

// Eine Service-Klasse ist eine "normale" Klasse gemaess ES 2015, die mittels
// DI in eine Komponente injiziert werden kann, falls sie innerhalb von
// provider: [...] bei einem Modul oder einer Komponente bereitgestellt wird.
// Eine Komponente realisiert gemaess MVC-Pattern den Controller und die View.
// Die Anwendungslogik wird vom Controller an Service-Klassen delegiert.

/**
 * Die Service-Klasse zu Kunden.
 */
@Injectable()
export class KundeService {
    private baseUriKunde: string
    private kundenEmitter = new EventEmitter<Array<Kunde>>()
    private kundeEmitter = new EventEmitter<Kunde>()
    private errorEmitter = new EventEmitter<string|number>()
    // tslint:disable-next-line:variable-name
    private _kunde: Kunde

    /**
     * @param diagrammService injizierter DiagrammService
     * @param http injizierter Service Http (von AngularJS)
     * @return void
     */
    constructor(
        @Inject(DiagrammService) private readonly diagrammService:
            DiagrammService,
        @Inject(Http) private readonly http: Http,
        @Inject(AuthService) private readonly authService: AuthService) {
        this.baseUriKunde = `${BASE_URI}${PATH_KUNDE}`
        console.log(
            `KundeService.constructor(): baseUriKunde=${this.baseUriKunde}`)
    }

    /**
     * Ein Kunde-Objekt puffern.
     * @param kunde Das Kunde-Objekt, das gepuffert wird.
     * @return void
     */
    set kunde(kunde: Kunde) {
        console.log('KundeService.set kunde()', kunde)
        this._kunde = kunde
    }

    @log
    observeKunden(next: (kunden: Array<Kunde>) => void) {
        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request abbrechen ("cancel") kann
        // tslint:disable:max-line-length
        // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md
        // http://stackoverflow.com/questions/34533197/what-is-the-difference-between-rx-observable-subscribe-and-foreach
        // https://xgrommx.github.io/rx-book/content/observable/observable_instance_methods/subscribe.html
        // tslint:enable:max-line-length
        return this.kundenEmitter.subscribe(next)
    }

    @log
    observeKunde(next: (kunde: Kunde) => void) {
        return this.kundeEmitter.subscribe(next)
    }

    @log
    observeError(next: (err: string|number) => void) {
        return this.errorEmitter.subscribe(next)
    }

    /**
     * Kunden suchen
     * @param suchkriterien Die Suchkriterien
     */
    @log
    find(suchkriterien: KundeForm) {
        const searchParams = this.suchkriterienToSearchParams(suchkriterien)
        const uri = this.baseUriKunde
        console.log(`KundeService.find(): uri=${uri}`)

        const nextFn: (response: Response) => void = response => {
            console.log('KundeService.find(): nextFn()')
            const kunden = this.responseToArrayKunde(response)
            this.kundenEmitter.emit(kunden)
        }
        const errorFn: (err: Response) => void = err => {
            const {status} = err
            console.log(`KundeService.find(): errorFn(): ${status}`)
            if (status === 400) {
                const body = err.text()
                if (isBlank(body)) {
                    this.errorEmitter.emit(status)
                } else {
                    // z.B. [PARAMETER][findByNachname.nachname][Bei einem ...][x]
                    let errorMsg = body.split('[')[3]
                    errorMsg = errorMsg.substr(0, errorMsg.length - 2)
                    this.errorEmitter.emit(errorMsg)
                }
            } else {
                this.errorEmitter.emit(status)
            }
        }

        // Observable.subscribe() aus RxJS liefert ein Subscription Objekt,
        // mit dem man den Request abbrechen ("cancel") kann
        // tslint:disable:max-line-length
        // https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/subscribe.md
        // http://stackoverflow.com/questions/34533197/what-is-the-difference-between-rx-observable-subscribe-and-foreach
        // https://xgrommx.github.io/rx-book/content/observable/observable_instance_methods/subscribe.html
        // tslint:enable:max-line-length
        this.http.get(uri, {search: searchParams}).subscribe(nextFn, errorFn)

        // Same-Origin-Policy verhindert Ajax-Datenabfragen an einen Server in
        // einer anderen Domain. JSONP (= JSON mit Padding) ermoeglicht die
        // Uebertragung von JSON-Daten über Domaingrenzen.
        // In Angular gibt es dafuer den Service Jsonp.
    }

    /**
     * Einen Kunden anhand der ID suchen
     * @param id Die ID des gesuchten Kundens
     */
    @log
    findById(id: string) {
        // Gibt es einen gepufferten Kunden mit der gesuchten ID?
        if (isPresent(this._kunde) && this._kunde._id === id) {
            console.log('KundeService.findById(): Kunde gepuffert')
            this.kundeEmitter.emit(this._kunde)
            return
        }
        if (isBlank(id)) {
            console.log('KundeService.findById(): Keine Id')
            return
        }

        const uri = `${this.baseUriKunde}/${id}`
        const nextFn: ((response: Response) => void) = response => {
            this._kunde = this.responseToKunde(response)
            this.kundeEmitter.emit(this._kunde)
        }
        const errorFn: (err: Response) => void = err => {
            const {status} = err
            console.log(`KundeService.findById(): errorFn(): ${status}`)
            this.errorEmitter.emit(status)
        }

        console.log('KundeService.findById(): GET-Request')
        this.http.get(uri).subscribe(nextFn, errorFn)
    }

    /**
     * Einen neuen Kunden anlegen
     * @param neuerKunde Das JSON-Objekt mit dem neuen Kunden
     * @param successFn Die Callback-Function fuer den Erfolgsfall
     * @param errorFn Die Callback-Function fuer den Fehlerfall
     */
    @log
    save(
        neuerKunde: Kunde, successFn: (location: string|undefined) => void,
        errorFn: (status: number, text: string) => void) {
        neuerKunde.geburtsdatum = moment(new Date())

        const uri = this.baseUriKunde
        const body = JSON.stringify(neuerKunde.toJSON())
        console.log('body=', body)

        const headers = new Headers({'Content-Type': 'application/json'})
        const authorization = this.authService.getAuthorization()
        if (isPresent(authorization)) {
            headers.append('Authorization', authorization as string)
        }
        const options: RequestOptionsArgs = {headers}
        console.log('options=', options)

        const nextFn: ((response: Response) => void) = response => {
            if (response.status === 201) {
                // TODO Das Response-Objekt enthaelt im Header NICHT "Location"
                successFn(undefined)
            }
        }
        // async. Error-Callback statt sync. try/catch
        const errorFnPost: ((err: Response) => void) = err => {
                if (isPresent(errorFn)) {
                    errorFn(err.status, err.text())
                }
            }
        this.http.post(uri, body, options).subscribe(nextFn, errorFnPost)
    }

    /**
     * Einen vorhandenen Kunden aktualisieren (PUT)
     * @param kunde Das JSON-Objekt mit den aktualisierten Kundendaten
     * @param successFn Die Callback-Function fuer den Erfolgsfall
     * @param errorFn Die Callback-Function fuer den Fehlerfall
     */
    @log
    update(
        kunde: Kunde, successFn: () => void,
        errorFn: (status: number, text: string) => void|undefined) {
        const uri = `${this.baseUriKunde}`
        const body = JSON.stringify(kunde.toJSON())
        console.log('body=', body)

        const headers = new Headers({'Content-Type': 'application/json'})
        const authorization = this.authService.getAuthorization()
        if (isPresent(authorization)) {
            headers.append('Authorization', authorization as string)
        }
        const options: RequestOptionsArgs = {headers}
        console.log('options=', options)

        const nextFn: ((response: Response) => void) = response =>
            successFn()
        const errorFnPut: ((err: Response) => void) = err => {
            if (isPresent(errorFn)) {
                errorFn(err.status, err.text())
            }
        }

        this.http.put(uri, body, options).subscribe(nextFn, errorFnPut)
    }

    /**
     * Einen Kunden l&ouml;schen (DELETE)
     * @param kunde Das JSON-Objekt mit dem zu loeschenden Kunden
     * @param successFn Die Callback-Function fuer den Erfolgsfall
     * @param errorFn Die Callback-Function fuer den Fehlerfall
     */
    @log
    remove(
        kunde: Kunde, successFn: () => void|undefined,
        errorFn: (status: number) => void) {
        const uri = `${this.baseUriKunde}/${kunde._id}`
        const authorization = this.authService.getAuthorization()
        console.log(`authorization=${authorization}`)
        const headers = new Headers({Authorization: authorization})
        const options: RequestOptionsArgs = {headers}
        console.log('options=', options)

        const nextFn: ((response: Response) => void) = response => {
            if (isPresent(successFn)) {
                successFn()
            }
        }
        const errorFnDelete: ((err: Response) => void) = err => {
                if (isPresent(errorFn)) {
                    errorFn(err.status)
                }
            }

        this.http.delete(uri, options).subscribe(nextFn, errorFnDelete)
    }

    // http://www.sitepoint.com/15-best-javascript-charting-libraries
    // http://thenextweb.com/dd/2015/06/12/20-best-javascript-chart-libraries
    // http://mikemcdearmon.com/portfolio/techposts/charting-libraries-using-d3

    // D3 (= Data Driven Documents) ist das fuehrende Produkt fuer
    // Datenvisualisierung:
    //  initiale Version durch die Dissertation von Mike Bostock
    //  gesponsort von der New York Times, seinem heutigen Arbeitgeber
    //  basiert auf SVG = scalable vector graphics: Punkte, Linien, Kurven, ...
    //  ca 250.000 Downloads/Monat bei https://www.npmjs.com
    //  https://github.com/mbostock/d3 mit ueber 100 Contributors

    // Chart.js ist deutlich einfacher zu benutzen als D3
    //  basiert auf <canvas>
    //  ca 25.000 Downloads/Monat bei https://www.npmjs.com
    //  https://github.com/nnnick/Chart.js mit ueber 60 Contributors

    /**
     * Ein Balkendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    @log
    createBarChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriKunde
        const nextFn: ((response: Response) => void) = (response) => {
            if (response.status !== 200) {
                console.error('response=', response)
                return
            }

            const kunden = this.responseToArrayKunde(response)
            const labels =
                kunden.map(kunde => kunde._id) as Array<string>
            console.log('KundeService.createBarChart(): labels: ', labels)
            const betragData =
                kunden.map(kunde => kunde.)

            const ratingData =
                buecher.map(buch => buch.rating) as Array<number>

            const datasets: Array<ChartDataSets> =
                [{label: 'Bewertung', data: ratingData}]
            const config: ChartConfiguration = {
                type: 'bar',
                data: {labels, datasets},
            }
            this.diagrammService.createChart(chartElement, config)
        }

        this.http.get(uri).subscribe(nextFn)
    }

    /**
     * Ein Liniendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    @log
    createLinearChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriBuch
        const nextFn: ((response: Response) => void) = response => {
            if (response.status !== 200) {
                console.error('response=', response)
                return
            }

            const buecher = this.responseToArrayBuch(response)
            const labels =
                buecher.map(buch => buch._id) as Array<string>
            const ratingData =
                buecher.map(buch => buch.rating) as Array<number>

            const datasets: Array<ChartDataSets> =
                [{label: 'Bewertung', data: ratingData}]

            const config: ChartConfiguration = {
                type: 'line',
                data: {labels, datasets},
            }

            this.diagrammService.createChart(chartElement, config)
        }

        this.http.get(uri).subscribe(nextFn)
    }

    /**
     * Ein Tortendiagramm erzeugen und bei einem Tag <code>canvas</code>
     * einf&uuml;gen.
     * @param chartElement Das HTML-Element zum Tag <code>canvas</code>
     */
    @log
    createPieChart(chartElement: HTMLCanvasElement) {
        const uri = this.baseUriBuch
        const nextFn: ((response: Response) => void) = response => {
            if (response.status !== 200) {
                console.error('response=', response)
                return
            }

            const buecher = this.responseToArrayBuch(response)
            const labels =
                buecher.map(buch => buch._id) as Array<string>
            const ratingData =
                buecher.map(buch => buch.rating) as Array<number>

            const backgroundColor =
                new Array<string>(ratingData.length)
            const hoverBackgroundColor =
                new Array<string>(ratingData.length)
            _.times(ratingData.length, i => {
                backgroundColor[i] = this.diagrammService.getBackgroundColor(i)
                hoverBackgroundColor[i] =
                    this.diagrammService.getHoverBackgroundColor(i)
            })

            const data: any = {
                labels,
                datasets: [{
                    data: ratingData,
                    backgroundColor,
                    hoverBackgroundColor,
                }],
            }

            const config: ChartConfiguration = {type: 'pie', data}
            this.diagrammService.createChart(chartElement, config)
        }

        this.http.get(uri).subscribe(nextFn)
    }

    toString() {
        return `KundeService: {kunde: ${JSON.stringify(this._kunde, null, 2)}}`
    }

    /**
     * Ein Response-Objekt in ein Array von Kunde-Objekten konvertieren.
     * @param response Response-Objekt eines GET-Requests.
     */
    @log
    private suchkriterienToSearchParams(suchkriterien: KundeForm):
        URLSearchParams {
        const searchParams = new URLSearchParams()

        if (!isEmpty(suchkriterien.nachname)) {
            searchParams.set('nachname', suchkriterien.nachname as string)
        }
        if (isPresent(suchkriterien.email)) {
            searchParams.set('email', suchkriterien.email as string)
        }
        if (isPresent(suchkriterien.lesen) && suchkriterien.lesen) {
            searchParams.set('LESEN', 'true')
        }
        if (isPresent(suchkriterien.sport) && suchkriterien.sport) {
            searchParams.set('SPORT', 'true')
        }
        if (isPresent(suchkriterien.reisen) && suchkriterien.reisen) {
            searchParams.set('REISEN', 'true')
        }
        return searchParams
    }

    /**
     * Ein Response-Objekt in ein Array von Kunde-Objekten konvertieren.
     * @param response Response-Objekt eines GET-Requests.
     */
    @log
    private responseToArrayKunde(response: Response) {
        const jsonArray = response.json() as Array<KundeServer>
        return jsonArray.map(jsonObjekt => Kunde.fromServer(jsonObjekt))
    }

    /**
     * Ein Response-Objekt in ein Kunde-Objekt konvertieren.
     * @param response Response-Objekt eines GET-Requests.
     */
    @log
    private responseToKunde(response: Response) {
        const jsonObjekt = response.json() as KundeServer
        return Kunde.fromServer(jsonObjekt)
    }
}
