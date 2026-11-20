'use strict'

const { IoTDB } = require('./iotdb')

const Grid = {
  props: ['result'],
  template: `<el-table :data="result.rows" size="mini" border max-height="480">
    <el-table-column v-for="(column, i) in result.columns" :key="i" :label="column" min-width="140">
      <template slot-scope="cell">{{ cell.row[i] === null ? 'NULL' : cell.row[i] }}</template>
    </el-table-column></el-table>`
}
const empty = () => ({ columns: [], rows: [] })

module.exports = {
  props: ['link', 'database'],
  components: { ResultGrid: Grid },
  data() {
    return { names: [], name: '', schema: empty(), pageData: empty(), offset: 0, size: 20,
      more: false, desc: false, range: null, loading: false, listing: false, selecting: 0,
      tab: 'data', sql: '', output: empty(), sqlMessage: '', executing: false }
  },
  computed: {
    client() { return new IoTDB(this.link) },
    objectLabel() { return this.link.model === 'tree' ? '设备' : '表' }
  },
  mounted() { this.refresh() },
  methods: {
    async refresh() {
      this.listing = true
      try {
        this.names = await this.client.objects(this.database)
        if (!this.names.includes(this.name)) this.select('')
      } catch (err) { this.$message.error(err.message) }
      finally { this.listing = false }
    },
    async select(name) {
      this.name = name
      this.offset = 0
      this.more = false
      this.schema = empty()
      this.pageData = empty()
      const sequence = ++this.selecting
      this.loading = !!name
      if (!name) return
      try {
        const schema = await this.client.describe(this.database, name)
        if (sequence !== this.selecting) return
        this.schema = schema
        await this.readPage(0)
      } catch (err) {
        if (sequence === this.selecting) { this.loading = false; this.$message.error(err.message) }
      }
    },
    async readPage(offset) {
      if (!this.name) return
      const sequence = ++this.selecting
      this.loading = true
      try {
        const result = await this.client.page(this.database, this.name, this.schema,
          { size: this.size, offset, range: this.range, desc: this.desc })
        if (sequence !== this.selecting) return
        this.pageData = result
        this.offset = offset
        this.more = result.more
      } catch (err) { if (sequence === this.selecting) this.$message.error(err.message) }
      finally { if (sequence === this.selecting) this.loading = false }
    },
    async drop() {
      const name = this.name
      try { await this.$confirm('确认删除' + this.objectLabel + ' ' + name + ' 的结构和数据？') }
      catch (_) { return }
      try { await this.client.dropObject(this.database, name); await this.refresh() }
      catch (err) { this.$message.error(err.message) }
    },
    async run(write) {
      this.executing = true
      this.output = empty()
      this.sqlMessage = ''
      try {
        if (write) {
          const status = await this.client.execute(this.sql, this.database)
          this.sqlMessage = status.message || '执行成功'
          await this.refresh()
        } else {
          this.output = await this.client.query(this.sql, this.database)
          this.sqlMessage = this.output.rows.length + ' 行'
        }
      } catch (err) { this.sqlMessage = err.message; this.$message.error(err.message) }
      finally { this.executing = false }
    }
  },
  template: `<el-tabs class="mainTab iotdb-browser" type="border-card" v-model="tab">
    <el-tab-pane :label="objectLabel" name="data">
      <el-row type="flex" align="middle" class="iotdb-toolbar">
        <el-select v-model="name" filterable :placeholder="'选择' + objectLabel" @change="select" :loading="listing">
          <el-option v-for="item in names" :key="item" :value="item" :label="item"></el-option>
        </el-select>
        <el-button size="small" :disabled="listing" @click="refresh">刷新列表</el-button>
        <el-button size="small" :disabled="!name" type="danger" plain @click="drop">删除{{objectLabel}}</el-button>
      </el-row>
      <el-row class="iotdb-toolbar" v-if="name">
        <el-date-picker type="datetimerange" v-model="range" :disabled="loading" start-placeholder="开始时间" end-placeholder="结束时间" @change="readPage(0)"></el-date-picker>
        <el-checkbox v-model="desc" :disabled="loading" @change="readPage(0)">时间倒序</el-checkbox>
        <el-button size="small" :disabled="loading" @click="readPage(offset)">刷新数据</el-button>
      </el-row>
      <result-grid v-loading="loading" :result="pageData"></result-grid>
      <el-row v-if="name" class="iotdb-toolbar">
        <el-button size="small" :disabled="loading || offset === 0" @click="readPage(offset-size)">上一页</el-button>
        <span>第 {{ offset / size + 1 }} 页</span>
        <el-button size="small" :disabled="loading || !more" @click="readPage(offset+size)">下一页</el-button>
      </el-row>
    </el-tab-pane>
    <el-tab-pane label="结构" name="schema"><result-grid :result="schema"></result-grid></el-tab-pane>
    <el-tab-pane label="控制台" name="sql">
      <el-input type="textarea" :rows="4" v-model="sql" :placeholder="link.model === 'tree' ? '输入带完整路径的 Tree SQL' : '输入当前数据库的 Table SQL'"></el-input>
      <el-row class="iotdb-toolbar"><el-button size="small" type="primary" :disabled="executing || !sql.trim()" @click="run(false)">查询</el-button>
        <el-button size="small" :disabled="executing || !sql.trim()" @click="run(true)">执行写入 / DDL</el-button><span>{{ sqlMessage }}</span></el-row>
      <result-grid v-loading="executing" :result="output"></result-grid>
    </el-tab-pane></el-tabs>`
}
