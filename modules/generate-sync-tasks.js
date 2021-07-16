import chalk from 'chalk'
import getCourses from './get-courses.js'
import classroomActions from './google-classroom-actions.js'
import googleAuth from './google-auth.js'
import appSettings from '../config/config.js'
import arrayDiff from './array-diff.js'

export default {
  async getSubjectCourseCreationTasks (store) {
    console.log(chalk.yellow('\n[ Generating Subject Course Creation Tasks ]\n'))

    store.timetable.subjects.forEach((s) => {
      const alias = `d:SUBJ-${s.SubjectCode.substring(1)}`
      const subjectCourse = getCourses.findCourse(store, alias)

      if (!Object.keys(subjectCourse).length) {
        store.courseCreationTasks.push({
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
    })
  },

  async getClassCourseCreationTasks (store) {
    console.log(chalk.yellow('\n[ Generating ClassCode Course Creation Tasks ]\n'))

    store.timetable.subjects.forEach((s) => {
      const subjectName = s.SubjectName
      const faculty = s.Faculty

      s.ClassCodes.forEach((c) => {
        const alias = `d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`
        const classCourse = getCourses.findCourse(store, alias)

        if (!Object.keys(classCourse).length) {
          store.courseCreationTasks.push({
            type: 'createCourse',
            courseAttributes: {
              id: alias,
              ownerId: appSettings.classAdmin,
              name: `${c.ClassCode}`,
              section: subjectName,
              description: `Domain: ${faculty} - ${subjectName}`,
              descriptionHeading: `Subject Domain: ${s.Faculty}`,
              courseState: 'ACTIVE'
            }
          })
        }
      })
    })
  },

  async getCompositeClassCourseCreationTasks (store) {
    console.log(chalk.yellow('\n[ Generating Composite ClassCode Course Creation Tasks ]\n'))

    store.timetable.CompositeClasses.forEach(async (c) => {
      const alias = `d:2021-${c.ClassCode}`
      const name = c.ClassCode
      const compositeCourse = getCourses.findCourse(store, alias)

      if (!Object.keys(compositeCourse).length) {
        store.courseCreationTasks.push({
          type: 'createCourse',
          courseAttributes: {
            id: alias,
            ownerId: appSettings.classAdmin,
            name: `${name} (Composite)`,
            section: c.SubjectName,
            description: '',
            descriptionHeading: '',
            courseState: 'ACTIVE'
          }
        })
      }
    })
  },

  async getSubjectCourseAttributeUpdateTasks (store) {
    console.log(chalk.yellow('\n[ Generating Subject Course Attribute Update Tasks ]\n'))

    store.timetable.subjects.forEach((s) => {
      const alias = `d:SUBJ-${s.SubjectCode.substring(1)}`
      const subjectCourse = getCourses.findCourse(store, alias)

      if (Object.keys(subjectCourse).length) {
        store.courseUpdatetasks.push({
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
  },

  async getClassCourseAttributeUpdateTasks (store) {
    console.log(chalk.yellow('\n[ Generating ClassCode Course Attribute Update Tasks ]\n'))

    store.timetable.subjects.forEach((s) => {
      const subjectName = s.SubjectName
      const faculty = s.Faculty

      s.ClassCodes.forEach((c) => {
        const alias = `d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`
        const classCourse = getCourses.findCourse(store, alias)

        if (Object.keys(classCourse).length) {
          store.courseUpdatetasks.push({
            type: 'updateCourse',
            courseAttributes: {
              id: alias,
              name: `${c.ClassCode}`,
              section: subjectName,
              description: `Domain: ${faculty} - ${subjectName}`,
              descriptionHeading: `Subject Domain: ${s.Faculty}`,
              courseState: 'ACTIVE'
            }
          })
        }
      })
    })
  },

  async getCompositeClassCourseAttributeUpdateTasks (store) {
    console.log(chalk.yellow('\n[ Generating Composite ClassCode Course Attribute Update Tasks ]\n'))

    store.timetable.CompositeClasses.forEach(async (c) => {
      const alias = `d:2021-${c.ClassCode}`
      const name = c.ClassCode
      const compositeCourse = getCourses.findCourse(store, alias)

      if (Object.keys(compositeCourse).length) {
        store.courseUpdatetasks.push({
          type: 'updateCourse',
          courseAttributes: {
            id: alias,
            ownerId: appSettings.classAdmin,
            name: `${name} (Composite)`,
            section: c.SubjectName,
            description: '',
            descriptionHeading: '',
            courseState: 'ACTIVE'
          }
        })
      }
    })
  },

  async getCompositeClassCourseEnrolmentTasks (store) {
    console.log(chalk.yellow('\n[ Fetching Current Composite Class Enrolments ]\n'))
    const auth = googleAuth()

    const remoteCourseStudentEnrolments = await Promise.all(
      store.timetable.CompositeClasses.map(async (c, index) => {
        const courseAlias = `d:${appSettings.academicYear}-${c.ClassCode}`

        return await classroomActions.getStudentsForCourse(
          auth,
          courseAlias,
          index,
          store.timetable.CompositeClasses.length
        )
      })
    )

    const remoteCourseTeacherEnrolments = await Promise.all(
      store.timetable.CompositeClasses.map(async (c, index) => {
        const courseAlias = `d:${appSettings.academicYear}-${c.ClassCode}`

        return await classroomActions.getTeachersForCourse(
          auth,
          courseAlias,
          index,
          store.timetable.CompositeClasses.length
        )
      })
    )

    store.timetable.CompositeClasses.forEach((c) => {
      const classCode = `d:${appSettings.academicYear}-${c.ClassCode}`
      const teachers = c.Teachers
      const students = c.Students

      const remoteCourse = remoteCourseStudentEnrolments.filter(obj => {
        if (obj) {
          return obj.courseId === classCode
        }
      })

      if (remoteCourse.length) {
        remoteCourseStudentEnrolments.forEach(async (rCourse) => {
          if (rCourse && rCourse.courseId === classCode) {
            const diffedItems = arrayDiff(
              students,
              rCourse.students
            )

            const studentsToAdd = diffedItems.arr1Diff
            studentsToAdd.forEach((student) => {
              store.studentCourseEnrolmentTasks.push({
                type: 'addStudent',
                courseId: rCourse.courseId,
                student
              })
            })

            const studentsToRemove = diffedItems.arr2Diff
            studentsToRemove.forEach((student) => {
              store.studentCourseRemovalTasks.push({
                type: 'removeStudent',
                courseId: rCourse.courseId,
                student
              })
            })
          }
        })

        remoteCourseTeacherEnrolments.forEach(async (rCourse) => {
          if (rCourse && rCourse.courseId === classCode) {
            const diffedItems = arrayDiff(
              teachers,
              rCourse.teachers
            )

            const teachersToAdd = diffedItems.arr1Diff
            teachersToAdd.forEach((teacher) => {
              store.teacherCourseEnrolmentTasks.push({
                type: 'addTeacher',
                courseId: rCourse.courseId,
                teacher
              })
            })

            const teachersToRemove = diffedItems.arr2Diff
            teachersToRemove.forEach((teacher) => {
              if (teacher !== appSettings.classAdmin) {
                store.teacherCourseRemovalTasks.push({
                  type: 'removeTeacher',
                  courseId: rCourse.courseId,
                  teacher
                })
              }
            })
          }
        })
      }
    })
  },

  async getStudentCourseEnrolmentTasks (store) {
    console.log(chalk.yellow('\n[ Fetching Current Student Course Enrolments ]\n'))
    const auth = googleAuth()

    const timetabledClasses = []
    store.timetable.subjects.forEach((s) => {
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
            const diffedItems = arrayDiff(
              students,
              rCourse.students
            )

            const studentsToAdd = diffedItems.arr1Diff
            studentsToAdd.forEach((student) => {
              store.studentCourseEnrolmentTasks.push({
                type: 'addStudent',
                courseId: rCourse.courseId,
                student
              })
            })

            const studentsToRemove = diffedItems.arr2Diff
            studentsToRemove.forEach((student) => {
              store.studentCourseRemovalTasks.push({
                type: 'removeStudent',
                courseId: rCourse.courseId,
                student
              })
            })
          }
        })
      }
    })
  },

  async getTeacherCourseEnrolmentTasks (store) {
    console.log(chalk.yellow('\n[ Fetching Current Teacher Course Enrolments ]\n'))
    const auth = googleAuth()

    const subjectsAndClasses = []
    store.timetable.subjects.forEach((s) => {
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
            const diffedItems = arrayDiff(
              teachers,
              rCourse.teachers
            )

            const teachersToAdd = diffedItems.arr1Diff
            teachersToAdd.forEach((teacher) => {
              store.teacherCourseEnrolmentTasks.push({
                type: 'addTeacher',
                courseId: rCourse.courseId,
                teacher
              })
            })

            const teachersToRemove = diffedItems.arr2Diff
            teachersToRemove.forEach((teacher) => {
              if (teacher !== appSettings.classAdmin) {
                store.teacherCourseRemovalTasks.push({
                  type: 'removeTeacher',
                  courseId: rCourse.courseId,
                  teacher
                })
              }
            })
          }
        })
      }
    })
  },

  async getCourseArchiveTasks (store) {
    console.log(chalk.yellow('\n[ Generating Course Archive Tasks ]\n'))

    const currentClassCourses = []
    store.coursesAliases.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key.substring(0, 6) === `d:${appSettings.academicYear}`) {
          const course = getCourses.findCourse(key)

          if (course.courseState === 'ACTIVE') {
            currentClassCourses.push(key)
          }
        }
      })
    })

    const currentTimetabledClasses = []
    store.timetable.subjects.forEach((s) => {
      s.ClassCodes.forEach((c) => {
        currentTimetabledClasses.push(`d:${appSettings.academicYear}-${c.ClassCode.substring(1)}`)
      })
    })

    store.timetable.CompositeClasses.forEach((c) => {
      currentTimetabledClasses.push(`d:${appSettings.academicYear}-${c.ClassCode}`)
    })

    const diffedItems = arrayDiff(currentTimetabledClasses, currentClassCourses)
    const coursesToArchive = diffedItems.arr2Diff

    coursesToArchive.forEach((course) => {
      store.courseArchiveTasks.push({
        type: 'archiveCourse',
        courseAttributes: {
          id: course,
          courseState: 'ARCHIVED'
        }
      })
    })
  }
}
