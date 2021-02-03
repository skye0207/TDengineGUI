const TaosRestful = require('./taosrestful_.js')
const storage = require('./localDataStore.js')

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
        addDBDialog:false,
        linkForm: {
          name:"",
          host:"",
          port:"",
          user:"",
          password:"",
        },
        activeTab:"1",
        
        surperTables: [], //超级表list
        surperTableData: [],
        surperTableName: "",
        totalSurperTable: 0,
        surperTableLabel: [],
        loadingSurperList: false,
        loadingSurperTable: false,

        tables: [], //表list
        tableData: [],
        tableName: "",
        totalTable: 0,
        tableLabel: [],
        loadingTableList: false,
        loadingTable: false,

        eachPageSurperTable:8,
        eachPageTable:8,

        addDBDialogLink:{},
        addDBForm:{
          name:""
        },
        searchIcon: true,
        freshIcon: true,
        links:[],
        theLink:{}, //当前连接
        theDB: "", //当前数据库
      }
    },
    methods: {
      cancelAddLink: function () {
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
      confirmAddLink: function (event) { 
       
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
            }
            
        }
        )
        //清空表单
        this.linkForm={
          name:"",
          host:"",
          port:"",
          user:"",
          password:""
        }
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
              type: 'success'
            });
            this.links[key].dbs = data.data
          } else {
            //连接失败，1.提示 2.删除当前连接 3.重新连接
            //1
            this.$message({
              message: '连接失败',
              type: 'error'
            });
            //2
            storage.deleteALink(key)
            this.links = storage.getLinks()
            //3
            this.$message({
              message: '尝试重新连接',
              type: 'warning'
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
              type: 'success'
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
              type: 'success'
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
      handleClickSurperT(val) {
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.clearSurperTable()
        this.surperTableName = val.name
        this.loadingSurperTable = true
        
        TaosRestful.selectData(val.name, this.theDB, payload,null,null,limit=this.eachPageSurperTable,offset = '0')
        .then(data =>{
          if(data.res){
            //成功
            this.$message({
              message: '获取成功',
              type: 'success'
            });
            if(data.data.length != 0){
              //有数据
              this.surperTableLabel = Object.keys(data.data[0])
              this.surperTableData = data.data
              this.totalSurperTable = data.count
            } else {
              this.$message({
                message: '无数据',
                type: 'success'
              });
            }
          }
          this.loadingSurperTable = false

        })
      },
      handleClickT(val) {
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.clearTable()
        this.tableName = val.table_name
        this.loadingTable = true
        

        TaosRestful.selectData(val.table_name, this.theDB, payload,null,null,limit=this.eachPageTable,offset = '0').then(data =>{
          if(data.res){
            //成功
            this.$message({
              message: '获取成功',
              type: 'success'
            });
            if(data.data.length != 0){
              //有数据
              this.tableLabel = Object.keys(data.data[0])
              this.tableData = data.data
              this.totalTable = data.count
            } else {
              this.$message({
                message: '无数据',
                type: 'success'
              });
            }
          }
          this.loadingTable = false
        })
      },
      paginationSurperChange(val){
        let offsetVal = (val-1)*this.eachPageSurperTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingSurperTable = true

        TaosRestful.selectData(this.surperTableName, this.theDB, payload,null,null,limit=this.eachPageSurperTable,offset = offsetVal).then(data =>{
          if(data.res){
            //成功
            this.$message({
              message: '获取成功',
              type: 'success'
            });
            if(data.data.length != 0){
              //有数据
              this.surperTableLabel = Object.keys(data.data[0])
              this.surperTableData = data.data
              this.totalSurperTable = data.count
            } else {
              this.$message({
                message: '无数据',
                type: 'success'
              });
            }
          }
          this.loadingSurperTable = false
        })
      },
      paginationChange(val){
        let offsetVal = (val-1)*this.eachPageTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.loadingTable = true
        TaosRestful.selectData(this.tableName, this.theDB, payload,null,null,limit=this.eachPageTable,offset = offsetVal).then(data =>{
          if(data.res){
            //成功
            this.$message({
              message: '获取成功',
              type: 'success'
            });
            if(data.data.length != 0){
              //有数据
              this.tableLabel = Object.keys(data.data[0])
              this.tableData = data.data
              this.totalTable = data.count
            } else {
              this.$message({
                message: '无数据',
                type: 'success'
              });
            }
          }
          this.loadingTable = false
        })
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
      
      addDB(link){
        this.addDBDialogLink = link
        this.addDBDialog = true
      },
      deleteDB(link,dbName){
        let payload = {
          ip:link.host,
          port:link.port,
          user:link.user,
          password:link.password
        }
        this.loadingLinks = true
        TaosRestful.dropDatabase(dbName, payload).then(data => {
          if(data.res){
            this.loadingLinks = false
            this.freshDB(payload)
          }
        })
      },
      postaddDB(){
        let payload = {
          ip:this.addDBDialogLink.host,
          port:this.addDBDialogLink.port,
          user:this.addDBDialogLink.user,
          password:this.addDBDialogLink.password
        }
        this.loadingLinks = true
        this.addDBDialog = false
        if(this.addDBForm.name){
          TaosRestful.createDatabase(this.addDBForm.name, payload).then(data => {
            if(data.res){
              //新增成功
              this.freshDB(payload)
              this.loadingLinks = false
              
            }else{

            }
          })
        }
      }
      
    }
  })


  