"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

const axios_1 = require("axios");
const dayjs = require("dayjs");
const he = require("he");
const CryptoJs = require("crypto-js");
const { load } = require('cheerio');

// ---------- 用户变量相关 ----------
let cachedUserConfig = {
    biliCookie: null,
    buvid3: null,
    buvid4: null,
    biliJct: null,
    cookieParsed: false
};

/**
 * 从 env 获取用户配置的 Cookie，并解析出所需字段
 */
function refreshUserConfig() {
    const userVars = env?.getUserVariables?.();
    if (!userVars) return;

    const newCookie = userVars.biliCookie || '';
    if (newCookie !== cachedUserConfig.biliCookie) {
        cachedUserConfig.biliCookie = newCookie;
        cachedUserConfig.cookieParsed = false;

        // 解析 Cookie 中的常用字段
        if (newCookie) {
            const matchBuvid3 = newCookie.match(/buvid3=([^;]+)/);
            const matchBuvid4 = newCookie.match(/buvid4=([^;]+)/);
            const matchBiliJct = newCookie.match(/bili_jct=([^;]+)/);
            cachedUserConfig.buvid3 = matchBuvid3 ? matchBuvid3[1] : null;
            cachedUserConfig.buvid4 = matchBuvid4 ? matchBuvid4[1] : null;
            cachedUserConfig.biliJct = matchBiliJct ? matchBiliJct[1] : null;
            cachedUserConfig.cookieParsed = true;
        }
    }
}

/**
 * 获取完整的用户 Cookie 字符串
 */
function getUserCookieString() {
    refreshUserConfig();
    return cachedUserConfig.biliCookie || '';
}

/**
 * 获取 buvid3（用于某些接口）
 */
function getBuvid3() {
    refreshUserConfig();
    return cachedUserConfig.buvid3;
}

/**
 * 获取 buvid4
 */
function getBuvid4() {
    refreshUserConfig();
    return cachedUserConfig.buvid4;
}

/**
 * 获取 bili_jct（csrf）
 */
function getBiliJct() {
    refreshUserConfig();
    return cachedUserConfig.biliJct || '';
}

// ---------- 原有 B站 API 逻辑，仅改造 cookie 相关部分 ----------

const headers = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
    accept: "*/*",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
};

// 原自动获取 cookie 的逻辑被移除，改为从用户变量获取
let cookie = null; // 全局 cookie 对象，格式与原插件兼容：{ b_3, b_4 }

async function getCookie() {
    // 若已解析过 cookie 对象且用户变量未变化，直接返回
    if (cookie && cookie.b_3 && cookie.b_4) {
        return;
    }
    refreshUserConfig();
    if (cachedUserConfig.cookieParsed) {
        cookie = {
            b_3: cachedUserConfig.buvid3,
            b_4: cachedUserConfig.buvid4,
        };
    } else {
        // 没有配置 Cookie 时，置空，后续请求可能失败
        cookie = { b_3: '', b_4: '' };
        console.warn('未配置 B站 Cookie，部分功能可能无法使用');
    }
}

async function getCid(bvid, aid) {
    const params = bvid ? { bvid } : { aid };
    const cidRes = (await axios_1.default.get("https://api.bilibili.com/x/web-interface/view", {
        headers: headers,
        params: params,
    })).data;
    return cidRes;
}

function durationToSec(duration) {
    if (typeof duration === "number") return duration;
    if (typeof duration === "string") {
        var dur = duration.split(":");
        return dur.reduce((prev, curr) => 60 * prev + +curr, 0);
    }
    return 0;
}

const searchHeaders = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
    accept: "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br",
    origin: "https://search.bilibili.com",
    "sec-fetch-site": "same-site",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    referer: "https://search.bilibili.com/",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
};

const pageSize = 20;

