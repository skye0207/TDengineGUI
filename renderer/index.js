const TaosRestful = require('./taosrestful.js')

new Vue({
    el: '#app',
    data: function() {
      return { 
        drawer: false,
        dialogVisible: false,
        linkForm: {
          host:"",
          port:"",
          user:"",
          password:"",
        },
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
        var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")
        tr.showDatabases().then(data =>{
            console.log(data)
            //处理返回的数据库数据
            const DBs = []
            
        }
        )
      },
      handleNodeClick(data) {
        console.log(data);
      }
    }
  })

