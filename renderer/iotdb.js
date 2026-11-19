'use strict'

const http = require('http')
const https = require('https')
const net = require('net')
const json = require('json-bigint')({ storeAsString: true })

const MAX_ROWS = 1000
const MAX_BYTES = 8 * 1024 * 1024
const DEFAULT_TIMEOUT = 15000

function tableName(value) {
  if (typeof value !== 'string' || !value || /[\x00-\x1f]/.test(value)) throw new Error('表或数据库名称无效')
  return '"' + value.replace(/"/g, '""') + '"'
}

function treePath(value) {
  // Parse literal path nodes, including dots and escaped backticks inside a quoted node.
  if (typeof value !== 'string' || !value.startsWith('root.')) throw new Error('请输入 root 开头的完整路径')
  const node = /(?:`((?:``|[^`\x00-\x1f])+)`|([\p{L}\p{N}_]+))(\.|$)/uy
  const parts = ['root']
  node.lastIndex = 5
  while (node.lastIndex < value.length) {
    const match = node.exec(value)
    if (!match || (match[3] && node.lastIndex === value.length)) throw new Error('设备路径无效')
    parts.push('`' + (match[1] || match[2]) + '`')
  }
  if (parts.length === 1) throw new Error('设备路径不能为空')
  return parts.join('.')
}

function namedValue(row, column) {
  const entry = Object.entries(row).find(([name]) => name.toLowerCase() === column.toLowerCase())
  if (!entry || entry[1] == null) throw new Error('IoTDB 缺少结果列 ' + column)
  return entry[1]
}

function transpose(columns, values) {
  if (values.length === 0) return []
  if (values.length !== columns.length || values.some(col => !Array.isArray(col))) {
    throw new Error('IoTDB 返回的结果列数量不一致')
  }
  const length = values[0].length
  if (values.some(col => col.length !== length)) throw new Error('IoTDB 返回的结果列长度不一致')
  return Array.from({ length }, (_, index) => values.map(col => col[index]))
}

function dataset(body, tree) {
  if (!Array.isArray(body.values)) throw new Error('IoTDB 返回了无效的查询结果')
  if (tree) {
    if (Array.isArray(body.expressions) && body.expressions.length > 0) {
      if (!Array.isArray(body.timestamps)) throw new Error('IoTDB 返回了无效的树模型时间戳')
      const rows = transpose(body.expressions, body.values)
      if (rows.length !== body.timestamps.length) throw new Error('IoTDB 树模型结果列长度不一致')
      return {
        columns: ['Time', ...body.expressions],
        rows: rows.map((row, index) => [body.timestamps[index], ...row])
      }
    }
    if (Array.isArray(body.column_names)) {
      return { columns: body.column_names, rows: transpose(body.column_names, body.values) }
    }
  }

  const columns = body.column_names || body.expressions
  if (!Array.isArray(columns)) throw new Error('IoTDB 返回了无效的查询结果')
  const rows = body.values
  if (rows.some(row => !Array.isArray(row) || row.length !== columns.length)) throw new Error('IoTDB 表模型结果列长度不一致')
  return { columns, rows }
}

function records(result) {
  return result.rows.map(row => Object.fromEntries(result.columns.map((name, index) => [name, row[index]])))
}

class IoTDB {
  constructor(link) {
    const host = (link.host || '').trim().replace(/^\[(.*)\]$/, '$1')
    const port = Number(link.port)
    if (!host || (!net.isIP(host) && !/^[a-zA-Z0-9._-]+$/.test(host))) throw new Error('请输入主机名或 IP 地址')
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('端口无效')
    if (!['http', 'https'].includes(link.scheme) || !['tree', 'table'].includes(link.model)) throw new Error('请选择协议和 SQL 方言')
    this.timeout = Number.isFinite(link.timeoutMs) && link.timeoutMs > 0 ? link.timeoutMs : DEFAULT_TIMEOUT
    this.tree = link.model === 'tree'
    this.transport = link.scheme === 'https' ? https : http
    this.options = { hostname: host, port, method: 'POST', auth: link.user + ':' + link.password }
  }

  async request(action, sql, database, rowLimit) {
    if (typeof sql !== 'string' || !sql.trim()) throw new Error('请输入 SQL')
    const path = (this.tree ? '/rest/v2/' : '/rest/table/v1/') + action
    const body = { sql }
    if (!this.tree && database) body.database = database
    if (action === 'query') body.row_limit = rowLimit
    const bytes = Buffer.from(JSON.stringify(body))
    const options = { ...this.options, path, headers: { 'Content-Type': 'application/json', 'Content-Length': bytes.length } }
    const result = await new Promise((resolve, reject) => {
      let timer
      const fail = error => {
        clearTimeout(timer)
        reject(error)
      }
      const req = this.transport.request(options, res => {
        const chunks = []
        let size = 0
        res.on('error', fail)
        res.on('data', chunk => {
          size += chunk.length
          if (size > MAX_BYTES) req.destroy(new Error('结果超过 8 MiB，请缩小查询范围'))
          else chunks.push(chunk)
        })
        res.on('end', () => {
          clearTimeout(timer)
          if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error('IoTDB HTTP ' + res.statusCode))
          try { resolve(json.parse(Buffer.concat(chunks).toString('utf8'))) }
          catch (_) { reject(new Error('IoTDB 返回的内容不是有效 JSON')) }
        })
      })
      timer = setTimeout(() => req.destroy(new Error('IoTDB 请求超时')), this.timeout)
      req.on('error', fail)
      req.end(bytes)
    })
    if (!result || typeof result !== 'object') throw new Error('IoTDB 响应无效')
    if (result.code != null && result.code !== 200) throw new Error('IoTDB ' + result.code + ': ' + (result.message || 'SQL 执行失败'))
    if (action === 'query') return dataset(result, this.tree)
    if (result.code !== 200) throw new Error('IoTDB 未确认写入成功')
    return result
  }

  query(sql, db, limit = MAX_ROWS) { return this.request('query', sql, db, limit) }
  execute(sql, db) { return this.request('nonQuery', sql, db) }

  async getVersion() {
    const result = await this.query('SHOW VERSION')
    return String(namedValue(records(result)[0] || {}, 'Version'))
  }
  async databases() {
    const result = await this.query('SHOW DATABASES')
    return records(result).map(row => ({ ...row, name: namedValue(row, 'Database') }))
  }
  databaseDDL(verb, name) {
    if (verb !== 'CREATE' && verb !== 'DROP') throw new Error('数据库操作无效')
    return this.execute(verb + ' DATABASE ' + (this.tree ? treePath(name) : tableName(name)))
  }
  async objects(db) {
    const result = this.tree ? await this.query('SHOW DEVICES ' + treePath(db) + '.**') : await this.query('SHOW TABLES', db)
    return records(result).map(row => namedValue(row, this.tree ? 'Device' : 'TableName'))
  }
  objectName(db, name) {
    if (!this.tree) return tableName(name)
    const device = treePath(name)
    const database = treePath(db)
    if (device !== database && !device.startsWith(database + '.')) throw new Error('设备不属于当前数据库')
    return device
  }
  describe(db, name) {
    const object = this.objectName(db, name)
    return this.query(this.tree ? 'SHOW TIMESERIES ' + object + '.*' : 'DESCRIBE ' + object, db)
  }
  dropObject(db, name) {
    const object = this.objectName(db, name)
    return this.execute(this.tree ? 'DROP TIMESERIES ' + object + '.*' : 'DROP TABLE ' + object, db)
  }
  async page(db, name, schema, { offset, size, desc, range }) {
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isInteger(size) || size < 1 || size >= MAX_ROWS) throw new Error('分页无效')
    const object = this.objectName(db, name)
    const order = ['time']
    if (!this.tree) {
      for (const row of records(schema)) {
        if (namedValue(row, 'Category') === 'TAG') order.push(tableName(namedValue(row, 'ColumnName')))
      }
    }
    let sql = 'SELECT * FROM ' + object
    if (range && range.length === 2) {
      const literals = range.map(date => {
        const iso = new Date(date).toISOString().replace(/Z$/, '+00:00')
        return this.tree ? "'" + iso + "'" : "TIMESTAMP '" + iso + "'"
      })
      sql += ' WHERE time >= ' + literals[0] + ' AND time <= ' + literals[1]
    }
    sql += ' ORDER BY ' + order.map(column => column + (desc ? ' DESC' : ' ASC')).join(', ')
    sql += ' LIMIT ' + (size + 1) + ' OFFSET ' + offset
    const result = await this.query(sql, db, size + 1)
    return { columns: result.columns, rows: result.rows.slice(0, size), more: result.rows.length > size }
  }
}

module.exports = { IoTDB }
