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

import {ModuleWithProviders} from '@angular/core'
import {RouterModule, Routes} from '@angular/router'

import CreateBuchComponent from '../buch/create-buch/create-buch.component'
import CreateBuchGuard from '../buch/create-buch/create-buch.guard'
import DetailsBuchComponent from '../buch/details-buch/details-buch.component'
import BalkendiagrammComponent from '../buch/diagramme/balkendiagramm.component'
import LiniendiagrammComponent from '../buch/diagramme/liniendiagramm.component'
import TortendiagrammComponent from '../buch/diagramme/tortendiagramm.component'
import SucheBuecherComponent from '../buch/suche-buecher/suche-buecher.component'
import UpdateBuchComponent from '../buch/update-buch/update-buch.component'

import {AdminGuard} from '../auth/admin.guard'
import HomeComponent from '../home/home.component'

export const HOME_PATH = ''
export const DETAILS_BUCH_PATH = 'detailsBuch'

// https://angular.io/docs/ts/latest/guide/router.html
/**
 * Route-Definitionen f&uuml;r AppModule.
 */
const routes: Routes = [
    {path: HOME_PATH, component: HomeComponent},
    {path: 'sucheBuecher', component: SucheBuecherComponent},
    // id als Pfad-Parameter
    {path: `${DETAILS_BUCH_PATH}/:id`, component: DetailsBuchComponent}, {
        path: 'updateBuch/:id',
        component: UpdateBuchComponent,
        canActivate: [AdminGuard],
    },
    {
      path: 'createBuch',
      component: CreateBuchComponent,
      canActivate: [AdminGuard],
      canDeactivate: [CreateBuchGuard],
    },
    {
      path: 'balkendiagramm',
      component: BalkendiagrammComponent,
      canActivate: [AdminGuard],
    },
    {
      path: 'liniendiagramm',
      component: LiniendiagrammComponent,
      canActivate: [AdminGuard],
    },
    {
      path: 'tortendiagramm',
      component: TortendiagrammComponent,
      canActivate: [AdminGuard],
    },

    // Weiterer Pfad fuer die Produktion.
    // In der Entwicklung ist es einfacher, bei FALSCHEN Pfaden die Fehler sehen
    // {path: '**', component: NotFoundComponent}
]

const ROOT_ROUTES: ModuleWithProviders = RouterModule.forRoot(routes)
export default ROOT_ROUTES
