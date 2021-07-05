import googleClassroom from './get-cloud-courses.js'
import googleAuth from './google-auth.js'
import classroomActions from './google-classroom-actions.js'
import appSettings from '../config/config.js'
import diffArrayMembers from './diff-course-members.js'

export default async function generateSyncTasks (dataset) {
  const auth = googleAuth()
  const tasks = []

  await generateSubjectTaks()
  await generateClassTasks()
  await generateStudentCourseEnrolmentTasks()

  async function generateSubjectTaks () {
    dataset.subjects.forEach((s) => {
      const alias = `d:SUBJ-${s.SubjectCode.substring(1)}`
      const subjectCourse = googleClassroom.findCourse(alias)

      // create courses for subjects that don't exist at google's end
      if (!Object.keys(subjectCourse).length) {
        tasks.push({
          type: 'createCourse',
          courseAttributes: {
            id: alias,
            ownerId: appSettings.classAdmin,
            name: `${s.SubjectCode.substring(1)} (Teachers)`,
            section: s.SubjectName,
            description: `Domain: ${s.Faculty} - ${s.SubjectName}`,
            descriptionHeading: `Subject Domain: ${s.Faculty}`,
            courseState: 'ACTIVE'
          }
        })
      }

      // update courses for subjects that do exisit
      if (Object.keys(subjectCourse).length) {
        tasks.push({
          type: 'updateCourse',
          courseAttributes: {
            id: alias,
            name: `${s.SubjectCode.substring(1)} (Teachers)`,
            section: s.SubjectName,
            description: `Domain: ${s.Faculty} - ${s.SubjectName}`,
            descriptionHeading: `Subject Domain: ${s.Faculty}`,
            courseState: 'ACTIVE'
          }
        })
      }
    })
  }

  async function generateClassTasks () {
  // process classes
    dataset.subjects.forEach((s) => {
      const subjectName = s.SubjectName
      const faculty = s.Faculty

      s.ClassCodes.forEach((c) => {
        const alias = `d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`
        const classCourse = googleClassroom.findCourse(alias)

        // create courses for classes that don't yet exist
        if (!Object.keys(classCourse).length) {
          tasks.push({
            type: 'createCourse',
            courseAttributes: {
              id: alias,
              ownerId: appSettings.classAdmin,
              name: `${c.ClassCode.substring(1)}`,
              section: subjectName,
              description: `Domain: ${faculty} - ${subjectName}`,
              descriptionHeading: `Subject Domain: ${s.Faculty}`,
              courseState: 'ACTIVE'
            }
          })
        }

        // update class attributes for class which do exist
        if (Object.keys(classCourse).length) {
          tasks.push({
            type: 'updateCourse',
            courseAttributes: {
              id: alias,
              name: `${c.ClassCode.substring(1)}`,
              section: subjectName,
              description: `Domain: ${faculty} - ${subjectName}`,
              descriptionHeading: `Subject Domain: ${s.Faculty}`,
              courseState: 'ACTIVE'
            }
          })
        }
      })
    })
  }

  async function generateStudentCourseEnrolmentTasks () {
    const timetabledClasses = []
    dataset.subjects.forEach((s) => {
      s.ClassCodes.forEach((c) => {
        timetabledClasses.push({
          classCode: `d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`,
          students: c.Students
        })
      })
    })

    const remoteCourseEnrolments = await Promise.all(
      timetabledClasses.map(async (c, index) => {
        const courseAlias = c.classCode

        return await classroomActions.getStudentsForCourse(
          auth,
          courseAlias,
          index,
          timetabledClasses.length)
      })
    )

    timetabledClasses.forEach((c) => {
      const classCode = c.classCode
      const students = c.students

      const remoteCourse = remoteCourseEnrolments.filter(obj => {
        if (obj) {
          return obj.courseId === classCode
        }
      })

      if (remoteCourse.length) {
        remoteCourseEnrolments.forEach(async (rCourse) => {
          if (rCourse && rCourse.courseId === classCode) {
            const diff = diffArrayMembers.diff(
              students,
              rCourse.students
            )

            diff.add.forEach((student) => {
              tasks.push({
                type: 'addStudent',
                courseId: rCourse.courseId,
                student
              })
            })

            diff.remove.forEach((student) => {
              tasks.push({
                type: 'removeStudent',
                courseId: rCourse.courseId,
                student
              })
            })
          }
        })
      } else {
        students.forEach((student) => {
          tasks.push({
            type: 'addStudent',
            courseId: classCode,
            student
          })
        })
      }
    })
  }

  return tasks
}
