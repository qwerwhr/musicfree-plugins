const axios_1 = require("axios"),
    CryptoJs = require("crypto-js"),
    he_1 = require("he"),
    qs = require("qs");

let Config = {
    server: "https://adad23u.appinstall.life:2358",
    platform: "QQ音乐",
    key: "88452cf25c1ca5b",
};

let ZZ123Config = {
    headers: {
        "Content-Type": "application/json",
        Referer: "https://zz123.com/",
        "User-Agent":
            "MQQBrowser/26 Mozilla/5.0 (Linux; U; Android 2.3.7; zh-cn; MB200 Build/GRJ22; CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
    },
};

const pageSize = 20;

function formatYunMusicItem(musicItem) {
    return {
        id: musicItem.MUSICRID.replace(
            'MUSIC_',
            ""
        ),
        title: (0, he_1.decode)(
            musicItem.NAME || ""
        ),
        artist: (0, he_1.decode)(
            musicItem.ARTIST || ""
        ),
        isfree:
            musicItem?.payInfo?.listen_fragment !== "1",
    };
}

function formatMusicItem(musicItem) {
    var _a, _b, _c;
    const albumid =
        musicItem.albumid ||
        ((_a = musicItem.album) === null || _a === void 0 ? void 0 : _a.id);
    const albummid =
        musicItem.albummid ||
        ((_b = musicItem.album) === null || _b === void 0 ? void 0 : _b.mid);
    const albumname =
        musicItem.albumname ||
        ((_c = musicItem.album) === null || _c === void 0 ? void 0 : _c.title);
    return {
        id: musicItem.id || musicItem.songid,
        songmid: musicItem.mid || musicItem.songmid,
        title: musicItem.title || musicItem.songname,
        artist: musicItem.singer?.map((s) => s.name)?.join(", "),
        artwork: albummid
            ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albummid}.jpg`
            : undefined,
        album: albumname,
        lrc: musicItem.lyric || undefined,
        albumid: albumid,
        albummid: albummid,
        isfree: musicItem.pay.pay_play === 0 || musicItem.pay.payplay === 0,
    };
}

const chineseSel = (item) => {
    let res = [];
    const reg = /[\u4e00-\u9fa5]/g;
    return item && (res = item.match(reg)), res?.length ? res.join("") : "";
};

function formatAlbumItem(_) {
    return {
        id: _.albumID || _.albumid,
        albumMID: _.albumMID || _.album_mid,
        title: _.albumName || _.album_name,
        artwork:
            _.albumPic ||
            `https://y.gtimg.cn/music/photo_new/T002R300x300M000${_.albumMID || _.album_mid
            }.jpg`,
        date: _.publicTime || _.pub_time,
        singerID: _.singerID || _.singer_id,
        artist: _.singerName || _.singer_name,
        singerMID: _.singerMID || _.singer_mid,
        description: _.desc,
    };
}
function formatArtistItem(_) {
    return {
        name: _.singerName,
        id: _.singerID,
        singerMID: _.singerMID,
        avatar: _.singerPic,
        worksNum: _.songNum,
    };
}

const searchTypeMap = {
    0: "song",
    2: "album",
    1: "singer",
    3: "songlist",
    7: "song",
    12: "mv",
};

const headers = {
    referer: "https://y.qq.com",
    "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
    Cookie: "uin=",
};

const validSongFilter = () => {
    return true;
};

async function searchBase(query, page, type) {
    const res = (
        await (0, axios_1.default)({
            url: "https://u.y.qq.com/cgi-bin/musicu.fcg",
            method: "POST",
            data: {
                req_1: {
                    method: "DoSearchForQQMusicDesktop",
                    module: "music.search.SearchCgiService",
                    param: {
                        num_per_page: pageSize,
                        page_num: page,
                        query: query,
                        search_type: type,
                    },
                },
            },
            headers: headers,
            xsrfCookieName: "XSRF-TOKEN",
            withCredentials: true,
        })
    ).data;
    return {
        isEnd: res.req_1.data.meta.sum <= page * pageSize,
        data: res.req_1.data.body[searchTypeMap[type]].list,
    };
}

async function searchMusic(query, page) {
    const songs = await searchBase(query, page, 0);
    return {
        isEnd: songs.isEnd,
        data: songs.data.filter(validSongFilter).map(formatMusicItem),
    };
}
async function searchAlbum(query, page) {
    const albums = await searchBase(query, page, 2);
    return {
        isEnd: albums.isEnd,
        data: albums.data.map(formatAlbumItem),
    };
}
async function searchArtist(query, page) {
    const artists = await searchBase(query, page, 1);
    return {
        isEnd: artists.isEnd,
        data: artists.data.map(formatArtistItem),
    };
}
async function searchMusicSheet(query, page) {
    const musicSheet = await searchBase(query, page, 3);
    return {
        isEnd: musicSheet.isEnd,
        data: musicSheet.data.map((item) => ({
            title: item.dissname,
            createAt: item.createtime,
            description: item.introduction,
            playCount: item.listennum,
            worksNums: item.song_count,
            artwork: item.imgurl,
            id: item.dissid,
            artist: item.creator.name,
        })),
    };
}

async function searchLyric(query, page) {
    const songs = await searchBase(query, page, 7);
    return {
        isEnd: songs.isEnd,
        data: songs.data.map((it) =>
            Object.assign(Object.assign({}, formatMusicItem(it)), {
                rawLrcTxt: it.content,
            })
        ),
    };
}

function getQueryFromUrl(key, search) {
    try {
        const sArr = search.split("?");
        let s = "";
        if (sArr.length > 1) {
            s = sArr[1];
        } else {
            return key ? undefined : {};
        }
        const querys = s.split("&");
        const result = {};
        querys.forEach((item) => {
            const temp = item.split("=");
            result[temp[0]] = decodeURIComponent(temp[1]);
        });
        return key ? result[key] : result;
    } catch (err) {
        return key ? "" : {};
    }
}
function changeUrlQuery(obj, baseUrl) {
    const query = getQueryFromUrl(null, baseUrl);
    let url = baseUrl.split("?")[0];
    const newQuery = Object.assign(Object.assign({}, query), obj);
    let queryArr = [];
    Object.keys(newQuery).forEach((key) => {
        if (newQuery[key] !== undefined && newQuery[key] !== "") {
            queryArr.push(`${key}=${encodeURIComponent(newQuery[key])}`);
        }
    });
    return `${url}?${queryArr.join("&")}`.replace(/\?$/, "");
}
const typeMap = {
    128: { s: "M500", e: ".mp3" },
    320: { s: "M800", e: ".mp3" },
    m4a: { s: "C400", e: ".m4a" },
    ape: { s: "A000", e: ".ape" },
    flac: { s: "F000", e: ".flac" },
};

async function getSourceUrl(id, type = "128") {
    const mediaId = id;
    let uin = "";
    const guid = (Math.random() * 10000000).toFixed(0);
    const typeObj = typeMap[type];
    const file = `${typeObj.s}${id}${mediaId}${typeObj.e}`;
    const url = changeUrlQuery({
        "-": "getplaysongvkey",
        g_tk: 5381,
        loginUin: uin,
        hostUin: 0,
        format: "json",
        inCharset: "utf8",
        outCharset: "utf-8¬ice=0",
        platform: "yqq.json",
        needNewCode: 0,
        data: JSON.stringify({
            req_0: {
                module: "vkey.GetVkeyServer",
                method: "CgiGetVkey",
                param: {
                    filename: [file],
                    guid: guid,
                    songmid: [id],
                    songtype: [0],
                    uin: uin,
                    loginflag: 1,
                    platform: "20",
                },
            },
            comm: {
                uin: uin,
                format: "json",
                ct: 19,
                cv: 0,
                authst: "",
            },
        }),
    }, "https://u.y.qq.com/cgi-bin/musicu.fcg");
    return (await (0, axios_1.default)({
        method: "GET",
        url: url,
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    })).data;
}
async function getAlbumInfo(albumItem) {
    const url = changeUrlQuery(
        {
            data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 10000,
                },
                albumSonglist: {
                    method: "GetAlbumSongList",
                    param: {
                        albumMid: albumItem.albumMID,
                        albumID: 0,
                        begin: 0,
                        num: 999,
                        order: 2,
                    },
                    module: "music.musichallAlbum.AlbumSongList",
                },
            }),
        },
        "https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8"
    );
    const res = (
        await (0, axios_1.default)({
            url: url,
            headers: headers,
            xsrfCookieName: "XSRF-TOKEN",
            withCredentials: true,
        })
    ).data;
    return {
        musicList: res.albumSonglist.data.songList
            .filter((_) => validSongFilter(_.songInfo))
            .map((item) => {
                const _ = item.songInfo;
                return formatMusicItem(_);
            }),
    };
}
async function getArtistSongs(artistItem, page) {
    const url = changeUrlQuery(
        {
            data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 0,
                },
                singer: {
                    method: "get_singer_detail_info",
                    param: {
                        sort: 5,
                        singermid: artistItem.singerMID,
                        sin: (page - 1) * pageSize,
                        num: pageSize,
                    },
                    module: "music.web_singer_info_svr",
                },
            }),
        },
        "http://u.y.qq.com/cgi-bin/musicu.fcg"
    );
    const res = (
        await (0, axios_1.default)({
            url: url,
            method: "get",
            headers: headers,
            xsrfCookieName: "XSRF-TOKEN",
            withCredentials: true,
        })
    ).data;
    return {
        isEnd: res.singer.data.total_song <= page * pageSize,
        data: res.singer.data.songlist.filter(validSongFilter).map(formatMusicItem),
    };
}
async function getArtistAlbums(artistItem, page) {
    const url = changeUrlQuery(
        {
            data: JSON.stringify({
                comm: {
                    ct: 24,
                    cv: 0,
                },
                singerAlbum: {
                    method: "get_singer_album",
                    param: {
                        singermid: artistItem.singerMID,
                        order: "time",
                        begin: (page - 1) * pageSize,
                        num: pageSize / 1,
                        exstatus: 1,
                    },
                    module: "music.web_singer_info_svr",
                },
            }),
        },
        "http://u.y.qq.com/cgi-bin/musicu.fcg"
    );
    const res = (
        await (0, axios_1.default)({
            url,
            method: "get",
            headers: headers,
            xsrfCookieName: "XSRF-TOKEN",
            withCredentials: true,
        })
    ).data;
    return {
        isEnd: res.singerAlbum.data.total <= page * pageSize,
        data: res.singerAlbum.data.list.map(formatAlbumItem),
    };
}
async function getArtistWorks(artistItem, page, type) {
    if (type === "music") {
        return getArtistSongs(artistItem, page);
    }
    if (type === "album") {
        return getArtistAlbums(artistItem, page);
    }
}
async function getLyric(musicItem) {
    const result = (
        await (0, axios_1.default)({
            url: `http://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${musicItem.songmid
                }&pcachetime=${new Date().getTime()}&g_tk=5381&loginUin=0&hostUin=0&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`,
            headers: { Referer: "https://y.qq.com", Cookie: "uin=" },
            method: "get",
            xsrfCookieName: "XSRF-TOKEN",
            withCredentials: true,
        })
    ).data;
    const res = JSON.parse(
        result.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, "")
    );
    let translation;
    if (res.trans) {
        translation = he.decode(
            CryptoJs.enc.Base64.parse(res.trans).toString(CryptoJs.enc.Utf8)
        );
    }
    return {
        rawLrc: he.decode(
            CryptoJs.enc.Base64.parse(res.lyric).toString(CryptoJs.enc.Utf8)
        ),
        translation,
    };
}

async function importMusicSheet(urlLike) {
    let id;
    if (!id) {
        id = (urlLike.match(
            /https?:\/\/i\.y\.qq\.com\/n2\/m\/share\/details\/taoge\.html\?.*id=([0-9]+)/
        ) || [])[1];
    }
    if (!id) {
        id = (urlLike.match(/https?:\/\/y\.qq\.com\/n\/ryqq\/playlist\/([0-9]+)/) ||
            [])[1];
    }
    if (!id) {
        id = (urlLike.match(/^(\d+)$/) || [])[1];
    }
    if (!id) {
        return;
    }
    const result = (
        await (0, axios_1.default)({
            url: `http://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&utf8=1&disstid=${id}&loginUin=0`,
            headers: { Referer: "https://y.qq.com/n/yqq/playlist", Cookie: "uin=" },
            method: "get",
            xsrfCookieName: "XSRF-TOKEN",
            withCredentials: true,
        })
    ).data;
    const res = JSON.parse(
        result.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, "")
    );
    return res.cdlist[0].songlist.filter(validSongFilter).map(formatMusicItem);
}
async function getTopLists() {
    const list = await (0, axios_1.default)({
        url: "https://u.y.qq.com/cgi-bin/musicu.fcg?_=1577086820633&data=%7B%22comm%22%3A%7B%22g_tk%22%3A5381%2C%22uin%22%3A123456%2C%22format%22%3A%22json%22%2C%22inCharset%22%3A%22utf-8%22%2C%22outCharset%22%3A%22utf-8%22%2C%22notice%22%3A0%2C%22platform%22%3A%22h5%22%2C%22needNewCode%22%3A1%2C%22ct%22%3A23%2C%22cv%22%3A0%7D%2C%22topList%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D",
        method: "get",
        headers: {
            Cookie: "uin=",
        },
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    });
    return list.data.topList.data.group.map((e) => ({
        title: e.groupName,
        data: e.toplist.map((_) => ({
            id: _.topId,
            description: _.intro,
            title: _.title,
            period: _.period,
            coverImg: _.headPicUrl || _.frontPicUrl,
        })),
    }));
}
async function getTopListDetail(topListItem) {
    var _a;
    const res = await (0, axios_1.default)({
        url: `https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&data=%7B%22detail%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetDetail%22%2C%22param%22%3A%7B%22topId%22%3A${topListItem.id
            }%2C%22offset%22%3A0%2C%22num%22%3A100%2C%22period%22%3A%22${(_a = topListItem.period) !== null && _a !== void 0 ? _a : ""
            }%22%7D%7D%2C%22comm%22%3A%7B%22ct%22%3A24%2C%22cv%22%3A0%7D%7D`,
        method: "get",
        headers: {
            Cookie: "uin=",
        },
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true,
    });
    return Object.assign(Object.assign({}, topListItem), {
        musicList: res.data.detail.data.songInfoList
            .filter(validSongFilter)
            .map(formatMusicItem),
    });
}
async function getRecommendSheetTags() {
    const res = (
        await axios_1.default.get(
            "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg?format=json&inCharset=utf8&outCharset=utf-8",
            {
                headers: {
                    referer: "https://y.qq.com/",
                },
            }
        )
    ).data.data.categories;
    const data = res.slice(1).map((_) => ({
        title: _.categoryGroupName,
        data: _.items.map((tag) => ({
            id: tag.categoryId,
            title: tag.categoryName,
        })),
    }));
    const pinned = [];
    for (let d of data) {
        if (d.data.length) {
            pinned.push(d.data[0]);
        }
    }
    return {
        pinned,
        data,
    };
}


