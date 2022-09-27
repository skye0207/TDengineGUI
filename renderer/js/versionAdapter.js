module.exports = {
  formatResult(res, sql) {
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

    if (
      /show /i.test(sql) &&
      /.stables/i.test(sql) &&
      res.data.head.length === 1 &&
      res.data.head[0] === 'stable_name'
    ) {
      res.data.head[0] = 'name'
    }

    return res
  }
}
