"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const dayjs = require("dayjs");

function formatArtwork(url) {
    if (!url) return null;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("http")) return url;
    return `https:${url}`;
}

function isMusicPaid(item) {
    if (item.is_paid === true) return true;
    if (item.isPaid === true) return true;
    if (item.price_type_enum > 0) return true;
    if (item.price_types && Array.isArray(item.price_types) && item.price_types.length > 0) return true;
    if (item.price > 0) return true;
    
    const hasPlayUrl = !!(item.play_path_64 || item.play_path_32 || item.play_path_aacv224 || 
                          item.play_path_aacv164 || item.playUrl64 || item.playUrl32 || 
                          item.playPathAacv224 || item.playPathAacv164);
    
    return !hasPlayUrl;
}

function isAlbumPaid(item) {
    if (item.is_paid === true) return true;
    if (item.isPaid === true) return true;
    if (item.price_type_enum > 0) return true;
    if (item.price_types && Array.isArray(item.price_types) && item.price_types.length > 0) return true;
    if (item.price > 0) return true;
    return false;
}

function formatMusicItem(item, artistName) {
    const isPaid = isMusicPaid(item);
    const title = isPaid ? `[付费] ${item.title}` : item.title;
    
    return {
        id: item.id || item.trackId,
        artist: artistName || item.nickname || item.artist,
        title: title,
        rawTitle: item.title,
        album: item.album_title || item.albumTitle || item.album,
        duration: item.duration,
        artwork: formatArtwork(item.cover_path || item.coverLarge || item.coverPath || item.cover),
        isPaid: isPaid,
        play_path_64: item.play_path_64,
        play_path_32: item.play_path_32,
        play_path_aacv224: item.play_path_aacv224,
        play_path_aacv164: item.play_path_aacv164,
        playUrl64: item.playUrl64,
        playUrl32: item.playUrl32,
        playPathAacv224: item.playPathAacv224,
        playPathAacv164: item.playPathAacv164,
    };
}

function formatAlbumItem(item) {
    const isPaid = isAlbumPaid(item);
    const title = isPaid ? `[付费] ${item.title}` : item.title;
    
    return {
        id: item.id || item.albumId,
        artist: item.nickname || item.artist,
        title: title,
        rawTitle: item.title,
        artwork: formatArtwork(item.cover_path || item.coverPath || item.cover || item.albumImage),
        description: item.intro || item.description,
        isPaid: isPaid,
        date: item.updated_at ? dayjs(item.updated_at).format("YYYY-MM-DD") : 
              item.updatedAt ? dayjs(item.updatedAt).format("YYYY-MM-DD") : 
              item.created_at ? dayjs(item.created_at).format("YYYY-MM-DD") : null,
    };
}

