import googleAuth from './modules/google-auth.js'
import classroomActions from './modules/google-classroom-actions.js'
import generateSubjectsFromCSV from './modules/build-subjects-from-csv.js'
import googleClassroom from './modules/get-cloud-courses.js'
import generateSyncTasks from './modules/generate-sync-tasks.js'
import chalk from 'chalk'

async function main () {
  const auth = googleAuth()
  await googleClassroom.getCloudCourses(auth)
  const aliasMap = googleClassroom.aliasMap
  const courses = googleClassroom.cloudCourses

  const dataset = generateSubjectsFromCSV()
  const tasks = await generateSyncTasks(dataset, aliasMap, courses)

  runSyncTasks(tasks)

  async function runSyncTasks (tasks) {
    if (tasks.courseCreationTasks.length) {
      console.log(chalk.yellow('\n[ Running Course Creation Tasks ]\n'))

      for (const [index, task] of tasks.courseCreationTasks.entries()) {
        console.log(task)
        await classroomActions.createCourse(
          auth,
          task.courseAttributes,
          index,
          tasks.courseCreationTasks.length
        )
      }
    }

    if (tasks.courseUpdatetasks.length) {
      console.log(chalk.yellow('\n[ Running Course Attribute Update Tasks ]\n'))

      await Promise.all(
        tasks.courseUpdatetasks.map(async (task, index) => {
          return await classroomActions.updateCourse(
            auth,
            task.courseAttributes,
            index,
            tasks.courseUpdatetasks.length
          )
        })
      )
    }

    if (tasks.teacherCourseEnrolmentTasks.length) {
      console.log(chalk.yellow('\n[ Running Teacher Course Enrolment Tasks ]\n'))

      await Promise.all(
        tasks.teacherCourseEnrolmentTasks.map(async (task, index) => {
          return await classroomActions.addTeacherToCourse(
            auth,
            task.courseId,
            task.teacher,
            index,
            tasks.teacherCourseEnrolmentTasks.length
          )
        })
      )
    }

    if (tasks.teacherCourseRemovalTasks.length) {
      console.log(chalk.yellow('\n[ Running Teacher Course Removal Tasks ]\n'))

      await Promise.all(
        tasks.teacherCourseRemovalTasks.map(async (task, index) => {
          return await classroomActions.removeTeacherFromCourse(
            auth,
            task.courseId,
            task.teacher,
            index,
            tasks.teacherCourseRemovalTasks.length
          )
        })
      )
    }

    if (tasks.studentCourseEnrolmentTasks.length) {
      console.log(chalk.yellow('\n[ Running Student Course Enrolment Tasks ]\n'))

      await Promise.all(
        tasks.studentCourseEnrolmentTasks.map(async (task, index) => {
          return await classroomActions.addStudentToCourse(
            auth,
            task.courseId,
            task.student,
            index,
            tasks.studentCourseEnrolmentTasks.length
          )
        })
      )
    }

    if (tasks.studentCourseRemovalTasks.length) {
      console.log(chalk.yellow('\n[ Running Student Course Removal Tasks ]\n'))

      await Promise.all(
        tasks.studentCourseRemovalTasks.map(async (task, index) => {
          return await classroomActions.removeStudentFromCourse(
            auth,
            task.courseId,
            task.student,
            index,
            tasks.studentCourseRemovalTasks.length
          )
        })
      )
    }

    if (tasks.courseArchiveTasks.length) {
      console.log(chalk.yellow('\n[ Archiving Non-Timetabled Courses ]\n'))

      await Promise.all(
        tasks.courseArchiveTasks.map(async (task, index) => {
          return await classroomActions.changeCourseState(
            auth,
            task.courseAttributes,
            index,
            tasks.courseArchiveTasks.length
          )
        })
      )
    }
  }
}

main().catch(console.error)
