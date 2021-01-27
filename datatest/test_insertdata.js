'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")

tr.insertData('person100',{'td':Date.now(),'name5':1.2},'test3').then(a =>
    console.log(a)
)

tr.useDatabase('test3')
tr.insertData('person100',{'td':Date.now(),'name5':1.2}).then(a =>
    console.log(a)
)