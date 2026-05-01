var $8Nr7K$axios = require("axios");
var $8Nr7K$cryptojs = require("crypto-js");
var $8Nr7K$qs = require("qs");
var $8Nr7K$biginteger = require("big-integer");
var $8Nr7K$dayjs = require("dayjs");
var $8Nr7K$cheerio = require("cheerio");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "default", () => $69c13ef3ab1c1f3e$export$2e2bcd8739ae039);

function $69c13ef3ab1c1f3e$var$create_key() {
    var d, e, b = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", c = "";
    for(d = 0; 16 > d; d += 1)e = Math.random() * b.length, e = Math.floor(e), c += b.charAt(e);
    return c;
}
function $69c13ef3ab1c1f3e$var$AES(a, b) {
    var c = (0, ($parcel$interopDefault($8Nr7K$cryptojs))).enc.Utf8.parse(b), d = (0, ($parcel$interopDefault($8Nr7K$cryptojs))).enc.Utf8.parse("0102030405060708"), e = (0, ($parcel$interopDefault($8Nr7K$cryptojs))).enc.Utf8.parse(a), f = (0, ($parcel$interopDefault($8Nr7K$cryptojs))).AES.encrypt(e, c, {
        iv: d,
        mode: (0, ($parcel$interopDefault($8Nr7K$cryptojs))).mode.CBC
    });
    return f.toString();
}
function $69c13ef3ab1c1f3e$var$Rsa(text) {
    text = text.split("").reverse().join("");
    const d = "010001";
    const e = "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7";
    const hexText = text.split("").map((_)=>_.charCodeAt(0).toString(16)).join("");
    const res = (0, ($parcel$interopDefault($8Nr7K$biginteger)))(hexText, 16).modPow((0, ($parcel$interopDefault($8Nr7K$biginteger)))(d, 16), (0, ($parcel$interopDefault($8Nr7K$biginteger)))(e, 16)).toString(16);
    return Array(256 - res.length).fill("0").join("").concat(res);
}
function $69c13ef3ab1c1f3e$var$getParamsAndEnc(text) {
    const first = $69c13ef3ab1c1f3e$var$AES(text, "0CoJUm6Qyw8W8jud");
    const rand = $69c13ef3ab1c1f3e$var$create_key();
    const params = $69c13ef3ab1c1f3e$var$AES(first, rand);
    const encSecKey = $69c13ef3ab1c1f3e$var$Rsa(rand);
    return {
        params: params,
        encSecKey: encSecKey
    };
}
function $69c13ef3ab1c1f3e$var$formatMusicItem(_) {
    var _a, _b, _c, _d;
    const album = _.al || _.album;
    return {
        id: _.id,
        artwork: album === null || album === void 0 ? void 0 : album.picUrl,
        title: _.name,
        artist: (_.ar || _.artists)[0].name,
        album: album === null || album === void 0 ? void 0 : album.name,
        url: `https://share.duanx.cn/url/wy/${_.id}/128k`,
        qualities: {
            low: {
                size: (_a = _.l || {}) === null || _a === void 0 ? void 0 : _a.size
            },
            standard: {
                size: (_b = _.m || {}) === null || _b === void 0 ? void 0 : _b.size
            },
            high: {
                size: (_c = _.h || {}) === null || _c === void 0 ? void 0 : _c.size
            },
            super: {
                size: (_d = _.sq || {}) === null || _d === void 0 ? void 0 : _d.size
            }
        },
        copyrightId: _ === null || _ === void 0 ? void 0 : _.copyrightId
    };
}
function $69c13ef3ab1c1f3e$var$formatAlbumItem(_) {
    return {
        id: _.id,
        artist: _.artist.name,
        title: _.name,
        artwork: _.picUrl,
        description: "",
        date: (0, ($parcel$interopDefault($8Nr7K$dayjs))).unix(_.publishTime / 1000).format("YYYY-MM-DD")
    };
}
const $69c13ef3ab1c1f3e$var$pageSize = 30;
async function $69c13ef3ab1c1f3e$var$searchBase(query, page, type) {
    const data = {
        s: query,
        limit: $69c13ef3ab1c1f3e$var$pageSize,
        type: type,
        offset: (page - 1) * $69c13ef3ab1c1f3e$var$pageSize,
        csrf_token: ""
    };
    const pae = $69c13ef3ab1c1f3e$var$getParamsAndEnc(JSON.stringify(data));
    const paeData = (0, ($parcel$interopDefault($8Nr7K$qs))).stringify(pae);
    const headers = {
        authority: "music.163.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "content-type": "application/x-www-form-urlencoded",
        accept: "*/*",
        origin: "https://music.163.com",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://music.163.com/search/",
        "accept-language": "zh-CN,zh;q=0.9"
    };
    const res = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
        method: "post",
        url: "https://music.163.com/weapi/search/get",
        headers: headers,
        data: paeData
    })).data;
    return res;
}
async function $69c13ef3ab1c1f3e$var$searchMusic(query, page) {
    const res = await $69c13ef3ab1c1f3e$var$searchBase(query, page, 1);
    const songs = res.result.songs.map($69c13ef3ab1c1f3e$var$formatMusicItem);
    return {
        isEnd: res.result.songCount <= page * $69c13ef3ab1c1f3e$var$pageSize,
        data: songs
    };
}
async function $69c13ef3ab1c1f3e$var$searchAlbum(query, page) {
    const res = await $69c13ef3ab1c1f3e$var$searchBase(query, page, 10);
    const albums = res.result.albums.map($69c13ef3ab1c1f3e$var$formatAlbumItem);
    return {
        isEnd: res.result.albumCount <= page * $69c13ef3ab1c1f3e$var$pageSize,
        data: albums
    };
}
async function $69c13ef3ab1c1f3e$var$searchArtist(query, page) {
    const res = await $69c13ef3ab1c1f3e$var$searchBase(query, page, 100);
    const artists = res.result.artists.map((_)=>({
            name: _.name,
            id: _.id,
            avatar: _.img1v1Url,
            worksNum: _.albumSize
        }));
    return {
        isEnd: res.result.artistCount <= page * $69c13ef3ab1c1f3e$var$pageSize,
        data: artists
    };
}
async function $69c13ef3ab1c1f3e$var$searchMusicSheet(query, page) {
    const res = await $69c13ef3ab1c1f3e$var$searchBase(query, page, 1000);
    const playlists = res.result.playlists.map((_)=>{
        var _a;
        return {
            title: _.name,
            id: _.id,
            coverImg: _.coverImgUrl,
            artist: (_a = _.creator) === null || _a === void 0 ? void 0 : _a.nickname,
            playCount: _.playCount,
            worksNum: _.trackCount
        };
    });
    return {
        isEnd: res.result.playlistCount <= page * $69c13ef3ab1c1f3e$var$pageSize,
        data: playlists
    };
}
async function $69c13ef3ab1c1f3e$var$searchLyric(query, page) {
    var _a, _b;
    const res = await $69c13ef3ab1c1f3e$var$searchBase(query, page, 1006);
    const lyrics = (_b = (_a = res.result.songs) === null || _a === void 0 ? void 0 : _a.map((it)=>{
        var _a, _b, _c, _d;
        return {
            title: it.name,
            artist: (_a = it.ar) === null || _a === void 0 ? void 0 : _a.map((_)=>_.name).join(", "),
            id: it.id,
            artwork: (_b = it.al) === null || _b === void 0 ? void 0 : _b.picUrl,
            album: (_c = it.al) === null || _c === void 0 ? void 0 : _c.name,
            rawLrcTxt: (_d = it.lyrics) === null || _d === void 0 ? void 0 : _d.join("\n")
        };
    })) !== null && _b !== void 0 ? _b : [];
    return {
        isEnd: res.result.songCount <= page * $69c13ef3ab1c1f3e$var$pageSize,
        data: lyrics
    };
}
async function $69c13ef3ab1c1f3e$var$getArtistWorks(artistItem, page, type) {
    const data = {
        csrf_token: ""
    };
    const pae = $69c13ef3ab1c1f3e$var$getParamsAndEnc(JSON.stringify(data));
    const paeData = (0, ($parcel$interopDefault($8Nr7K$qs))).stringify(pae);
    const headers = {
        authority: "music.163.com",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "content-type": "application/x-www-form-urlencoded",
        accept: "*/*",
        origin: "https://music.163.com",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://music.163.com/search/",
        "accept-language": "zh-CN,zh;q=0.9"
    };
    if (type === "music") {
        const res = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
            method: "post",
            url: `https://music.163.com/weapi/v1/artist/${artistItem.id}?csrf_token=`,
            headers: headers,
            data: paeData
        })).data;
        return {
            isEnd: true,
            data: res.hotSongs.map($69c13ef3ab1c1f3e$var$formatMusicItem)
        };
    } else if (type === "album") {
        const res = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
            method: "post",
            url: `https://music.163.com/weapi/artist/albums/${artistItem.id}?csrf_token=`,
            headers: headers,
            data: paeData
        })).data;
        return {
            isEnd: true,
            data: res.hotAlbums.map($69c13ef3ab1c1f3e$var$formatAlbumItem)
        };
    }
}
async function $69c13ef3ab1c1f3e$var$getTopListDetail(topListItem) {
    const musicList = await $69c13ef3ab1c1f3e$var$getSheetMusicById(topListItem.id);
    return Object.assign(Object.assign({}, topListItem), {
        musicList: musicList
    });
}
async function $69c13ef3ab1c1f3e$var$getLyric(musicItem) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded"
    };
    const data = {
        id: musicItem.id,
        lv: -1,
        tv: -1,
        csrf_token: ""
    };
    const pae = $69c13ef3ab1c1f3e$var$getParamsAndEnc(JSON.stringify(data));
    const paeData = (0, ($parcel$interopDefault($8Nr7K$qs))).stringify(pae);
    const result = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
        method: "post",
        url: `https://interface.music.163.com/weapi/song/lyric?csrf_token=`,
        headers: headers,
        data: paeData
    })).data;
    return {
        rawLrc: result.lrc.lyric
    };
}
async function $69c13ef3ab1c1f3e$var$getMusicInfo(musicItem) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded"
    };
    const data = {
        id: musicItem.id,
        ids: `[${musicItem.id}]`
    };
    const result = (await (0, ($parcel$interopDefault($8Nr7K$axios))).get("http://music.163.com/api/song/detail", {
        headers: headers,
        params: data
    })).data;
    return {
        artwork: result.songs[0].album.picUrl
    };
}
async function $69c13ef3ab1c1f3e$var$getAlbumInfo(albumItem) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded"
    };
    const data = {
        resourceType: 3,
        resourceId: albumItem.id,
        limit: 15,
        csrf_token: ""
    };
    const pae = $69c13ef3ab1c1f3e$var$getParamsAndEnc(JSON.stringify(data));
    const paeData = (0, ($parcel$interopDefault($8Nr7K$qs))).stringify(pae);
    const res = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
        method: "post",
        url: `https://interface.music.163.com/weapi/v1/album/${albumItem.id}?csrf_token=`,
        headers: headers,
        data: paeData
    })).data;
    return {
        albumItem: {
            description: res.album.description
        },
        musicList: (res.songs || []).map($69c13ef3ab1c1f3e$var$formatMusicItem)
    };
}
async function $69c13ef3ab1c1f3e$var$getValidMusicItems(trackIds) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded"
    };
    try {
        const res = (await (0, ($parcel$interopDefault($8Nr7K$axios))).get(`https://music.163.com/api/song/detail/?ids=[${trackIds.join(",")}]`, {
            headers: headers
        })).data;
        const validMusicItems = res.songs.map($69c13ef3ab1c1f3e$var$formatMusicItem);
        return validMusicItems;
    } catch (e) {
        console.error(e);
        return [];
    }
}
async function $69c13ef3ab1c1f3e$var$getSheetMusicById(id) {
    const headers = {
        Referer: "https://y.music.163.com/",
        Origin: "https://y.music.163.com/",
        authority: "music.163.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36"
    };
    const sheetDetail = (await (0, ($parcel$interopDefault($8Nr7K$axios))).get(`https://music.163.com/api/v3/playlist/detail?id=${id}&n=5000`, {
        headers: headers
    })).data;
    const trackIds = sheetDetail.playlist.trackIds.map((_)=>_.id);
    let result = [];
    let idx = 0;
    while(idx * 200 < trackIds.length){
        const res = await $69c13ef3ab1c1f3e$var$getValidMusicItems(trackIds.slice(idx * 200, (idx + 1) * 200));
        result = result.concat(res);
        ++idx;
    }
    return result;
}
async function $69c13ef3ab1c1f3e$var$importMusicSheet(urlLike) {
    const matchResult = urlLike.match(/(?:https:\/\/y\.music\.163.com\/m\/playlist\?id=([0-9]+))|(?:https?:\/\/music\.163\.com\/playlist\/([0-9]+)\/.*)|(?:https?:\/\/music.163.com(?:\/#)?\/playlist\?id=(\d+))|(?:^\s*(\d+)\s*$)/);
    const id = matchResult[1] || matchResult[2] || matchResult[3] || matchResult[4];
    return $69c13ef3ab1c1f3e$var$getSheetMusicById(id);
}
async function $69c13ef3ab1c1f3e$var$getTopLists() {
    const res = await (0, ($parcel$interopDefault($8Nr7K$axios))).get("https://music.163.com/discover/toplist", {
        headers: {
            referer: "https://music.163.com/",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54"
        }
    });
    const $ = $8Nr7K$cheerio.load(res.data);
    const children = $(".n-minelst").children();
    const groups = [];
    let currentGroup = {
        title: undefined,
        data: []
    };
    for (let c of children){
        if (c.tagName == "h2") {
            if (currentGroup.title) groups.push(currentGroup);
            currentGroup = {
                title: undefined,
                data: []
            };
            currentGroup.title = $(c).text();
            currentGroup.data = [];
        } else if (c.tagName === "ul") {
            let sections = $(c).children();
            currentGroup.data = sections.map((index, element)=>{
                const ele = $(element);
                const id = ele.attr("data-res-id");
                const coverImg = ele.find("img").attr("src").replace(/(\.jpg\?).*/, ".jpg?param=800y800");
                const title = ele.find("p.name").text();
                const description = ele.find("p.s-fc4").text();
                return {
                    id: id,
                    coverImg: coverImg,
                    title: title,
                    description: description
                };
            }).toArray();
        }
    }
    if (currentGroup.title) groups.push(currentGroup);
    return groups;
}

const $69c13ef3ab1c1f3e$var$API_URL = 'https://88.lxmusic.xn--fiqs8s';
const $69c13ef3ab1c1f3e$var$SECRET_KEY = 'JaJ?a7Nwk_Fgj?2o:znAkst';
const $69c13ef3ab1c1f3e$var$SCRIPT_MD5 = '1888f9865338afe6d5534b35171c61a4';

function $69c13ef3ab1c1f3e$var$sha256(message) {
    const ERROR = 'input is invalid type';
    const ARRAY_BUFFER = typeof ArrayBuffer !== 'undefined';
    const HEX_CHARS = '0123456789abcdef'.split('');
    const EXTRA = [-2147483648, 8388608, 32768, 128];
    const SHIFT = [24, 16, 8, 0];
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const blocks = [];

    function Sha256(sharedMemory) {
        if (sharedMemory) {
            blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
            blocks[4] = blocks[5] = blocks[6] = blocks[7] =
            blocks[8] = blocks[9] = blocks[10] = blocks[11] =
            blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            this.blocks = blocks;
        } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        this.h0 = 0x6a09e667;
        this.h1 = 0xbb67ae85;
        this.h2 = 0x3c6ef372;
        this.h3 = 0xa54ff53a;
        this.h4 = 0x510e527f;
        this.h5 = 0x9b05688c;
        this.h6 = 0x1f83d9ab;
        this.h7 = 0x5be0cd19;
        this.block = this.start = this.bytes = this.hBytes = 0;
        this.finalized = this.hashed = false;
        this.first = true;
    }

    Sha256.prototype.update = function(message) {
        if (this.finalized) {
            return;
        }
        var notString, type = typeof message;
        if (type !== 'string') {
            if (type === 'object') {
                if (message === null) {
                    throw new Error(ERROR);
                } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
                    message = new Uint8Array(message);
                } else if (!Array.isArray(message)) {
                    if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                        throw new Error(ERROR);
                    }
                }
            } else {
                throw new Error(ERROR);
            }
            notString = true;
        }
        var code, index = 0, i, length = message.length, blocks = this.blocks;

        while (index < length) {
            if (this.hashed) {
                this.hashed = false;
                blocks[0] = this.block;
                blocks[16] = blocks[1] = blocks[2] = blocks[3] =
                blocks[4] = blocks[5] = blocks[6] = blocks[7] =
                blocks[8] = blocks[9] = blocks[10] = blocks[11] =
                blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
            }

            if (notString) {
                for (i = this.start; index < length && i < 64; ++index) {
                    blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
                }
            } else {
                for (i = this.start; index < length && i < 64; ++index) {
                    code = message.charCodeAt(index);
                    if (code < 0x80) {
                        blocks[i >> 2] |= code << SHIFT[i++ & 3];
                    } else if (code < 0x800) {
                        blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    } else if (code < 0xd800 || code >= 0xe000) {
                        blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    } else {
                        code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
                        blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
                        blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                    }
                }
            }

            this.lastByteIndex = i;
            this.bytes += i - this.start;
            if (i >= 64) {
                this.block = blocks[16];
                this.start = i - 64;
                this.hash();
                this.hashed = true;
            } else {
                this.start = i;
            }
        }
        if (this.bytes > 4294967295) {
            this.hBytes += this.bytes / 4294967296 << 0;
            this.bytes = this.bytes % 4294967296;
        }
        return this;
    };

    Sha256.prototype.finalize = function() {
        if (this.finalized) {
            return;
        }
        this.finalized = true;
        var blocks = this.blocks, i = this.lastByteIndex;
        blocks[16] = this.block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.block = blocks[16];
        if (i >= 56) {
            if (!this.hashed) {
                this.hash();
            }
            blocks[0] = this.block;
            blocks[16] = blocks[1] = blocks[2] = blocks[3] =
            blocks[4] = blocks[5] = blocks[6] = blocks[7] =
            blocks[8] = blocks[9] = blocks[10] = blocks[11] =
            blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
        blocks[15] = this.bytes << 3;
        this.hash();
    };

    Sha256.prototype.hash = function() {
        var a = this.h0, b = this.h1, c = this.h2, d = this.h3,
            e = this.h4, f = this.h5, g = this.h6, h = this.h7,
            blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

        for (j = 16; j < 64; ++j) {
            t1 = blocks[j - 15];
            s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
            t1 = blocks[j - 2];
            s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
            blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
        }

        bc = b & c;
        for (j = 0; j < 64; j += 4) {
            if (this.first) {
                ab = 704751109;
                t1 = blocks[0] - 210244248;
                h = t1 - 1521486534 << 0;
                d = t1 + 143694565 << 0;
                this.first = false;
            } else {
                s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
                s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
                ab = a & b;
                maj = ab ^ (a & c) ^ bc;
                ch = (e & f) ^ (~e & g);
                t1 = h + s1 + ch + K[j] + blocks[j];
                t2 = s0 + maj;
                h = d + t1 << 0;
                d = t1 + t2 << 0;
            }
            s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
            s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
            da = d & a;
            maj = da ^ (d & b) ^ ab;
            ch = (h & e) ^ (~h & f);
            t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
            t2 = s0 + maj;
            g = c + t1 << 0;
            c = t1 + t2 << 0;
            s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
            s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
            cd = c & d;
            maj = cd ^ (c & a) ^ da;
            ch = (g & h) ^ (~g & e);
            t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
            t2 = s0 + maj;
            f = b + t1 << 0;
            b = t1 + t2 << 0;
            s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
            s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
            bc = b & c;
            maj = bc ^ (b & d) ^ cd;
            ch = (f & g) ^ (~f & h);
            t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
            t2 = s0 + maj;
            e = a + t1 << 0;
            a = t1 + t2 << 0;
        }

        this.h0 = this.h0 + a << 0;
        this.h1 = this.h1 + b << 0;
        this.h2 = this.h2 + c << 0;
        this.h3 = this.h3 + d << 0;
        this.h4 = this.h4 + e << 0;
        this.h5 = this.h5 + f << 0;
        this.h6 = this.h6 + g << 0;
        this.h7 = this.h7 + h << 0;
    };

    Sha256.prototype.hex = function() {
        this.finalize();
        var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3,
            h4 = this.h4, h5 = this.h5, h6 = this.h6, h7 = this.h7;
        return HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
            HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
            HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
            HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
            HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
            HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
            HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
            HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
            HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
            HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
            HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
            HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
            HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
            HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
            HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
            HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
            HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
            HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
            HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
            HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
            HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
            HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
            HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
            HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
            HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
            HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
            HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
            HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F] +
            HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
            HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
            HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
            HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    };

    return function(message) {
        return new Sha256(true).update(message).hex();
    };
}

function $69c13ef3ab1c1f3e$var$generateSign(requestPath) {
    const sha256Func = $69c13ef3ab1c1f3e$var$sha256();
    return sha256Func(requestPath + $69c13ef3ab1c1f3e$var$SCRIPT_MD5 + $69c13ef3ab1c1f3e$var$SECRET_KEY);
}

const $69c13ef3ab1c1f3e$var$qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "flac",
    super: "flac24bit"
};

