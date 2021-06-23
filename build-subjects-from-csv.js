import csvToJson from 'convert-csv-to-json'
import appSettings from './config/config.js'

export default function buildSubjects () {
  const classNamesCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Class Names.csv`)
  const StudentLessonsCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Student Lessons.csv`)
  const TimetableCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Timetable.csv`)
  const UnscheduledDuties = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Unscheduled Duties.csv`)

  const subjects = getSubjectsAndClasses()

  addTeachersToSubjects()
  addStudentsToSubjects()
  addDomainLeaderToSubjects()

  return subjects

  function getSubjectsAndClasses () {
    const subjects = []

    const processedSubjects = []
    let arrayPosition = -1

    classNamesCsv.forEach((e) => {
      const faculty = e.FacultyName.split('_')[0]

      if (!processedSubjects.includes(e.SubjectCode)) {
        subjects.push({
          SubjectCode: e.SubjectCode,
          SubjectName: e.SubjectName.replace(/['"]+/g, ''),
          Faculty: faculty,
          Teachers: [],
          ClassCodes: []
        })
        arrayPosition = arrayPosition + 1
      }

      subjects[arrayPosition].ClassCodes.push({
        ClassCode: e.ClassCode,
        Students: []
      })

      processedSubjects.push(e.SubjectCode)
    })

    return subjects
  }

  function addTeachersToSubjects () {
    subjects.forEach((e, index) => {
      const teachers = []
      const classCodes = e.ClassCodes

      classCodes.forEach((e) => {
        const classCode = e.ClassCode

        TimetableCsv.forEach((e) => {
          if (classCode === e.ClassCode) {
            if (!teachers.includes(e.TeacherCode)) {
              teachers.push(e.TeacherCode)
            }
          }
        })
      })
      subjects[index].Teachers = teachers
    })
  }

  function addStudentsToSubjects () {
    subjects.forEach((subject) => {
      subject.ClassCodes.forEach((classCode, index) => {
        const item = classCode
        const itemIndex = index

        StudentLessonsCsv.forEach((lesson) => {
          if (lesson.ClassCode === item.ClassCode) {
            subject.ClassCodes[itemIndex].Students.push(lesson.StudentCode)
          }
        })
      })
    })
  }

  function addDomainLeaderToSubjects () {
    const domainLeaders = []

    UnscheduledDuties.forEach(e => {
      if (e.DutyName.includes('Domain Leader')) {
        const dutyNameParts = e.DutyName.split('_')
        const domainMember = e.TeacherCode
        domainLeaders.push({
          Domain: dutyNameParts[1],
          Member: domainMember
        })
      }
    })

    subjects.forEach((subject, index) => {
      domainLeaders.forEach(e => {
        if (subject.Faculty.toLowerCase() === e.Domain.toLowerCase()) {
          if (!subject.Teachers.includes(e.Member)) {
            subjects[index].Teachers.push(e.Member)
          }
        }
      })
    })
  }

  function addCompositeClasses () {

  }
}
