var $fFvhi$axios = require("axios");

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
$parcel$export(module.exports, "default", () => $d25ff3d008f9e7e0$export$2e2bcd8739ae039);

const $d25ff3d008f9e7e0$var$pageSize = 20;

function $d25ff3d008f9e7e0$var$formatMusicItem(_) {
    var _a, _b, _c;
    const albumid = _.albumid || ((_a = _.album) === null || _a === void 0 ? void 0 : _a.id);
    const albummid = _.albummid || ((_b = _.album) === null || _b === void 0 ? void 0 : _b.mid);
    const albumname = _.albumname || ((_c = _.album) === null || _c === void 0 ? void 0 : _c.title);
    return {
        id: _.id || _.songid,
        songmid: _.mid || _.songmid,
        title: _.title || _.songname,
        artist: _.singer.map((s)=>s.name).join(", "),
        artwork: albummid ? `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albummid}.jpg` : undefined,
        album: albumname,
        lrc: _.lyric || undefined,
        albumid: albumid,
        albummid: albummid
    };
}

function $d25ff3d008f9e7e0$var$formatAlbumItem(_) {
    return {
        id: _.albumID || _.albumid,
        albumMID: _.albumMID || _.album_mid,
        title: _.albumName || _.album_name,
        artwork: _.albumPic || `https://y.gtimg.cn/music/photo_new/T002R800x800M000${_.albumMID || _.album_mid}.jpg`,
        date: _.publicTime || _.pub_time,
        singerID: _.singerID || _.singer_id,
        artist: _.singerName || _.singer_name,
        singerMID: _.singerMID || _.singer_mid,
        description: _.desc
    };
}

function $d25ff3d008f9e7e0$var$formatArtistItem(_) {
    return {
        name: _.singerName,
        id: _.singerID,
        singerMID: _.singerMID,
        avatar: _.singerPic,
        worksNum: _.songNum
    };
}

const $d25ff3d008f9e7e0$var$searchTypeMap = {
    0: "song",
    2: "album",
    1: "singer",
    3: "songlist",
    7: "song",
    12: "mv"
};

const $d25ff3d008f9e7e0$var$headers = {
    referer: "https://y.qq.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
    Cookie: "uin="
};

async function $d25ff3d008f9e7e0$var$searchBase(query, page, type) {
    const res = (await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: "https://u.y.qq.com/cgi-bin/musicu.fcg",
        method: "POST",
        data: {
            req_1: {
                method: "DoSearchForQQMusicDesktop",
                module: "music.search.SearchCgiService",
                param: {
                    num_per_page: $d25ff3d008f9e7e0$var$pageSize,
                    page_num: page,
                    query: query,
                    search_type: type
                }
            }
        },
        headers: $d25ff3d008f9e7e0$var$headers,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    return {
        isEnd: res.req_1.data.meta.sum <= page * $d25ff3d008f9e7e0$var$pageSize,
        data: res.req_1.data.body[$d25ff3d008f9e7e0$var$searchTypeMap[type]].list
    };
}

async function $d25ff3d008f9e7e0$var$searchMusic(query, page) {
    const songs = await $d25ff3d008f9e7e0$var$searchBase(query, page, 0);
    return {
        isEnd: songs.isEnd,
        data: songs.data.map($d25ff3d008f9e7e0$var$formatMusicItem)
    };
}

async function $d25ff3d008f9e7e0$var$searchAlbum(query, page) {
    const albums = await $d25ff3d008f9e7e0$var$searchBase(query, page, 2);
    return {
        isEnd: albums.isEnd,
        data: albums.data.map($d25ff3d008f9e7e0$var$formatAlbumItem)
    };
}

async function $d25ff3d008f9e7e0$var$searchArtist(query, page) {
    const artists = await $d25ff3d008f9e7e0$var$searchBase(query, page, 1);
    return {
        isEnd: artists.isEnd,
        data: artists.data.map($d25ff3d008f9e7e0$var$formatArtistItem)
    };
}

async function $d25ff3d008f9e7e0$var$searchMusicSheet(query, page) {
    const musicSheet = await $d25ff3d008f9e7e0$var$searchBase(query, page, 3);
    return {
        isEnd: musicSheet.isEnd,
        data: musicSheet.data.map((item)=>({
                title: item.dissname,
                createAt: item.createtime,
                description: item.introduction,
                playCount: item.listennum,
                worksNums: item.song_count,
                artwork: item.imgurl,
                id: item.dissid,
                artist: item.creator.name
            }))
    };
}

async function $d25ff3d008f9e7e0$var$searchLyric(query, page) {
    const songs = await $d25ff3d008f9e7e0$var$searchBase(query, page, 7);
    return {
        isEnd: songs.isEnd,
        data: songs.data.map((it)=>Object.assign(Object.assign({}, $d25ff3d008f9e7e0$var$formatMusicItem(it)), {
                rawLrcTxt: it.content
            }))
    };
}

function $d25ff3d008f9e7e0$var$getQueryFromUrl(key, search) {
    try {
        const sArr = search.split("?");
        let s = "";
        if (sArr.length > 1) s = sArr[1];
        else return key ? undefined : {};
        const querys = s.split("&");
        const result = {};
        querys.forEach((item)=>{
            const temp = item.split("=");
            result[temp[0]] = decodeURIComponent(temp[1]);
        });
        return key ? result[key] : result;
    } catch (err) {
        return key ? "" : {};
    }
}

function $d25ff3d008f9e7e0$var$changeUrlQuery(obj, baseUrl) {
    const query = $d25ff3d008f9e7e0$var$getQueryFromUrl(null, baseUrl);
    let url = baseUrl.split("?")[0];
    const newQuery = Object.assign(Object.assign({}, query), obj);
    let queryArr = [];
    Object.keys(newQuery).forEach((key)=>{
        if (newQuery[key] !== undefined && newQuery[key] !== "") queryArr.push(`${key}=${encodeURIComponent(newQuery[key])}`);
    });
    return `${url}?${queryArr.join("&")}`.replace(/\?$/, "");
}

async function $d25ff3d008f9e7e0$var$getAlbumInfo(albumItem) {
    const url = $d25ff3d008f9e7e0$var$changeUrlQuery({
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 10000
            },
            albumSonglist: {
                method: "GetAlbumSongList",
                param: {
                    albumMid: albumItem.albumMID,
                    albumID: 0,
                    begin: 0,
                    num: 999,
                    order: 2
                },
                module: "music.musichallAlbum.AlbumSongList"
            }
        })
    }, "https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8");
    const res = (await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: url,
        headers: $d25ff3d008f9e7e0$var$headers,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    return {
        musicList: res.albumSonglist.data.songList.map((item)=>{
            const _ = item.songInfo;
            return $d25ff3d008f9e7e0$var$formatMusicItem(_);
        })
    };
}

