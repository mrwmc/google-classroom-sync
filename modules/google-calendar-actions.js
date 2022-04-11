import { google } from 'googleapis'
import appSettings from '../config/config.js'
import chalk from 'chalk'

export default {
  async firstFunction (auth) {
    // const calendar = google.calendar('v3')
    console.log('yo')
    const calendar = google.calendar({ version: 'v3', auth })
    //calendar.calendarList()
    //console.log(calendar)
    try {
      const res = await calendar.calendarList.list({})
      console.log(res)
    } catch (e) {
      console.log(e)
    }
  }
}
