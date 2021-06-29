import { google } from 'googleapis'
import googleAuth from './google-auth.js'

export default async function getCloudCourses () {
  const cloudCourses = await getCourses(googleAuth(), 'classadmin@cheltsec.vic.edu.au')
  return cloudCourses

  async function getCourses (auth, teacher) {
    const classroom = google.classroom({ version: 'v1', auth })

    const courses = []
    let nextPageToken = ''

    console.log('Getting remote Google Classroom Courses...')

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

    return courses
  }
}
