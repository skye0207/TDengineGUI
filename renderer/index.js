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
        formLabelWidth: '80px'
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

