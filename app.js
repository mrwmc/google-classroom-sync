import { google } from 'googleapis'
import googleAuth from './google-auth.js'
import appSettings from './config/config.js'
import classroomActions from './google-classroom-actions.js'
import generateSubjectsFromCSV from './build-subjects-from-csv.js'
import googleClassroomActions from './google-classroom-actions.js'
import getCloudCourses from './get-cloud-courses.js'

async function main () {
  const auth = googleAuth()

  // const remoteCourses = await getCloudCourses(auth, appSettings.classAdmin)
  const subjects = generateSubjectsFromCSV()
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
