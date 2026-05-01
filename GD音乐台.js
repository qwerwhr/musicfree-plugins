"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");

const BASE_API = "https://music-api.gdstudio.xyz/api.php?btwaf=99801110";
const picUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyYTVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HRDwvdGV4dD48L3N2Zz4=";


// Get current music source from user variables
function getMusicSource() {
    const vars = env && env.getUserVariables && env.getUserVariables();
    // 默认使用 netease，支持的平台：netease, tencent, tidal, spotify, ytmusic, qobuz, joox, deezer, migu, kugou, kuwo, ximalaya, apple
    return (vars && vars.musicSource) || 'netease';
}


// Get artwork URL from pic_id
async function getArtworkUrl(pic_id, source) {
    if (!pic_id) return null;

    try {
        const response = await axios_1.default.get(BASE_API, {
            params: {
                types: 'pic',
                source: source,
                id: pic_id,
                size: 500
            },
            timeout: 5000
        });

        return response.data?.url || null;
    } catch (error) {
        console.error('[GD Studio] Get artwork error:', error.message);
        return null;
    }
}

// Format music item
function formatMusicItem(item, source) {
    return {
        id: item.id,
        title: item.name,
        artist: Array.isArray(item.artist) ? item.artist.join('/') : item.artist,
        album: item.album,
        artwork: picUrl,
        source: source,
        qualities: {
            '128k': { size: null },
            '192k': { size: null },
            '320k': { size: null },
            'flac': { size: null },
            'hires': { size: null }
        },
        _rawData: {
            ...item,
            pic_id: item.pic_id
        }
    };
}


// Format album item
function formatAlbumItem(item, source) {
    return {
        id: item.id,
        title: item.name,
        artist: Array.isArray(item.artist) ? item.artist.join('/') : item.artist,
        artwork: picUrl,
        description: '',
        source: source,
        _rawData: {
            ...item,
            pic_id: item.pic_id
        }
    };
}

// Format artist item
function formatArtistItem(item, source) {
    return {
        id: item.id,
        name: item.name,
        avatar: picUrl,
        description: '',
        source: source,
        _rawData: item
    };
}

// Search music/album/artist
async function search(query, page = 1, type) {
    const musicSource = getMusicSource();

    let searchSource = musicSource;
    let pageSize = 20;
    let formatter = formatMusicItem;

    if (type === 'album') {
        searchSource = `${musicSource}_album`;
        pageSize = 20;
        formatter = formatAlbumItem;
    } else if (type === 'artist') {
        searchSource = `${musicSource}_artist`;
        pageSize = 20;
        formatter = formatArtistItem;
    } else if (type !== 'music') {
        return { isEnd: true, data: [] };
    }

    try {
        const response = await axios_1.default.get(BASE_API, {
            params: {
                types: 'search',
                source: searchSource,
                name: query,
                count: pageSize,
                pages: page
            },
            timeout: 10000
        });

        const data = response.data;

        if (!Array.isArray(data)) {
            return { isEnd: true, data: [] };
        }

        return {
            isEnd: data.length < pageSize,
            data: data.map(item => formatter(item, musicSource))
        };
    } catch (error) {
        console.error(`[GD Studio] Search ${type} error:`, error.message);
        return { isEnd: true, data: [] };
    }
}


// Get media source (play URL)
async function getMediaSource(musicItem, quality) {
    const source = musicItem.source || getMusicSource();
    const trackId = musicItem.id;

    const qualityMap = {
        '128k': '128',
        '192k': '192',
        '320k': '320',
        'flac': '740',
        'hires': '999'
    };

    const br = qualityMap[quality] || '320';

    try {
        const response = await axios_1.default.get(BASE_API, {
            params: {
                types: 'url',
                source: source,
                id: trackId,
                br: br
            },
            timeout: 10000
        });

        const data = response.data;

        if (!data || !data.url) {
            return null;
        }

        return {
            url: data.url
        };
    } catch (error) {
        console.error('[GD Studio] Get media source error:', error.message);
        return null;
    }
}


// Get lyric
async function getLyric(musicItem) {
    const source = musicItem.source || getMusicSource();
    const lyricId = musicItem._rawData?.lyric_id || musicItem.id;

    try {
        const response = await axios_1.default.get(BASE_API, {
            params: {
                types: 'lyric',
                source: source,
                id: lyricId
            },
            timeout: 10000
        });

        const data = response.data;

        if (!data) {
            return null;
        }

        let rawLrc = data.lyric || '';

        // Add translation if available
        if (data.tlyric) {
            rawLrc += '\n' + data.tlyric;
        }

        return {
            rawLrc: rawLrc
        };
    } catch (error) {
        console.error('[GD Studio] Get lyric error:', error.message);
        return null;
    }
}


