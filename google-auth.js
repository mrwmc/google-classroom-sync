import { google } from 'googleapis'
import fs from 'fs'

export default function g () {
  const rawdata = fs.readFileSync('./tt-classroom-sync-0374f62a8cf4.json')
  const keys = JSON.parse(rawdata)

  const SCOPES = ['https://www.googleapis.com/auth/classroom.courses',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',
    'https://www.googleapis.com/auth/classroom.profile.emails',
    'https://www.googleapis.com/auth/classroom.profile.photos'
  ]

  const auth = new google.auth.JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes: SCOPES,
    subject: 'superadmin@cheltsec.vic.edu.au'
  })

  return auth
}
