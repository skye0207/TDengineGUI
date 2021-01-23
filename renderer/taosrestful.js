'use strict'
const axios = require('axios')

module.exports = class TaosRestful {
   constructor(ip='localhost', port='6041',user='root',password="taosdata") {
       this.ip = ip
       this.port = port
       this.user = user
       this.password = password
       this.database = 'demo'
   }
   async sendRequest(sqlStr){
    try {   
        let res = await axios.post(`http://${this.ip}:${this.port}/rest/sql`, sqlStr, {
            auth: {
            username: this.user,
            password: this.password
            }
        })
        if (res.data.status == 'succ'){
            // console.log(res.data.data)
            // console.log(res.data.rows)
            // console.log(res.data.head)
            let head  = res.data.head
            let resData = res.data.data.map(item => Object.fromEntries(head.map((a,b)=>[a,item[b]])))
            return  {'res':true,'count':res.data.rows,'data':resData}
        }else{
            return {'res':false,'msg':res.data.desc,'code':res.data.code}
        }
    } catch (err) {
        return {'res':false,'msg':err.response.data.desc,'code':err.response.data.code}
    }

   }
   showDatabases(){
    return this.sendRequest('SHOW DATABASES')
   }
   createDatabase(dbName,safe=true,keep= null,update=false,comp=null,replica=null,quorum=null,blocks=null){
        let sqlStr = 'CREATE DATABASE '
        if(safe){
            sqlStr += 'IF NOT EXISTS '
        }
        sqlStr += dbName

        if(keep != null){
            sqlStr += ` KEEP ${keep}`
        }
        if(comp != null){
            sqlStr += ` COMP ${comp}`
        }
        if(replica != null) {
            sqlStr += ` REPLICA ${replica}`
        }
        if(quorum != null){
            sqlStr += ` QUORUM ${quorum}`
        }
        if(blocks != null){
            sqlStr += ` BLOCKS ${blocks}`
        }
        if(update != null){
            sqlStr += ` UPDATE 1`
        }
        // console.log(sqlStr)
        return this.sendRequest(sqlStr)
   }

   alterDatabase(dbName,keep=null,comp=null,replica=null,quorum=null,blocks=null){
    let sqlStr = 'ALTER DATABASE '
    sqlStr += dbName
    if(keep != null){
        sqlStr += ` KEEP ${keep}`
    }
    if(comp != null){
        sqlStr += ` COMP ${comp}`
    }
    if(replica != null){
        sqlStr += ` REPLICA ${replica}`
    }
    if(quorum != null){
        sqlStr += ` QUORUM ${quorum}`
    }
    if(blocks != null){
        sqlStr += ` BLOCKS ${blocks}`
    }
    // console.log(sqlStr)
    return this.sendRequest(sqlStr)
}
   useDatabase(dbName){
    this.database = dbName
   }
   dropDatabase(dbName,safe=true){
    // console.log(`DROP DATABASE ${safe?'IF EXISTS':''} ${dbName}`)
    return this.sendRequest(`DROP DATABASE ${safe?'IF EXISTS':''} ${dbName}`)
   }
   showSuperTables(dbName){
    return this.sendRequest(`SHOW ${dbName}.STABLES`)
   }
   showTables(dbName=null){
    let dbN = dbName ? dbName : this.database
    // console.log(`SHOW ${dbN}.TABLES`)
    return this.sendRequest(`SHOW ${dbN}.TABLES`)
   }
   disTable(tableName,dbName=null){
    let dbN = dbName ? dbName : this.database
    return this.sendRequest(`DESCRIBE ${dbN}.${tableName}`)
   }

   insertData(tableName,data,dbName=null){
    let dbN = dbName ? dbName : this.database
    let fields = ''
    let values = ''
    for (const [key, value] of Object.entries(data)) {
        fields += key + ','
        values += value + ','
    }
    // console.log(`INSERT INTO ${dbN}.${tableName} (${fields.slice(0,-1)}) VALUES (${values.slice(0,-1)})` )
    return this.sendRequest(`INSERT INTO ${dbN}.${tableName} (${fields.slice(0,-1)}) VALUES (${values.slice(0,-1)})`)
   }
   selectData(tableName,fields=null,where=null,limit =null,offset = null,desc =null,dbName=null){
    let dbN = dbName ? dbName : this.database
    let sqlStr = 'SELECT '
    let fieldStr= '*'
    if(fields && fields.length>0){
        fieldStr= ''
        fields.forEach(function(field){
            fieldStr += field + ','
        });
        fieldStr = fieldStr.slice(0,-1)
    }
    sqlStr += fieldStr + ` FROM ${dbN}.${tableName} `
    if(where){
        sqlStr +=` WHERE ${where} `
    }
    if(desc != null){
        sqlStr +=` ORDER BY ${desc} DESC `
    }
    if(limit != null){
        sqlStr +=` LIMIT ${limit} `
    }
    if(offset != null){
        sqlStr +=` OFFSET ${offset} `
    }
    
    // console.log(sqlStr)
    return this.sendRequest(sqlStr)

   }
   rawSql(sqlStr){
    return this.sendRequest(sqlStr)
   }
}