async function searchBase(keyword, page, searchType) {
    await getCookie(); // 确保 cookie 对象已初始化
    const params = {
        context: "",
        page: page,
        order: "",
        page_size: pageSize,
        keyword: keyword,
        duration: "",
        tids_1: "",
        tids_2: "",
        __refresh__: true,
        _extra: "",
        highlight: 1,
        single_column: 0,
        platform: "pc",
        from_source: "",
        search_type: searchType,
        dynamic_offset: 0,
    };

    // 使用完整的用户 Cookie 字符串，而非仅 buvid3/4
    const cookieString = getUserCookieString();
    const res = (await axios_1.default.get("https://api.bilibili.com/x/web-interface/search/type", {
        headers: {
            ...searchHeaders,
            Cookie: cookieString, // 携带完整 Cookie
        },
        params: params,
    })).data;
    return res.data;
}

async function getFavoriteList(id) {
    const result = [];
    const pageSize = 20;
    let page = 1;
    while (true) {
        try {
            const { data: { data: { medias, has_more } } } = await axios_1.default.get("https://api.bilibili.com/x/v3/fav/resource/list", {
                headers: {
                    Cookie: getUserCookieString(), // 携带 Cookie
                },
                params: {
                    media_id: id,
                    platform: "web",
                    ps: pageSize,
                    pn: page,
                },
            });
            result.push(...medias);
            if (!has_more) break;
            page += 1;
        } catch (error) {
            console.warn(error);
            break;
        }
    }
    return result;
}

function formatMedia(result) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const title = he.decode((_b = (_a = result.title)?.replace(/(\<em(.*?)\>)|(\<\/em\>)/g, "")) ?? "");
    return {
        id: (_d = (_c = result.cid) ?? result.bvid) ?? result.aid,
        aid: result.aid,
        bvid: result.bvid,
        artist: (_e = result.author) ?? (_f = result.owner)?.name,
        title,
        alias: (_g = title.match(/《(.+?)》/))?.[1],
        album: (_h = result.bvid) ?? result.aid,
        artwork: ((_j = result.pic)?.startsWith("//"))
            ? "http:" + result.pic
            : result.pic,
        duration: durationToSec(result.duration),
        tags: (_k = result.tag)?.split(","),
        date: dayjs.unix(result.pubdate || result.created).format("YYYY-MM-DD"),
    };
}

async function searchAlbum(keyword, page) {
    const resultData = await searchBase(keyword, page, "video");
    const albums = resultData.result.map(formatMedia);
    return {
        isEnd: resultData.numResults <= page * pageSize,
        data: albums,
    };
}

async function searchArtist(keyword, page) {
    const resultData = await searchBase(keyword, page, "bili_user");
    const artists = resultData.result.map((result) => ({
        name: result.uname,
        id: result.mid,
        fans: result.fans,
        description: result.usign,
        avatar: result.upic?.startsWith("//")
            ? `https://${result.upic}`
            : result.upic,
        worksNum: result.videos,
    }));
    return {
        isEnd: resultData.numResults <= page * pageSize,
        data: artists,
    };
}

// ---------- WBI 签名相关（保持不变） ----------
function getMixinKey(e) {
    var t = [];
    ([
        46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
        49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55,
        40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57,
        62, 11, 36, 20, 34, 44, 52,
    ]).forEach(function (r) {
        e.charAt(r) && t.push(e.charAt(r));
    });
    return t.join("").slice(0, 32);
}

function hmacSha256(key, message) {
    const hmac = CryptoJs.HmacSHA256(message, key);
    return hmac.toString(CryptoJs.enc.Hex);
}

async function getBiliTicket(csrf) {
    const ts = Math.floor(Date.now() / 1000);
    const hexSign = hmacSha256('XgwSnGZ1p', `ts${ts}`);
    const url = 'https://api.bilibili.com/bapis/bilibili.api.ticket.v1.Ticket/GenWebTicket';
    try {
        const response = await axios_1.default.post(url, null, {
            params: {
                key_id: 'ec02',
                hexsign: hexSign,
                'context[ts]': ts,
                csrf: csrf || getBiliJct() // 优先使用用户 cookie 中的 bili_jct
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0'
            }
        });
        return response.data.data;
    } catch (e) {
        throw e;
    }
}

let img, sub, syncedTime;

