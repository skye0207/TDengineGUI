// Opt-in integration test against an explicitly configured IoTDB REST service.
'use strict'

const assert = require('assert').strict
const { randomBytes } = require('crypto')
const { IoTDB } = require('../renderer/iotdb')

async function smoke(link) {
  const client = new IoTDB(link)
  const prefix = link.model === 'tree' ? 'root.' : ''
  const database = prefix + 'gui_smoke_' + randomBytes(10).toString('hex')
  const object = prefix ? database + '.sensor' : 'sensor'
  const version = await client.getVersion()
  assert(!(await client.databases()).some(db => db.name === database))
  await client.databaseDDL('CREATE', database)
  try {
    assert((await client.databases()).some(db => db.name === database))
    await client.execute(prefix
      ? `CREATE TIMESERIES ${object}.temperature WITH DATATYPE=DOUBLE, ENCODING=GORILLA`
      : 'CREATE TABLE sensor (station STRING TAG, temperature DOUBLE FIELD)', database)
    for (const [time, value] of [[1700000000000, 12.5], [1700000000001, 14.5]]) {
      await client.execute(prefix
      ? `INSERT INTO ${object}(timestamp,temperature) VALUES (${time},${value})`
        : `INSERT INTO sensor(time,station,temperature) VALUES (${time},'station_a',${value})`, database)
    }
    assert((await client.objects(database)).includes(object))
    const schema = await client.describe(database, object)
    assert(schema.rows.length > 0)
    const opts = { size: 1, desc: false, range: null }
    const first = await client.page(database, object, schema, { ...opts, offset: 0 })
    const second = await client.page(database, object, schema, { ...opts, offset: 1 })
    const col = first.columns.findIndex(name => /(^|\.)temperature$/i.test(name))
    assert(col >= 0)
    assert.equal(first.rows[0][col], 12.5)
    assert.equal(first.more, true)
    assert.equal(second.rows[0][col], 14.5)
    assert.equal(second.more, false)
    await client.dropObject(database, object)
    assert(!(await client.objects(database)).includes(object))
  } finally {
    await client.databaseDDL('DROP', database)
    assert(!(await client.databases()).some(db => db.name === database))
  }
  console.log(`${link.model}: IoTDB ${version}, read/write, pagination and cleanup passed (${database})`)
}

async function main() {
  const { IOTDB_REST_URL: endpoint, IOTDB_USER: user, IOTDB_PASSWORD: password } = process.env
  if (!endpoint || !user || !password) throw new Error('Set IOTDB_REST_URL, IOTDB_USER and IOTDB_PASSWORD before running this test')
  const url = new URL(endpoint)
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('IOTDB_REST_URL must be an HTTP(S) origin without credentials')
  const link = { host: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80), scheme: url.protocol.slice(0, -1), user, password }
  for (const model of ['tree', 'table']) await smoke({ ...link, model })
}

main().catch(err => { console.error(err.message); process.exitCode = 1 })
