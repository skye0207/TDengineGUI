
//存储数据在本地
const sessionPasswords = new Map()

function linkKey(link) {
    const parts = [link.backend || 'tdengine', link.host, String(link.port)]
    if (link.backend === 'iotdb') parts.push(link.scheme, link.model, link.user)
    return JSON.stringify(parts)
}

module.exports = {
    linkKey,

    getLinks() {
        let links = localStorage.getItem('links');
        links = links? JSON.parse(links) : [];
        return links.map(link => link.backend === 'iotdb' && sessionPasswords.has(linkKey(link))
            ? { ...link, password: sessionPasswords.get(linkKey(link)) } : link)
    },

    setLinks(links) {
        links = JSON.stringify(links.map(link => {
            if (link.backend !== 'iotdb') return link
            const { password, dbs, ...profile } = link
            return profile
        }));
        return localStorage.setItem('links', links);
    },
    deleteALink(key) {
        let links = this.getLinks()
        if (links[key]) sessionPasswords.delete(linkKey(links[key]))
        links.splice(key,1)
        return this.setLinks(links)
    },

    AddALink(theLink) {
        //添加一个连接，如果本地就存了，更新，没存新增
        let links = this.getLinks()
        if (theLink.backend === 'iotdb') sessionPasswords.set(linkKey(theLink), theLink.password)
        for(let i=0; i<links.length;i++){
            if(linkKey(theLink) === linkKey(links[i])){
                //更新
                links[i] = theLink
                return this.setLinks(links)
            }
        }
        //新增
        links.push(theLink)       
        return this.setLinks(links)
    },
    rememberPassword(link, password) { sessionPasswords.set(linkKey(link), password) }
}
