import { google } from 'googleapis'
import googleAuth from './modules/google-auth.js'
import appSettings from './config/config.js'
import classroomActions from './modules/google-classroom-actions.js'
import generateSubjectsFromCSV from './modules/build-subjects-from-csv.js'
import googleClassroom from './modules/get-cloud-courses.js'
import generateSyncTasks from './modules/generate-sync-tasks.js'

async function main () {
  const auth = googleAuth()
  await googleClassroom.getCloudCourses(auth)
  const aliasMap = googleClassroom.aliasMap
  const dataset = generateSubjectsFromCSV()
  const tasks = await generateSyncTasks(dataset, aliasMap)
  console.dir(tasks, { maxArrayLength: null })

  function sync (tasks) {
    
  }
}

main().catch(console.error)
