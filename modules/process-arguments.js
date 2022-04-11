import chalk from 'chalk'
import arrayDiff from './array-diff.js'

export default function processArguments (commandArgs) {
  const rawArgs = commandArgs.slice(2)

  const args = rawArgs.map(element => {
    return element.toLowerCase()
  })

  const acceptedFlags = [
    '--add-courses',
    '--update-courses',
    '--add-teachers',
    '--remove-teachers',
    '--add-students',
    '--remove-students',
    '--archive-courses',
    '--all-tasks',
    '--show-tasks',
    '--sync-calendars'
  ]

  if (!args.length) {
    const exception = 'Error: No flag(s) specified.'
    displayHelp(exception)
    process.exit(1)
  }

  const invalidFlagCheck = arrayDiff(args, acceptedFlags)
  if (invalidFlagCheck.arr1Diff.length > 0) {
    const exception = 'Error: Invalid flag or no flag specified.'
    displayHelp(exception)
    process.exit(1)
  }

  if (args.length === 1 && args.includes('--show-tasks')) {
    const exception = 'Error: --Show-Tasks cannot be used in isolation'
    displayHelp(exception)
    process.exit(1)
  }

  return args

  function displayHelp (exceptionMsg) {
    console.log(chalk.whiteBright('\nNAME'))
    console.log(chalk.white('   Google Classroom Sync\n'))
    console.log(chalk.whiteBright('DESCRIPTION'))
    console.log(chalk.white('   Generate and sync subjects and classes using exported CSV files from Timetabler to courses on Google Classroom.\n'))
    console.log(chalk.whiteBright('FLAG EXAMPLES'))
    console.log(chalk.white('   --Add-Courses      : Looks up timetable CSV files and creates new courses if they don\'t already exist at Google.\n'))
    console.log(chalk.white('   --Update-Courses   : Looks up timetable CSV files and updates course attributes (makes course state \'active\' if timetabled).\n'))
    console.log(chalk.white('   --Add-Teachers     : Looks up timetable CSV files and adds teachers to exisitng Google Classroom courses.\n'))
    console.log(chalk.white('   --Remove-Teachers  : Looks up timetable CSV files and removes teachers from exisiting Google Classroom courses who are not in timetable.\n'))
    console.log(chalk.white('   --Add-Students     : Looks up timetable CSV files and and adds students to exisitng Google Classroom courses.\n'))
    console.log(chalk.white('   --Remove-Students  : Looks up timetable CSV files and removes students from exisiting Google Classroom courses who are not in timetable.\n'))
    console.log(chalk.white('   --Archive-Courses  : Archives class (not subject) courses that are not found in the timetable CSV files.\n'))
    console.log(chalk.white('   --All-Tasks        : Runs add courses, update courses, add teachers (does not remove teacher), add students and archive tasks. Can not be used with --Show-Tasks\n'))
    console.log(chalk.white('   --Show-Tasks       : Displays the generated task objects on screen instead of executing them.\n'))
    console.log(chalk.redBright('\n' + exceptionMsg + '\n'))
  }
}
