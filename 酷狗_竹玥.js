var $hTj9b$axios = require("axios");
var $hTj9b$cheerio = require("cheerio");
var $hTj9b$cryptojs = require("crypto-js");
var $hTj9b$he = require("he");

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

$parcel$export(module.exports, "default", () => $28c810e89c2349b3$export$2e2bcd8739ae039);

const $28c810e89c2349b3$var$pageSize = 20;

function $28c810e89c2349b3$var$formatMusicItem(_) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    return {
        id: (_d = _.FileHash) !== null && _d !== void 0 ? _d : _.Grp[0].FileHash,
        title: (_a = _.SongName) !== null && _a !== void 0 ? _a : _.OriSongName,
        artist: (_b = _.SingerName) !== null && _b !== void 0 ? _b : _.Singers[0].name,
        album: (_c = _.AlbumName) !== null && _c !== void 0 ? _c : _.Grp[0].AlbumName,
        album_id: (_e = _.AlbumID) !== null && _e !== void 0 ? _e : _.Grp[0].AlbumID,
        album_audio_id: 0,
        duration: _.Duration,
        artwork: ((_f = _.Image) !== null && _f !== void 0 ? _f : _.Grp[0].Image).replace("{size}", "1080"),
        "320hash": (_i = _.HQFileHash) !== null && _i !== void 0 ? _i : undefined,
        sqhash: (_g = _.SQFileHash) !== null && _g !== void 0 ? _g : undefined,
        ResFileHash: (_h = _.ResFileHash) !== null && _h !== void 0 ? _h : undefined
    };
}

function $28c810e89c2349b3$var$formatMusicItem2(_) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        id: _.hash,
        title: _.songname,
        artist: (_a = _.singername) !== null && _a !== void 0 ? _a : ((_c = (_b = _.authors) === null || _b === void 0 ? void 0 : _b.map((_)=>{
            var _a;
            return (_a = _ === null || _ === void 0 ? void 0 : _.author_name) !== null && _a !== void 0 ? _a : "";
        })) === null || _c === void 0 ? void 0 : _c.join(", ")) || ((_f = (_e = (_d = _.filename) === null || _d === void 0 ? void 0 : _d.split("-")) === null || _e === void 0 ? void 0 : _e[0]) === null || _f !== void 0 ? _f : _f.trim()),
        album: (_g = _.album_name) !== null && _g !== void 0 ? _g : _.remark,
        album_id: _.album_id,
        album_audio_id: _.album_audio_id,
        artwork: _.album_sizable_cover ? _.album_sizable_cover.replace("{size}", "400") : undefined,
        duration: _.duration,
        "320hash": _["320hash"],
        sqhash: _.sqhash,
        origin_hash: _.origin_hash
    };
}

function $28c810e89c2349b3$var$formatImportMusicItem(_) {
    var _a, _b, _c, _d, _e, _f, _g;
    let title = _.name;
    const singerName = _.singername;
    if (singerName && title) {
        const index = title.indexOf(singerName);
        if (index !== -1) title = (_a = title.substring(index + singerName.length + 2)) === null || _a === void 0 ? void 0 : _a.trim();
        if (!title) title = singerName;
    }
    const qualites = _.relate_goods;
    return {
        id: _.hash,
        title: title,
        artist: singerName,
        album: (_b = _.albumname) !== null && _b !== void 0 ? _b : "",
        album_id: _.album_id,
        album_audio_id: _.album_audio_id,
        artwork: (_d = (_c = _ === null || _ === void 0 ? void 0 : _.info) === null || _c === void 0 ? void 0 : _c.image) === null || _d === void 0 ? void 0 : _d.replace("{size}", "400"),
        "320hash": (_e = qualites === null || qualites === void 0 ? void 0 : qualites[1]) === null || _e === void 0 ? void 0 : _e.hash,
        sqhash: (_f = qualites === null || qualites === void 0 ? void 0 : qualites[2]) === null || _f === void 0 ? void 0 : _f.hash,
        origin_hash: (_g = qualites === null || qualites === void 0 ? void 0 : qualites[3]) === null || _g === void 0 ? void 0 : _g.hash
    };
}

const $28c810e89c2349b3$var$headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.9"
};

