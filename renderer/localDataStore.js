
//存储数据在本地

module.exports = {

    getLinks() {
        let links = localStorage.getItem('links');
        links = links? JSON.parse(links) : [];
        return links
    },

    setLinks(links) {
        links = JSON.stringify(links);
        return localStorage.setItem('links', links);
    },

    getTheLink() {
        return localStorage.getItem('theLink')? JSON.parse(theLink) : {};
    },

    setTheLink() {
        theLink = JSON.stringify(theLink);
        return localStorage.setItem('theLink', theLink);
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