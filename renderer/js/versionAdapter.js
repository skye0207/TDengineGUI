module.exports = {
  formatResult(res) {
    if (res.data.status !== undefined) {
      // Version 2.x
      return res
    }

    if (res.data.code === 0) {
      res.data.status = 'succ'
      res.data.head = res.data.column_meta.map(item => item[0])
    } else {
      res.data.status = 'error'
    }

    return res
  }
}
