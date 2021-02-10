'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")

tr.rawSql('use dianli_test').then(a =>{
    console.log(a)
    tr.rawSql('SELECT ts from node_8').then(a =>
        console.log(a)
    )
})

tr.rawSqlWithDB('SELECT ts from node_8','dianli_test').then(a =>{
    console.log(a)
})



tr.rawSql('SELECT ts from dianli_test.node_8').then(a =>
    console.log(a)
)


