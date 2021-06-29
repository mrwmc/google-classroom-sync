import fs from 'fs'

export default {
  async logError (source, error) {
    const log = `${new Date().toISOString()} - ${source} - ${error}`
    const stream = fs.createWriteStream('error.log', { flags: 'a' })

    stream.write(log)
    stream.end()
  },
  async logSuccess (data) {

  }
}