async function getWBIKeys() {
    if (img && sub && syncedTime && syncedTime.getDate() === (new Date()).getDate()) {
        return { img, sub };
    } else {
        const data = await getBiliTicket('');
        img = data.nav.img;
        img = img.slice(img.lastIndexOf('/') + 1, img.lastIndexOf('.'));
        sub = data.nav.sub;
        sub = sub.slice(sub.lastIndexOf('/') + 1, sub.lastIndexOf('.'));
        syncedTime = new Date();
        return { img, sub };
    }
}

async function getRid(params) {
    const wbiKeys = await getWBIKeys();
    const npi = wbiKeys.img + wbiKeys.sub;
    const o = getMixinKey(npi);
    const l = Object.keys(params).sort();
    let c = [];
    for (let d = 0, u = /[!'\(\)*]/g; d < l.length; ++d) {
        let [h, p] = [l[d], params[l[d]]];
        p && "string" == typeof p && (p = p.replace(u, ""));
        null != p &&
            c.push("".concat(encodeURIComponent(h), "=").concat(encodeURIComponent(p)));
    }
    const f = c.join("&");
    const w_rid = CryptoJs.MD5(f + o).toString();
    return w_rid;
}

let w_webid;
let w_webid_date;

async function getWWebId(id) {
    if (w_webid && w_webid_date && (Date.now() - w_webid_date.getTime() < 1000 * 60 * 60)) {
        return w_webid;
    }
    const html = (await axios_1.default.get("https://space.bilibili.com/" + id, {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
            Cookie: getUserCookieString(), // 携带 Cookie 以获取登录态空间页
        }
    })).data;
    const $ = load(html);
    const content = $("#__RENDER_DATA__").text();
    const jsonContent = JSON.parse(decodeURIComponent(content));
    w_webid = jsonContent.access_id;
    w_webid_date = new Date();
    return w_webid;
}

async function getArtistWorks(artistItem, page, type) {
    const queryHeaders = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br, zstd",
        origin: "https://space.bilibili.com",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: `https://space.bilibili.com/${artistItem.id}/video`,
    };

    await getCookie();
    const w_webid = await getWWebId(artistItem.id);
    const now = Math.round(Date.now() / 1e3);
    const params = {
        mid: artistItem.id,
        ps: 30,
        tid: 0,
        pn: page,
        web_location: 1550101,
        order_avoided: true,
        order: "pubdate",
        keyword: "",
        platform: "web",
        dm_img_list: "[]",
        dm_img_str: "V2ViR0wgMS4wIChPcGVuR0wgRVMgMi4wIENocm9taXVtKQ",
        dm_cover_img_str: "QU5HTEUgKE5WSURJQSwgTlZJRElBIEdlRm9yY2UgR1RYIDE2NTAgKDB4MDAwMDFGOTEpIERpcmVjdDNEMTEgdnNfNV8wIHBzXzVfMCwgRDNEMTEpR29vZ2xlIEluYy4gKE5WSURJQS",
        dm_img_inter: '{"ds":[],"wh":[0,0,0],"of":[0,0,0]}',
        w_webid: w_webid,
        wts: now.toString(),
    };
    const w_rid = await getRid(params);
    const res = (await axios_1.default.get("https://api.bilibili.com/x/space/wbi/arc/search", {
        headers: {
            ...queryHeaders,
            Cookie: getUserCookieString(), // 使用完整 Cookie
        },
        params: {
            ...params,
            w_rid,
        },
    })).data;
    const resultData = res.data;
    const albums = resultData.list.vlist.map(formatMedia);
    return {
        isEnd: resultData.page.pn * resultData.page.ps >= resultData.page.count,
        data: albums,
    };
}

