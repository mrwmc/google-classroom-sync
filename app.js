import { google } from 'googleapis'
import googleAuth from './modules/google-auth.js'
import appSettings from './config/config.js'
import classroomActions from './modules/google-classroom-actions.js'
import generateSubjectsFromCSV from './modules/build-subjects-from-csv.js'
import googleClassroom from './modules/get-cloud-courses.js'

async function main () {
  const auth = googleAuth()
  await googleClassroom.getCloudCourses(auth)
  const dataset = generateSubjectsFromCSV()
}

main().catch(console.error)
