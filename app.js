import { google } from 'googleapis'
import googleAuth from './google-auth.js'
import appSettings from './config/config.js'

async function main () {
  const auth = googleAuth()
}

main().catch(console.error)