async function getMediaSource(musicItem, quality) {
    var _a;
    let cid = musicItem.cid;
    if (!cid) {
        cid = (await getCid(musicItem.bvid, musicItem.aid)).data.cid;
    }
    const _params = musicItem.bvid
        ? { bvid: musicItem.bvid }
        : { aid: musicItem.aid };
    const res = (await axios_1.default.get("https://api.bilibili.com/x/player/playurl", {
        headers: {
            ...headers,
            Cookie: getUserCookieString(), // 携带 Cookie 获取更高音质/会员音频
        },
        params: {
            ..._params,
            cid: cid,
            fnval: 16,
        },
    })).data;
    let url;
    if (res.data.dash) {
        const audios = res.data.dash.audio;
        audios.sort((a, b) => a.bandwidth - b.bandwidth);
        switch (quality) {
            case "low": url = audios[0]?.baseUrl; break;
            case "standard": url = audios[1]?.baseUrl; break;
            case "high": url = audios[2]?.baseUrl; break;
            case "super": url = audios[3]?.baseUrl; break;
            default: url = audios[0]?.baseUrl;
        }
    } else {
        url = res.data.durl[0].url;
    }
    const hostUrl = url.substring(url.indexOf("/") + 2);
    const _headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
        accept: "*/*",
        host: hostUrl.substring(0, hostUrl.indexOf("/")),
        "accept-encoding": "gzip, deflate, br",
        connection: "keep-alive",
        referer: "https://www.bilibili.com/video/".concat((_a = (musicItem.bvid ?? musicItem.aid)) ?? ""),
        Cookie: getUserCookieString(), // 流媒体下载有时也需要 Cookie
    };
    return {
        url: url,
        headers: _headers,
    };
}

// ---------- 排行榜、歌单导入、评论等，均添加 Cookie 头 ----------
async function getTopLists() {
    const precious = {
        title: "入站必刷",
        data: [{
            id: "popular/precious?page_size=100&page=1",
            title: "入站必刷",
            coverImg: "https://s1.hdslb.com/bfs/static/jinkela/popular/assets/icon_history.png",
        }],
    };
    const weekly = { title: "每周必看", data: [] };
    const weeklyRes = await axios_1.default.get("https://api.bilibili.com/x/web-interface/popular/series/list", {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            Cookie: getUserCookieString(),
        },
    });
    weekly.data = weeklyRes.data.data.list.slice(0, 8).map((e) => ({
        id: `popular/series/one?number=${e.number}`,
        title: e.subject,
        description: e.name,
        coverImg: "https://s1.hdslb.com/bfs/static/jinkela/popular/assets/icon_weekly.png",
    }));

    const boardKeys = [
        { id: "ranking/v2?rid=0&type=all", title: "全站" },
        { id: "ranking/v2?rid=3&type=all", title: "音乐" },
        { id: "ranking/v2?rid=1&type=all", title: "动画" },
        { id: "ranking/v2?rid=119&type=all", title: "鬼畜" },
        { id: "ranking/v2?rid=168&type=all", title: "国创相关" },
        { id: "ranking/v2?rid=129&type=all", title: "舞蹈" },
        { id: "ranking/v2?rid=4&type=all", title: "游戏" },
        { id: "ranking/v2?rid=36&type=all", title: "知识" },
        { id: "ranking/v2?rid=188&type=all", title: "科技" },
        { id: "ranking/v2?rid=234&type=all", title: "运动" },
        { id: "ranking/v2?rid=223&type=all", title: "汽车" },
        { id: "ranking/v2?rid=160&type=all", title: "生活" },
        { id: "ranking/v2?rid=211&type=all", title: "美食" },
        { id: "ranking/v2?rid=217&type=all", title: "动物圈" },
        { id: "ranking/v2?rid=155&type=all", title: "时尚" },
        { id: "ranking/v2?rid=5&type=all", title: "娱乐" },
        { id: "ranking/v2?rid=181&type=all", title: "影视" },
        { id: "ranking/v2?rid=0&type=origin", title: "原创" },
        { id: "ranking/v2?rid=0&type=rookie", title: "新人" },
    ];
    const board = {
        title: "排行榜",
        data: boardKeys.map(_ => ({
            ..._,
            coverImg: "https://s1.hdslb.com/bfs/static/jinkela/popular/assets/icon_rank.png"
        })),
    };
    return [weekly, precious, board];
}

async function getTopListDetail(topListItem) {
    const res = await axios_1.default.get(`https://api.bilibili.com/x/web-interface/${topListItem.id}`, {
        headers: {
            ...headers,
            referer: "https://www.bilibili.com/",
            Cookie: getUserCookieString(),
        },
    });
    return {
        ...topListItem,
        musicList: res.data.data.list.map(formatMedia),
    };
}

