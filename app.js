import googleAuth from './modules/google-auth.js'
import classroomActions from './modules/google-classroom-actions.js'
import generateSubjectsFromCSV from './modules/build-subjects-from-csv.js'
import getCourses from './modules/get-courses.js'
import generateSyncTasks from './modules/generate-sync-tasks.js'
import chalk from 'chalk'
import processArguments from './modules/process-arguments.js'
import store from './modules/store.js'

async function main () {
  const args = processArguments(process.argv)
  const auth = googleAuth()

  generateSubjectsFromCSV(store)
  await getCourses.fetchCourses(auth, store)

  if (args.includes('-COURSES'.toLocaleLowerCase())) {
    await generateSyncTasks.getSubjectCourseCreationTasks(store)
    await generateSyncTasks.getClassCourseCreationTasks(store)
    await generateSyncTasks.getCompositeClassCourseCreationTasks(store)

    await runCourseCreationTasks(store)
  }

  if (args.includes('-UPDATE'.toLocaleLowerCase())) {
    await generateSyncTasks.getSubjectCourseAttributeUpdateTasks(store)
    await generateSyncTasks.getClassCourseAttributeUpdateTasks(store)
    await generateSyncTasks.getCompositeClassCourseAttributeUpdateTasks(store)

    await runCourseUpdateTasks(store)
  }

  if (args.includes('-TEACHERS'.toLocaleLowerCase())) {
    await generateSyncTasks.getTeacherCourseEnrolmentTasks(store)

    await runTeacherCourseEnrolmentTasks(store)
  }

  console.log(chalk.magentaBright('\n[ Selected Sync Tasks Completed ]\n'))

  async function runCourseCreationTasks (store) {
    if (store.courseCreationTasks.length) {
      console.log(chalk.yellow('\n[ Running Course Creation Tasks ]\n'))

      for (const [index, task] of store.courseCreationTasks.entries()) {
        await classroomActions.createCourse(
          auth,
          task.courseAttributes,
          index,
          store.courseCreationTasks.length
        )
      }

      if (store.isCoursesCreationError) {
        store.isCoursesCreationError = false
        await runCourseCreationTasks(store)
      }
    }
  }

  async function runCourseUpdateTasks (store) {
    if (store.courseUpdatetasks.length) {
      console.log(chalk.yellow('\n[ Running Course Attribute Update Tasks ]\n'))

      await Promise.all(
        store.courseUpdatetasks.map(async (task, index) => {
          return await classroomActions.updateCourse(
            auth,
            task.courseAttributes,
            index,
            store.courseUpdatetasks.length
          )
        })
      )
    }
  }

  async function runTeacherCourseEnrolmentTasks (store) {
    if (store.teacherCourseEnrolmentTasks.length) {
      console.log(chalk.yellow('\n[ Running Teacher Course Enrolment Tasks ]\n'))

      await Promise.all(
        store.teacherCourseEnrolmentTasks.map(async (task, index) => {
          return await classroomActions.addTeacherToCourse(
            auth,
            task.courseId,
            task.teacher,
            index,
            store.teacherCourseEnrolmentTasks.length
          )
        })
      )
    }
  }

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

    console.log(chalk.magentaBright('\n[ Selected Sync Tasks Completed ]\n'))
  }
}

main().catch(console.error)
