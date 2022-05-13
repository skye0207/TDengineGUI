
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
    deleteALink(key) {
        let links = this.getLinks()
        links.splice(key,1)
        return this.setLinks(links)
    },

    AddALink(theLink) {
        //添加一个连接，如果本地就存了，更新，没存新增
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
    }
}