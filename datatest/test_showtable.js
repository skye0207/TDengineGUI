'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")

// tr.showSuperTables('dianli1').then(a =>
//     console.log(a)
// )
// tr.showTables('dianli1').then(a =>
//     console.log(a)
// )

tr.showSuperTables('dianli1','2').then(a =>
    console.log(a)
)

tr.showTables('dianli1','1').then(a =>
    console.log(a)
)

// tr.useDatabase('test3')
// tr.showTables().then(a =>
//     console.log(a)
// )