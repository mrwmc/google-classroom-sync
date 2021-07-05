import { google } from 'googleapis'
import googleAuth from './modules/google-auth.js'
import appSettings from './config/config.js'
import classroomActions from './modules/google-classroom-actions.js'
import generateSubjectsFromCSV from './modules/build-subjects-from-csv.js'
import googleClassroom from './modules/get-cloud-courses.js'
import generateSyncTasks from './modules/generate-sync-tasks.js'

async function main () {
  const auth = googleAuth()
  const dataset = generateSubjectsFromCSV()
  await googleClassroom.getCloudCourses(auth)

  const tasks = await generateSyncTasks(dataset)
  console.dir(tasks, { maxArrayLength: null })
}

main().catch(console.error)