async function importMusicSheet(urlLike) {
    var _a, _b, _c, _d;
    let id;
    id = id || (_a = urlLike.match(/^\s*(\d+)\s*$/))?.[1];
    id = id || (_b = urlLike.match(/^(?:.*)fid=(\d+).*$/))?.[1];
    id = id || (_c = urlLike.match(/\/playlist\/pl(\d+)/i))?.[1];
    id = id || (_d = urlLike.match(/\/list\/ml(\d+)/i))?.[1];
    if (!id) return;

    const musicSheet = await getFavoriteList(id);
    return musicSheet.map(_ => ({
        id: _.id,
        aid: _.aid,
        bvid: _.bvid,
        artwork: _.cover,
        title: _.title,
        artist: _.upper?.name,
        album: _.bvid ?? _.aid,
        duration: durationToSec(_.duration),
    }));
}

function formatComment(item) {
    var _a, _b, _c, _d, _e;
    return {
        id: item.rpid,
        nickName: (_a = item.member)?.uname,
        avatar: (_b = item.member)?.avatar,
        comment: (_c = item.content)?.message,
        like: item.like,
        createAt: item.ctime * 1000,
        location: ((_e = (_d = item.reply_control)?.location)?.startsWith("IP属地：")) ? item.reply_control.location.slice(5) : undefined
    };
}

async function getMusicComments(musicItem) {
    var _a, _b;
    const params = {
        type: 1,
        mode: 3,
        oid: musicItem.aid,
        plat: 1,
        web_location: 1315875,
        wts: Math.floor(Date.now() / 1000)
    };
    const w_rid = await getRid(params);
    const res = (await axios_1.default.get("https://api.bilibili.com/x/v2/reply/wbi/main", {
        params: { ...params, w_rid },
        headers: { Cookie: getUserCookieString() },
    })).data;
    const data = res.data.replies;
    const comments = [];
    for (let i = 0; i < data.length; ++i) {
        comments[i] = formatComment(data[i]);
        if ((_a = data[i].replies)?.length) {
            comments[i].replies = (_b = data[i])?.replies.map(formatComment);
        }
    }
    return { isEnd: true, data: comments };
}

// ---------- 插件导出 ----------
module.exports = {
    platform: "哔哩哔哩_Cookie",
    appVersion: ">=0.0",
    version: "0.7.3",
    author: "other",
    description: "需要用户配置 B站 Cookie 以使用登录态，支持收藏夹、高音质等",
    // 用户变量配置
    userVariables: [
        {
            key: "biliCookie",
            name: "B站Cookie",
            type: "password",
            description: "从浏览器（如Chrome）复制完整的Cookie字符串，包含 SESSDATA、buvid3、bili_jct 等"
        }
    ],
    srcUrl: "https://gitee.com/your-repo/bilibili-cookie-plugin.js", // 请替换为实际地址
    cacheControl: "no-cache",
    primaryKey: ["id", "aid", "bvid", "cid"],
    hints: {
        importMusicSheet: [
            "必须配置 Cookie 才能导入非公开收藏夹",
            "复制 Cookie：登录 bilibili.com → F12 → 控制台 → 输入 document.cookie → 复制完整内容",
            "导入耗时与歌单大小有关，请耐心等待",
        ],
    },
    supportedSearchType: ["music", "album", "artist"],
    async search(keyword, page, type) {
        if (type === "album" || type === "music") {
            return await searchAlbum(keyword, page);
        }
        if (type === "artist") {
            return await searchArtist(keyword, page);
        }
    },
    getMediaSource,
    async getAlbumInfo(albumItem) {
        var _a;
        const cidRes = await getCid(albumItem.bvid, albumItem.aid);
        const _ref2 = (_a = cidRes?.data) ?? {};
        const cid = _ref2.cid;
        const pages = _ref2.pages;
        let musicList;
        if (pages.length === 1) {
            musicList = [{ ...albumItem, cid }];
        } else {
            musicList = pages.map(_ => ({
                ...albumItem,
                cid: _.cid,
                title: _.part,
                duration: durationToSec(_.duration),
                id: _.cid
            }));
        }
        return { musicList };
    },
    getArtistWorks,
    getTopLists,
    getTopListDetail,
    importMusicSheet,
    getMusicComments
};