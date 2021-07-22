import chalk from 'chalk'

export default function processArguments (commandArgs) {
  const args = commandArgs.slice(2)

  if (!args.length) {
    displayHelp()
  }

  if (!args.includes('--Add-Courses'.toLocaleLowerCase()) &&
    !args.includes('--Update-Courses'.toLocaleLowerCase()) &&
    !args.includes('--Teachers'.toLocaleLowerCase()) &&
    !args.includes('--Add-Teachers'.toLocaleLowerCase()) &&
    !args.includes('--Remove-Teachers'.toLocaleLowerCase()) &&
    !args.includes('--Add-Students'.toLocaleLowerCase()) &&
    !args.includes('--Remove-Students'.toLocaleLowerCase()) &&
    !args.includes('--Archive-Courses'.toLocaleLowerCase()) &&
    !args.includes('--All-Tasks'.toLocaleLowerCase())
  ) {
    displayHelp()
  }

  return args

  function displayHelp () {
    console.log(chalk.redBright('\nExpected at least one flag! See examples.\n'))
    console.log(chalk.whiteBright('NAME'))
    console.log(chalk.white('   Google Classroom Sync\n'))
    console.log(chalk.whiteBright('DESCRIPTION'))
    console.log(chalk.white('   Syncs exported CSV files from Timetabler CSV courses on Google Classroom.\n'))
    console.log(chalk.whiteBright('FLAG EXAMPLES'))
    console.log(chalk.white('   --Add-Courses      : Looks up timetable CSV files and creates new courses if they don\'t already exist at Google.\n'))
    console.log(chalk.white('   --Update-Courses   : Looks up timetable CSV files and updates course attributes (makes course state \'active\' if timetabled).\n'))
    console.log(chalk.white('   --Add-Teachers     : Looks up timetable CSV files and adds teachers to exisitng Google Classroom courses.\n'))
    console.log(chalk.white('   --Remove-Teachers  : Looks up timetable CSV files and removes teachers from exisiting Google Classroom courses who are not in timetable.\n'))
    console.log(chalk.white('   --Add-Students     : Looks up timetable CSV files and and adds students to exisitng Google Classroom courses.\n'))
    console.log(chalk.white('   --Remove-Students  : Looks up timetable CSV files and removes students from exisiting Google Classroom courses who are not in timetable.\n'))
    console.log(chalk.white('   --Archive-Courses  : Archives class (not subject) courses that are not found in the timetable CSV files.\n'))
    console.log(chalk.white('   --All-Tasks        : Runs a courses, update, teachers, students and archive sync.\n'))

    process.exit(1)
  }
}