async function $d25ff3d008f9e7e0$var$getArtistSongs(artistItem, page) {
    const url = $d25ff3d008f9e7e0$var$changeUrlQuery({
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            singer: {
                method: "get_singer_detail_info",
                param: {
                    sort: 5,
                    singermid: artistItem.singerMID,
                    sin: (page - 1) * $d25ff3d008f9e7e0$var$pageSize,
                    num: $d25ff3d008f9e7e0$var$pageSize
                },
                module: "music.web_singer_info_svr"
            }
        })
    }, "http://u.y.qq.com/cgi-bin/musicu.fcg");
    const res = (await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: url,
        method: "get",
        headers: $d25ff3d008f9e7e0$var$headers,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    return {
        isEnd: res.singer.data.total_song <= page * $d25ff3d008f9e7e0$var$pageSize,
        data: res.singer.data.songlist.map($d25ff3d008f9e7e0$var$formatMusicItem)
    };
}

async function $d25ff3d008f9e7e0$var$getArtistAlbums(artistItem, page) {
    const url = $d25ff3d008f9e7e0$var$changeUrlQuery({
        data: JSON.stringify({
            comm: {
                ct: 24,
                cv: 0
            },
            singerAlbum: {
                method: "get_singer_album",
                param: {
                    singermid: artistItem.singerMID,
                    order: "time",
                    begin: (page - 1) * $d25ff3d008f9e7e0$var$pageSize,
                    num: $d25ff3d008f9e7e0$var$pageSize / 1,
                    exstatus: 1
                },
                module: "music.web_singer_info_svr"
            }
        })
    }, "http://u.y.qq.com/cgi-bin/musicu.fcg");
    const res = (await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: url,
        method: "get",
        headers: $d25ff3d008f9e7e0$var$headers,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    return {
        isEnd: res.singerAlbum.data.total <= page * $d25ff3d008f9e7e0$var$pageSize,
        data: res.singerAlbum.data.list.map($d25ff3d008f9e7e0$var$formatAlbumItem)
    };
}

async function $d25ff3d008f9e7e0$var$getArtistWorks(artistItem, page, type) {
    if (type === "music") return $d25ff3d008f9e7e0$var$getArtistSongs(artistItem, page);
    if (type === "album") return $d25ff3d008f9e7e0$var$getArtistAlbums(artistItem, page);
}

async function $d25ff3d008f9e7e0$var$getLyric(musicItem) {
    try {
        const response = await (0, ($parcel$interopDefault($fFvhi$axios)))({
            url: `https://yunzhiapi.cn/API/jhlrcgc.php?id=${musicItem.songmid}&msg=qq`,
            method: "get",
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        
        if (response.data && typeof response.data === 'string') {
            return {
                rawLrc: response.data,
                translation: ""
            };
        } else {
            return {
                rawLrc: "",
                translation: ""
            };
        }
    } catch (error) {
        return {
            rawLrc: "",
            translation: ""
        };
    }
}

async function $d25ff3d008f9e7e0$var$importMusicSheet(urlLike) {
    let id;
    if (!id) id = (urlLike.match(/https?:\/\/i\.y\.qq\.com\/n2\/m\/share\/details\/taoge\.html\?.*id=([0-9]+)/) || [])[1];
    if (!id) id = (urlLike.match(/https?:\/\/y\.qq\.com\/n\/ryqq\/playlist\/([0-9]+)/) || [])[1];
    if (!id) id = (urlLike.match(/^(\d+)$/) || [])[1];
    if (!id) return;
    const result = (await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: `http://i.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&utf8=1&disstid=${id}&loginUin=0`,
        headers: {
            Referer: "https://y.qq.com/n/yqq/playlist",
            Cookie: "uin="
        },
        method: "get",
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    const res = JSON.parse(result.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, ""));
    return res.cdlist[0].songlist.map($d25ff3d008f9e7e0$var$formatMusicItem);
}

async function $d25ff3d008f9e7e0$var$getTopLists() {
    const list = await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: "https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D",
        method: "get",
        headers: {
            Cookie: "uin="
        },
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    });
    return list.data.topList.data.group.map((e)=>({
            title: e.groupName,
            data: e.toplist.map((_)=>({
                    id: _.topId,
                    description: _.intro,
                    title: _.title,
                    period: _.period,
                    coverImg: _.headPicUrl || _.frontPicUrl
                }))
        }));
}

async function $d25ff3d008f9e7e0$var$getTopListDetail(topListItem) {
    var _a;
    const res = await (0, ($parcel$interopDefault($fFvhi$axios)))({
        url: `https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&data=%7B%22detail%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetDetail%22%2C%22param%22%3A%7B%22topId%22%3A${topListItem.id}%2C%22offset%22%3A0%2C%22num%22%3A100%2C%22period%22%3A%22${(_a = topListItem.period) !== null && _a !== void 0 ? _a : ""}%22%7D%7D%2C%22comm%22%3A%7B%22ct%22%3A24%2C%22cv%22%3A0%7D%7D`,
        method: "get",
        headers: {
            Cookie: "uin="
        },
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    });
    return Object.assign(Object.assign({}, topListItem), {
        musicList: res.data.detail.data.songInfoList.map($d25ff3d008f9e7e0$var$formatMusicItem)
    });
}

async function $d25ff3d008f9e7e0$var$getRecommendSheetTags() {
    const res = (await (0, ($parcel$interopDefault($fFvhi$axios))).get("https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg?format=json&inCharset=utf8&outCharset=utf-8", {
        headers: {
            referer: "https://y.qq.com/"
        }
    })).data.data.categories;
    const data = res.slice(1).map((_)=>({
            title: _.categoryGroupName,
            data: _.items.map((tag)=>({
                    id: tag.categoryId,
                    title: tag.categoryName
                }))
        }));
    const pinned = [];
    for (let d of data)if (d.data.length) pinned.push(d.data[0]);
    return {
        pinned: pinned,
        data: data
    };
}

async function $d25ff3d008f9e7e0$var$getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    const rawRes = (await (0, ($parcel$interopDefault($fFvhi$axios))).get("https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg", {
        headers: {
            referer: "https://y.qq.com/"
        },
        params: {
            inCharset: "utf8",
            outCharset: "utf-8",
            sortId: 5,
            categoryId: (tag === null || tag === void 0 ? void 0 : tag.id) || "10000000",
            sin: pageSize * (page - 1),
            ein: page * pageSize - 1
        }
    })).data;
    const res = JSON.parse(rawRes.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, "")).data;
    const isEnd = res.sum <= page * pageSize;
    const data = res.list.map((item)=>{
        var _a, _b;
        return {
            id: item.dissid,
            createTime: item.createTime,
            title: item.dissname,
            artwork: item.imgurl,
            description: item.introduction,
            playCount: item.listennum,
            artist: (_b = (_a = item.creator) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : ""
        };
    });
    return {
        isEnd: isEnd,
        data: data
    };
}

