var $M8GQN$axios = require("axios");
var $M8GQN$he = require("he");

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
$parcel$export(module.exports, "default", () => $4e63e094b4590b2b$export$2e2bcd8739ae039);

const $4e63e094b4590b2b$var$pageSize = 30;

function $4e63e094b4590b2b$var$artworkShort2Long(albumpicShort) {
    var _a;
    const firstSlashOfAlbum = (_a = albumpicShort?.indexOf("/")) ?? -1;
    return firstSlashOfAlbum !== -1 ? `https://img4.kuwo.cn/star/albumcover/1080${albumpicShort.slice(firstSlashOfAlbum)}` : undefined;
}

function $4e63e094b4590b2b$var$formatMusicItem(_) {
    return {
        id: _.MUSICRID.replace("MUSIC_", ""),
        artwork: $4e63e094b4590b2b$var$artworkShort2Long(_.web_albumpic_short),
        title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.NAME || ""),
        artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.ARTIST || ""),
        album: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.ALBUM || ""),
        albumId: _.ALBUMID,
        artistId: _.ARTISTID,
        formats: _.FORMATS
    };
}

function $4e63e094b4590b2b$var$formatAlbumItem(_) {
    var _a;
    return {
        id: _.albumid,
        artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.artist || ""),
        title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
        artwork: (_a = _.img) ?? $4e63e094b4590b2b$var$artworkShort2Long(_.pic),
        description: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.info || ""),
        date: _.pub,
        artistId: _.artistid
    };
}

function $4e63e094b4590b2b$var$formatArtistItem(_) {
    return {
        id: _.ARTISTID,
        avatar: _.hts_PICPATH,
        name: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.ARTIST || ""),
        artistId: _.ARTISTID,
        description: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.desc || ""),
        worksNum: _.SONGNUM
    };
}

function $4e63e094b4590b2b$var$formatMusicSheet(_) {
    return {
        id: _.playlistid,
        title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
        artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.nickname || ""),
        artwork: _.pic,
        playCount: _.playcnt,
        description: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.intro || ""),
        worksNum: _.songnum
    };
}

async function $4e63e094b4590b2b$var$searchMusic(query, page) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            client: "kt", all: query, pn: page - 1, rn: $4e63e094b4590b2b$var$pageSize,
            uid: 2574109560, ver: "kwplayer_ar_8.5.4.2", vipver: 1, ft: "music",
            cluster: 0, strategy: 2012, encoding: "utf8", rformat: "json",
            vermerge: 1, mobi: 1
        }
    })).data;
    const songs = res.abslist.map($4e63e094b4590b2b$var$formatMusicItem);
    return { isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL, data: songs };
}

async function $4e63e094b4590b2b$var$searchAlbum(query, page) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query, ft: "album", itemset: "web_2013", client: "kt",
            pn: page - 1, rn: $4e63e094b4590b2b$var$pageSize, rformat: "json",
            encoding: "utf8", pcjson: 1
        }
    })).data;
    const albums = res.albumlist.map($4e63e094b4590b2b$var$formatAlbumItem);
    return { isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL, data: albums };
}

async function $4e63e094b4590b2b$var$searchArtist(query, page) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query, ft: "artist", itemset: "web_2013", client: "kt",
            pn: page - 1, rn: $4e63e094b4590b2b$var$pageSize, rformat: "json",
            encoding: "utf8", pcjson: 1
        }
    })).data;
    const artists = res.abslist.map($4e63e094b4590b2b$var$formatArtistItem);
    return { isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL, data: artists };
}

async function $4e63e094b4590b2b$var$searchMusicSheet(query, page) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            all: query, ft: "playlist", itemset: "web_2013", client: "kt",
            pn: page - 1, rn: $4e63e094b4590b2b$var$pageSize, rformat: "json",
            encoding: "utf8", pcjson: 1
        }
    })).data;
    const musicSheets = res.abslist.map($4e63e094b4590b2b$var$formatMusicSheet);
    return { isEnd: (+res.PN + 1) * +res.RN >= +res.TOTAL, data: musicSheets };
}

