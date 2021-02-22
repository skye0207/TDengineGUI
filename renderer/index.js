const TaosRestful = require('./taosrestful_.js')
const storage = require('./localDataStore.js')
const { TouchBarScrubber } = require('electron')

new Vue({
    el: '#app',
    mounted: function () {
      let links = storage.getLinks()
      for(let i = 0,len=links.length; i < len; i++) {
        let payload = {
          ip:links[i].host,
          port:links[i].port,
          user:links[i].user,
          password:links[i].password
        }
        TaosRestful.getVersion(payload).then(data => {
          links[i].version = data
          this.$data.links =links 
        })
      }
        
    },
    data: function() {
      return { 
        dbInfo:'',
        consoleResult:'',
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
        addDBDialog:false,
        addDBname:"",
        addDBcomp:"",
        addDBreplica:"",
        addDBkeep:"",
        addDBupdate:false,
        addDBquorum:"",
        addDBblocks:"",

        searchIcon: true,
        freshIcon: true,
        links:[],
        theLink:{}, //当前连接
        theDB: "", //当前数据库

        SuperTdialog: false,
        SuperTdialogText: "",
        Tdialog: false,
        TdialogText: "",

        surperTorder:"ASC",
        Torder:"ASC",
        consoleInput: "",
        marks: {
          0: '0',
          365: '365',
          36500: '36500'
        }
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

              TaosRestful.getVersion(payload).then(_data => {
                //连接成功，保存到本地
                storage.AddALink({
                  name: this.linkForm.name, 
                  host: this.linkForm.host, 
                  port: this.linkForm.port, 
                  user: this.linkForm.user, 
                  password: this.linkForm.password,
                  version: _data
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
              })
             
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
              message: data.msg,
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
        this.addDBDialog = true

        this.addDBname = ""
        this.addDBcomp = ""
        this.addDBreplica = ""
        this.addDBkeep = ""
        this.addDBupdate = false
        this.addDBquorum = ""
        this.addDBblocks = ""
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
        if(this.addDBname){
          if(this.addDBreplica && this.addDBquorum){
            if(this.addDBreplica < this.addDBquorum){
              this.$message({
                message: 'replica应大于等于quorum',
                type: 'error',
                duration:1000
              });
              return 
            }
          }
          TaosRestful.createDatabase(this.addDBname, payload,safe=true,keep= this.addDBkeep,update=this.addDBupdate,comp=this.addDBcomp, replica=this.addDBreplica,quorum=this.addDBquorum,blocks=this.addDBblocks).then(data => {
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
                message: data.msg,
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
                message: data.msg,
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
      makeDbInfo(dbs,dbName){
        console.log(dbs)
        let info = '无法获取数据库信息'
        dbs.forEach(item => {
          if(item['name'] == dbName){
            info = `数据库名:&nbsp;&nbsp;${dbName}<br/>`
            info += `创建时间:&nbsp;&nbsp;${item['created_time']}<br/>`
            info += `可更新:&nbsp;&nbsp;${item['update'] == 0?'否':'是'}<br/>`
            info += `cache(MB):&nbsp;&nbsp;${item['cache(MB)']}<br/>`
            info += `cachelast:&nbsp;&nbsp;${item['cachelast']}<br/>`
            info += `comp:&nbsp;&nbsp;${item['comp']}<br/>`
            info += `days:&nbsp;&nbsp;${item['days']}<br/>`
            info += `fsync:&nbsp;&nbsp;${item['fsync']}<br/>`
            info += `keep0,keep1,keep(D):&nbsp;&nbsp;${item['keep0,keep1,keep(D)']}<br/>`
            info += `maxrows:&nbsp;&nbsp;${item['maxrows']}<br/>`
            info += `minrows:&nbsp;&nbsp;${item['minrows']}<br/>`
            info += `ntables:&nbsp;&nbsp;${item['ntables']}<br/>`
            info += `quorum:&nbsp;&nbsp;${item['quorum']}<br/>`
            info += `replica:&nbsp;&nbsp;${item['replica']}<br/>`
            info += `status:&nbsp;&nbsp;${item['status']}<br/>`
            info += `vgroups:&nbsp;&nbsp;${item['vgroups']}<br/>`
            info += `wallevel:&nbsp;&nbsp;${item['wallevel']}<br/>`
            info += `precision:&nbsp;&nbsp;${item['precision']}<br/>`
          }
        })
        return info
      },
      alartDB(link,dbName){        
        //切换数据库前先清空表
        this.dbInfo=this.makeDbInfo(link.dbs,dbName)
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
      searchSurperTList(){
        this.SuperTdialog = false
        this.surperTables = []  
        this.clearSurperTable()
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperList = true
        TaosRestful.showSuperTables(this.theDB, payload, like=this.SuperTdialogText).then(data =>{
          if(data.res){
            //拉取超级表成功
            this.$message({
              message: '查找成功',
              type: 'success',
              duration:1000
            });
            this.surperTables = data.data
          } else {
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
            this.freshSurperTables()
          }
          this.SuperTdialogText = ""
          this.loadingSurperList = false
        }) 

      },
      freshSurperTList(){
        this.surperTables = []  
        this.clearSurperTable()
        this.freshSurperTables()
      },
      searchTList(){
        this.Tdialog = false
        this.tables = []
        this.clearTable()

        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTableList = true
        TaosRestful.showTables(this.theDB, payload, like=this.TdialogText).then(data =>{
          if(data.res){
            //拉取表成功
            this.$message({
              message: '查找成功',
              type: 'success',
              duration:1000
            });
            this.tables = data.data
          }else{
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
            this.freshTables()

          }
          this.TdialogText = ""
          this.loadingTableList = false
        })
      },
      freshTList(){
        this.tables = []
        this.clearTable()
        this.freshTables()
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
              message: data.msg,
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
              message: data.msg,
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
        if(this.surperTableFilter.surperDateRange){
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
          , limit=this.eachPageSurperTable, offset=offsetVal, desc=this.surperTorder, startTime=startTime, endTime=endTime)
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
              message: data.msg,
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
        if(this.tableFilter.dateRange){
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
          , limit=this.eachPageTable, offset=offsetVal, desc=this.Torder, startTime=startTime, endTime=endTime)
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
              this.tableLabel = []
              this.tableData = data.data
              this.totalTable = data.count
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
        if(val){
          this.clearSurperTable()
          this.surperTableName = val.name
          this.selectSurperData(true)
        }
      },   
      handleClickT(val) {
        if(val){
          this.clearTable()
          this.tableName = val.table_name   
          this.selectTData(true)
        }
      },
      paginationSurperChange(){
        this.selectSurperData(false)
      },
      paginationChange(){
        this.selectTData(false)
      },
      editSurperT(val) {
        console.log(val)
      },
      deleteSurperT(val) {
        this.$confirm('确认删除超级表' + val + "吗？")
        .then(_ => {
          let payload = {
            ip:this.theLink.host,
            port:this.theLink.port,
            user:this.theLink.user,
            password:this.theLink.password
          }
          this.loadingSurperList = true

          //TODO没测试过
          TaosRestful.dropTable(val, this.theDB, payload).then(data => {

            if(data.res){
              //成功
              this.$message({
                message: '删除成功',
                type: 'success',
                duration:500
              });
            } else {
              this.$message({
                message: data.msg,
                type: 'error',
                duration:500
              });
            }
            this.loadingSurperList = false
            this.freshSurperTables()
          })
          
        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:500
          });
        });
      },
      editT(val) {
        console.log(val)
      },
      deleteT(val) {
        this.$confirm('确认删除表' + val + "吗？")
        .then(_ => {
          let payload = {
            ip:this.theLink.host,
            port:this.theLink.port,
            user:this.theLink.user,
            password:this.theLink.password
          }
          this.loadingTableList = true

          //TODO没测试过
          TaosRestful.dropTable(val, this.theDB, payload).then(data => {

            if(data.res){
              //成功
              this.$message({
                message: '删除成功',
                type: 'success',
                duration:500
              });
            } else {
              this.$message({
                message: data.msg,
                type: 'error',
                duration:500
              });
            }
            this.loadingTableList = false
            this.freshTables()
          })
          
        })
        .catch(_ => {
          this.$message({
            message: '操作已取消',
            type: 'warning',
            duration:500
          });
        });
      },
      sendSQL(){
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        // console.log(this.theDB)
        TaosRestful.rawSqlWithDB(this.consoleInput,this.theDB,payload).then(data => {
          if(data.res){
            // let info = ''
            // info += `数据数量:&nbsp;&nbsp;${data.count}<br/>`
            // info += `数据列:&nbsp;&nbsp;${data.head}<br/>`
            // info += `数据:&nbsp;&nbsp;${data.data}<br/>`
            this.$message({
              message: '执行成功',
              type: 'success',
              duration:500
            });
            this.consoleResult = data
          } else {
            this.$message({
              message: data.msg,
              type: 'error',
              duration:1000
            });
          }
          
        })
      },
      closeSuperTdialog(){
        this.SuperTdialogText = ""
        this.SuperTdialog = false
      },
      closeTdialog(){
        this.TdialogText = ""
        this.Tdialog = false
      }
   
    }
  })


  