async function getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    const rawRes = (
        await axios_1.default.get(
            "https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg",
            {
                headers: {
                    referer: "https://y.qq.com/",
                },
                params: {
                    inCharset: "utf8",
                    outCharset: "utf-8",
                    sortId: 5,
                    categoryId:
                        (tag === null || tag === void 0 ? void 0 : tag.id) || "10000000",
                    sin: pageSize * (page - 1),
                    ein: page * pageSize - 1,
                },
            }
        )
    ).data;
    const res = JSON.parse(
        rawRes.replace(/callback\(|MusicJsonCallback\(|jsonCallback\(|\)$/g, "")
    ).data;
    const isEnd = res.sum <= page * pageSize;
    const data = res.list.map((item) => {
        var _a, _b;
        return {
            id: item.dissid,
            createTime: item.createTime,
            title: item.dissname,
            artwork: item.imgurl,
            description: item.introduction,
            playCount: item.listennum,
            artist:
                (_b =
                    (_a = item.creator) === null || _a === void 0 ? void 0 : _a.name) !==
                    null && _b !== void 0
                    ? _b
                    : "",
        };
    });
    return {
        isEnd,
        data,
    };
}
async function getMusicSheetInfo(sheet, page) {
    const data = await importMusicSheet(sheet.id);
    return {
        isEnd: true,
        musicList: data,
    };
}
async function getMusicKuWoSource(musicItem) {
    try {

        let time = Math.round(Date.now() / 1e3).toString(),
            keyStr = '88452cf25c1ca5b',
            hash = CryptoJs.MD5(
                musicItem.third_id + keyStr + time
            );
        const url =
            'https://sfuuc53rd.appinstall.life:8022/music/yun.php?flag=' +
            hash +
            'id=' +
            musicItem.third_id +
            '&tm=' +
            time,
            res = (
                await axios_1.default.get(
                    url
                )
            ).data;
        if (
            res.url !== ""
        ) {
            let params = {
                headers: {
                    "Content-Type": 'application/json',
                    Host: 'nmobi.kuwo.cn',
                    Referer: 'https://www.kuwo.cn/search/list?key=',
                },
            },
                res1 = (
                    await axios_1.default.get(
                        res.url,
                        params
                    )
                ).data,
                spIdx = res1.indexOf(
                    'url='
                ),
                str2 = res1.substring(spIdx),
                idx2 = str2.indexOf("\x0d\x0a");
            return (
                (str2 = str2.substring(4, idx2)),
                { url: str2 }
            );
        }

    } catch {

    }
    return { url: "" };
}
// async function viewLog(_0x10282d) {
//     const _0x351b4b = _0x372c47,
//         _0x36b694 = {
//             GJaOu: _0x351b4b(0x1a4, "G*8K"),
//             NPJtT: function (_0x196b96, _0xa18d55) {
//                 return _0x196b96 === _0xa18d55;
//             },
//             shYmt: _0x351b4b(0x437, "1]Wc"),
//             ZRBpe: _0x351b4b(0x1d6, "ESa4"),
//             HYxjW: _0x351b4b(0x26f, "gqjc"),
//             AoPpm: function (_0x28f3fd, _0xe56bbe) {
//                 return _0x28f3fd + _0xe56bbe;
//             },
//             tDOFe: function (_0x2748b7, _0x404124) {
//                 return _0x2748b7 + _0x404124;
//             },
//             ynMVJ: function (_0x2af97e, _0x18634b) {
//                 return _0x2af97e + _0x18634b;
//             },
//             OSTEc: function (_0x2b1cb6, _0x291f3b) {
//                 return _0x2b1cb6 + _0x291f3b;
//             },
//             EfaoO: function (_0x385eb3, _0x344e02) {
//                 return _0x385eb3(_0x344e02);
//             },
//             xNGfR: _0x351b4b(0x2d5, "gqjc"),
//             qbrGs: function (_0x3a56a9, _0x34d4f6) {
//                 return _0x3a56a9 === _0x34d4f6;
//             },
//             wyjwU: _0x351b4b(0x2ec, "Xq##"),
//             miODi: _0x351b4b(0x4ba, "cSN("),
//             sHnBf: _0x351b4b(0x169, "AhM)"),
//         };
//     try {
//         if (
//             _0x36b694[_0x351b4b(0x2be, "lM4M")](
//                 _0x36b694[_0x351b4b(0x225, "3r^q")],
//                 _0x36b694[_0x351b4b(0x272, "%[Ik")]
//             )
//         )
//             return { url: "" };
//         else {
//             let _0x4ba485 =
//                 Config[_0x351b4b(0x435, "o%l(")] + _0x351b4b(0x373, "G*8K"),
//                 _0x336625 = Math[_0x351b4b(0x501, "biLz")](
//                     new Date()[_0x351b4b(0x185, "hY7y")]() / 0x3e8
//                 )[_0x351b4b(0x4e5, "n1oj")](),
//                 _0x196f42 = {
//                     platform: _0x10282d[_0x351b4b(0xe0, "obYi")],
//                     third_id: _0x10282d[_0x351b4b(0x44a, "u*ru")],
//                     music_url: _0x10282d[_0x351b4b(0x409, "%[Ik")],
//                     music_id: _0x10282d[_0x351b4b(0x476, "SvDu")],
//                 };
//             (_0x196f42[_0x36b694[_0x351b4b(0x3cc, "75HO")]] = _0x336625),
//                 (_0x196f42[_0x351b4b(0x3e8, "C9Gu")] = CryptoJs[
//                     _0x351b4b(0x12a, "3r^q")
//                 ](
//                     _0x36b694[_0x351b4b(0x288, "za4T")](
//                         _0x36b694[_0x351b4b(0x21b, "[RLd")](
//                             _0x36b694[_0x351b4b(0x1dc, "lM4M")](
//                                 _0x36b694[_0x351b4b(0x317, "hY7y")](
//                                     _0x10282d[_0x351b4b(0x304, "hEOB")],
//                                     _0x36b694[_0x351b4b(0x45a, "n1oj")](
//                                         encodeURIComponent,
//                                         _0x10282d[_0x351b4b(0xe9, "%!yu")]
//                                     )
//                                 ),
//                                 _0x10282d[_0x351b4b(0x259, "gqjc")]
//                             ),
//                             Config[_0x351b4b(0x365, "IZB8")]
//                         ),
//                         _0x336625
//                     )
//                 )[_0x351b4b(0x50f, "CC8d")]()),
//                 (0x0, axios_1[_0x351b4b(0x2eb, "PUu(")])({
//                     method: _0x36b694[_0x351b4b(0x33b, "^%hc")],
//                     url: _0x4ba485,
//                     data: qs[_0x351b4b(0x432, "EzBF")](_0x196f42),
//                 })[_0x351b4b(0x452, "0fr)")]((_0x2e3c54) => {
//                     const _0x2a4a40 = _0x351b4b;
//                     console[_0x2a4a40(0x1a1, "gqjc")](
//                         _0x36b694[_0x2a4a40(0x23a, "3r^q")],
//                         _0x2e3c54[_0x2a4a40(0x271, "Y7Oy")]
//                     );
//                 });
//         }
//     } catch (_0x5a5c37) {
//         if (
//             _0x36b694[_0x351b4b(0x390, "gqjc")](
//                 _0x36b694[_0x351b4b(0x487, "tq2O")],
//                 _0x36b694[_0x351b4b(0x2ce, "UP$$")]
//             )
//         )
//             return null;
//         else
//             console[_0x351b4b(0x2c9, "$Sw1")](
//                 _0x36b694[_0x351b4b(0x263, "jLvN")],
//                 _0x5a5c37
//             );
//     }
// }
async function getMusicKuWoApp(musicItem, thirdItem) {

    let ret = { url: "" };
    try {
        if (thirdItem != null) {
            ret = getMusicKuWoSource(thirdItem);
        } else {
            let result1 = await getSearchKuwo(
                musicItem
            );
            if (result1) {
                let obj1 = {
                    platform: 'yun',
                    third_id: result1["id"],
                };
                (ret = await getMusicKuWoSource(
                    obj1
                ));
            }

        }
    } catch { }
    return ret;
}



async function getSearchKuwo(musicItem) {

    let artist = musicItem.artist.toLowerCase().replaceAll("\x20", "").replaceAll("&", ","),
        title = musicItem.title.toLowerCase().replaceAll("\x20", "").replaceAll("&", ","),
        cmb = artist + "\x20" + title;
    const response = (
        await (0, axios_1.default)({
            method: 'get',
            url: 'http://search.kuwo.cn/r.s',
            params: {
                client: "kt",
                all: cmb,
                pn: 0x0,
                rn: 0x1e,
                uid: 794762570,
                ver: 'kwplayer_ar_9.2.2.1',
                vipver: "1",
                show_copyright_off: 1,
                newver: 1,
                ft: 'music',
                cluster: 0,
                strategy: 2012,
                encoding: 'utf8',
                rformat: 'json',
                vermerge: 1,
                mobi: 1,
                issubtitle: 1,
            },
        })
    ).data;
    let formattedResult =
        response.abslist.map(
            formatYunMusicItem
        );
    return formattedResult.find(
        (item) =>
            item.title
                .toLowerCase()
                .replaceAll("\x20", "")
                .replaceAll("&", ",") == title &&
            item.artist
                .toLowerCase()
                .replaceAll("\x20", "")
                .replaceAll("&", ",") == artist
    );
}

// async function saveServer(musicItem, _0x27af92) {
//     const _0x28b4f5 = _0x372c47,
//         _0x32dce3 = {
//             sBjiW: function (_0x3303d0, _0x358212) {
//                 return _0x3303d0 / _0x358212;
//             },
//             bcpIU: function (_0x2f2ef6, _0x668081) {
//                 return _0x2f2ef6(_0x668081);
//             },
//             Gcrxm: "sign",
//             zooMS: function (_0x423e5b, _0x145eaa) {
//                 return _0x423e5b + _0x145eaa;
//             },
//             cYiqe: "post",
//         };
//     try {
//         let serverUrl = "https://adad23u.appinstall.life:2358/api/yun/send",
//             time = Math.round(Date.now() / 1000),
//             data = {
//                 platform: Config.platform,
//                 third_id: musicItem.songmid,
//                 title: musicItem.title,
//                 artwork: musicItem.artwork,
//                 artist: musicItem.artist,
//             },
//             data1 = {
//                 musicInfo: encodeURIComponent(JSON.stringify(data)),
//                 payInfo: encodeURIComponent(JSON.stringify(_0x27af92)),
//                 time: time,
//             };

//         (data1.sign = CryptoJs.MD5(
//             data1.musicInfo + data1.payInfo + Config.key + time
//         ).toString()),
//             (0x0, axios_1[_0x28b4f5(0xcf, "EryH")])({
//                 method: _0x32dce3[_0x28b4f5(0x297, "hY7y")],
//                 url: serverUrl,
//                 data: qs[_0x28b4f5(0x4e4, "^!X0")](data1),
//             })[_0x28b4f5(0x3fb, "a5UL")]((_0x757b7d) => {
//                 const _0x1ca823 = _0x28b4f5;
//                 console[_0x1ca823(0x33d, "lM4M")](
//                     "提交",
//                     _0x757b7d[_0x1ca823(0x3fc, "CC8d")]
//                 );
//             });
//     } catch (e) { }
// }

async function getMusic2t58(musicItem, resultItem) {

    try {
        if (resultItem !== null) {
            let params = {
                headers: {
                    "Content-Type": 'application/x-www-form-urlencoded',
                    Referer:
                        'http://www.2t58.com/song/' +
                        resultItem.third_id +
                        '.html',
                },
            },
                response = (
                    await (0x0, axios_1.default)({
                        method: 'post',
                        url: 'http://www.2t58.com/js/play.php',
                        headers: params.headers,
                        data:
                            'id=' +
                            resultItem.third_id +
                            '&type=music',
                    })
                ).data;


            return response.url != ""
                ? ({ url: response.url })
                : { url: "" }
        }
        let artist = musicItem.artist.toLowerCase().replaceAll("\x20", "").replaceAll("&", ","),
            title = musicItem.title.toLowerCase().replaceAll("\x20", "").replaceAll("&nbsp;", "").replaceAll("&", ""),
            enc = encodeURIComponent(artist + '\x20' + title),
            url =
                'http://www.2t58.com/so/' + enc + '.html',
            res = (
                await (0, axios_1.default)({
                    method: 'get',
                    url: url,
                    timeout: 5000,
                })
            ).data;
        var reg = /href="\/song\/(.+?).html" target="_mp3">(.+?)<\/a>/g;
        let regResult = res.matchAll(reg),
            resultArr = Array.from(regResult),
            resultArr1 = [];
        for (
            let i = 0;
            i < resultArr.length;
            i++
        ) {
            let item = resultArr[i],
                splitResult = item[2].split("-"),
                singerName = splitResult[0].toLowerCase().replaceAll("\x20", "").replaceAll("&", ","),
                str = "";
            for (
                var j = 1;
                j < splitResult.length;
                j++
            ) {
                str += splitResult[j].toLowerCase().replaceAll("\x20", "").replaceAll("&nbsp;", "").replaceAll("&", "");
            }
            let resultItem = {
                key: item[1],
                singerName: singerName,
                songName: str,
            };
            resultArr1.push(resultItem);
        }
        let targetItem = resultArr1.find(
            (item) =>
                item.singerName == artist &&
                item.songName == title
        );
        if (targetItem) {
            let params = {
                headers: {
                    "Content-Type": 'application/x-www-form-urlencoded',
                    Referer:
                        'http://www.2t58.com/song/' +
                        targetItem.key +
                        '.html',
                },
            },
                response = (
                    await (0, axios_1.default)({
                        method: 'post',
                        url: 'http://www.2t58.com/js/play.php',
                        headers: params.headers,
                        data:
                            "id=" +
                            targetItem.key +
                            '&type=music',
                    })
                ).data;
            if (
                response.url !== ''
            )
                return (
                    (resultItem = {
                        platform: '2t58',
                        third_id: targetItem.key,
                    }),
                    // saveServer(musicItem, resultItem),
                    { url: response.url }
                );
            return { url: "" };
        } else return { url: "" };
    } catch (e) {
        console.error(e);
        return {
            url: ""
        }

    }
}


async function getMusicZZ123(musicItem) {
    return {
        url: ""
    }
    // const _0x2a4257 = _0x372c47,
    //     _0x36587e = {
    //         CsBOg: function (_0x3f0149, _0x2104d9) {
    //             return _0x3f0149(_0x2104d9);
    //         },
    //         nJdTL: function (_0x5a67bf, _0x126256) {
    //             return _0x5a67bf == _0x126256;
    //         },
    //         nxuET: function (_0x131ceb, _0x1fcc73) {
    //             return _0x131ceb / _0x1fcc73;
    //         },
    //         DDpnZ: function (_0x2c40b1, _0x560189) {
    //             return _0x2c40b1(_0x560189);
    //         },
    //         sbRhb: function (_0x45f069, _0x4ba4b8) {
    //             return _0x45f069(_0x4ba4b8);
    //         },
    //         MSQof: 'sign',
    //         tfVyS: function (_0x1392e2, _0xe47d35) {
    //             return _0x1392e2 + _0xe47d35;
    //         },
    //         zYReb: function (_0x34f4e5, _0x1d6862) {
    //             return _0x34f4e5 + _0x1d6862;
    //         },
    //         CPFrQ: 'post',
    //         syvCc: function (_0x5cd778, _0x5110d6) {
    //             return _0x5cd778 != _0x5110d6;
    //         },
    //         mGmIM: function (_0x2136ef, _0xdc7579) {
    //             return _0x2136ef === _0xdc7579;
    //         },
    //         VWOCG: 'SqFmM',
    //         FoHeL: 'YfEid',
    //         tAfzh: function (_0x97b101, _0x8a0eca) {
    //             return _0x97b101 + _0x8a0eca;
    //         },
    //         eiZQb: 'search',
    //         JDRmt: function (_0x39d41e, _0xe25663) {
    //             return _0x39d41e > _0xe25663;
    //         },
    //         myfEd: function (_0x4d3c7a, _0x6856df) {
    //             return _0x4d3c7a !== _0x6856df;
    //         },
    //         ogkfU: 'lwEdd',
    //         QdmeR: 'songinfo',
    //         YPnie: 'CeZyJ',
    //         IDUmq: 'gutZH',
    //         TIdRB: function (_0x2b4f83, _0xd6828b) {
    //             return _0x2b4f83 === _0xd6828b;
    //         },
    //         eKZVG: 'alXbW'
    //     };

    // try {
    //     let artist = musicItem.artist,
    //         title = musicItem.title;
    //     var reg = /\(.*?\)/gis;
    //     let matchResult = title.match(reg);
    //     (matchResult !== null) &&
    //         matchResult[_0x2a4257(0x2f7, "k30p")] > 0 &&
    //         (_0x36587e[_0x2a4257(0x132, "1]Wc")](
    //             _0x36587e[_0x2a4257(0x30a, "AhM)")],
    //             _0x36587e[_0x2a4257(0x43f, "UP$$")]
    //         )
    //             ? _0x268250[_0x2a4257(0x146, "Mc&5")](
    //                 _0x3bc141 +
    //                 "=" +
    //                 _0x36587e[_0x2a4257(0x376, "tq2O")](
    //                     _0x5dea7c,
    //                     _0x23b218[_0x21f5b9]
    //                 )
    //             )
    //             : (title = title[_0x2a4257(0x153, "Xq##")](
    //                 matchResult[0x0],
    //                 ""
    //             )));
    //     (matchResult !== null) &&
    //         matchResult[_0x2a4257(0x100, "gqjc")] > 0x0 &&
    //         (title = title[_0x2a4257(0xce, "jLvN")](matchResult[0x0], ""));
    //     artist = artist.replaceAll("/", ",");
    //     let splitResult = artist.split(","),
    //         resultArr = [];
    //     splitResult.forEach((item) => {
    //         let name = chineseSel(item);
    //         (name === "")
    //             ? resultArr.push(item)
    //             : resultArr.push(name);
    //     });
    //     let query = splitResult.join("\x20") + '-' + title;
    //     const res = (
    //         await (0, axios_1.default)({
    //             method: 'post',
    //             url: 'https://zz123.com/ajax/',
    //             headers: ZZ123Config.headers,
    //             params: {
    //                 act: 'search',
    //                 key: query,
    //                 page: 1,
    //             },
    //         })
    //     ).data;
    //     if (
    //         _0x36587e[_0x2a4257(0xe1, "^%hc")](
    //             res[_0x2a4257(0x312, "C9Gu")][_0x2a4257(0x1e3, "3r^q")],
    //             0x0
    //         )
    //     ) {
    //         let _0x157928 = res[_0x2a4257(0x421, "YiIZ")][
    //             _0x2a4257(0x174, "0fr)")
    //         ](
    //             (_0x53d159) =>
    //                 _0x53d159[_0x2a4257(0x4d8, "X@&D")] ==
    //                 musicItem[_0x2a4257(0x22c, "$Sw1")] &&
    //                 _0x53d159[_0x2a4257(0x202, "xAPG")] ==
    //                 musicItem[_0x2a4257(0x206, "a5UL")]
    //         );
    //         if (
    //             _0x36587e[_0x2a4257(0x321, "C9Gu")](
    //                 _0x157928[_0x2a4257(0x387, "jLvN")],
    //                 0x0
    //             )
    //         ) {
    //             if (
    //                 _0x36587e[_0x2a4257(0x16b, "%!yu")](
    //                     _0x36587e[_0x2a4257(0x38b, "DJ#n")],
    //                     _0x36587e[_0x2a4257(0x38b, "DJ#n")]
    //                 )
    //             ) {
    //                 let _0x4ad043 =
    //                     _0x2b76f8[_0x2a4257(0x164, "cgFM")] + _0x2a4257(0x34b, "0fr)"),
    //                     _0x4407be = _0x191176[_0x2a4257(0x244, "ESa4")](
    //                         _0x36587e[_0x2a4257(0x2d4, "cgFM")](
    //                             new _0x4b0b79()[_0x2a4257(0x32b, "gqjc")](),
    //                             0x3e8
    //                         )
    //                     )[_0x2a4257(0x306, "hEOB")](),
    //                     _0x156142 = {
    //                         platform: _0x205835[_0x2a4257(0x1a3, "EzBF")],
    //                         third_id: _0x2648cd[_0x2a4257(0x2f8, "a5UL")],
    //                         title: _0x4772e3[_0x2a4257(0x4fd, "*agp")],
    //                         artwork: _0x51ca0f[_0x2a4257(0x310, "tq2O")],
    //                         artist: _0x26b1c4[_0x2a4257(0x471, "cgFM")],
    //                     },
    //                     _0x2a3dad = {
    //                         musicInfo: _0x36587e[_0x2a4257(0x12d, "Mc&5")](
    //                             _0x5e573d,
    //                             _0x4388a9[_0x2a4257(0x2da, "k30p")](_0x156142)
    //                         ),
    //                         payInfo: _0x36587e[_0x2a4257(0x104, "PUu(")](
    //                             _0x52b7ba,
    //                             _0x3817c1[_0x2a4257(0x163, "CC8d")](_0xe77097)
    //                         ),
    //                         time: _0x4407be,
    //                     };
    //                 (_0x2a3dad[_0x36587e[_0x2a4257(0x309, "biLz")]] = _0x1cc39d[
    //                     _0x2a4257(0x145, "IZB8")
    //                 ](
    //                     _0x36587e[_0x2a4257(0x1d3, "EzBF")](
    //                         _0x36587e[_0x2a4257(0x2b2, "WSxn")](
    //                             _0x2a3dad[_0x2a4257(0x176, "mpeN")],
    //                             _0x2a3dad[_0x2a4257(0x363, "%[Ik")]
    //                         ) + _0x36aa2a[_0x2a4257(0xfc, "fm9T")],
    //                         _0x4407be
    //                     )
    //                 )[_0x2a4257(0x480, "Mc&5")]()),
    //                     (0x0, _0x3bab1a[_0x2a4257(0x199, "za4T")])({
    //                         method: _0x36587e[_0x2a4257(0x3bc, "AhM)")],
    //                         url: _0x4ad043,
    //                         data: _0x5f49a6[_0x2a4257(0x47c, "Mc&5")](_0x2a3dad),
    //                     })[_0x2a4257(0x427, "[RLd")]((_0x1ac965) => {
    //                         const _0x284132 = _0x2a4257;
    //                         _0x140ae4[_0x284132(0x17c, "G*8K")](
    //                             "提交",
    //                             _0x1ac965[_0x284132(0x35a, "tq2O")]
    //                         );
    //                     });
    //             } else {
    //                 const _0x3bd1fa = (
    //                     await (0x0, axios_1[_0x2a4257(0x19e, "HM9^")])({
    //                         method: _0x36587e[_0x2a4257(0x385, "%!yu")],
    //                         url: _0x2a4257(0x3ee, "fm9T"),
    //                         headers: ZZ123Config[_0x2a4257(0x3a5, "AhM)")],
    //                         params: {
    //                             act: _0x36587e[_0x2a4257(0x4d5, "SvDu")],
    //                             id: _0x157928[0x0]["id"],
    //                         },
    //                     })
    //                 )[_0x2a4257(0x46c, "3r^q")];
    //                 if ((_0x3bd1fa[_0x2a4257(0x3c7, "1]Wc")] = 0xc8))
    //                     return {
    //                         url:
    //                             _0x2a4257(0xcc, "IZB8") +
    //                             _0x3bd1fa[_0x2a4257(0x3ce, "HM9^")][_0x2a4257(0x283, "xAPG")],
    //                     };
    //                 else {
    //                     if (
    //                         _0x36587e[_0x2a4257(0x1ba, "n1oj")](
    //                             _0x36587e[_0x2a4257(0x426, "EzBF")],
    //                             _0x36587e[_0x2a4257(0x15f, "k%k@")]
    //                         )
    //                     ) {
    //                         let _0x378b0c = [];
    //                         const _0x40abe8 = /[\u4e00-\u9fa5]/g;
    //                         return (
    //                             _0x264cad &&
    //                             (_0x378b0c = _0x10a46e[_0x2a4257(0x1b7, "ESa4")](_0x40abe8)),
    //                             _0x378b0c?.[_0x2a4257(0x4b6, "75HO")]
    //                                 ? _0x378b0c[_0x2a4257(0x47f, "0fr)")]("")
    //                                 : ""
    //                         );
    //                     } else return { url: "" };
    //                 }
    //             }
    //         }
    //     }
    //     return { url: "" };
    // } catch (e) {
    //     console.log(e)
    //     return { url: "" };
    // }
}



async function getMusicMigu(musicItem) {
    let artist = musicItem.artist,
        title = musicItem.title,
        enc = encodeURIComponent(artist + "\x20" + title);
    try {

        const headers = {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            "Accept-Encoding": 'gzip, deflate, br',
            "Accept-Language": 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            Connection: 'keep-alive',
            "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8',
            Host: 'm.music.migu.cn',
            Referer: 'https://m.music.migu.cn/v3/search?keyword=' + encodeURIComponent(enc),
            "Sec-Fetch-Dest": 'empty',
            "Sec-Fetch-Mode": 'cors',
            "Sec-Fetch-Site": 'same-origin',
            "User-Agent": 'Mozilla/5.0 (Linux; Android 6.0.1; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Mobile Safari/537.36 Edg/89.0.774.68',
            "X-Requested-With": 'XMLHttpRequest',
        },
            params = { keyword: enc, type: 2, pgc: 1, rows: 20 },
            res = await axios_1.default.get('https://m.music.migu.cn/migu/remoting/scr_search_tag', {
                headers: headers,
                params: params,
            });
        if (!res.data.musics) {
            return { url: "" };
        }
        let filterResult = res.data.musics.filter((_) => {
            let canPlay = _.mp3 || _.listenUrl || _.lisQq || _.lisCr;
            return (
                canPlay && _.artist === artist
            );
        });
        if (
            filterResult.length > 0
        ) {
            let first = filterResult[0],
                finalUrl = first.mp3 || first.listenUrl || first.lisQq || first.lisCr;
            return { url: finalUrl };
        }
    } catch {

    }
    return { url: "" };
}




async function getMusicFangpi(musicItem, thirdItem) {
    try {
        if (thirdItem) {
            let response2 = (
                await (0x0, axios_1.default)({
                    method: 'get',
                    url:
                        "https://www.fangpi.net/api/play_url?id=" +
                        thirdItem.third_id +
                        '&json=1',
                    timeout: 5000,
                })
            ).data;
            if (
                response2.code === 1 &&
                response2.data.url &&
                response2.data.url != ""
            ) {

                return {
                    url: response2.data.url,
                };

            }
        }
        let artist = musicItem.artist,
            title = musicItem.title;
        var reg = /\(.*?\)/gis;
        let matchResult = title.match(reg);

        matchResult != null && (
            matchResult.length > 0
        ) &&
            (title = title.replace(matchResult[0], ""));
        artist = artist.replaceAll("/", ",");
        let artistSplit = artist.split(","),
            resultArr = [];
        artistSplit.forEach((item) => {
            let sel = chineseSel(
                item
            );
            sel === ""
                ? resultArr.push(item)
                : resultArr.push(sel);
        });
        let enc = encodeURIComponent(resultArr.join("\x20") +
            "\x20" +
            title),
            url = 'https://www.fangpi.net/s/' + enc;
        const response = (
            await (0, axios_1.default)({
                url: url,
                method: 'get',
                timeout: 3000,
            })
        ).data;
        var reg1 = /class="col-5 col-content">(.*?)<\/a>/gis;
        let matchResult1 = response.match(reg1);
        for (const item of matchResult1) {
            let idx = _(
                item.indexOf(
                    '/music/'
                ) +
                7
            ),
                substrItem = item.substring(idx);
            idx = substrItem.indexOf("\x22");
            let str2 = substrItem.substring(0, idx),
                response2 = (
                    await (0, axios_1.default)({
                        method: 'get',
                        url:
                            'https://www.fangpi.net/api/play_url?id=' + str2 + '&json=1',
                        timeout: 5000,
                    })
                ).data;
            if (
                response2.code === 1 &&
                response2.data.url &&
                response2.data.url != ""
            ) {
                return (
                    (thirdItem = {
                        platform: 'fangpi',
                        third_id: str2,
                    }),
                    // _0x43e8cc[_0x12b518(0x27e, "mpeN")](
                    //     saveServer,
                    //     musicItem,
                    //     thirdItem
                    // ),
                    {
                        url: response2.data.url,
                    }
                );
            }

        }
        return { url: "" };
    } catch {
        return { url: "" };
    }
}



async function getMusicSource(musicItem, quality) {
    try {
        if (musicItem.isfree) {
            let source = await getMusicQQ(musicItem, quality);
            if (source) {
                return source;
            }
        }
        let obj = { url: "" },
            api = Config.server + "/api/yun",
            time = Math.round(Date.now() / 1000).toString(),
            params = {
                platform: Config.platform,
                third_id: musicItem.songmid,
                time: time,
            };
        params.sign = CryptoJs.MD5(params.third_id + Config.key + +time).toString();
        let res = (
            await (0, axios_1.default)({
                method: "post",
                url: api,
                data: qs.stringify(params),
            })
        ).data;
        if (res.code !== 1 && res.data.length > 0) {
            let results = res.data;
            for (var result of results) {

                if (
                    result.platform == 'yun'
                )
                    obj = (obj.url === "")
                        ? await getMusicKuWoApp(
                            musicItem,
                            result
                        )
                        : obj;
                else {
                    if (
                        result.platform === '2t58'
                    )
                        obj =
                            obj.url == ""
                                ? await getMusic2t58(musicItem, result)
                                : obj;
                    else if (result.platform === 'fangpi') {
                        obj = (obj.url === ""
                            ? await getMusicFangpi(musicItem, result)
                            : obj);
                    }
                }
            }
        }


        return (
            (obj = obj.url === ""
                ? await getMusicKuWoApp(
                    musicItem,
                    null
                )
                : obj),
            (obj = obj.url === ""
                ? await getMusic2t58(
                    musicItem,
                    null
                )
                : obj),
            (obj = obj.url === ""
                ? await getMusicZZ123(musicItem)
                : obj),
            (obj = obj.url === ""
                ? await getMusicMigu(musicItem)
                : obj),
            (obj = obj.url === ""
                ? await getMusicFangpi(
                    musicItem,
                    null
                )
                : obj),
            obj &&
            obj.url.indexOf(
                'http'
            ) == -1 && (obj.url = ""),
            obj
        );
    } catch (e) {
        // log
        console.log(e)
    }
}



async function getMusicQQ(musicItem, quality) {

    let domain = "",
        purl = "",
        type = '128';
    if (quality === 'standard')
        type = '320';
    else {
        if (
            quality === 'high'
        ) {
            type = 'm4a';
        }

        else
            (quality === 'super') && (type = 'flac');
    }
    const result = await getSourceUrl(musicItem.songmid, type);

    if (result.req_0 && result.req_0.data && result.req_0.data.midurlinfo) {
        purl = result.req_0.data.midurlinfo[0].purl;
    }
    if (!purl) {
        return null;
    }
    if (domain === "") {
        domain =
            result.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
            result.req_0.data.sip[0];
    }
    return {
        url: `${domain}${purl}`,
    };
}


module.exports = {
    platform: "QQ音乐",
    version: "0.2.5",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "QQ音乐APP：自建歌单-分享-分享到微信好友/QQ好友；然后点开并复制链接，直接粘贴即可",
            "H5：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入时间和歌单大小有关，请耐心等待",
        ],
    },
    srcUrl: "https://gitee.com/maotoumao/plugins-list1/raw/master/qq.js",
    primaryKey: ["id", "songmid"],
    supportedSearchType: ["music", "album", "sheet", "artist", "lyric"],
    async search(query, page, type) {
        if (type === "music") {
            return await searchMusic(query, page);
        } else if (type === "album") {
            return await searchAlbum(query, page);
        } else if (type === "artist") {
            return await searchArtist(query, page);
        } else if (type === "sheet") {
            return await searchMusicSheet(query, page);
        } else if (type === "lyric") {
            return await searchLyric(query, page);
        }
    },
    async getMediaSource(musicItem, quality) {
        return await getMusicSource(musicItem, quality);
    },
    getLyric: getLyric,
    getAlbumInfo: getAlbumInfo,
    getArtistWorks: getArtistWorks,
    importMusicSheet: importMusicSheet,
    getTopLists: getTopLists,
    getTopListDetail: getTopListDetail,
    getRecommendSheetTags: getRecommendSheetTags,
    getRecommendSheetsByTag: getRecommendSheetsByTag,
    getMusicSheetInfo: getMusicSheetInfo,
};
