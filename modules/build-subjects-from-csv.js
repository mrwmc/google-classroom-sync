import csvToJson from 'convert-csv-to-json'
import appSettings from '../config/config.js'

export default function buildSubjects (store) {
  const classNamesCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Class Names.csv`)
  const StudentLessonsCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Student Lessons.csv`)
  const TimetableCsv = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Timetable.csv`)
  const UnscheduledDuties = csvToJson.fieldDelimiter('"').getJsonFromCsv(`${appSettings.timetableFilesLocation}/Unscheduled Duties.csv`)

  const dataset = {}

  getCompositeClasses()

  const subjects = getSubjectsAndClasses()

  addTeachersToSubjects()
  addStudentsToClasses()
  addDomainLeaderToSubjects()

  dataset.subjects = subjects
  store.timetable = dataset

  function getSubjectsAndClasses () {
    const sortedClassNamesCSV = classNamesCsv.sort((a, b) => a.SubjectCode.localeCompare(b.SubjectCode))

    const subjects = []

    const processedSubjects = []
    let arrayPosition = -1

    sortedClassNamesCSV.forEach((e) => {
      if (!isSubjectExcepted(e.SubjectCode)) {
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
      }

      processedSubjects.push(e.SubjectCode)
    })

    return subjects

    function isSubjectExcepted (subjectName) {
      const subjectExceptions = appSettings.subjectExceptions
      const subjectNameWithoutSemesterPrefix = subjectName.substring(1)

      return subjectExceptions.includes(subjectNameWithoutSemesterPrefix)
    }
  }

  function addTeachersToSubjects () {
    subjects.forEach((e, index) => {
      const teachers = []
      const classCodes = e.ClassCodes

      classCodes.forEach((e) => {
        const classCode = e.ClassCode

        TimetableCsv.forEach((e) => {
          if (classCode === e.ClassCode) {
            if (!teachers.includes(e.TeacherCode.toLowerCase() + appSettings.domain)) {
              teachers.push(e.TeacherCode.toLowerCase() + appSettings.domain)
            }
          }
        })
      })
      subjects[index].Teachers = teachers
    })
  }

  function addStudentsToClasses () {
    subjects.forEach((subject) => {
      subject.ClassCodes.forEach((classCode, index) => {
        const item = classCode
        const itemIndex = index

        StudentLessonsCsv.forEach((lesson) => {
          if (lesson.ClassCode === item.ClassCode) {
            const validUserCode = /^([a-z-]{3})?\d+$/i

            if (validUserCode.test(lesson.StudentCode)) {
              subject.ClassCodes[itemIndex].Students.push(
                lesson.StudentCode.toLowerCase() + appSettings.domain
              )
            }
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
          if (!subject.Teachers.includes(e.Member.toLowerCase() + appSettings.domain)) {
            subjects[index].Teachers.push(e.Member.toLowerCase() + appSettings.domain)
          }
        }
      })
    })
  }

  function getCompositeClasses () {
    const classExceptions = appSettings.compositeClassExceptions

    const compositeClasses = []
    const compositeClassList = []
    const compositeClassCodes = []

    const uniqueLessonObjects = []
    const map = new Map()

    for (const item of TimetableCsv) {
      if (!classExceptions.includes(item.ClassCode) && !map.has(item.ClassCode)) {
        map.set(item.ClassCode, true)
        uniqueLessonObjects.push({
          ClassCode: item.ClassCode,
          Period: item.PeriodNo,
          Teacher: item.TeacherCode,
          Day: item.DayNo,
          Room: item.RoomCode
        })
      }
    }

    uniqueLessonObjects.forEach((lesson) => {
      const classCode = lesson.ClassCode
      const dayNo = lesson.Day
      const period = lesson.Period
      const teacher = lesson.Teacher
      const room = lesson.Room

      const matchedClasses = []

      TimetableCsv.forEach((item) => {
        if (!classExceptions.includes(item.ClassCode)) {
          if (item.ClassCode !== classCode &&
            item.DayNo === dayNo &&
            item.PeriodNo === period &&
            (item.TeacherCode === teacher || item.Room === room)
          ) {
            matchedClasses.push(classCode, item.ClassCode)
            compositeClassList.push(classCode)
            compositeClassList.push(item.ClassCode)
          }
        }
      })

      if (matchedClasses.length) {
        compositeClassCodes.push(matchedClasses.sort())
      }
    })

    const uniqueUngroupedCompositeClassCodes = [...new Set(compositeClassList.sort())]

    const removeDuplicateItems = []
    compositeClassCodes.forEach(e => {
      const uniqueElements = [...new Set(e)]
      removeDuplicateItems.push(uniqueElements.sort())
    })

    const uniqueGroupedCompositeClassCodes = Array.from(new Set(removeDuplicateItems.map(JSON.stringify)), JSON.parse)

    uniqueGroupedCompositeClassCodes.forEach(classCodeGroup => {
      const Students = []
      const Teachers = []

      StudentLessonsCsv.forEach((lesson) => {
        if (classCodeGroup.includes(lesson.ClassCode)) {
          Students.push(`${lesson.StudentCode.toLowerCase()}${appSettings.domain}`)
        }
      })

      TimetableCsv.forEach((lesson) => {
        if (classCodeGroup.includes(lesson.ClassCode)) {
          Teachers.push(`${lesson.TeacherCode.toLowerCase()}${appSettings.domain}`)
        }
      })

      const uniqueStudents = [...new Set(Students)]
      const uniqueTeachers = [...new Set(Teachers)]

      let SubjectName = ''
      let ClassCode = ''

      classCodeGroup.forEach(classCode => {
        SubjectName += classCode + '-'
        ClassCode += classCode + '-'
      })

      SubjectName = SubjectName.slice(0, -1)
      ClassCode = ClassCode.slice(0, -1)

      compositeClasses.push({
        SubjectName,
        ClassCode,
        Teachers: uniqueTeachers,
        Students: uniqueStudents
      })
    })

    dataset.CompositeClassCodeList = uniqueUngroupedCompositeClassCodes
    dataset.CompositeClasses = compositeClasses
  }
}