async function $4e63e094b4590b2b$var$getArtistMusicWorks(artistItem, page) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: page - 1, rn: $4e63e094b4590b2b$var$pageSize, artistid: artistItem.id,
            stype: "artist2music", sortby: 0, alflac: 1, show_copyright_off: 1,
            pcmp4: 1, encoding: "utf8", plat: "pc", thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2", devid: "38668888", newver: 1, pcjson: 1
        }
    })).data;
    const songs = res.musiclist.map((_)=>({
        id: _.musicrid,
        artwork: $4e63e094b4590b2b$var$artworkShort2Long(_.web_albumpic_short),
        title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
        artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.artist || ""),
        album: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.album || ""),
        albumId: _.albumid, artistId: _.artistid, formats: _.formats
    }));
    return { isEnd: (+res.pn + 1) * $4e63e094b4590b2b$var$pageSize >= +res.total, data: songs };
}

async function $4e63e094b4590b2b$var$getArtistAlbumWorks(artistItem, page) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: page - 1, rn: $4e63e094b4590b2b$var$pageSize, artistid: artistItem.id,
            stype: "albumlist", sortby: 1, alflac: 1, show_copyright_off: 1,
            pcmp4: 1, encoding: "utf8", plat: "pc", thost: "search.kuwo.cn",
            vipver: "MUSIC_9.1.1.2_BCS2", devid: "38668888", newver: 1, pcjson: 1
        }
    })).data;
    const albums = res.albumlist.map($4e63e094b4590b2b$var$formatAlbumItem);
    return { isEnd: (+res.pn + 1) * $4e63e094b4590b2b$var$pageSize >= +res.total, data: albums };
}

async function $4e63e094b4590b2b$var$getArtistWorks(artistItem, page, type) {
    if (type === "music") return $4e63e094b4590b2b$var$getArtistMusicWorks(artistItem, page);
    else if (type === "album") return $4e63e094b4590b2b$var$getArtistAlbumWorks(artistItem, page);
}

async function $4e63e094b4590b2b$var$getLyric(musicItem) {
    try {
        const res = await (0, ($parcel$interopDefault($M8GQN$axios))).get("https://yunzhiapi.cn/API/jhlrcgc.php", {
            params: { id: musicItem.id, msg: "kw" },
            timeout: 10000
        });
        let rawLrc = res.data;
        if (rawLrc?.trim().length > 0) return { rawLrc: rawLrc };
        return { rawLrc: "" };
    } catch (error) {
        console.error("获取歌词失败:", error.message);
        return { rawLrc: "" };
    }
}

async function $4e63e094b4590b2b$var$getAlbumInfo(albumItem) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios)))({
        url: `http://search.kuwo.cn/r.s`,
        params: {
            pn: 0, rn: 100, albumid: albumItem.id, stype: "albuminfo", sortby: 0,
            alflac: 1, show_copyright_off: 1, pcmp4: 1, encoding: "utf8", plat: "pc",
            thost: "search.kuwo.cn", vipver: "MUSIC_9.1.1.2_BCS2", devid: "38668888",
            newver: 1, pcjson: 1
        }
    })).data;
    const songs = res.musiclist.map((_)=>({
        id: _.id,
        artwork: albumItem.artwork ?? res.img,
        title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
        artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.artist || ""),
        album: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.album || ""),
        albumId: albumItem.id, artistId: _.artistid, formats: _.formats
    }));
    return { musicList: songs };
}

async function $4e63e094b4590b2b$var$getTopLists() {
    const result = (await (0, ($parcel$interopDefault($M8GQN$axios))).get("http://wapi.kuwo.cn/api/pc/bang/list")).data.child;
    return result.map((e)=>({
        title: e.disname,
        data: e.child.map((_)=>({
            id: _.sourceid,
            coverImg: _.pic5 ?? _.pic2 ?? _.pic,
            title: _.name,
            description: _.intro
        }))
    }));
}

