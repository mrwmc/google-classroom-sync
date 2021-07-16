import { google } from 'googleapis'
import classroomActions from './google-classroom-actions.js'
import appSettings from '../config/config.js'
import chalk from 'chalk'

export default {
  async fetchCourses (auth, store) {
    await getCoursesFromGoogle(auth, appSettings.classAdmin)
    await getCourseAliasesMap(auth, store)

    async function getCoursesFromGoogle (auth, teacher) {
      const classroom = google.classroom({ version: 'v1', auth })

      const courses = []
      let nextPageToken = ''

      console.log(chalk.yellow(`\n[ Fetching remote Google Classroom Courses for ${appSettings.classAdmin} ]`))

      do {
        const params = {
          teacherId: teacher,
          pageSize: 0,
          pageToken: nextPageToken || ''
        }

        const res = await classroom.courses.list(params)
        Array.prototype.push.apply(courses, res.data.courses)

        nextPageToken = res.data.nextPageToken
      } while (nextPageToken)

      store.courses = courses
    }

    async function getCourseAliasesMap (auth, store) {
      console.log(chalk.yellow('\n[ Mapping Google Classroom course Ids to Aliases... ]\n'))

      const courses = store.courses

      const courseAliases = await Promise.all(
        courses.map(async (course, index) => {
          return await classroomActions.getCourseAliases(
            auth,
            course.id,
            index,
            courses.length
          )
        })
      )

      const aliasToCourseIdMap = []
      courseAliases.forEach((alias) => {
        const courseId = alias.id
        alias.aliases.forEach(e => {
          aliasToCourseIdMap.push({
            [e]: courseId
          })
        })
      })

      store.courseAliases = aliasToCourseIdMap
    }
  },

  findCourse (store, alias) {
    const courses = store.courses
    const courseAliases = store.courseAliases

    let courseId = ''
    let course = {}

    courseAliases.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key === alias) {
          courseId = item[key]
        }
      })
    })

    courses.forEach(c => {
      if (c.id === courseId) {
        course = c
      }
    })

    return course
  }
}
