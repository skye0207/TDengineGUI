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
        linkForm: {
          name:"",
          host:"",
          port:"",
          user:"",
          password:"",
        },
        searchIcon: true,
        freshIcon: true,
        formLabelWidth: '80px',
        surperTables: [],
        tables: [],
        surperTableData: [],
        tableData: [],
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
        TaosRestful.showSuperTables(dbName, payload).then(data =>{
          console.log(data)
          this.drawer = false
          this.surperTables = data.data
        })
        TaosRestful.showTables(dbName, payload).then(data =>{
          this.tables = data.data
        })
        //记录当前数据库
        this.theDBName = dbName
        storage.setTheDB(dbName)
      }
    }
  })