async function $d25ff3d008f9e7e0$var$getMusicSheetInfo(sheet, page) {
    const data = await $d25ff3d008f9e7e0$var$importMusicSheet(sheet.id);
    return {
        isEnd: true,
        musicList: data
    };
}

const $d25ff3d008f9e7e0$var$qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "flac",
    super: "flac24bit"
};

const $d25ff3d008f9e7e0$var$sha256 = (function() {
    var ERROR = 'input is invalid type';
    var ARRAY_BUFFER = typeof ArrayBuffer !== 'undefined';
    var HEX_CHARS = '0123456789abcdef'.split('');
    var EXTRA = [-2147483648, 8388608, 32768, 128];
    var SHIFT = [24, 16, 8, 0];
    var K = [
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
    var blocks = [];

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
})();

const $d25ff3d008f9e7e0$var$API_URL = 'https://88.lxmusic.xn--fiqs8s';
const $d25ff3d008f9e7e0$var$SCRIPT_MD5 = '1888f9865338afe6d5534b35171c61a4';
const $d25ff3d008f9e7e0$var$SECRET_KEY = 'JaJ?a7Nwk_Fgj?2o:znAkst';

const $d25ff3d008f9e7e0$var$txQualityMap = {
    "128k": "128k",
    "320k": "320k",
    "flac": "flac",
    "flac24bit": "flac24bit"
};

function $d25ff3d008f9e7e0$var$generateSign(requestPath) {
    return $d25ff3d008f9e7e0$var$sha256(requestPath + $d25ff3d008f9e7e0$var$SCRIPT_MD5 + $d25ff3d008f9e7e0$var$SECRET_KEY);
}

async function $d25ff3d008f9e7e0$var$getMediaSource(musicItem, quality) {
    try {
        const txQuality = $d25ff3d008f9e7e0$var$txQualityMap[$d25ff3d008f9e7e0$var$qualityLevels[quality]] || "320k";
        const requestPath = `/lxmusicv4/url/tx/${musicItem.songmid}/${txQuality}`;
        const url = $d25ff3d008f9e7e0$var$API_URL + requestPath + '?sign=' + $d25ff3d008f9e7e0$var$generateSign(requestPath);
        
        const response = await (0, ($parcel$interopDefault($fFvhi$axios)))({
            url: url,
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-request-key': 'lxmusic',
                'user-agent': 'lx-music-mobile/2.0.0'
            }
        });
        
        const data = response.data;
        
        if (data.code === 0 || data.code === 200) {
            const musicUrl = data.data || data.url;
            if (musicUrl) {
                return {
                    url: musicUrl
                };
            } else {
                throw new Error('响应中未找到有效的URL');
            }
        } else if (data.code === 403) {
            throw new Error('Key失效/鉴权失败');
        } else if (data.code === 429) {
            throw new Error('请求过速，请稍后再试');
        } else {
            throw new Error(data.msg || data.message || '未知错误');
        }
    } catch (error) {
        return {
            url: ''
        };
    }
}

