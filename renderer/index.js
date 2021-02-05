const TaosRestful = require('./taosrestful_.js')
const storage = require('./localDataStore.js')
const { TouchBarScrubber } = require('electron')

new Vue({
    el: '#app',
    mounted: function () {
      this.$data.links = storage.getLinks()
    },
    data: function() {
      return { 
        loadingLinks: false,
        drawer: true,
        addLinkDialog: false,
        linkForm: {
          name:"",
          host:"",
          port:"",
          user:"",
          password:"",
        },
        activeTab:"1",

        surperTableFilter:{
          fields:[],
        },
        surperTableFilterCopy:{},
        tableFilter:{
          fields:[],
        },
        tableFilterCopy:{},

        tableSearchText:"",
        tableSearchColumn:"",
        tableFilterDialog:false,

        surperTSearchText: "",
        surperTSearchColumn: "",
        surperTableFilterDialog:false,
        
        surperTables: [], //超级表list
        surperTableData: [],
        surperTableName: "",
        totalSurperTable: 0,
        surperTableLabelItems: [],
        surperTableLabel: [],
        loadingSurperList: false,
        loadingSurperTable: false,

        tables: [], //表list
        tableData: [],
        tableName: "",
        totalTable: 0,
        tableLabelItems: [],
        tableLabel: [],
        loadingTableList: false,
        loadingTable: false,

        eachPageSurperTable:8,
        currentPageSurperTable:1,
        eachPageTable:8,
        currentPageTable:1,

        addDBDialogLinkKey:0,
        addDBName:"",
        addDBDialog:false,

        searchIcon: true,
        freshIcon: true,
        links:[],
        theLink:{}, //当前连接
        theDB: "", //当前数据库
      }
    },
    methods: {
      cancelAddLink() {
        this.addLinkDialog = false
        //清空表单
        this.linkForm={
          name:"",
          host:"",
          port:"",
          user:"",
          password:""
        }
      },
      confirmAddLink(event) {    
        //新建连接，先连接，如果成功，将payload+name记入本地
        //var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")
        let payload = {
          ip:this.linkForm.host,
          port:this.linkForm.port,
          user:this.linkForm.user,
          password:this.linkForm.password
        }
        TaosRestful.showDatabases(payload).then(data =>{
            //处理返回的数据库数据
            if(data.res){
              //连接成功，保存到本地
              storage.AddALink({
                name: this.linkForm.name, 
                host: this.linkForm.host, 
                port: this.linkForm.port, 
                user: this.linkForm.user, 
                password: this.linkForm.password
              })
              //关闭新建连接的弹窗
              this.addLinkDialog = false
              //清空表单
              this.linkForm={
                name:"",
                host:"",
                port:"",
                user:"",
                password:"",
              }
              //更新连接列表
              this.links = storage.getLinks()
            } else {
              //连接失败
              this.$message({
                message: '连接失败',
                type: 'error',
                duration:1000
              });
            }
            
        }
        )
       
      },
      deleteLink(key, linkName){
        this.$confirm('确认删除连接' + linkName + "吗？")
        .then(_ => {
          storage.deleteALink(key)
          this.links = storage.getLinks()
          this.$message({
            message: '删除成功',
            type: 'success',
            duration:500
          });
        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:500
          });
        });
      },
      freshDB(key){
        let theLink = this.links[key]
        let payload = {
          ip:theLink.host,
          port:theLink.port,
          user:theLink.user,
          password:theLink.password
        }
        this.loadingLinks = true
        TaosRestful.showDatabases(payload).then(data =>{
          this.loadingLinks = false
          if(data.res){
            this.$message({
              message: '刷新成功',
              type: 'success',
              duration:1000
            });
            this.links[key].dbs = data.data
            //TODO展开菜单

          } else {
            //连接失败，1.提示 2.删除当前连接 3.重新连接
            //1
            this.$message({
              message: '连接失败',
              type: 'error',
              duration:1000
            });
            //2
            storage.deleteALink(key)
            this.links = storage.getLinks()
            //3
            this.$message({
              message: '尝试重新连接',
              type: 'warning',
              duration:1000
            });
            this.linkForm = {
              name: theLink.name,
              host: theLink.host,
              port: theLink.port,
              user: theLink.user,
              password: theLink.password,
            }
            this.addLinkDialog = true
          }
        })
      },
      addDB(key){
        this.addDBDialogLinkKey = key
        this.addDBName = ""
        this.addDBDialog = true
      },
      postaddDB(){
        let key = this.addDBDialogLinkKey
        let theLink = this.links[key]
        let payload = {
          ip:theLink.host,
          port:theLink.port,
          user:theLink.user,
          password:theLink.password
        }
        if(this.addDBName){
          TaosRestful.createDatabase(this.addDBName, payload).then(data => {
            if(data.res){
              //新增成功
              this.$message({
                message: '添加成功',
                type: 'success',
                duration:1000
              });
              this.freshDB(key)
              this.addDBDialog = false
            }else{
              //添加失败
              this.$message({
                message: '添加失败',
                type: 'error',
                duration:1000
              });
            }
          })
        } else{
          this.$message({
            message: '请填写内容',
            type: 'warning',
            duration:1000
          });
        }
      },
      deleteDB(link, dbName, key){
        this.$confirm('确认删除数据库' + dbName + "吗？")
        .then(_ => {
          let payload = {
            ip:link.host,
            port:link.port,
            user:link.user,
            password:link.password
          }
          this.loadingLinks = true

          TaosRestful.dropDatabase(dbName, payload).then(data => {

            if(data.res){
              //成功
              this.$message({
                message: '删除成功',
                type: 'success',
                duration:1000
              });
            } else {
              this.$message({
                message: '删除失败',
                type: 'error',
                duration:1000
              });
            }
            this.loadingLinks = false
            this.freshDB(key)
          })
        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:1000
          });
        });
      },
      clearSurperTable(){
        this.surperTableName = ""
        this.totalSurperTable = 0
        this.surperTableData = []
        this.surperTableLabel = []
      },
      clearTable(){
        this.tableName = ""
        this.totalTable = 0
        this.tableData = []
        this.tableLabel = []
      },
      alartDB(link,dbName){        
        //切换数据库前先清空表
        this.surperTables = []  
        this.clearSurperTable()
        this.tables = []
        this.clearTable()
      
        //记录进入的数据库
        this.theLink = link
        this.theDB = dbName

        //更新超级表页
        this.drawer = false
        this.activeTab = "1"
        this.freshSurperTables()
      },
      freshSurperTables(){
        this.surperTables = []  
        this.clearSurperTable()
        
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperList = true
        TaosRestful.showSuperTables(this.theDB, payload).then(data =>{
          if(data.res){
            //拉取超级表成功
            this.$message({
              message: '刷新成功',
              type: 'success',
              duration:1000
            });
            this.surperTables = data.data
          }
          this.loadingSurperList = false
        })
      },
      freshTables(){
        this.tables = []
        this.clearTable()

        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTableList = true
        TaosRestful.showTables(this.theDB, payload).then(data =>{
          if(data.res){
            //拉取表成功
            this.$message({
              message: '刷新成功',
              type: 'success',
              duration:1000
            });
            this.tables = data.data
          }
          this.loadingTableList = false
        })
      },
      handleSwichTab(tab) {
        switch(tab.name) {
          case "1":
            //超级表
            this.freshSurperTables()
            break;
          case "2":
            //表
            this.freshTables()
            break;
          case "3":
            //控制台
            break;
          case "4":
            //数据库属性
            break;
     } 
      },
      openSurperTableFilterD(){
        this.surperTableFilterDialog = true
        this.surperTableFilterCopy = JSON.parse(JSON.stringify(this.surperTableFilter))
      },
      concelSurperTableFilter(){
        this.$message({
          message: '取消操作',
          type: 'warning',
          duration:1000
        });
        this.surperTableFilterDialog = false
        this.surperTableFilter = this.surperTableFilterCopy
      },
      postSurperTableFilter(){
        this.surperTableFilterDialog = false
        this.selectSurperData(false)
      },
      openTableFilterD(){
        this.tableFilterDialog = true
        this.tableFilterCopy = JSON.parse(JSON.stringify(this.tableFilter))
      },
      concelTableFilter(){
        this.$message({
          message: '取消操作',
          type: 'warning',
          duration:1000
        });
        this.tableFilterDialog = false
        this.tableFilter = this.tableFilterCopy
      },
      postTableFilter(){
        this.tableFilterDialog = false
        this.selectTData(false)
      },
      selectSurperData(isFirst){
        let offsetVal = (this.currentPageSurperTable-1)*this.eachPageSurperTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperTable = true
        //tableName,dbName,payload,fields=null,where=null,limit =null,offset = null,desc =null,startTime=null,endTime=null
        TaosRestful.selectData(this.surperTableName, this.theDB, payload, fields=this.surperTableFilter.fields, where=null
          , limit=this.eachPageSurperTable, offset=offsetVal, desc =null, startTime=null, endTime=null)
        .then(data =>{
          if(data.res){
            //成功
            if(data.data.length != 0){
              //有数据
              this.$message({
                message: '获取成功',
                type: 'success',
                duration:1000
              });
              if(isFirst){
                this.surperTableLabelItems = Object.keys(data.data[0])
              }
              this.surperTableLabel = Object.keys(data.data[0])
              this.surperTableFilter.fields =  Object.keys(data.data[0])
              this.surperTableData = data.data
              this.totalSurperTable = data.count
            } else {
              this.$message({
                message: '无数据',
                type: 'warning',
                duration:1000
              });
            }
          }
          this.loadingSurperTable = false

        })
      },
      selectTData(isFirst){
        let offsetVal = (this.currentPageTable-1)*this.eachPageTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTable = true
        //tableName,dbName,payload,fields=null,where=null,limit =null,offset = null,desc =null,startTime=null,endTime=null
        TaosRestful.selectData(this.tableName, this.theDB, payload, fields=this.tableFilter.fields, where=null
          , limit=this.eachPageTable, offset=offsetVal, desc =null, startTime=null, endTime=null)
        .then(data =>{
          if(data.res){
            //成功
            if(data.data.length != 0){
              //有数据
              this.$message({
                message: '获取成功',
                type: 'success',
                duration:1000
              });
              if(isFirst){
                this.tableLabelItems = Object.keys(data.data[0])
              }
              this.tableLabel = Object.keys(data.data[0])
              this.tableFilter.fields =  Object.keys(data.data[0])
              this.tableData = data.data
              this.totalTable = data.count
            } else {
              this.$message({
                message: '无数据',
                type: 'warning',
                duration:1000
              });
            }
          }
          this.loadingTable = false
        })
      },
      surTableFilter(){
        this.selectSurperData(0)
      },
      handleClickSurperT(val) {
        this.clearSurperTable()
        this.surperTableName = val.name
        this.selectSurperData(true)
        this.surperTableFilter={
          fields:[]
        }
      },   
      handleClickT(val) {
        this.clearTable()
        this.tableName = val.table_name
        this.selectTData(true)
        this.tableFilter={
          fields:[]
        }
      },
      paginationSurperChange(isFirst){
        this.selectSurperData(false)
      },
      paginationChange(){
        this.selectTData(false)
      },
     
      editSurperT(val) {
        console.log(val)
      },
      deleteSurperT(val) {
        console.log(val)
      },
      editT(val) {
        console.log(val)
      },
      deleteT(val) {
        console.log(val)
      },
   
    }
  })


  