import csvToJson from 'convert-csv-to-json'
import appSettings from './config/config.js'

export default function buildSubjects () {
  const classNamesCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Class Names.csv`)
  const StudentLessonsCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Student Lessons.csv`)
  const TimetableCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Timetable.csv`)
  const UnscheduledDuties = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Unscheduled Duties.csv`)

  const dataset = {}

  getCompositeClasses()
  const subjects = getSubjectsAndClasses()

  addTeachersToSubjects()
  addStudentsToSubjects()
  addDomainLeaderToSubjects()

  dataset.subjects = subjects

  return dataset

  function getSubjectsAndClasses () {
    const sortedClassNamesCSV = classNamesCsv.sort((a, b) => a.SubjectCode.localeCompare(b.SubjectCode))

    const subjects = []

    const processedSubjects = []
    let arrayPosition = -1

    sortedClassNamesCSV.forEach((e) => {
      const faculty = e.FacultyName.split('_')[0]

      if (!processedSubjects.includes(e.SubjectCode)) {
        subjects.push({
          SubjectCode: e.SubjectCode,
          SubjectName: e.SubjectName.replace(/['"]+/g, ''),
          Faculty: faculty,
          Teachers: [],
          ClassCodes: []
        })
        arrayPosition += 1
      }
      if (!dataset.CompositeClassCodeList.includes(e.ClassCode)) {
        subjects[arrayPosition].ClassCodes.push({
          ClassCode: e.ClassCode,
          Students: []
        })
      }

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

  function getCompositeClasses () {
    const compositeClasses = []
    const compositeClassList = []
    const compositeClassCodes = []

    const uniqueLessonObjects = []
    const map = new Map()

    for (const item of TimetableCsv) {
      if (!map.has(item.ClassCode)) {
        map.set(item.ClassCode, true)

        uniqueLessonObjects.push({
          ClassCode: item.ClassCode,
          Period: item.PeriodNo,
          Teacher: item.TeacherCode,
          Day: item.DayNo
        })
      }
    }

    uniqueLessonObjects.forEach((lesson) => {
      const classCode = lesson.ClassCode
      const dayNo = lesson.Day
      const period = lesson.Period
      const teacher = lesson.Teacher

      const matchedClasses = []

      TimetableCsv.forEach((item) => {
        if (item.ClassCode !== classCode &&
          item.DayNo === dayNo &&
          item.PeriodNo === period &&
          item.TeacherCode === teacher
        ) {
          matchedClasses.push(classCode, item.ClassCode)
          compositeClassList.push(classCode)
          compositeClassList.push(item.ClassCode)
        }
      })

      if (matchedClasses.length) {
        compositeClassCodes.push(matchedClasses.sort())
      }
    })

    const uniqueCompositeClassCodes = [...new Set(compositeClassList.sort())]
    const distinctCompositeClassCodes = Array.from(new Set(compositeClassCodes.map(JSON.stringify)), JSON.parse)

    const cCodes = []

    distinctCompositeClassCodes.forEach(c => {
      const Students = []
      const Teachers = []

      StudentLessonsCsv.forEach((lesson) => {
        if (lesson.ClassCode === c[0] || lesson.ClassCode === c[1]) {
          Students.push(lesson.StudentCode)
        }
      })

      TimetableCsv.forEach((lesson) => {
        if (lesson.ClassCode === c[0] || lesson.ClassCode === c[1]) {
          Teachers.push(lesson.TeacherCode)
        }
      })

      const uniqueStudents = [...new Set(Students)]
      const uniqueTeachers = [...new Set(Teachers)]

      cCodes.push(`${c[0]}-${c[1]}`)

      compositeClasses.push({
        SubjectName: `${c[0]}-${c[1]}`,
        ClassCode: `${c[0]}-${c[1]}`,
        Teachers: uniqueTeachers,
        Students: uniqueStudents
      })
    })

    dataset.CompositeClassCodeList = uniqueCompositeClassCodes
    dataset.CompositeClasses = compositeClasses
  }
}
