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

        surperTableFilterCopy:{},
        
        surperTableFilter:{
          fields:[],
          surperDateRange:[],
          surperTSearchText: "",
          surperTSearchColumn: "",
        },
        
        tableFilterCopy:{}, 
        tableFilter:{
          fields:[],
          dateRange:[],
          tableSearchText:"",
          tableSearchColumn:"",
        },
        surperWhere:"",
        tableWhere:"",

        tableFilterDialog:false,
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

        eachPageSurperTable:10,
        currentPageSurperTable:1,
        eachPageTable:10,
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
      beforeClosedrawer(){
        if(this.theDB){
          this.drawer = false
        } else {
          this.$message({
            message: '请选择数据库',
            type: 'warning',
            duration:1000
          });
        }
      },
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
      clearSurperTable(){
        this.surperTableName = ""
        this.totalSurperTable = 0
        this.surperTableData = []
        this.surperTableLabel = []
        this.surperTableFilter={
          fields:[],
          surperDateRange:[],
          surperTSearchText: "",
          surperTSearchColumn: "",
        }
      },
      clearTable(){
        this.tableName = ""
        this.totalTable = 0
        this.tableData = []
        this.tableLabel = []
        this.tableFilter={
          fields:[],
          dateRange:[],
          tableSearchText:"",
          tableSearchColumn:"",
        }
      },
      freshSurperTables(){
        //清理超级表列表
        this.surperTables = []  
        //清理选中的超级表和具体数据
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
          } else {
            this.$message({
              message: '刷新失败',
              type: 'error',
              duration:1000
            });
          }
          this.loadingSurperList = false
        }) 
      },
      freshTables(){
        //清理表列表
        this.tables = []
        //清理选中的表和具体数据
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
          }else{
            this.$message({
              message: '刷新失败',
              type: 'error',
              duration:1000
            });
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
      searchSurperText(){
        if(this.surperTableFilter.surperTSearchColumn && this.surperTableFilter.surperTSearchText.trim()){
          // this.surperWhere = this.surperTSearchColumn + " > " + this.surperTSearchText.trim()+"%"
          // this.clearSurperTable()
          let surperTSearchText = this.surperTableFilter.surperTSearchText.trim()
          if(!isNaN(surperTSearchText)){
            this.surperWhere =this.surperTableFilter.surperTSearchColumn + " = " + surperTSearchText
          } else {
            this.surperWhere =this.surperTableFilter.surperTSearchColumn + " = '" + surperTSearchText +"'"
          }
          
          this.selectSurperData(false)
        } else {
          this.surperWhere = ""
          this.$message({
            message: '请填写正确',
            type: 'warning',
            duration:1000
          });
          this.selectSurperData(false)
        }
      },
      searchTableText(){
        if(this.tableFilter.tableSearchColumn && this.tableFilter.tableSearchText.trim()){

          let tableSearchText = this.tableFilter.tableSearchText.trim()
          if(!isNaN(tableSearchText)){
            this.tableWhere =this.tableFilter.tableSearchColumn + " = " + tableSearchText
          } else {
            this.tableWhere =this.tableFilter.tableSearchColumn + " = '" + tableSearchText +"'"
          }
          
          this.selectTData(false)
        } else {
          this.tableWhere = ""
          this.$message({
            message: '请填写正确',
            type: 'warning',
            duration:1000
          });
          this.selectTData(false)
        }
      },
      selectSurperData(isFirst, isResetPage){

        //处理时间范围
        let startTime = null
        let endTime = null
        if(this.surperTableFilter.surperDateRange.length > 0){
          startTime = this.surperTableFilter.surperDateRange[0];
          endTime = this.surperTableFilter.surperDateRange[1];
        }

        //是否需要重置分页
        if(isResetPage){
          this.currentPageSurperTable = 1
        }

        let offsetVal = (this.currentPageSurperTable-1)*this.eachPageSurperTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperTable = true

        //处理查询数据
        // if(!this.surperTableFilter.surperTSearchText.trim()){
        //   this.surperWhere = ""
        // }

        //tableName,dbName,payload,fields=null,where=null,limit =null,offset = null,desc =null,startTime=null,endTime=null
        TaosRestful.selectData(this.surperTableName, this.theDB, payload, fields=this.surperTableFilter.fields, where=this.surperWhere
          , limit=this.eachPageSurperTable, offset=offsetVal, desc =null, startTime=startTime, endTime=endTime)
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
              this.surperTableLabel = []
              this.surperTableData = data.data
              this.totalSurperTable = data.count
              this.$message({
                message: '无数据',
                type: 'warning',
                duration:1000
              });
            }
          }else{
            this.$message({
              message: '获取失败',
              type: 'error',
              duration:1000
            });
          }
          this.loadingSurperTable = false

        })
      },
      selectTData(isFirst, isResetPage=false){

        //处理时间范围
        let startTime = null
        let endTime = null
        if(this.tableFilter.dateRange.length > 0){
          startTime = this.tableFilter.dateRange[0];
          endTime = this.tableFilter.dateRange[1];
        }

        if(isResetPage){
          this.currentPageTable = 1
        }

        let offsetVal = (this.currentPageTable-1)*this.eachPageTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTable = true

        // if(!this.tableFilter.tableSearchText.trim()){
        //   this.tableWhere = ""
        // }

        //tableName,dbName,payload,fields=null,where=null,limit =null,offset = null,desc =null,startTime=null,endTime=null
        TaosRestful.selectData(this.tableName, this.theDB, payload, fields=this.tableFilter.fields, where=this.tableWhere
          , limit=this.eachPageTable, offset=offsetVal, desc =null, startTime=startTime, endTime=endTime)
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
      },   
      handleClickT(val) {
        this.clearTable()
        this.tableName = val.table_name
        
        this.selectTData(true)
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


  