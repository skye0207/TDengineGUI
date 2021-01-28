'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918",1)

tr.testConnect().then(a =>
    console.log(a)
)
tr.showDatabases().then(a =>
    console.log(a)
)
