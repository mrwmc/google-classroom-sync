import { google } from 'googleapis'
import classroomActions from './google-classroom-actions.js'
import appSettings from '../config/config.js'
import chalk from 'chalk'

export default {
  cloudCourses: [],
  aliasMap: [],

  async getCloudCourses (auth) {
    this.cloudCourses = await getCourses(auth, appSettings.classAdmin)
    this.aliasMap = await getCourseAliasesMap(auth, this.cloudCourses)

    async function getCourses (auth, teacher) {
      const classroom = google.classroom({ version: 'v1', auth })

      const courses = []
      let nextPageToken = ''

      console.log(chalk.yellow('\n[ Fetching remote Google Classroom Courses... ]'))

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

      console.log(chalk.magentaBright('[ Done! ]'))

      return courses
    }

    async function getCourseAliasesMap (auth, remoteCourses) {
      console.log(chalk.magentaBright('\n[ Mapping Google Classroom course Ids to Aliases ]'))

      const results = await Promise.all(
        remoteCourses.map(async (course, index) => {
          return await classroomActions.getCourseAliases(
            auth,
            course.id,
            index,
            remoteCourses.length
          )
        })
      )

      const aliasToCourseIdMap = []

      results.forEach((result) => {
        const courseId = result.id
        result.aliases.forEach(e => {
          aliasToCourseIdMap.push({
            [e]: courseId
          })
        })
      })
      // console.dir(aliasToCourseIdMap, { maxArrayLength: null })
      return aliasToCourseIdMap
    }
  },

  findCourse (alias) {
    let courseId = ''
    let course = {}

    this.aliasMap.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key === alias) {
          courseId = item[key]
        }
      })
    })

    this.cloudCourses.forEach(c => {
      if (c.id === courseId) {
        course = c
      }
    })

    return course
  }
}