async function searchBase(query, page, core) {
    try {
        const response = await axios_1.default.get("https://www.ximalaya.com/revision/search", {
            params: {
                kw: query,
                page: page,
                core: core,
                spellchecker: true,
                condition: "relation",
                rows: 20,
                device: "web",
            },
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return response.data;
    } catch (error) {
        console.error("搜索请求失败:", error.message);
        return { ret: 500, data: { result: { response: { docs: [], totalPage: 0 } } } };
    }
}

async function searchMusic(query, page) {
    const res = await searchBase(query, page, "track");
    
    if (res.ret !== 200 || !res.data?.result?.response) {
        return {
            isEnd: true,
            data: [],
        };
    }
    
    const response = res.data.result.response;
    const docs = response.docs || [];
    const totalPage = response.totalPage || 1;
    
    const musicList = docs.map(item => formatMusicItem(item, item.nickname));
    
    return {
        isEnd: page >= totalPage,
        data: musicList,
    };
}

async function searchAlbum(query, page) {
    const res = await searchBase(query, page, "album");
    
    if (res.ret !== 200 || !res.data?.result?.response) {
        return {
            isEnd: true,
            data: [],
        };
    }
    
    const response = res.data.result.response;
    const docs = response.docs || [];
    const totalPage = response.totalPage || 1;
    
    const albumList = docs.map(formatAlbumItem);
    
    return {
        isEnd: page >= totalPage,
        data: albumList,
    };
}

async function getAlbumInfo(albumItem, page = 1) {
    try {
        const albumId = typeof albumItem === 'object' ? albumItem.id : albumItem;
        const artistName = typeof albumItem === 'object' ? albumItem.artist : null;
        const albumIsPaid = typeof albumItem === 'object' ? albumItem.isPaid : false;
        
        const response = await axios_1.default.get("http://mobwsa.ximalaya.com/mobile/playlist/album/page", {
            params: {
                albumId: albumId,
                pageId: page,
            },
            timeout: 10000,
        });
        
        const data = response.data;
        
        if (data.ret !== 0 || !data.list) {
            return {
                isEnd: true,
                albumItem: { worksNum: 0, isPaid: albumIsPaid },
                musicList: [],
            };
        }
        
        const musicList = data.list.map(item => formatMusicItem(item, artistName));
        
        const totalCount = data.totalCount || 0;
        const pageSize = data.pageSize || 20;
        const maxPageId = data.maxPageId || Math.ceil(totalCount / pageSize);
        
        return {
            isEnd: page >= maxPageId,
            albumItem: {
                worksNum: totalCount,
                isPaid: albumIsPaid,
            },
            musicList: musicList,
        };
    } catch (error) {
        console.error("获取专辑详情失败:", error.message);
        return {
            isEnd: true,
            albumItem: { worksNum: 0, isPaid: false },
            musicList: [],
        };
    }
}

async function getMediaSource(musicItem, quality) {
    try {
        console.log("获取播放地址 - 歌曲:", musicItem.rawTitle || musicItem.title);
        
        let playUrl = null;
        let sourceType = "";
        
        if (musicItem.play_path_aacv224) {
            playUrl = musicItem.play_path_aacv224;
            sourceType = "play_path_aacv224";
        } else if (musicItem.playPathAacv224) {
            playUrl = musicItem.playPathAacv224;
            sourceType = "playPathAacv224";
        } else if (musicItem.play_path_64) {
            playUrl = musicItem.play_path_64;
            sourceType = "play_path_64";
        } else if (musicItem.playUrl64) {
            playUrl = musicItem.playUrl64;
            sourceType = "playUrl64";
        } else if (musicItem.play_path_32) {
            playUrl = musicItem.play_path_32;
            sourceType = "play_path_32";
        } else if (musicItem.playUrl32) {
            playUrl = musicItem.playUrl32;
            sourceType = "playUrl32";
        } else if (musicItem.play_path_aacv164) {
            playUrl = musicItem.play_path_aacv164;
            sourceType = "play_path_aacv164";
        } else if (musicItem.playPathAacv164) {
            playUrl = musicItem.playPathAacv164;
            sourceType = "playPathAacv164";
        }
        
        if (playUrl) {
            console.log(`找到播放地址 [${sourceType}]`);
            
            if (playUrl.startsWith("//")) {
                playUrl = `https:${playUrl}`;
            }
            return { url: playUrl };
        }
        
        console.log("未找到播放地址 - 可能为付费内容");
        return null;
    } catch (error) {
        console.error("获取播放地址失败:", error.message);
        return null;
    }
}

async function search(query, page, type) {
    if (type === "music") {
        return searchMusic(query, page);
    } else if (type === "album") {
        return searchAlbum(query, page);
    }
    return {
        isEnd: true,
        data: [],
    };
}

module.exports = {
    platform: "喜马拉雅(公开API)",
    author: '竹佀',
    version: "0.6.2",
    supportedSearchType: ["music", "album"],
    srcUrl: "https://raw.gitcode.com/Crystim/mfp/raw/main/%E5%96%9C%E9%A9%AC%E6%8B%89%E9%9B%85_%E7%AB%B9%E4%BE%A3.js",
    cacheControl: "no-cache",
    search,
    getAlbumInfo,
    getMediaSource,
};