// Get album info
async function getAlbumInfo(albumItem, page = 1) {
    const source = albumItem.source || getMusicSource();
    const albumName = albumItem.title || albumItem.name;

    try {
        const response = await axios_1.default.get(BASE_API, {
            params: {
                types: 'search',
                source: `${source}_album`,
                name: albumName,
                count: 50,
                pages: page
            },
            timeout: 10000
        });

        const data = response.data;

        if (!Array.isArray(data)) {
            return { isEnd: true, musicList: [] };
        }

        return {
            isEnd: data.length < 50,
            musicList: data.map(item => formatMusicItem(item, source))
        };
    } catch (error) {
        console.error('[GD Studio] Get album info error:', error.message);
        return { isEnd: true, musicList: [] };
    }
}


// Get music info (fetch real artwork when needed)
async function getMusicInfo(musicItem) {
    const source = musicItem.source || getMusicSource();
    const picId = musicItem._rawData?.pic_id;

    if (!picId) {
        return { artwork: picUrl };
    }

    const artworkUrl = await getArtworkUrl(picId, source);
    return {
        artwork: artworkUrl || picUrl
    };
}


// Get artist works
async function getArtistWorks(artistItem, page = 1, type) {
    const source = artistItem.source || getMusicSource();
    const artistId = artistItem.id;

    if (type === 'music') {
        try {
            const response = await axios_1.default.get(BASE_API, {
                params: {
                    types: 'search',
                    source: source,
                    name: artistItem.name,
                    count: 50,
                    pages: page
                },
                timeout: 10000
            });

            const data = response.data;

            if (!Array.isArray(data)) {
                return { isEnd: true, data: [] };
            }

            return {
                isEnd: data.length < 50,
                data: data.map(item => formatMusicItem(item, source))
            };
        } catch (error) {
            console.error('[GD Studio] Get artist music error:', error.message);
            return { isEnd: true, data: [] };
        }
    } else if (type === 'album') {
        try {
            const response = await axios_1.default.get(BASE_API, {
                params: {
                    types: 'search',
                    source: `${source}_album`,
                    name: artistItem.name,
                    count: 30,
                    pages: page
                },
                timeout: 10000
            });

            const data = response.data;

            if (!Array.isArray(data)) {
                return { isEnd: true, data: [] };
            }

            return {
                isEnd: data.length < 30,
                data: data.map(item => formatAlbumItem(item, source))
            };
        } catch (error) {
            console.error('[GD Studio] Get artist albums error:', error.message);
            return { isEnd: true, data: [] };
        }
    }

    return { isEnd: true, data: [] };
}


// Module exports
module.exports = {
    platform: "GD音乐台",
    author: 'Toskysun',
    version: "1.0.0",
    srcUrl: "https://music.gdstudio.xyz",
    cacheControl: "no-cache",
    description: "GD音乐台 API 插件\n\n" +
        "数据来源：GD音乐台 (music.gdstudio.xyz)\n" +
        "感谢 GD Studio 提供的音乐API服务\n" +
        "基于开源项目 Meting & MKOnlineMusicPlayer\n\n" +
        "使用须知：\n" +
        "本插件仅供学习交流使用，请勿用于商业用途\n" +
        "数据来自网络，仅限学习参考，严禁下载、传播或商用\n" +
        "API访问频率限制：5分钟内不超过60次请求\n" +
        "搜索列表使用默认封面以减少API请求，播放时显示真实封面\n" +
        "若使用本插件，请注明出处\"GD音乐台(music.gdstudio.xyz)\"\n" +
        "如遇问题可QQ私信：473560795\n\n" +
        "支持的音乐源（共13个平台）：\n\n" +
        "稳定音乐源（推荐）：\n" +
        "netease - 网易云音乐\n" +
        "kuwo - 酷我音乐\n" +
        "joox - JOOX音乐\n\n" +
        "其他音乐源：\n" +
        "tencent - QQ音乐\n" +
        "migu - 咪咕音乐\n" +
        "kugou - 酷狗音乐\n" +
        "ximalaya - 喜马拉雅\n" +
        "apple - Apple Music\n" +
        "tidal - Tidal\n" +
        "spotify - Spotify\n" +
        "ytmusic - YouTube Music\n" +
        "qobuz - Qobuz\n" +
        "deezer - Deezer\n\n" +
        "注意：部分音乐源可能失效，建议优先使用稳定源\n\n" +
        "使用方法：\n" +
        "在插件设置中找到\"用户变量\"\n" +
        "在\"音乐源\"输入框中输入平台代码（如：netease）\n" +
        "留空则默认使用 netease",

    // User variables for music source selection
    userVariables: [
        {
            key: "musicSource",
            name: "音乐源",
            hint: "留空默认netease，详见插件说明"
        }
    ],

    // Supported search types
    supportedSearchType: ["music", "album", "artist"],

    // Plugin methods
    search,
    getMediaSource,
    getLyric,
    getAlbumInfo,
    getArtistWorks,
    getMusicInfo
};
