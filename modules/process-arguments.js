import chalk from 'chalk'

export default function processArguments (commandArgs) {
  const args = commandArgs.slice(2)

  if (!args.length) {
    displayHelp()
  }

  if (!args.includes('-Courses'.toLocaleLowerCase()) &&
    !args.includes('-Update'.toLocaleLowerCase()) &&
    !args.includes('-Teachers'.toLocaleLowerCase()) &&
    !args.includes('-Students'.toLocaleLowerCase()) &&
    !args.includes('-Archive'.toLocaleLowerCase()) &&
    !args.includes('-Full'.toLocaleLowerCase())
  ) {
    displayHelp()
  }

  return args

  function displayHelp () {
    console.log(chalk.redBright('\nExpected at least one flag! See examples.\n'))
    console.log(chalk.whiteBright('NAME'))
    console.log(chalk.white('   Google Classroom Sync\n'))
    console.log(chalk.whiteBright('DESCRIPTION'))
    console.log(chalk.white('   Syncs exported CSV files from Timetabler CSV export to courses on Google Classroom\n'))
    console.log(chalk.whiteBright('FLAG EXAMPLES'))
    console.log(chalk.white('   -Courses  : Looks up timetable CSV files and creates new courses if they don\'t already exist at Google.\n'))
    console.log(chalk.white('   -Update   : Looks up timetable CSV files and updates course attributes (makes courses active if timetabled).\n'))
    console.log(chalk.white('   -Teachers : Looks up timetable CSV files and and syncs teachers to exisitng Google Classroom courses.\n'))
    console.log(chalk.white('   -Students : Looks up timetable CSV files and and syncs students to exisitng Google Classroom courses.\n'))
    console.log(chalk.white('   -Archive  : Archives class (not subject) courses that are not found on the timetable CSV files.\n'))
    console.log(chalk.white('   -Full     : Runs a courses, update, teachers, students and archive sync.\n'))
    console.log(chalk.white('   -Replace  : <timetabled teacher> <replacement teacher>.\n'))
    process.exit(1)
  }
}
