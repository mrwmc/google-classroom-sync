import { google } from 'googleapis'
import googleAuth from './google-auth.js'
import appSettings from './config/config.js'
import classroomActions from './google-classroom-actions.js'
import generateSubjectsFromCSV from './build-subjects-from-csv.js'
// import googleClassroomActions from './google-classroom-actions.js'
import getCloudCourses from './get-cloud-courses.js'

async function main () {
  const auth = googleAuth()

  const remoteCourses = await getCloudCourses(auth, appSettings.classAdmin)
  const dataset = generateSubjectsFromCSV()
  const aliasMap = await getCourseAliasesMap(auth, remoteCourses)
  console.dir(aliasMap, { maxArrayLength: null })
}

async function getCourseAliasesMap (auth, remoteCourses) {
  console.log('Mapping Google course Ids to Aliases')

  const results = await Promise.all(
    remoteCourses.map(async (course, index) => {
      return await classroomActions.getCourseAliases(auth,
        course.id,
        index,
        remoteCourses.length)
    })
  )

  const aliasToCourseIdMap = []

  results.forEach((result) => {
    const couseId = result.id
    result.aliases.forEach(e => {
      aliasToCourseIdMap.push({
        [e]: couseId
      })
    })
  })

  return aliasToCourseIdMap
}

async function updateCourseDescriptions (auth, subjects, remoteCourses) {
  const classesToUpdate = []

  subjects.forEach((subject, i) => {
    const subjectName = subject.SubjectName
    const faculty = subject.Faculty

    subject.ClassCodes.forEach(async (c) => {
      const classCode = 'd:' + appSettings.academicYear + '-1' + c.ClassCode.substring(1)

      // console.log(classCode)

      const descriptionHeading = 'UPDATED-' + appSettings.academicYear + '-1' + c.ClassCode.substring(1) // trims the semester prefix
      const description = 'Subject Domain: ' + faculty + ' - ' + subjectName
      const courseState = 'ACTIVE'

      // const matchedCloudCourse = cloudCourses.find(o => o.descriptionHeading === classCode)

      classesToUpdate.push({
        id: classCode,
        name: c.ClassCode,
        section: subjectName,
        descriptionHeading,
        description,
        courseState
      })
    })
  })
}

main().catch(console.error)
