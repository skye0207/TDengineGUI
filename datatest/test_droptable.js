'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")

tr.dropTable('rule_1','dianli1',false).then(a =>
    console.log(a)
)
