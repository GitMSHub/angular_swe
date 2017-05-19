/*
 * Copyright (C) 2016 Juergen Zimmermann, Hochschule Karlsruhe
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

/* global require */
/* eslint max-len: 0 */

const inquirer = require('inquirer')
const shell = require('shelljs')

const questions = [
    {
        message: 'Username: ',
        name: 'username',
    },
    {
        message: 'Password: ',
        name: 'password',
        type: 'password',
    },
]

inquirer
    .prompt(questions)
    .then(answers => {
        const {username, password} = answers

        shell.exec(`npm c set proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888 && npm c set https-proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888`)
        shell.exec(`git config --global http.proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888 && git config --global https.proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888 && git config --global url."http://".insteadOf git://`)
    })