async function $4e63e094b4590b2b$var$getTopListDetail(topListItem) {
    const res = await (0, ($parcel$interopDefault($M8GQN$axios))).get(`http://kbangserver.kuwo.cn/ksong.s`, {
        params: {
            from: "pc", fmt: "json", pn: 0, rn: 80, type: "bang", data: "content",
            id: topListItem.id, show_copyright_off: 0, pcmp4: 1, isbang: 1,
            userid: 0, httpStatus: 1
        }
    });
    return {
        ...topListItem,
        musicList: res.data.musiclist.map((_)=>({
            id: _.id,
            title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
            artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.artist || ""),
            album: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.album || ""),
            albumId: _.albumid, artistId: _.artistid, formats: _.formats
        }))
    };
}

async function $4e63e094b4590b2b$var$getMusicSheetResponseById(id, page, pagesize = 50) {
    return (await (0, ($parcel$interopDefault($M8GQN$axios))).get(`http://nplserver.kuwo.cn/pl.svc`, {
        params: {
            op: "getlistinfo", pid: id, pn: page - 1, rn: pagesize,
            encode: "utf8", keyset: "pl2012", vipver: "MUSIC_9.1.1.2_BCS2", newver: 1
        }
    })).data;
}

async function $4e63e094b4590b2b$var$importMusicSheet(urlLike) {
    let id;
    if (!id) id = urlLike.match(/https?:\/\/www\/kuwo\.cn\/playlist_detail\/(\d+)/)?.[1];
    if (!id) id = urlLike.match(/https?:\/\/m\.kuwo\.cn\/h5app\/playlist\/(\d+)/)?.[1];
    if (!id) id = urlLike.match(/^\s*(\d+)\s*$/);
    if (!id) return;
    let page = 1;
    let totalPage = 30;
    let musicList = [];
    while(page < totalPage){
        try {
            const data = await $4e63e094b4590b2b$var$getMusicSheetResponseById(id, page, 80);
            totalPage = Math.ceil(data.total / 80);
            if (isNaN(totalPage)) totalPage = 1;
            musicList = musicList.concat(data.musicList.map((_)=>({
                id: _.id,
                title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
                artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.artist || ""),
                album: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.album || ""),
                albumId: _.albumid, artistId: _.artistid, formats: _.formats
            })));
        } catch {}
        await new Promise((resolve)=> setTimeout(resolve, 200 + Math.random() * 100));
        ++page;
    }
    return musicList;
}

async function $4e63e094b4590b2b$var$getRecommendSheetTags() {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios))).get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576`)).data.data;
    const data = res.map((group)=>({
        title: group.name,
        data: group.data.map((_)=>({ id: _.id, digest: _.digest, title: _.name }))
    })).filter((item)=>item.data.length);
    const pinned = [
        { id: "1848", title: "翻唱" }, { id: "621", title: "网络" },
        { title: "伤感", id: "146" }, { title: "欧美", id: "35" }
    ];
    return { data: data, pinned: pinned };
}

async function $4e63e094b4590b2b$var$getRecommendSheetsByTag(tag, page) {
    const pageSize = 20;
    let res;
    if (tag.id) {
        if (tag.digest === "10000") res = (await (0, ($parcel$interopDefault($M8GQN$axios))).get(`http://wapi.kuwo.cn/api/pc/classify/playlist/getTagPlayList?loginUid=0&loginSid=0&appUid=76039576&pn=${page - 1}&id=${tag.id}&rn=${pageSize}`)).data.data;
        else {
            let digest43Result = (await (0, ($parcel$interopDefault($M8GQN$axios))).get(`http://mobileinterfaces.kuwo.cn/er.s?type=get_pc_qz_data&f=web&id=${tag.id}&prod=pc`)).data;
            res = {
                total: 0,
                data: digest43Result.reduce((prev, curr)=>[ ...prev, ...curr.list ])
            };
        }
    } else res = (await (0, ($parcel$interopDefault($M8GQN$axios))).get(`https://wapi.kuwo.cn/api/pc/classify/playlist/getRcmPlayList?loginUid=0&loginSid=0&appUid=76039576&&pn=${page - 1}&rn=${pageSize}&order=hot`)).data.data;
    const isEnd = page * pageSize >= res.total;
    return {
        isEnd: isEnd,
        data: res.data.map((_)=>({
            title: _.name, artist: _.uname, id: _.id,
            artwork: _.img, playCount: _.listencnt, createUserId: _.uid
        }))
    };
}

