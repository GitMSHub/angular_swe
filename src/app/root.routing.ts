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

import CreateKundeComponent from '../kunde/create-kunde/create-kunde.component'
import CreateKundeGuard from '../kunde/create-kunde/create-kunde.guard'
import DetailsKundeComponent from '../kunde/details-kunde/details-kunde.component'
import BalkendiagrammComponent from '../kunde/diagramme/balkendiagramm.component'
import LiniendiagrammComponent from '../kunde/diagramme/liniendiagramm.component'
import TortendiagrammComponent from '../kunde/diagramme/tortendiagramm.component'
import SucheKundenComponent from '../kunde/suche-kunden/suche-kunden.component'
import UpdateKundeComponent from '../kunde/update-kunde/update-kunde.component'

import {AdminGuard} from '../auth/admin.guard'
import HomeComponent from '../home/home.component'

export const HOME_PATH = ''
export const DETAILS_KUNDE_PATH = 'detailsKunde'

// https://angular.io/docs/ts/latest/guide/router.html
/**
 * Route-Definitionen f&uuml;r AppModule.
 */
const routes: Routes = [
    {path: HOME_PATH, component: HomeComponent},
    {path: 'sucheKunden', component: SucheKundenComponent},
    // id als Pfad-Parameter
    {path: `${DETAILS_KUNDE_PATH}/:id`, component: DetailsKundeComponent}, {
        path: 'updateKunde/:id',
        component: UpdateKundeComponent,
        canActivate: [AdminGuard],
    },
    {
      path: 'createKunde',
      component: CreateKundeComponent,
      canActivate: [AdminGuard],
      canDeactivate: [CreateKundeGuard],
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
