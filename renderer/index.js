const TaosRestful = require('./taosrestful.js')

new Vue({
    el: '#app',
    data: function() {
      return { 
        dialogVisible: false,
        linkForm: {
          host:"",
          port:"",
          user:"",
          password:"",
        },
        formLabelWidth: '80px',
        DBs: [{
            label: '一级 1',
            children: [{
              label: '二级 1-1',
              children: [{
                label: '三级 1-1-1'
              }]
            }]
          }, {
            label: '一级 2',
            children: [{
              label: '二级 2-1',
              children: [{
                label: '三级 2-1-1'
              }]
            }, {
              label: '二级 2-2',
              children: [{
                label: '三级 2-2-1'
              }]
            }]
          }, {
            label: '一级 3',
            children: [{
              label: '二级 3-1',
              children: [{
                label: '三级 3-1-1'
              }]
            }, {
              label: '二级 3-2',
              children: [{
                label: '三级 3-2-1'
              }]
            }]
          }],
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

