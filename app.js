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

  let isShowTasksOnly = false
  if (args.includes('--SHOW-TASKS'.toLowerCase())) {
    isShowTasksOnly = true
  }

  if (isShowTasksOnly && args.includes('--ALL-TASKS'.toLowerCase())) {
    console.log(chalk.red('\nShow Tasks flag can only be used with individual task groups. Script will now exit.\n'))
    process.exit(1)
  }

  generateSubjectsFromCSV(store)
  await getCourses.fetchCourses(auth, store)

  if (args.includes('--ALL-TASKS'.toLowerCase())) {
    // course creation
    await generateSyncTasks.getSubjectCourseCreationTasks(store)
    await generateSyncTasks.getClassCourseCreationTasks(store)
    await generateSyncTasks.getCompositeClassCourseCreationTasks(store)
    await invokeCourseCreationTasks(store)

    // update course attributes
    await generateSyncTasks.getSubjectCourseAttributeUpdateTasks(store)
    await generateSyncTasks.getClassCourseAttributeUpdateTasks(store)
    await generateSyncTasks.getCompositeClassCourseAttributeUpdateTasks(store)
    await invokeCourseUpdateTasks(store)

    // add/remove teachers
    await generateSyncTasks.getCompositeTeacherCourseEnrolmentTasks(store)
    await generateSyncTasks.getTeacherCourseEnrolmentTasks(store)
    await invokeTeacherCourseEnrolmentTasks(store)
    await invokeTeacherCourseRemovalTasks(store)

    // add/remove students
    await generateSyncTasks.getCompositeStudentCourseEnrolmentTasks(store)
    await generateSyncTasks.getStudentCourseEnrolmentTasks(store)
    await invokeStudentCourseEnrolmentTasks(store)
    await invokeStudentCourseRemovalTasks(store)

    // archive old courses
    await generateSyncTasks.getCourseArchiveTasks(store)
    await invokeCourseArchiveTasks(store)

    console.log(chalk.magentaBright('\n[ Selected Sync Tasks Completed ]\n'))

    process.exit(1)
  }

  if (args.includes('--ADD-COURSES'.toLowerCase())) {
    await generateSyncTasks.getSubjectCourseCreationTasks(store)
    await generateSyncTasks.getClassCourseCreationTasks(store)
    await generateSyncTasks.getCompositeClassCourseCreationTasks(store)

    if (!isShowTasksOnly) {
      invokeCourseCreationTasks(store)
    } else {
      console.dir(store.courseCreationTasks, { maxArrayLength: null })
      console.log(`\n${store.courseCreationTasks.length} Tasks`)
    }
  }

  if (args.includes('--UPDATE-COURSES'.toLowerCase())) {
    await generateSyncTasks.getSubjectCourseAttributeUpdateTasks(store)
    await generateSyncTasks.getClassCourseAttributeUpdateTasks(store)
    await generateSyncTasks.getCompositeClassCourseAttributeUpdateTasks(store)

    if (!isShowTasksOnly) {
      await invokeCourseUpdateTasks(store)
    } else {
      console.dir(store.courseUpdatetasks, { maxArrayLength: null })
      console.log(`\n${store.courseUpdatetasks.length} Tasks`)
    }
  }

  if (args.includes('--ADD-TEACHERS'.toLowerCase())) {
    if (!store.state.isGeneratedTeacherEnrolmentTasks) {
      await generateSyncTasks.getCompositeTeacherCourseEnrolmentTasks(store)
      await generateSyncTasks.getTeacherCourseEnrolmentTasks(store)
      store.state.isGeneratedTeacherEnrolmentTasks = true
    }

    if (!isShowTasksOnly) {
      await invokeTeacherCourseEnrolmentTasks(store)
    } else {
      console.dir(store.teacherCourseEnrolmentTasks, { maxArrayLength: null })
      console.log(`\n${store.teacherCourseEnrolmentTasks.length} Tasks`)
    }
  }

  if (args.includes('--REMOVE-TEACHERS'.toLowerCase())) {
    if (!store.state.isGeneratedTeacherEnrolmentTasks) {
      await generateSyncTasks.getCompositeTeacherCourseEnrolmentTasks(store)
      await generateSyncTasks.getTeacherCourseEnrolmentTasks(store)
      store.state.isGeneratedTeacherEnrolmentTasks = true
    }

    if (!isShowTasksOnly) {
      await invokeTeacherCourseRemovalTasks(store)
    } else {
      console.dir(store.teacherCourseRemovalTasks, { maxArrayLength: null })
      console.log(`\n${store.teacherCourseRemovalTasks.length} Tasks`)
    }
  }

  if (args.includes('--ADD-STUDENTS'.toLowerCase())) {
    if (!store.state.isGeneratedStudentEnrolmentTasks) {
      await generateSyncTasks.getCompositeStudentCourseEnrolmentTasks(store)
      await generateSyncTasks.getStudentCourseEnrolmentTasks(store)
      store.state.isGeneratedStudentEnrolmentTasks = true
    }

    if (!isShowTasksOnly) {
      await invokeStudentCourseEnrolmentTasks(store)
    } else {
      console.dir(store.studentCourseEnrolmentTasks, { maxArrayLength: null })
      console.log(`\n${store.studentCourseEnrolmentTasks.length} Tasks`)
    }
  }

  if (args.includes('--REMOVE-STUDENTS'.toLowerCase())) {
    if (!store.state.isGeneratedStudentEnrolmentTasks) {
      await generateSyncTasks.getCompositeStudentCourseEnrolmentTasks(store)
      await generateSyncTasks.getStudentCourseEnrolmentTasks(store)
      store.state.isGeneratedStudentEnrolmentTasks = true
    }

    if (!isShowTasksOnly) {
      await invokeStudentCourseRemovalTasks(store)
    } else {
      console.dir(store.studentCourseRemovalTasks, { maxArrayLength: null })
      console.log(`\n${store.studentCourseRemovalTasks.length} Tasks`)
    }
  }

  if (args.includes('--ARCHIVE-COURSES'.toLowerCase())) {
    await generateSyncTasks.getCourseArchiveTasks(store)

    if (!isShowTasksOnly) {
      await invokeCourseArchiveTasks(store)
    } else {
      console.dir(store.courseArchiveTasks, { maxArrayLength: null })
      console.log(`\n${store.courseArchiveTasks.length} Tasks`)
    }
  }

  console.log(chalk.magentaBright('\n[ Finished! ]\n'))

  async function invokeCourseCreationTasks (store) {
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
        await invokeCourseCreationTasks(store)
      }
    }
  }

  async function invokeCourseUpdateTasks (store) {
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

  async function invokeTeacherCourseEnrolmentTasks (store) {
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

  async function invokeTeacherCourseRemovalTasks (store) {
    if (store.teacherCourseRemovalTasks.length) {
      console.log(chalk.yellow('\n[ Running Teacher Course Removal Tasks ]\n'))

      await Promise.all(
        store.teacherCourseRemovalTasks.map(async (task, index) => {
          return await classroomActions.removeTeacherFromCourse(
            auth,
            task.courseId,
            task.teacher,
            index,
            store.teacherCourseRemovalTasks.length
          )
        })
      )
    }
  }

  async function invokeStudentCourseEnrolmentTasks (store) {
    if (store.studentCourseEnrolmentTasks.length) {
      console.log(chalk.yellow('\n[ Running Student Course Enrolment Tasks ]\n'))

      await Promise.all(
        store.studentCourseEnrolmentTasks.map(async (task, index) => {
          return await classroomActions.addStudentToCourse(
            auth,
            task.courseId,
            task.student,
            index,
            store.studentCourseEnrolmentTasks.length
          )
        })
      )
    }
  }

  async function invokeStudentCourseRemovalTasks () {
    if (store.studentCourseRemovalTasks.length) {
      console.log(chalk.yellow('\n[ Running Student Course Removal Tasks ]\n'))

      await Promise.all(
        store.studentCourseRemovalTasks.map(async (task, index) => {
          return await classroomActions.removeStudentFromCourse(
            auth,
            task.courseId,
            task.student,
            index,
            store.studentCourseRemovalTasks.length
          )
        })
      )
    }
  }

  async function invokeCourseArchiveTasks (store) {
    if (store.courseArchiveTasks.length) {
      console.log(chalk.yellow('\n[ Archiving Non-Timetabled Courses ]\n'))

      await Promise.all(
        store.courseArchiveTasks.map(async (task, index) => {
          return await classroomActions.changeCourseState(
            auth,
            task.courseAttributes,
            index,
            store.courseArchiveTasks.length
          )
        })
      )
    }
  }
}

main().catch(console.error)