async function $28c810e89c2349b3$var$searchMusic(query, page) {
    const res = (await (0, ($parcel$interopDefault($hTj9b$axios))).get("https://songsearch.kugou.com/song_search_v2", {
        headers: $28c810e89c2349b3$var$headers,
        params: {
            keyword: query,
            page: page,
            pagesize: $28c810e89c2349b3$var$pageSize,
            userid: 0,
            clientver: "",
            platform: "WebFilter",
            filter: 2,
            iscorrection: 1,
            privilege_filter: 0,
            area_code: 1
        }
    })).data;
    const songs = res.data.lists.map($28c810e89c2349b3$var$formatMusicItem);
    return {
        isEnd: page * $28c810e89c2349b3$var$pageSize >= res.data.total,
        data: songs
    };
}

async function $28c810e89c2349b3$var$searchAlbum(query, page) {
    const res = (await (0, ($parcel$interopDefault($hTj9b$axios))).get("http://msearch.kugou.com/api/v3/search/album", {
        headers: $28c810e89c2349b3$var$headers,
        params: {
            version: 9108,
            iscorrection: 1,
            highlight: "em",
            plat: 0,
            keyword: query,
            pagesize: 20,
            page: page,
            sver: 2,
            with_res_tag: 0
        }
    })).data;
    const albums = res.data.info.map((_)=>{
        var _a, _b;
        return {
            id: _.albumid,
            artwork: (_a = _.imgurl) === null || _a === void 0 ? void 0 : _a.replace("{size}", "400"),
            artist: _.singername,
            title: (0, $hTj9b$cheerio.load)(_.albumname).text(),
            description: _.intro,
            date: (_b = _.publishtime) === null || _b === void 0 ? void 0 : _b.slice(0, 10)
        };
    });
    return {
        isEnd: page * 20 >= res.data.total,
        data: albums
    };
}

async function $28c810e89c2349b3$var$searchMusicSheet(query, page) {
    const res = (await (0, ($parcel$interopDefault($hTj9b$axios))).get("http://mobilecdn.kugou.com/api/v3/search/special", {
        headers: $28c810e89c2349b3$var$headers,
        params: {
            format: "json",
            keyword: query,
            page: page,
            pagesize: $28c810e89c2349b3$var$pageSize,
            showtype: 1
        }
    })).data;
    const sheets = res.data.info.map((item)=>({
            title: item.specialname,
            createAt: item.publishtime,
            description: item.intro,
            artist: item.nickname,
            coverImg: item.imgurl,
            gid: item.gid,
            playCount: item.playcount,
            id: item.specialid,
            worksNum: item.songcount
        }));
    return {
        isEnd: page * $28c810e89c2349b3$var$pageSize >= res.data.total,
        data: sheets
    };
}

const $28c810e89c2349b3$var$qualityLevels = {
    low: "128k",
    standard: "320k",
    high: "flac",
    super: "flac24bit"
};

