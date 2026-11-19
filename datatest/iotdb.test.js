'use strict'

const assert = require('assert').strict
const http = require('http')
const { test } = require('node:test')
const { IoTDB } = require('../renderer/iotdb')

async function withServer(handler, run) {
  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      try {
        handler(req, res, Buffer.concat(chunks).toString('utf8'))
      } catch (error) {
        res.writeHead(500).end()
      }
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    await run(server.address().port)
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
}

function reply(res, value) {
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(value))
}

test('validates connection, Tree paths, table names and pagination', async () => {
  for (const link of [
    { host: '', port: 18080, scheme: 'http', model: 'tree' },
    { host: 'db.example', port: 0, scheme: 'http', model: 'tree' },
    { host: 'db.example', port: 18080, scheme: 'ftp', model: 'tree' },
    { host: 'db.example', port: 18080, scheme: 'http', model: 'other' }
  ]) assert.throws(() => new IoTDB(link))

  const calls = []
  await withServer((req, res, text) => {
    calls.push({ path: req.url, body: JSON.parse(text) })
    reply(res, { code: 200, column_names: [], values: [] })
  }, async port => {
    const tree = new IoTDB({ host: '127.0.0.1', port, user: 'root', password: 'pass', scheme: 'http', model: 'tree' })
    const table = new IoTDB({ host: '127.0.0.1', port, user: 'root', password: 'pass', scheme: 'http', model: 'table' })
    for (const path of ['', 'example', 'root', 'root.example..device', 'root.example; DROP DATABASE root.other']) {
      assert.throws(() => tree.databaseDDL('CREATE', path))
    }
    assert.throws(() => tree.databaseDDL('ALTER', 'root.example'))
    await table.databaseDDL('CREATE', 'bad";DROP DATABASE test')
    assert.equal(calls.at(-1).body.sql, 'CREATE DATABASE "bad"";DROP DATABASE test"')
    await table.dropObject('test', 'bad";DROP TABLE test')
    assert.equal(calls.at(-1).body.sql, 'DROP TABLE "bad"";DROP TABLE test"')
    assert.throws(() => tree.objectName('root.test', 'root.other.device'))
    await assert.rejects(() => table.page('test', 'sensor', { columns: [], rows: [] }, { offset: -1, size: 20 }))
    await assert.rejects(() => table.page('test', 'sensor', { columns: [], rows: [] }, { offset: 0, size: 1000 }))
    await assert.rejects(() => table.query('   '))
  })
})

test('decodes IoTDB Tree and Table REST datasets without losing large timestamps', async () => {
  await withServer((req, res) => {
    const tree = req.url === '/rest/v2/query'
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(tree
      ? '{"code":200,"expressions":["s1"],"data_types":["DOUBLE"],"timestamps":[9007199254740993],"values":[[1.25]]}'
      : '{"code":200,"column_names":["time","site"],"values":[[9007199254740993,"a"]]}')
  }, async port => {
    const options = { host: '127.0.0.1', port, user: 'root', password: 'secret', scheme: 'http' }
    const tree = await new IoTDB({ ...options, model: 'tree' }).query('SELECT * FROM root.demo.d')
    const table = await new IoTDB({ ...options, model: 'table' }).query('SELECT * FROM devices', 'demo')
    assert.deepEqual(tree.columns, ['Time', 's1'])
    assert.equal(tree.rows[0][0], '9007199254740993')
    assert.deepEqual(tree.rows[0].slice(1), [1.25])
    assert.deepEqual(table.columns, ['time', 'site'])
    assert.equal(table.rows[0][0], '9007199254740993')
    assert.deepEqual(table.rows[0].slice(1), ['a'])
  })
})

test('decodes column-oriented Tree metadata and empty result sets', async () => {
  await withServer((req, res, text) => {
    const sql = JSON.parse(text).sql
    if (sql === 'SHOW VERSION') return reply(res, {
      code: 200,
      expressions: [],
      column_names: ['Version', 'BuildInfo'],
      data_types: ['TEXT', 'TEXT'],
      timestamps: [],
      values: [['2.0.11'], ['build-1']]
    })
    return reply(res, {
      code: 200,
      expressions: [],
      column_names: ['Database', 'SchemaReplicationFactor'],
      data_types: ['TEXT', 'INT32'],
      timestamps: [],
      values: []
    })
  }, async port => {
    const tree = new IoTDB({ host: '127.0.0.1', port, user: 'root', password: 'secret', scheme: 'http', model: 'tree' })
    assert.equal(await tree.getVersion(), '2.0.11')
    assert.deepEqual(await tree.databases(), [])
  })
})

