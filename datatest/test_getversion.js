'use strict'


var TaosRestful = require('../renderer/js/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")


tr.getVersion().then(a =>{
    console.log(a)
})
