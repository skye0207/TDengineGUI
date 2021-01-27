const TaosRestful = require('./taosrestful.js')

const storage = require('./localDataStore.js')


new Vue({
    el: '#app',
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
        tableData: [{
          date: '2016-05-02',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        }, {
          date: '2016-05-04',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1517 弄'
        }, {
          date: '2016-05-01',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1519 弄'
        }, {
          date: '2016-05-03',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1516 弄'
        }]
      }
    },
    methods: {
      postLinkForm: function (event) { 
       
        //新建连接，先连接，如果成功了，更新本地连接缓存
        //var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")
        var tr = new TaosRestful(this.linkForm.host,this.linkForm.port,this.linkForm.user,this.linkForm.password)
        tr.showDatabases().then(data =>{
            console.log(data)
            //处理返回的数据库数据
            if(data.res){
              //连接成功，保存到本地

              
            } else {
              //连接失败
            }
            
        }
        )
      },
      handleNodeClick(data) {
        console.log(data);
      }
    }
  })


