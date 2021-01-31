const TaosRestful = require('./taosrestful_.js')

const storage = require('./localDataStore.js')


new Vue({
    el: '#app',
    mounted: function () {
      this.$data.links = storage.getLinks()
      let theLink = storage.getTheLink()
      let theDBName = storage.getTheDB()
      //如果当前连接和当前数据库不为空，拉取超级表数据
      if(theLink && theDBName){
        this.$data.theLink = theLink
        this.$data.theDBName = theDBName
        let payload = {
          ip:theLink.host,
          port:theLink.port,
          user:theLink.user,
          password:theLink.password
        }
        TaosRestful.showSuperTables(theDBName, payload).then(data =>{
          this.$data.surperTables = data.data
        })
        TaosRestful.showTables(theDBName, payload).then(data =>{
          this.tables = data.data
        })
      } else {
         //如果为空显示连接数据库
         this.$data.drawer = true
      }
     

    },
    data: function() {
      return { 
        drawer: false,
        dialogVisible: false,
        addDBDialog:false,
        linkForm: {
          name:"",
          host:"",
          port:"",
          user:"",
          password:"",
        },
        addDBDialogLink:{},
        addDBForm:{
          name:""
        },
        searchIcon: true,
        freshIcon: true,
        formLabelWidth: '80px',
        surperTables: [],
        tables: [],
        surperTableData: [],
        surperTableName: "",
        totalSurperTable: 0,
        eachPageSurperTable:8,
        surperTableLabel: [],
        tableData: [],
        tableName: "",
        totalTable: 0,
        tableLabel: [],
        eachPageTable:8,
        links:[],
        theLink:{},
        theDBName: ''
      }
    },
    methods: {
      postLinkForm: function (event) { 
       
        //新建连接，先连接，如果成功了，更新本地连接缓存
        //虚假
        //var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")
        //真实
        //var tr = new TaosRestful(this.linkForm.host,this.linkForm.port,this.linkForm.user,this.linkForm.password)
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
              storage.setTheLink({
                name: this.linkForm.name, 
                host: this.linkForm.host, 
                port: this.linkForm.port, 
                user: this.linkForm.user, 
                password: this.linkForm.password, 
                dbs: data.data
              })
              //关闭新建连接的弹窗
              this.dialogVisible = false
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
              this.theLink = storage.getTheLink()
            } else {
              //连接失败
            }
            
        }
        )
      },
      alartDB(link,dbName){
        //处理点击数据库名事件，拉取数据库中的数据表
        let payload = {
          ip:link.host,
          port:link.port,
          user:link.user,
          password:link.password
        }
        //切换数据库的同时，清空表格
        this.totalSurperTable = 0
        this.surperTableData = []
        this.surperTableLabel = []
        this.totalTable = 0
        this.tableData = []
        this.tableLabel = []
          
        TaosRestful.showSuperTables(dbName, payload).then(data =>{
          this.drawer = false
          this.surperTables = data.data
        })
        TaosRestful.showTables(dbName, payload).then(data =>{
          this.tables = data.data
        })
        //记录当前数据库
        this.theDBName = dbName
        storage.setTheDB(dbName)
      },
      handleClickSurperT(val) {
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.surperTableName = val.name

        TaosRestful.selectData(val.name, this.theDBName, payload,null,null,limit=this.eachPageSurperTable,offset = '0').then(data =>{
          this.totalSurperTable = data.count
          this.surperTableData = data.data
          this.surperTableLabel = data.data[0]?Object.keys(data.data[0]):[]
        })
      },
      handleClickT(val) {
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        this.tableName = val.table_name
        TaosRestful.selectData(val.table_name, this.theDBName, payload,null,null,limit=this.eachPageTable,offset = '0').then(data =>{
          this.totalTable = data.count
          this.tableData = data.data
          this.tableLabel = data.data[0]?Object.keys(data.data[0]):[]
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
      paginationSurperChange(val){
        let offsetVal = (val-1)*this.eachPageSurperTable
        let payload = {
          ip:this.theLink.host,
          port:this.theLink.port,
          user:this.theLink.user,
          password:this.theLink.password
        }
        TaosRestful.selectData(this.surperTableName, this.theDBName, payload,null,null,limit=this.eachPageSurperTable,offset = offsetVal).then(data =>{
          this.totalSurperTable = data.count
          this.surperTableData = data.data
          this.surperTableLabel = data.data[0]?Object.keys(data.data[0]):[]
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
        TaosRestful.selectData(this.tableName, this.theDBName, payload,null,null,limit=this.eachPageTable,offset = offsetVal).then(data =>{
          this.totalTable = data.count
          this.tableData = data.data
          this.tableLabel = data.data[0]?Object.keys(data.data[0]):[]
        })
      },
      freshDB(link){
        let payload = {
          ip:link.host,
          port:link.port,
          user:link.user,
          password:link.password
        }
        TaosRestful.showDatabases(payload).then(data =>{
          //处理返回的数据库数据
          if(data.res){
            //连接成功，保存到本地
            storage.setTheLink({
              name: link.name, 
              host: link.host, 
              port: link.port, 
              user: link.user, 
              password: link.password, 
              dbs: data.data
            })
            this.links = storage.getLinks()
            
          } else {
            //连接失败
          }
        })
      },
      addDB(link){
        this.addDBDialogLink = link
        this.addDBDialog = true
      },
      postaddDB(){
        console.log("postaddDBs", this.addDBForm.name)
        let payload = {
          ip:this.addDBDialogLink.host,
          port:this.addDBDialogLink.port,
          user:this.addDBDialogLink.user,
          password:this.addDBDialogLink.password
        }
        if(this.addDBForm.name){
          TaosRestful.createDatabase(this.addDBForm.name, payload).then(data => {
            console.log(data)
            if(data.res){
              //新增成功
              
            }else{

            }
          })
        }
      }
      
    }
  })


