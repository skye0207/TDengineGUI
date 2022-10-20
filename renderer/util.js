module.exports = {
    //convert api response to 2.0 data structure
    convertToStandardFormat(res) {
        try {
            if (res.data) {
                let head = []
                let resData = []
                if (res.data&& res.data.code === 0) {//3.0
                    head = res.data.column_meta.map(item => {
                        return item[0]
                    })
                } else if (res.data && res.data.status === 'succ') {//2.x
                    head = res.data.head
                } else {
                    return { 'res': false, 'msg': res.data.desc, 'code': res.data.code }
                }

                resData = res.data.data.map(item => Object.fromEntries(head.map((a, b) => [a, item[b]])))
                return { 'res': true, 'count': res.data.rows, 'data': resData }
            }

        } catch (error) {
            throw new Error('数据转换失败')
        }

    }
}