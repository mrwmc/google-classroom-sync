import { google } from 'googleapis'
import util from './util.js'
import appSettings from '../config/config.js'
import chalk from 'chalk'

export default {
  async getStudentsForCourse (auth, courseId, index, total) {
    const classroom = google.classroom({ version: 'v1', auth })

    index = index || 0
    total = total || 0

    const params = {
      courseId,
      pageSize: 100
    }

    await util.sleep(index * appSettings.taskDelay)
    console.log(`Fetching students for course: ${courseId} ${index} of ${total}`)
    try {
      const res = await classroom.courses.students.list(params)
      const students = []

      if (res.data.students.length) {
        res.data.students.forEach(e => {
          students.push(e.profile.emailAddress)
        })
      }

      return { courseId, students }
    } catch (e) {
      const errorSource = 'getStudentsForCourse() CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async getTeachersForCourse (auth, courseId, index, total) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId: courseId,
      pageSize: 100
    }

    await util.sleep(index * appSettings.taskDelay)
    console.log(chalk.whiteBright(`Fetching teachers for course: ${courseId} ${index} of ${total}`))

    try {
      const res = await classroom.courses.teachers.list(params)
      const teachers = []

      if (res.data.teachers.length) {
        res.data.teachers.forEach(e => {
          teachers.push(e.profile.emailAddress)
        })
      }

      return { courseId, teachers }
    } catch (e) {
      const errorSource = 'getTeachersForCourse() CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async getCourse (auth, courseId) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      id: courseId
    }

    try {
      const res = await classroom.courses.get(params)
      const course = res.data
      return course
    } catch (e) {
      const errorSource = 'getClassroomCourse() - CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async updateCourse (auth, courseAttributes) {
    const classroom = google.classroom({ version: 'v1', auth })

    const id = courseAttributes.id
    const name = courseAttributes.name
    const section = courseAttributes.section
    const description = courseAttributes.description
    const descriptionHeading = courseAttributes.descriptionHeading
    const courseState = courseAttributes.courseState

    const params = {
      id,
      updateMask: 'name,section,description,descriptionHeading,courseState',
      requestBody: {
        name,
        section,
        description,
        descriptionHeading,
        courseState
      }
    }

    try {
      const res = await classroom.courses.patch(params)
      const course = res.data

      return course
    } catch (e) {
      const errorSource = 'updateCourse() - CourseId: ' + id
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async changeCourseState (auth, courseAttributes) {
    const classroom = google.classroom({ version: 'v1', auth })

    const id = courseAttributes.id
    const courseState = courseAttributes.courseState

    const params = {
      id,
      updateMask: 'courseState',
      requestBody: {
        courseState
      }
    }

    try {
      const res = await classroom.courses.patch(params)
      const course = res.data

      return course
    } catch (e) {
      const errorSource = 'changeCourseState() - CourseId: ' + id
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async addTeacherToCourse (auth, courseId, teacher) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId,
      requestBody: { userId: teacher }
    }

    try {
      const res = await classroom.courses.teachers.create(params)
      return res.data
    } catch (e) {
      const errorSource = 'addTeacherToCourse() - CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async addStudentToCourse (auth, courseId, student) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId,
      requestBody: { userId: student }
    }

    try {
      const res = await classroom.courses.students.create(params)
      return res.data
    } catch (e) {
      const errorSource = 'addStudentToCourse() - CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async removeStudentFromCourse (auth, courseId, student) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId,
      userId: student
    }

    try {
      const res = await classroom.courses.students.delete(params)
      return res.data
    } catch (e) {
      const errorSource = 'addStudentToCourse() - CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async removeTeacherFromCourse (auth, courseId, teacher) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId,
      userId: teacher
    }

    try {
      const res = await classroom.courses.teachers.delete(params)
      return res.data
    } catch (e) {
      const errorSource = 'addStudentToCourse() - CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async createCourseAlias (auth, courseId, newAlias) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId,
      requestBody: {
        alias: newAlias
      }
    }

    try {
      const res = await classroom.courses.aliases.create(params)
      return res.data
    } catch (e) {
      const errorSource = 'createCourseAlias() - CourseId: ' + courseId
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async getCourseAliases (auth, courseId, index, total) {
    const classroom = google.classroom({ version: 'v1', auth })
    index = index || 0
    total = total || 0

    index = index + 1

    await util.sleep(index * appSettings.taskDelay)
    console.log(chalk.white(`Fetching aliases for course: ${courseId} ${index} of ${total}`))

    const aliases = []
    let nextPageToken = ''

    do {
      const params = {
        courseId,
        pageSize: 100,
        pageToken: nextPageToken || ''
      }
      try {
        const res = await classroom.courses.aliases.list(params)

        if (res.data.aliases && res.data.aliases.length) {
          res.data.aliases.forEach((e) => {
            aliases.push(e.alias)
          })
        }

        nextPageToken = res.data.nextPageToken
      } catch (e) {
        const errorSource = 'getCourseAliases() - CourseId: ' + courseId
        util.logError(errorSource, e)
        console.error(errorSource, e)
      }
    } while (nextPageToken)

    return {
      id: courseId,
      aliases
    }
  },

  async deleteCourseAlias (auth, courseId, alias) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      courseId,
      alias
    }

    try {
      const res = await classroom.courses.aliases.delete(params)
      return res.data
    } catch (e) {
      const errorSource = 'deleteCourseAlias()'
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  },

  async createCourse (auth, courseAttributes) {
    const classroom = google.classroom({ version: 'v1', auth })

    const params = {
      requestBody: {
        id: courseAttributes.id,
        ownerId: courseAttributes.ownerId,
        name: courseAttributes.name,
        section: courseAttributes.section,
        description: courseAttributes.description,
        descriptionHeading: courseAttributes.descriptionHeading,
        courseState: courseAttributes.courseState
      }
    }

    try {
      const res = await classroom.courses.create(params)
      return res.data
    } catch (e) {
      const errorSource = 'createCourse()'
      util.logError(errorSource, e.response.data.error.message)
      console.error(errorSource, e.response.data.error.message)
    }
  }
}
