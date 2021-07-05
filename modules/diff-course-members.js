export default {
  diff (local, remote) {
    const members = {}

    const localDiff = local.filter(x => !remote.includes(x))
    const remoteDiff = remote.filter(x => !local.includes(x))

    members.add = localDiff
    members.remove = remoteDiff

    return members
  }
}