async function $4e63e094b4590b2b$var$getMusicSheetInfo(sheet, page) {
    const res = await $4e63e094b4590b2b$var$getMusicSheetResponseById(sheet.id, page, $4e63e094b4590b2b$var$pageSize);
    return {
        isEnd: page * $4e63e094b4590b2b$var$pageSize >= res.total,
        musicList: res.musiclist.map((_)=>({
            id: _.id,
            title: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.name || ""),
            artist: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.artist || ""),
            album: (0, ($parcel$interopDefault($M8GQN$he))).decode(_.album || ""),
            albumId: _.albumid, artistId: _.artistid, formats: _.formats
        }))
    };
}

const $4e63e094b4590b2b$var$qualityLevels = {
    low: "128k", standard: "320k", high: "flac", super: "flac24bit"
};

var $4e63e094b4590b2b$var$sha256 = (function() {
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
        if (this.finalized) return;
        var notString, type = typeof message;
        if (type !== 'string') {
            if (type === 'object') {
                if (message === null) throw new Error(ERROR);
                else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) message = new Uint8Array(message);
                else if (!Array.isArray(message)) {
                    if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) throw new Error(ERROR);
                }
            } else throw new Error(ERROR);
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
        if (this.finalized) return;
        this.finalized = true;
        var blocks = this.blocks, i = this.lastByteIndex;
        blocks[16] = this.block;
        blocks[i >> 2] |= EXTRA[i & 3];
        this.block = blocks[16];
        if (i >= 56) {
            if (!this.hashed) this.hash();
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

const $4e63e094b4590b2b$var$API_URL = 'https://88.lxmusic.xn--fiqs8s';
const $4e63e094b4590b2b$var$SCRIPT_MD5 = '1888f9865338afe6d5534b35171c61a4';
const $4e63e094b4590b2b$var$SECRET_KEY = 'JaJ?a7Nwk_Fgj?2o:znAkst';

function $4e63e094b4590b2b$var$generateSign(requestPath) {
    return $4e63e094b4590b2b$var$sha256(requestPath + $4e63e094b4590b2b$var$SCRIPT_MD5 + $4e63e094b4590b2b$var$SECRET_KEY);
}

async function $4e63e094b4590b2b$var$getMediaSource(musicItem, quality) {
    const qualityValue = $4e63e094b4590b2b$var$qualityLevels[quality] || '128k';
    const requestPath = `/lxmusicv4/url/kw/${musicItem.id}/${qualityValue}`;
    const sign = $4e63e094b4590b2b$var$generateSign(requestPath);
    const url = $4e63e094b4590b2b$var$API_URL + requestPath + '?sign=' + sign;
    
    try {
        const res = await (0, ($parcel$interopDefault($M8GQN$axios))).get(url, {
            headers: {
                'accept': 'application/json',
                'x-request-key': 'lxmusic',
                'user-agent': 'lx-music-mobile/2.0.0'
            },
            timeout: 15000
        });
        
        if (res.data) {
            if (!res.data || isNaN(Number(res.data.code))) throw new Error('无效的响应数据');
            
            switch (res.data.code) {
                case 0:
                case 200:
                    const musicUrl = res.data.data || res.data.url;
                    if (musicUrl) return { url: musicUrl };
                    else throw new Error('响应中未找到有效的URL');
                case 403: throw new Error('Key失效/鉴权失败');
                case 429: throw new Error('请求过速，请稍后再试');
                default: throw new Error(res.data.msg || res.data.message || '未知错误');
            }
        } else throw new Error('服务器返回空响应');
    } catch (error) {
        if (error.response) {
            const statusCode = error.response.status || error.response.statusCode || 500;
            if (statusCode === 404) throw new Error('API端点不存在');
            else if (statusCode >= 500) throw new Error(`服务器错误 (${statusCode})`);
        } else if (error.request) throw new Error('网络错误，无法连接到服务器');
        else throw new Error(`获取播放地址失败: ${error.message}`);
        throw error;
    }
}

async function $4e63e094b4590b2b$var$getMusicInfo(musicItem) {
    const res = (await (0, ($parcel$interopDefault($M8GQN$axios))).get("http://m.kuwo.cn/newh5/singles/songinfoandlrc", {
        params: { musicId: musicItem.id, httpStatus: 1 }
    })).data;
    const originalUrl = res.data.songinfo.pic;
    let picUrl;
    if (originalUrl.includes("starheads/")) picUrl = originalUrl.replace(/starheads\/\d+/, "starheads/800");
    else if (originalUrl.includes("albumcover/")) picUrl = originalUrl.replace(/albumcover\/\d+/, "albumcover/800");
    return { artwork: picUrl };
}

async function $4e63e094b4590b2b$var$search(query, page, type) {
    if (type === "music") return await $4e63e094b4590b2b$var$searchMusic(query, page);
    if (type === "album") return await $4e63e094b4590b2b$var$searchAlbum(query, page);
    if (type === "artist") return await $4e63e094b4590b2b$var$searchArtist(query, page);
    if (type === "sheet") return await $4e63e094b4590b2b$var$searchMusicSheet(query, page);
}

const $4e63e094b4590b2b$var$pluginInstance = {
    platform: "酷我(独家音源)",
    author: "竹佀＆玥然OvO",
    version: "4",
    srcUrl: "https://raw.gitcode.com/Crystim/mfp/raw/main/%E9%85%B7%E6%88%91_%E7%AB%B9%E7%8E%A5.js",
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "酷我APP：自建歌单-分享-复制试听链接，直接粘贴即可",
            "H5：复制URL并粘贴，或者直接输入纯数字歌单ID即可",
            "导入时间和歌单大小有关，请耐心等待"
        ],
        importMusicItem: []
    },
    supportedSearchType: ["music", "album", "sheet", "artist"],
    search: $4e63e094b4590b2b$var$search,
    getMediaSource: $4e63e094b4590b2b$var$getMediaSource,
    getMusicInfo: $4e63e094b4590b2b$var$getMusicInfo,
    getAlbumInfo: $4e63e094b4590b2b$var$getAlbumInfo,
    getLyric: $4e63e094b4590b2b$var$getLyric,
    getArtistWorks: $4e63e094b4590b2b$var$getArtistWorks,
    getTopLists: $4e63e094b4590b2b$var$getTopLists,
    getTopListDetail: $4e63e094b4590b2b$var$getTopListDetail,
    importMusicSheet: $4e63e094b4590b2b$var$importMusicSheet,
    getRecommendSheetTags: $4e63e094b4590b2b$var$getRecommendSheetTags,
    getRecommendSheetsByTag: $4e63e094b4590b2b$var$getRecommendSheetsByTag,
    getMusicSheetInfo: $4e63e094b4590b2b$var$getMusicSheetInfo
};

$4e63e094b4590b2b$var$search("童话镇", 1, "music").then((res)=>{
    console.log(res);
    $4e63e094b4590b2b$var$getMediaSource(res.data[0], "standard").then((res)=>{
        console.log(res);
    });
    $4e63e094b4590b2b$var$getLyric(res.data[0]).then((res)=>{
        console.log(res);
    });
});

var $4e63e094b4590b2b$export$2e2bcd8739ae039 = $4e63e094b4590b2b$var$pluginInstance;

//# sourceMappingURL=xiaowo.js.map