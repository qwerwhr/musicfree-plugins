"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");

const THIRD_PARTY_API_BASE = "https://api-v2.cenguigui.cn/api/music/dg_ximalayamusic.php";
const ALBUM_API_BASE = "https://api-v2.cenguigui.cn/api/music/ximalaya.php";

const albumCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function isPaidContent(item) {
    if (item.isPaid === true || item.paid === true || item.isVip === true || item.vip === true) {
        return true;
    }
    
    const title = item.title || '';
    const paidKeywords = ['付费', 'VIP', '会员', '专享', '精品', '订阅', '购买', '收费'];
    for (const keyword of paidKeywords) {
        if (title.includes(keyword)) {
            return true;
        }
    }
    
    const intro = item.intro || item.description || '';
    if (intro.includes('付费') || intro.includes('VIP') || intro.includes('购买')) {
        return true;
    }
    
    return false;
}

function addPaidTag(title, isPaid) {
    if (isPaid) {
        return `[付费] ${title}`;
    }
    return title;
}

function formatMusicItem(item, index) {
    const isPaid = isPaidContent(item);
    
    return {
        id: item.trackId || item.id,
        title: addPaidTag(item.title, isPaid),
        artist: item.Nickname || item.nickname,
        album: item.album_title ? item.album_title.replace(/^来源专辑-/, '') : (item.albumName || ''),
        artwork: item.cover ? (item.cover.startsWith("//") ? `https:${item.cover}` : item.cover) : null,
        duration: item.duration || 0,
        trackId: item.trackId || item.id,
        isPaid: isPaid,
        _n: item.n || (index + 1),
        url: null,
        _raw: {
            albumId: item.album_id || item.albumId,
            originalTitle: item.title,
            nickname: item.Nickname || item.nickname
        }
    };
}

function formatAlbumItem(item, index) {
    const isPaid = isPaidContent(item);
    
    return {
        id: item.albumId,
        title: addPaidTag(item.title, isPaid),
        artist: item.Nickname,
        artwork: item.cover ? (item.cover.startsWith("//") ? `https:${item.cover}` : item.cover) : null,
        type: item.type || 'album',
        description: item.intro,
        albumId: item.albumId,
        trackCount: item.trackCount || 0,
        isPaid: isPaid,
        isAlbum: true,
        _raw: {
            originalTitle: item.title,
            nickname: item.Nickname
        }
    };
}

async function search(query, page, type) {
    console.log(`[调试] 搜索类型: ${type}, 关键词: ${query}, 页码: ${page}`);
    
    if (type === "album" || type === "music_album") {
        return searchAlbums(query, page);
    } else {
        return searchMusic(query, page);
    }
}

async function searchAlbums(query, page) {
    try {
        console.log(`[调试] 搜索专辑: ${query}, 页码: ${page}`);
        
        const response = await axios_1.default.get(ALBUM_API_BASE, {
            params: {
                name: query
            },
            timeout: 8000
        });

        const searchResult = response.data;
        const allAlbums = searchResult?.data || [];
        
        console.log(`[调试] 搜索到 ${allAlbums.length} 个专辑`);

        const pageSize = 20;
        const startIndex = (page - 1) * pageSize;
        const pageData = allAlbums.slice(startIndex, startIndex + pageSize);
        const isEnd = startIndex + pageSize >= allAlbums.length;

        const formattedData = pageData.map((item, index) => {
            return formatAlbumItem(item, startIndex + index);
        });

        const paidCount = formattedData.filter(item => item.isPaid).length;
        console.log(`[调试] 本页专辑: 共${formattedData.length}个, 付费${paidCount}个`);

        return {
            isEnd: isEnd,
            data: formattedData,
        };
    } catch (error) {
        console.error("[喜马拉雅] 搜索专辑失败:", error.message);
        return { isEnd: true, data: [] };
    }
}

async function searchMusic(query, page) {
    try {
        console.log(`[调试] 搜索音轨: ${query}, 页码: ${page}`);
        
        const response = await axios_1.default.get(THIRD_PARTY_API_BASE, {
            params: {
                msg: query,
                num: 30,
                type: 'json'
            },
            timeout: 8000
        });

        const searchResult = response.data;
        const allTracks = searchResult?.data || [];
        
        console.log(`[调试] 搜索到 ${allTracks.length} 条音轨`);

        const pageSize = 20;
        const startIndex = (page - 1) * pageSize;
        const pageData = allTracks.slice(startIndex, startIndex + pageSize);
        const isEnd = startIndex + pageSize >= allTracks.length;

        const formattedData = pageData.map((item, index) => {
            return formatMusicItem(item, startIndex + index + 1);
        });

        const paidCount = formattedData.filter(item => item.isPaid).length;
        console.log(`[调试] 本页音轨: 共${formattedData.length}条, 付费${paidCount}条`);

        return {
            isEnd: isEnd,
            data: formattedData,
        };
    } catch (error) {
        console.error("[喜马拉雅] 搜索音轨失败:", error.message);
        return { isEnd: true, data: [] };
    }
}