const $28c810e89c2349b3$var$sha256 = (function() {
  "use strict";
  var HEX_CHARS = '0123456789abcdef'.split('');
  
  function Sha256() {
    this.blocks = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
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
    
    var notString = typeof message !== 'string';
    var blocks = this.blocks;
    
    for (var i = 0; i < message.length; i++) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = 
        blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = 
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }
      
      var code = notString ? message[i] : message.charCodeAt(i);
      blocks[this.start >> 2] |= code << (24 - (this.start % 4) * 8);
      this.start++;
      
      if (this.start === 64) {
        this.block = blocks[16];
        this.start = 0;
        this.hash();
        this.hashed = true;
      }
    }
    
    this.bytes += message.length;
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha256.prototype.finalize = function() {
    if (this.finalized) return;
    this.finalized = true;
    
    var blocks = this.blocks;
    var i = this.start;
    blocks[16] = this.block;
    blocks[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
    this.block = blocks[16];
    
    if (i >= 56) {
      if (!this.hashed) this.hash();
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = 
      blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = 
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha256.prototype.hash = function() {
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
      0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
      0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
      0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3,
        e = this.h4, f = this.h5, g = this.h6, h = this.h7,
        blocks = this.blocks;
    
    for (var j = 0; j < 64; j++) {
      if (j >= 16) {
        var w0 = blocks[j - 15];
        var w1 = blocks[j - 2];
        var s0 = ((w0 >>> 7) | (w0 << 25)) ^ ((w0 >>> 18) | (w0 << 14)) ^ (w0 >>> 3);
        var s1 = ((w1 >>> 17) | (w1 << 15)) ^ ((w1 >>> 19) | (w1 << 13)) ^ (w1 >>> 10);
        blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1;
      }
      
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ ((~e) & g);
      var temp1 = h + S1 + ch + K[j] + (blocks[j] >>> 0);
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var temp2 = S0 + maj;
      
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    
    this.h0 = (this.h0 + a) >>> 0;
    this.h1 = (this.h1 + b) >>> 0;
    this.h2 = (this.h2 + c) >>> 0;
    this.h3 = (this.h3 + d) >>> 0;
    this.h4 = (this.h4 + e) >>> 0;
    this.h5 = (this.h5 + f) >>> 0;
    this.h6 = (this.h6 + g) >>> 0;
    this.h7 = (this.h7 + h) >>> 0;
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
    return new Sha256().update(message).hex();
  };
})();

const $28c810e89c2349b3$var$API_URL = "https://88.lxmusic.xn--fiqs8s";
const $28c810e89c2349b3$var$API_KEY = "lxmusic";
const $28c810e89c2349b3$var$SCRIPT_MD5 = "1888f9865338afe6d5534b35171c61a4";
const $28c810e89c2349b3$var$SECRET_KEY = 'JaJ?a7Nwk_Fgj?2o:znAkst';

const $28c810e89c2349b3$var$generateSign = (requestPath) => {
  return $28c810e89c2349b3$var$sha256(requestPath + $28c810e89c2349b3$var$SCRIPT_MD5 + $28c810e89c2349b3$var$SECRET_KEY);
}

async function $28c810e89c2349b3$var$getMediaSource(musicItem, quality) {
  const targetQuality = $28c810e89c2349b3$var$qualityLevels[quality] || "320k";
  
  const requestPath = `/lxmusicv4/url/kg/${musicItem.id}/${targetQuality}`;
  
  const sign = $28c810e89c2349b3$var$generateSign(requestPath);
  
  const fullUrl = `${$28c810e89c2349b3$var$API_URL}${requestPath}?sign=${sign}`;
  
  try {
    const response = await (0, ($parcel$interopDefault($hTj9b$axios))).get(fullUrl, {
      headers: {
        'accept': 'application/json',
        'x-request-key': $28c810e89c2349b3$var$API_KEY,
        'user-agent': 'lx-music-request/2.0.0'
      },
      timeout: 15000
    });
    
    const { data } = response;
    
    if (data && (data.code === 0 || data.code === 200)) {
      const musicUrl = data.data || data.url;
      if (musicUrl) {
        return {
          url: musicUrl
        };
      } else {
        throw new Error('API响应中未找到有效的URL');
      }
    } else if (data && data.code) {
      switch(data.code) {
        case 1:
          throw new Error('IP被封禁');
        case 2:
          throw new Error(data.msg || '获取音乐链接失败');
        case 4:
          throw new Error('服务器内部错误');
        case 5:
          throw new Error('请求过于频繁，请稍后再试');
        case 6:
          throw new Error('参数错误');
        default:
          throw new Error(data.msg || `API错误 (code: ${data.code})`);
      }
    } else {
      throw new Error('API返回无效响应');
    }
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new Error('API端点不存在');
      } else if (status >= 500) {
        throw new Error(`服务器错误 (${status})`);
      } else if (status === 403) {
        throw new Error('访问被拒绝，请检查API密钥');
      }
    } else if (error.request) {
      throw new Error('网络请求失败，请检查网络连接');
    }
    throw new Error(`获取播放链接失败: ${error.message}`);
  }
}

async function $28c810e89c2349b3$var$getTopLists() {
    const lists = (await (0, ($parcel$interopDefault($hTj9b$axios))).get("http://mobilecdnbj.kugou.com/api/v3/rank/list?version=9108&plat=0&showtype=2&parentid=0&apiver=6&area_code=1&withsong=0&with_res_tag=0", {
        headers: $28c810e89c2349b3$var$headers
    })).data.data.info;
    const res = [
        {
            title: "热门榜单",
            data: []
        },
        {
            title: "特色音乐榜",
            data: []
        },
        {
            title: "全球榜",
            data: []
        }
    ];
    const extra = {
        title: "其他",
        data: []
    };
    lists.forEach((item)=>{
        var _a, _b, _c, _d;
        if (item.classify === 1 || item.classify === 2) res[0].data.push({
            id: item.rankid,
            description: item.intro,
            coverImg: (_a = item.imgurl) === null || _a === void 0 ? void 0 : _a.replace("{size}", "400"),
            title: item.rankname
        });
        else if (item.classify === 3 || item.classify === 5) res[1].data.push({
            id: item.rankid,
            description: item.intro,
            coverImg: (_b = item.imgurl) === null || _b === void 0 ? void 0 : _b.replace("{size}", "400"),
            title: item.rankname
        });
        else if (item.classify === 4) res[2].data.push({
            id: item.rankid,
            description: item.intro,
            coverImg: (_c = item.imgurl) === null || _c === void 0 ? void 0 : _c.replace("{size}", "400"),
            title: item.rankname
        });
        else extra.data.push({
            id: item.rankid,
            description: item.intro,
            coverImg: (_d = item.imgurl) === null || _d === void 0 ? void 0 : _d.replace("{size}", "400"),
            title: item.rankname
        });
    });
    if (extra.data.length !== 0) res.push(extra);
    return res;
}

async function $28c810e89c2349b3$var$getTopListDetail(topListItem) {
    const res = await (0, ($parcel$interopDefault($hTj9b$axios))).get(`http://mobilecdnbj.kugou.com/api/v3/rank/song?version=9108&ranktype=0&plat=0&pagesize=100&area_code=1&page=1&volid=35050&rankid=${topListItem.id}&with_res_tag=0`, {
        headers: $28c810e89c2349b3$var$headers
    });
    return Object.assign(Object.assign({}, topListItem), {
        musicList: res.data.data.info.map($28c810e89c2349b3$var$formatMusicItem2)
    });
}

async function $28c810e89c2349b3$var$getLyricDownload(lyrdata) {
    const result = (await (0, ($parcel$interopDefault($hTj9b$axios)))({
        url: `http://lyrics.kugou.com/download?ver=1&client=pc&id=${lyrdata.id}&accesskey=${lyrdata.accessKey}&fmt=lrc&charset=utf8`,
        headers: {
            "KG-RC": 1,
            "KG-THash": "expand_search_manager.cpp:852736169:451",
            "User-Agent": "KuGou2012-9020-ExpandSearchManager"
        },
        method: "get",
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    return {
        rawLrc: (0, ($parcel$interopDefault($hTj9b$he))).decode((0, ($parcel$interopDefault($hTj9b$cryptojs))).enc.Base64.parse(result.content).toString((0, ($parcel$interopDefault($hTj9b$cryptojs))).enc.Utf8))
    };
}

async function $28c810e89c2349b3$var$getLyric(musicItem) {
    const result = (await (0, ($parcel$interopDefault($hTj9b$axios)))({
        url: `http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${musicItem.title}&hash=${musicItem.id}&timelength=${musicItem.duration}`,
        headers: {
            "KG-RC": 1,
            "KG-THash": "expand_search_manager.cpp:852736169:451",
            "User-Agent": "KuGou2012-9020-ExpandSearchManager"
        },
        method: "get",
        xsrfCookieName: "XSRF-TOKEN",
        withCredentials: true
    })).data;
    const info = result.candidates[0];
    return await $28c810e89c2349b3$var$getLyricDownload({
        id: info.id,
        accessKey: info.accesskey
    });
}

async function $28c810e89c2349b3$var$getAlbumInfo(albumItem, page = 1) {
    const res = (await (0, ($parcel$interopDefault($hTj9b$axios))).get("http://mobilecdn.kugou.com/api/v3/album/song", {
        params: {
            version: 9108,
            albumid: albumItem.id,
            plat: 0,
            pagesize: 100,
            area_code: 1,
            page: page,
            with_res_tag: 0
        }
    })).data;
    return {
        isEnd: page * 100 >= res.data.total,
        albumItem: {
            worksNum: res.data.total
        },
        musicList: res.data.info.map((_)=>{
            var _a;
            const [artist, songname] = _.filename.split("-");
            return {
                id: _.hash,
                title: songname.trim(),
                artist: artist.trim(),
                album: (_a = _.album_name) !== null && _a !== void 0 ? _a : _.remark,
                album_id: _.album_id,
                album_audio_id: _.album_audio_id,
                artwork: albumItem.artwork,
                "320hash": _.HQFileHash,
                sqhash: _.SQFileHash,
                origin_hash: _.id
            };
        })
    };
}

async function $28c810e89c2349b3$var$importMusicSheet(urlLike) {
    var _a;
    let id = (_a = urlLike.match(/^(?:.*?)(\d+)(?:.*?)$/)) === null || _a === void 0 ? void 0 : _a[1];
    let musicList = [];
    if (!id) return;
    let res = await (0, ($parcel$interopDefault($hTj9b$axios))).post(`http://t.kugou.com/command/`, {
        appid: 1001,
        clientver: 9020,
        mid: "21511157a05844bd085308bc76ef3343",
        clienttime: 640612895,
        key: "36164c4015e704673c588ee202b9ecb8",
        data: id
    });
    if (res.status === 200 && res.data.status === 1) {
        let data = res.data.data;
        let response = await (0, ($parcel$interopDefault($hTj9b$axios))).post(`http://www2.kugou.kugou.com/apps/kucodeAndShare/app/`, {
            appid: 1001,
            clientver: 10112,
            mid: "70a02aad1ce4648e7dca77f2afa7b182",
            clienttime: 722219501,
            key: "381d7062030e8a5a94cfbe50bfe65433",
            data: {
                id: data.info.id,
                type: 3,
                userid: data.info.userid,
                collect_type: data.info.collect_type,
                page: 1,
                pagesize: data.info.count
            }
        });
        if (response.status === 200 && response.data.status === 1) {
            let resource = [];
            response.data.data.forEach((song)=>{
                resource.push({
                    album_audio_id: 0,
                    album_id: "0",
                    hash: song.hash,
                    id: 0,
                    name: song.filename.replace(".mp3", ""),
                    page_id: 0,
                    type: "audio"
                });
            });
            let postData = {
                appid: 1001,
                area_code: "1",
                behavior: "play",
                clientver: "10112",
                dfid: "2O3jKa20Gdks0LWojP3ly7ck",
                mid: "70a02aad1ce4648e7dca77f2afa7b182",
                need_hash_offset: 1,
                relate: 1,
                resource: resource,
                token: "",
                userid: "0",
                vip: 0
            };
            var result = await (0, ($parcel$interopDefault($hTj9b$axios))).post(`https://gateway.kugou.com/v2/get_res_privilege/lite?appid=1001&clienttime=1668883879&clientver=10112&dfid=2O3jKa20Gdks0LWojP3ly7ck&mid=70a02aad1ce4648e7dca77f2afa7b182&userid=390523108&uuid=92691C6246F86F28B149BAA1FD370DF1`, postData, {
                headers: {
                    "x-router": "media.store.kugou.com"
                }
            });
            if (response.status === 200 && response.data.status === 1) musicList = result.data.data.map($28c810e89c2349b3$var$formatImportMusicItem);
        }
    }
    return musicList;
}

async function $28c810e89c2349b3$var$search(query, page, type) {
    if (type === "music") return await $28c810e89c2349b3$var$searchMusic(query, page);
    else if (type === "album") return await $28c810e89c2349b3$var$searchAlbum(query, page);
    else if (type === "sheet") return await $28c810e89c2349b3$var$searchMusicSheet(query, page);
}

const $28c810e89c2349b3$var$pluginInstance = {
    platform: "酷狗(独家音源)",
    author: "竹佀＆玥然OvO",
    version: "4",
    srcUrl: "https://raw.gitcode.com/Crystim/mfp/raw/main/%E9%85%B7%E7%8B%97_%E7%AB%B9%E7%8E%A5.js",
    cacheControl: "no-cache",
    primaryKey: [
        "id",
        "album_id",
        "album_audio_id"
    ],
    hints: {
        importMusicSheet: [
            "仅支持酷狗APP通过酷狗码导入，输入纯数字酷狗码即可。",
            "导入时间和歌单大小有关，请耐心等待"
        ],
        importMusicItem: []
    },
    supportedSearchType: [
        "music",
        "album",
        "sheet"
    ],
    search: $28c810e89c2349b3$var$search,
    getMediaSource: $28c810e89c2349b3$var$getMediaSource,
    getTopLists: $28c810e89c2349b3$var$getTopLists,
    getLyric: $28c810e89c2349b3$var$getLyric,
    getTopListDetail: $28c810e89c2349b3$var$getTopListDetail,
    getAlbumInfo: $28c810e89c2349b3$var$getAlbumInfo,
    importMusicSheet: $28c810e89c2349b3$var$importMusicSheet
};

var $28c810e89c2349b3$export$2e2bcd8739ae039 = $28c810e89c2349b3$var$pluginInstance;