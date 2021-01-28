
//存储数据在本地

module.exports = {

    getLinks() {
        let links = localStorage.getItem('links');
        links = links? JSON.parse(links) : [];
        return links
    },

    setLinks(links) {
        links = JSON.stringify(links); //将json数据转换为字符串存储
        return localStorage.setItem('links', links);
    },

    getTheLink() {
        return localStorage.getItem('theLink')? JSON.parse(theLink) : {};
    },

    setTheLink(theLink) {
        //保存一个连接，如果本地就存了，更新，没存新增
        let links = this.getLinks()
        for(let i=0; i<links.length;i++){
            if(theLink.host == links[i].host && theLink.port == links[i].port){
                //更新
                links[i] = theLink
                return this.setLinks(links)
            }
        }
        //新增
        links.push(theLink)       
        return this.setLinks(links)
    },

    // addLink(name,host,port,data) {
    //     //如果本地存了，就更新数据，没存就添加数据
    //     let newLink = {
    //         name: name,
    //         host: host,
    //         port: port,
    //         dbs: data
    //     }
    //     for(let link in this.getLinks()){
    //         if(host == link.host && port == link.port){
    //             //更新
    //             link = newLink
    //         }
    //         return this.setLinks()
    //     }
    //     //新增
    //     this.links = [...this.links, newLink]
    //     this.theLink = newLink
    //     return this.setLinks()
    // }
}