const { default: axios } = require("axios");
const fs = require('node:fs');

const callAllPages = async (address, allFollowers = []) => {
    const response = await axios.get(address)
    const newFollowers = response.data
    const nextAddress = /<(\S*)>; rel="next",/.exec(response.headers.link)?.[1];
    const combinedFollowers = [
        ...allFollowers,
        ...newFollowers
    ];

    if(!nextAddress){
        return combinedFollowers;
    }
    return await callAllPages(nextAddress, combinedFollowers)
}

const getNonMutualLinks = (nonMutuals) =>{
    const nonMutualsWithLink = nonMutuals.map(person => ({link: `https://mastodon.social/@${person.acct}`, acct:person.acct}));
    let whiteList = getWhiteList();
    const nonMutualsWithoutWhiteList = nonMutualsWithLink.filter(({link}) => !whiteList.some(listItem => listItem === link))
    
    const links = nonMutualsWithoutWhiteList.map(({link, acct}) => `<li><a href="${link}">${acct}</a>`)
    return links
}

const getWhiteList = () => fs.readFileSync("./whitelist.txt", 'utf8').split(/\r?\n|\r|\n/g).filter(Boolean)

const buildPage = (links) => {
    const pageStart = "<html><ul>"
    const pageEnd = "</ul></html>"
    const pageHtml = pageStart+links+pageEnd;
    return pageHtml
}

const doIt = async () => {
    const followers = await callAllPages("https://mastodon.social/api/v1/accounts/112156626614796336/followers?limit=80")
    const followerIds = followers.map(person => person.id);
    const following = await callAllPages("https://mastodon.social/api/v1/accounts/112156626614796336/following?limit=80")
    
    const nonMutuals = following.filter(account => !followerIds.some(id => id === account.id));
    const links = getNonMutualLinks(nonMutuals)

    const pageHtml = buildPage(links)
    fs.writeFileSync("links.html", pageHtml)
}

doIt()