async function $69c13ef3ab1c1f3e$var$getMediaSource(musicItem, quality) {
    try {
        const songId = musicItem.id;
        if (!songId) {
            return { url: "" };
        }

        const qualityMap = $69c13ef3ab1c1f3e$var$qualityLevels[quality] || "320k";
        const requestPath = `/lxmusicv4/url/wy/${songId}/${qualityMap}`;
        const sign = $69c13ef3ab1c1f3e$var$generateSign(requestPath);
        const url = `${$69c13ef3ab1c1f3e$var$API_URL}${requestPath}?sign=${sign}`;

        const response = await (0, ($parcel$interopDefault($8Nr7K$axios)))({
            method: 'GET',
            url: url,
            headers: {
                'accept': 'application/json',
                'x-request-key': 'lxmusic',
                'user-agent': 'lx-music-mobile/2.0.0'
            },
            timeout: 10000
        });

        const data = response.data;

        if (data && (data.code === 0 || data.code === 200)) {
            const musicUrl = data.data || data.url;
            if (musicUrl) {
                return { url: musicUrl };
            }
        }

        return { url: "" };
        
    } catch (error) {
        console.error('获取音乐源失败:', error.message);
        return { url: "" };
    }
}

const $69c13ef3ab1c1f3e$var$headers = {
    authority: "music.163.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36",
    "content-type": "application/x-www-form-urlencoded",
    accept: "*/*",
    origin: "https://music.163.com",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    referer: "https://music.163.com/",
    "accept-language": "zh-CN,zh;q=0.9"
};
async function $69c13ef3ab1c1f3e$var$getRecommendSheetTags() {
    const data = {
        csrf_token: ""
    };
    const pae = $69c13ef3ab1c1f3e$var$getParamsAndEnc(JSON.stringify(data));
    const paeData = (0, ($parcel$interopDefault($8Nr7K$qs))).stringify(pae);
    const res = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
        method: "post",
        url: "https://music.163.com/weapi/playlist/catalogue",
        headers: $69c13ef3ab1c1f3e$var$headers,
        data: paeData
    })).data;
    const cats = res.categories;
    const map = {};
    const catData = Object.entries(cats).map((_)=>{
        const tagData = {
            title: _[1],
            data: []
        };
        map[_[0]] = tagData;
        return tagData;
    });
    let pinned = [];
    res.sub.forEach((tag)=>{
        const _tag = {
            id: tag.name,
            title: tag.name
        };
        if (tag.hot) pinned.push(_tag);
        map[tag.category].data.push(_tag);
    });
    return {
        pinned: pinned,
        data: catData
    };
}
async function $69c13ef3ab1c1f3e$var$getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    const data = {
        cat: tag.id || "全部",
        order: "hot",
        limit: pageSize,
        offset: (page - 1) * pageSize,
        total: true,
        csrf_token: ""
    };
    const pae = $69c13ef3ab1c1f3e$var$getParamsAndEnc(JSON.stringify(data));
    const paeData = (0, ($parcel$interopDefault($8Nr7K$qs))).stringify(pae);
    const res = (await (0, ($parcel$interopDefault($8Nr7K$axios)))({
        method: "post",
        url: "https://music.163.com/weapi/playlist/list",
        headers: $69c13ef3ab1c1f3e$var$headers,
        data: paeData
    })).data;
    const playLists = res.playlists.map((_)=>({
            id: _.id,
            artist: _.creator.nickname,
            title: _.name,
            artwork: _.coverImgUrl,
            playCount: _.playCount,
            createUserId: _.userId,
            createTime: _.createTime,
            description: _.description
        }));
    return {
        isEnd: !(res.more === true),
        data: playLists
    };
}
async function $69c13ef3ab1c1f3e$var$getMusicSheetInfo(sheet, page) {
    let trackIds = sheet._trackIds;
    if (!trackIds) {
        const id = sheet.id;
        const headers = {
            Referer: "https://y.music.163.com/",
            Origin: "https://y.music.163.com/",
            authority: "music.163.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36"
        };
        const sheetDetail = (await (0, ($parcel$interopDefault($8Nr7K$axios))).get(`https://music.163.com/api/v3/playlist/detail?id=${id}&n=5000`, {
            headers: headers
        })).data;
        trackIds = sheetDetail.playlist.trackIds.map((_)=>_.id);
    }
    const pageSize = 40;
    const currentPageIds = trackIds.slice((page - 1) * pageSize, page * pageSize);
    const res = await $69c13ef3ab1c1f3e$var$getValidMusicItems(currentPageIds);
    let extra = {};
    if (page <= 1) extra = {
        _trackIds: trackIds
    };
    return Object.assign({
        isEnd: trackIds.length <= page * pageSize,
        musicList: res
    }, extra);
}
async function $69c13ef3ab1c1f3e$var$search(query, page, type) {
    if (type === "music") return await $69c13ef3ab1c1f3e$var$searchMusic(query, page);
    if (type === "album") return await $69c13ef3ab1c1f3e$var$searchAlbum(query, page);
    if (type === "artist") return await $69c13ef3ab1c1f3e$var$searchArtist(query, page);
    if (type === "sheet") return await $69c13ef3ab1c1f3e$var$searchMusicSheet(query, page);
    if (type === "lyric") return await $69c13ef3ab1c1f3e$var$searchLyric(query, page);
}
const $69c13ef3ab1c1f3e$var$pluginInstance = {
    platform: "网易(独家音源)",
    author: "竹佀＆玥然OvO",
    version: "4",
    srcUrl: "https://raw.gitcode.com/Crystim/mfp/raw/main/%E7%BD%91%E6%98%93_%E7%AB%B9%E7%8E%A5.js",
    cacheControl: "no-store",
    hints: {
        importMusicSheet: [
            "网易云：APP点击分享，然后复制链接",
            "默认歌单无法导入，先新建一个空白歌单复制过去再导入新歌单即可"
        ],
        importMusicItem: []
    },
    supportedSearchType: [
        "music",
        "album",
        "sheet",
        "artist",
        "lyric"
    ],
    search: $69c13ef3ab1c1f3e$var$search,
    getMediaSource: $69c13ef3ab1c1f3e$var$getMediaSource,
    getMusicInfo: $69c13ef3ab1c1f3e$var$getMusicInfo,
    getAlbumInfo: $69c13ef3ab1c1f3e$var$getAlbumInfo,
    getLyric: $69c13ef3ab1c1f3e$var$getLyric,
    getArtistWorks: $69c13ef3ab1c1f3e$var$getArtistWorks,
    importMusicSheet: $69c13ef3ab1c1f3e$var$importMusicSheet,
    getTopLists: $69c13ef3ab1c1f3e$var$getTopLists,
    getTopListDetail: $69c13ef3ab1c1f3e$var$getTopListDetail,
    getRecommendSheetTags: $69c13ef3ab1c1f3e$var$getRecommendSheetTags,
    getMusicSheetInfo: $69c13ef3ab1c1f3e$var$getMusicSheetInfo,
    getRecommendSheetsByTag: $69c13ef3ab1c1f3e$var$getRecommendSheetsByTag
};

var $69c13ef3ab1c1f3e$export$2e2bcd8739ae039 = $69c13ef3ab1c1f3e$var$pluginInstance;


//# sourceMappingURL=xiaoyun.js.map