test('lists schemas and builds bounded, deterministic Tree/Table pages', async () => {
  const calls = []
  await withServer((req, res, text) => {
    calls.push({ path: req.url, authorization: req.headers.authorization, body: JSON.parse(text) })
    const sql = JSON.parse(text).sql
    const tree = req.url === '/rest/v2/query'
    if (sql === 'SHOW VERSION') return reply(res, {
      code: 200,
      expressions: [],
      column_names: ['Version', 'BuildInfo'],
      timestamps: [],
      values: [['2.0.8'], ['build-1']]
    })
    if (sql === 'SHOW DATABASES') return reply(res, { code: 200, column_names: ['Database'], values: [['root.factory']] })
    if (sql.startsWith('SHOW DEVICES')) return reply(res, { code: 200, column_names: ['Device'], values: [['root.factory.room']] })
    if (sql === 'SHOW TABLES') return reply(res, { code: 200, column_names: ['TableName'], values: [['sensors']] })
    if (sql.startsWith('SHOW TIMESERIES')) return reply(res, {
      code: 200,
      column_names: ['Timeseries', 'Alias'],
      expressions: [],
      timestamps: [],
      values: [['root.factory.room.temp', 'root.factory.room.humidity'], [null, null]]
    })
    if (sql.startsWith('DESCRIBE')) return reply(res, { code: 200, column_names: ['ColumnName', 'Category'], values: [['site', 'TAG'], ['temp', 'FIELD']] })
    return reply(res, tree
      ? { code: 200, expressions: ['temp'], data_types: ['DOUBLE'], timestamps: [1, 2], values: [[12.5, 14.5]] }
      : { code: 200, column_names: ['site', 'temp'], values: [['north', 12.5], ['north', 14.5]] })
  }, async port => {
    const options = { host: '127.0.0.1', port, user: 'root', password: 'secret', scheme: 'http' }
    const tree = new IoTDB({ ...options, model: 'tree' })
    const table = new IoTDB({ ...options, model: 'table' })
    assert.equal(await tree.getVersion(), '2.0.8')
    assert.deepEqual((await tree.databases())[0].name, 'root.factory')
    assert.deepEqual(await tree.objects('root.factory'), ['root.factory.room'])
    const treeSchema = await tree.describe('root.factory', 'root.factory.room')
    assert.deepEqual(treeSchema.columns, ['Timeseries', 'Alias'])
    assert.equal(treeSchema.rows.length, 2)
    assert.deepEqual(await table.objects('factory'), ['sensors'])
    const schema = await table.describe('factory', 'sensors')
    assert.equal(schema.rows.length, 2)
    assert.equal((await tree.page('root.factory', 'root.factory.room', [], { size: 1, offset: 0, desc: true, range: ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'] })).more, true)
    await table.page('factory', 'sensors', schema, { size: 1, offset: 1, desc: false, range: ['2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z'] })

    const treePage = calls.find(call => call.path === '/rest/v2/query' && call.body.sql.includes('LIMIT 2'))
    assert.equal(treePage.body.row_limit, 2)
    assert.match(treePage.body.sql, /ORDER BY time DESC LIMIT 2 OFFSET 0$/)
    assert.match(treePage.body.sql, /time >= '2024-01-01T00:00:00\.000\+00:00' AND time <= '2024-01-02T00:00:00\.000\+00:00'/)
    const tablePage = calls.find(call => call.path === '/rest/table/v1/query' && call.body.sql.includes('LIMIT 2'))
    assert.equal(tablePage.body.database, 'factory')
    assert.equal(tablePage.body.row_limit, 2)
    assert.match(tablePage.body.sql, /ORDER BY time ASC, "site" ASC LIMIT 2 OFFSET 1$/)
    assert.match(tablePage.body.sql, /time >= TIMESTAMP '2024-01-01T00:00:00\.000\+00:00' AND time <= TIMESTAMP '2024-01-02T00:00:00\.000\+00:00'/)
    assert.equal(tablePage.body.sql.includes('site'), true)
    assert.match(tablePage.authorization, /^Basic /)
    await tree.dropObject('root.factory', 'root.factory.room')
    assert.equal(calls.at(-1).body.sql, 'DROP TIMESERIES root.`factory`.`room`.*')
  })
})

test('executes mutations, guards result and HTTP errors, and times out', async () => {
  let mode = 'success'
  await withServer((req, res) => {
    if (mode === 'unauthorized') return res.writeHead(401).end('credentials')
    if (mode === 'malformed') return res.writeHead(200).end('not json')
    if (mode === 'slow') return undefined
    reply(res, mode === 'status' ? { code: 701, message: 'database is not specified' } : { code: 200, message: 'success' })
  }, async port => {
    const client = new IoTDB({ host: '127.0.0.1', port, user: 'root', password: 'secret', scheme: 'http', model: 'table', timeoutMs: 20 })
    assert.equal((await client.execute('CREATE DATABASE factory')).message, 'success')
    mode = 'status'
    await assert.rejects(client.query('SHOW DATABASES'), /IoTDB 701: database is not specified/)
    mode = 'unauthorized'
    await assert.rejects(client.query('SHOW DATABASES'), /IoTDB HTTP 401/)
    mode = 'malformed'
    await assert.rejects(client.query('SHOW DATABASES'), /有效 JSON/)
    mode = 'slow'
    await assert.rejects(client.query('SHOW DATABASES'), /请求超时/)
  })
})