async function getAlbumInfo(albumItem, page) {
    console.log(`[调试] 获取专辑详情: ${albumItem.id || albumItem.albumId}, 页码: ${page}`);
    
    try {
        const albumId = albumItem.id || albumItem.albumId;
        const pageSize = 30;
        const cacheKey = `album_${albumId}`;
        
        let allTracks = [];
        let totalTracks = 0;
        
        if (albumCache.has(cacheKey)) {
            const cached = albumCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                allTracks = cached.data;
                totalTracks = allTracks.length;
                console.log(`[调试] 使用缓存: ${totalTracks} 条音频`);
            } else {
                albumCache.delete(cacheKey);
            }
        }
        
        if (allTracks.length === 0) {
            console.log(`[调试] 从API获取专辑数据，可能耗时较长...`);
            
            const response = await axios_1.default.get(ALBUM_API_BASE, {
                params: {
                    albumId: albumId
                },
                timeout: 30000,
                maxContentLength: 50 * 1024 * 1024,
                validateStatus: function (status) {
                    return status >= 200 && status < 300;
                }
            });

            const result = response.data;
            
            if (!result || !result.data) {
                console.log("[错误] 返回数据格式不正确");
                return { isEnd: true, albumItem: {}, musicList: [] };
            }

            allTracks = result.data || [];
            totalTracks = allTracks.length;
            
            albumCache.set(cacheKey, {
                data: allTracks,
                timestamp: Date.now()
            });
            
            console.log(`[调试] 专辑总共包含 ${totalTracks} 条音频`);
        }

        const startIndex = (page - 1) * pageSize;
        
        if (startIndex >= totalTracks) {
            return {
                isEnd: true,
                albumItem: {
                    id: albumId,
                    title: albumItem.title,
                    artist: albumItem.artist,
                    artwork: albumItem.artwork,
                    description: albumItem.description,
                    totalTracks: totalTracks,
                    isPaid: albumItem.isPaid || false
                },
                musicList: []
            };
        }

        const pageData = allTracks.slice(startIndex, Math.min(startIndex + pageSize, totalTracks));
        const isEnd = startIndex + pageSize >= totalTracks;

        const musicList = pageData.map((item, index) => {
            const isPaid = isPaidContent(item) || albumItem.isPaid || false;
            
            return formatMusicItem({
                ...item,
                album_title: albumItem.title,
                Nickname: item.Nickname || albumItem.artist,
                isPaid: isPaid
            }, startIndex + index + 1);
        });

        const paidCount = musicList.filter(item => item.isPaid).length;
        console.log(`[调试] 本页音频: 共${musicList.length}条, 付费${paidCount}条`);

        const albumInfo = {
            id: albumId,
            title: albumItem.title,
            artist: albumItem.artist,
            artwork: albumItem.artwork,
            description: albumItem.description,
            totalTracks: totalTracks,
            isPaid: albumItem.isPaid || false,
            paidCount: paidCount
        };

        console.log(`[调试] 返回第 ${page} 页, ${musicList.length} 条, 是否结束: ${isEnd}`);

        return {
            isEnd: isEnd,
            albumItem: albumInfo,
            musicList: musicList
        };
        
    } catch (error) {
        console.error("[喜马拉雅] 获取专辑详情失败:", error.message);
        
        let errorMessage = "加载失败";
        if (error.code === 'ECONNABORTED') {
            errorMessage = "请求超时，数据量过大";
        } else if (error.message.includes('maxContentLength')) {
            errorMessage = "数据过大，无法加载";
        }
        
        return { 
            isEnd: true, 
            albumItem: {
                id: albumItem.id || albumItem.albumId,
                title: albumItem.title,
                artist: albumItem.artist,
                artwork: albumItem.artwork,
                description: errorMessage,
                isPaid: albumItem.isPaid || false
            }, 
            musicList: [] 
        };
    }
}

async function getMediaSource(musicItem, quality) {
    console.log("========== getMediaSource 被调用 ==========");
    console.log(`音乐项:`, JSON.stringify(musicItem, null, 2));
    
    const trackId = musicItem.trackId || musicItem.id;
    if (!trackId) {
        console.log("[错误] 没有trackId");
        return null;
    }
    
    try {
        const response = await axios_1.default.get(ALBUM_API_BASE, {
            params: {
                trackId: trackId
            },
            timeout: 8000
        });

        console.log(`[调试] API响应:`, JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.code === 200) {
            const playUrl = response.data.url;
            if (playUrl) {
                console.log(`获取到播放地址: ${playUrl}`);
                return { url: playUrl };
            }
        }
        
        return null;
        
    } catch (error) {
        console.error(`获取失败:`, error.message);
        return null;
    }
}

function clearCache() {
    albumCache.clear();
    console.log("[调试] 缓存已清理");
}

async function getArtistWorks() { return { isEnd: true, data: [] }; }
async function getLyric() { return null; }

module.exports = {
    platform: "喜马拉雅(笭鬼鬼API)",
    author: '竹佀',
    version: "1.6",
    srcUrl: "https://raw.gitcode.com/Crystim/mfp/raw/main/%E5%96%9C%E9%A9%AC%E6%8B%89%E9%9B%85_%E7%AC%AD%E9%AC%BC%E9%AC%BC.js",
    supportedSearchType: ["music", "album", "music_album"],
    cacheControl: "no-cache",
    search,
    getAlbumInfo,
    getMediaSource,
    getArtistWorks,
    getLyric,
    clearCache,
};