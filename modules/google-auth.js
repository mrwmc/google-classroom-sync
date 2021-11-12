import { google } from 'googleapis'
import fs from 'fs'
import appSettings from '../config/config.js'

export default function g () {
  const keyFile = fs.readFileSync(appSettings.keyFile)
  const keys = JSON.parse(keyFile)

  const scopes = appSettings.scopes

  const auth = new google.auth.JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes,
    subject: 'superadmin@cheltsec.vic.edu.au'
  })

  return auth
}
