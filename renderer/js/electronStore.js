//持久化存储
const Store = require('electron-store');

let store = new Store();

const getLinks = () => {
    let links = store.get("links");
    links = links ? links : []
    return links;
}

const setLinks = (links) => {
    return store.set("links", links);
}

const deleteALink = (key) => {
    let links = getLinks();
    links.splice(key, 1)
    return setLinks(links)
}

const addALink = (link) => {
    //添加一个连接，如果本地存了，就更新，没存新增
    let links = getLinks()
    for (let i = 0; i < links.length; i++) {
        if (link.host === links[i].host && link.port === links[i].port) {
            //更新
            links[i] = link
            return setLinks(links)
        }
    }
    //新增
    links.push(link)
    return setLinks(links)
}

Vue.prototype.$electronStore = {
    getLinks,
    setLinks,
    deleteALink,
    addALink
};