async function $d25ff3d008f9e7e0$var$search(query, page, type) {
    if (type === "music") return await $d25ff3d008f9e7e0$var$searchMusic(query, page);
    if (type === "album") return await $d25ff3d008f9e7e0$var$searchAlbum(query, page);
    if (type === "artist") return await $d25ff3d008f9e7e0$var$searchArtist(query, page);
    if (type === "sheet") return await $d25ff3d008f9e7e0$var$searchMusicSheet(query, page);
    if (type === "lyric") return await $d25ff3d008f9e7e0$var$searchLyric(query, page);
}

const $d25ff3d008f9e7e0$var$pluginInstance = {
    platform: "QQ(独家音源)",
    author: "竹佀＆玥然OvO",
    version: "4",
    srcUrl: "https://raw.gitcode.com/Crystim/mfp/raw/main/QQ_%E7%AB%B9%E7%8E%A5.js",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "QQ音乐APP：自建歌单-分享-分享到微信好友/QQ好友；然后点开并复制链接，直接粘贴即可",
            "H5：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入时间和歌单大小有关，请耐心等待"
        ],
        importMusicItem: []
    },
    primaryKey: [
        "id",
        "songmid"
    ],
    supportedSearchType: [
        "music",
        "album",
        "sheet",
        "artist",
        "lyric"
    ],
    search: $d25ff3d008f9e7e0$var$search,
    getMediaSource: $d25ff3d008f9e7e0$var$getMediaSource,
    getLyric: $d25ff3d008f9e7e0$var$getLyric,
    getAlbumInfo: $d25ff3d008f9e7e0$var$getAlbumInfo,
    getArtistWorks: $d25ff3d008f9e7e0$var$getArtistWorks,
    importMusicSheet: $d25ff3d008f9e7e0$var$importMusicSheet,
    getTopLists: $d25ff3d008f9e7e0$var$getTopLists,
    getTopListDetail: $d25ff3d008f9e7e0$var$getTopListDetail,
    getRecommendSheetTags: $d25ff3d008f9e7e0$var$getRecommendSheetTags,
    getRecommendSheetsByTag: $d25ff3d008f9e7e0$var$getRecommendSheetsByTag,
    getMusicSheetInfo: $d25ff3d008f9e7e0$var$getMusicSheetInfo
};

var $d25ff3d008f9e7e0$export$2e2bcd8739ae039 = $d25ff3d008f9e7e0$var$pluginInstance;