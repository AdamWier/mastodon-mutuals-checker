const { default: axios } = require("axios");
const fs = require('node:fs');

const doIt = async () => {
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
    const followers = await callAllPages("https://mastodon.social/api/v1/accounts/112156626614796336/followers?limit=80")
    const followerIds = followers.map(person => person.id);
    const following = await callAllPages("https://mastodon.social/api/v1/accounts/112156626614796336/following?limit=80")
    console.log(following)
    const nonMutuals = following.filter(account => !followerIds.some(id => id === account.id));
    const links = nonMutuals.map(person => `<li><a href="https://mastodon.social/@${person.acct}">${person.acct}</a>`)
    const pageStart = "<html><ul>"
    const pageEnd = "</ul></html>"
    const pageHtml = pageStart+links+pageEnd;
    fs.writeFileSync("links.html", pageHtml)
}

doIt()