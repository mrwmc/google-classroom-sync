import googleClassroom from './get-cloud-courses.js'
import googleAuth from './google-auth.js'
import classroomActions from './google-classroom-actions.js'
import appSettings from '../config/config.js'
import arrayDiff from './array-differ.js'
import chalk from 'chalk'

export default async function generateSyncTasks (dataset, coursesAliases) {
  const auth = googleAuth()
  const tasks = []

  await generateSubjectTaks()
  await generateClassTasks()
  await generateStudentCourseEnrolmentTasks()
  await generateTeacherCourseEnrolmentTasks()
  await generateCourseArchiveTasks()

  async function generateCourseArchiveTasks () {
    const classCourses = []
    coursesAliases.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key.substring(0, 6) === `d:${appSettings.academicYear}`) {
          classCourses.push(key)
        }
      })
    })

    const currentTimetabledClasses = []
    dataset.subjects.forEach((s) => {
      s.ClassCodes.forEach((c) => {
        currentTimetabledClasses.push(`d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`)
      })
    })
    const diffedItems = arrayDiff.diff(currentTimetabledClasses, classCourses)
    const coursesToArchive = diffedItems.arr2Diff

    coursesToArchive.forEach((course) => {
      tasks.push({
        type: 'archiveCourse',
        courseAttributes: {
          id: course,
          courseState: 'ARCHIVED'
        }
      })
    })
  }

  async function generateSubjectTaks () {
    console.log(chalk.yellow('\n [ Generating subject tasks... ]'))

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
    console.log(chalk.yellow('\n [ Generating class tasks... ]'))

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

    console.log(chalk.yellow('\n[ Fetching Student Enrolments... ]\n'))
    const remoteCourseEnrolments = await Promise.all(
      timetabledClasses.map(async (c, index) => {
        const courseAlias = c.classCode

        return await classroomActions.getStudentsForCourse(
          auth,
          courseAlias,
          index,
          timetabledClasses.length
        )
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
            const diffedItems = arrayDiff.diff(
              students,
              rCourse.students
            )

            const studentsToAdd = diffedItems.arr1Diff
            studentsToAdd.forEach((student) => {
              tasks.push({
                type: 'addStudent',
                courseId: rCourse.courseId,
                student
              })
            })

            const studentsToRemove = diffedItems.arr2Diff
            studentsToRemove.forEach((student) => {
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

  async function generateTeacherCourseEnrolmentTasks () {
    const subjectsAndClasses = []
    dataset.subjects.forEach((s) => {
      subjectsAndClasses.push({
        course: `d:SUBJ-${s.SubjectCode.substring(1)}`,
        teachers: s.Teachers
      })

      s.ClassCodes.forEach((c) => {
        subjectsAndClasses.push({
          course: `d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`,
          teachers: s.Teachers
        })
      })
    })

    const remoteCourseEnrolments = await Promise.all(
      subjectsAndClasses.map(async (sc, index) => {
        const courseAlias = sc.course

        return await classroomActions.getTeachersForCourse(
          auth,
          courseAlias,
          index,
          subjectsAndClasses.length
        )
      })
    )

    subjectsAndClasses.forEach((sc) => {
      const course = sc.course
      const teachers = sc.teachers

      const remoteCourse = remoteCourseEnrolments.filter(obj => {
        if (obj) {
          return obj.courseId === course
        }
      })

      if (remoteCourse.length) {
        remoteCourseEnrolments.forEach(async (rCourse) => {
          if (rCourse && rCourse.courseId === course) {
            const diffedItems = arrayDiff.diff(
              teachers,
              rCourse.teachers
            )

            const teachersToAdd = diffedItems.arr1Diff
            teachersToAdd.forEach((teacher) => {
              tasks.push({
                type: 'addTeacher',
                courseId: rCourse.courseId,
                teacher
              })
            })

            const teachersToRemove = diffedItems.arr2Diff
            teachersToRemove.forEach((teacher) => {
              if (teacher !== appSettings.classAdmin) {
                tasks.push({
                  type: 'removeTeacher',
                  courseId: rCourse.courseId,
                  teacher
                })
              }
            })
          }
        })
      } else {
        teachers.forEach((teacher) => {
          tasks.push({
            type: 'addTeacher',
            courseId: course,
            teacher
          })
        })
      }
    })
  }

  return tasks
}
