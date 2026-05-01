const axios = require('axios');

/**
 * 秋秋插件配置
 * 版本: 2.1.0
 * 作者：简云
 * 邮箱：603212202@qq.com
 * 创建时间：2026/1/21 am
 */
var CONFIG = {
    platform: "QQ Vip",
    author: "简云",
    version: "2.1.0",
    srcUrl: "https://gitee.com/csdjrw/music-free-plugin/raw/master/qq.vip.js",
    primaryKey: ["id","mid"],
    cacheControl: "no-store",
    hints: {
        importMusicItem: ["请输入QQ歌曲分享链接或 hash","示例：000FkzFx2qSs84 | https://c6.y.qq.com/base/fcgi-bin/u?__=SAukJ32wI4Td"],
        importMusicSheet: ["请输入QQ歌单链接或 歌单id", "示例：1769768332 | https://y.qq.com/n/ryqq/playlist/1769768332"],
    },
    // 以下可无视
    userVariables: [
        {
            key: "QQ",
            title: "您的QQ号码",
        },
        {
            key: "apikey",
            title: "您的music.qq接口的apikey",
        }
    ],
    pageSize: 30,
    supportedSearchType: ['music', 'album', 'sheet', 'lyric', 'artist', 'mv'],
    requestRetryCount: 3, // 请求重试次数
    requestRetryDelay: 1000 // 重试延迟时间(毫秒)
};


const DEFAULT_APIKEY = 'fb5401d5dad8a2917a71e5d8a327fb71';
const GET_URL_BASE = 'https://api.vsaa.cn/api/music.qq';
const API_BASE = 'http://api.vsaa.cn/api/music.qq.vip';

/**
 * 工具函数集
 */
var Utils = {
    /**
     * 构建图片URL
     * @param {string} url - 原始图片URL
     * @returns {string} 处理后的图片URL
     */
    buildImage: function(url) {
        if (!url) return '';
        if (url.indexOf('{size}') !== -1) {
            return url.replace('{size}', '500');
        }
        return url;
    },

    /**
     * 格式化歌手信息
     * @param {string|Array} singer - 歌手信息
     * @returns {string} 格式化后的歌手字符串
     */
    formatArtist: function(singer) {
        if (!singer) return '';
        if (Array.isArray(singer)) {
            return singer.join(' / ');
        }
        return singer;
    },

    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    delay: function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    },

    /**
     * 带重试的请求函数
     * @param {Function} requestFn - 请求函数
     * @param {number} retries - 重试次数
     * @param {number} delay - 重试延迟(毫秒)
     * @returns {Promise} Promise对象
     */
    retryRequest: function(requestFn, retries, delay) {
        var _this = this;
        retries = retries || CONFIG.requestRetryCount;
        delay = delay || CONFIG.requestRetryDelay;
        
        return new Promise(function(resolve, reject) {
            var attemptRequest = function(attempt) {
                requestFn().then(resolve).catch(function(error) {
                    if (attempt >= retries) {
                        reject(error);
                        return;
                    }
                    
                    console.warn('请求失败，第' + (attempt + 1) + '次重试...', error.message);
                    
                    if (delay > 0) {
                        _this.delay(delay).then(function() {
                            attemptRequest(attempt + 1);
                        });
                    } else {
                        attemptRequest(attempt + 1);
                    }
                });
            };
            
            attemptRequest(0);
        });
    }
};

/**
 * 数据转换器
 */
var DataTransformer = {
    /**
     * 转换歌曲数据
     * @param {Object} item - 原始歌曲数据
     * @returns {Object} 标准化的歌曲信息
     */
    transformSong: function(item) {
        
        // 安全获取嵌套属性
        var songInfo = item.songInfo || {};
        var album = item.album || songInfo.album || {};
        var singers = item.singer || songInfo.singer || [];
        var fileInfo = item.file || songInfo.file || {};
        var vs = item.vs || songInfo.vs || [];
        
        var result = {
            platform: CONFIG.platform,
            id: item.id || songInfo.id || '',
            mid: item.mid || songInfo.mid || '',
            title: '',
            artist: '',
            artwork: '',
            album: '',
            duration: 0,
            albumid: '',
            media_mid: ''
        };
        
        // 处理标题
        result.title = item.title || songInfo.title || '';
        
        // 处理歌手 - 将所有歌手名字用斜杠连接
        if (singers && singers.length > 0) {
            var artistNames = [];
            for (var i = 0; i < singers.length; i++) {
                if (singers[i] && singers[i].name) {
                    artistNames.push(singers[i].name);
                }
            }
            result.artist = artistNames.join(' / ') || '';
        } else {
            result.artist = '';
        }
        
        // 处理专辑 - 安全访问
        result.album = album.name || '';
        
        // 处理专辑ID
        result.albumid = album.mid || '';
        
        // 处理封面
        if (result.album && result.albumid) {
            result.artwork = `https://y.gtimg.cn/music/photo_new/T002R500x500M000${result.albumid}.jpg`;
        } else if (vs[1]) {
            result.artwork = `https://y.qq.com/music/photo_new/T062R300x300M000${vs[1]}.jpg`;
        } else if (singers.length > 0 && singers[0].mid) {
            // 使用第一个歌手的mid
            result.artwork = `https://y.qq.com/music/photo_new/T001R300x300M000${singers[0].mid}.jpg`;
        } else {
            result.artwork = ''; // 留空而不是使用可能出错的结构
        }
        
        // 处理时长
        result.duration = item.interval || songInfo.interval || 0;

        // file_mid - 安全访问
        result.media_mid = fileInfo.media_mid || '';
        return result;
    },
    
    /**
     * 转换专辑数据
     * @param {Object} album - 原始专辑数据
     * @returns {Object} 标准化的专辑信息
     */
    transformAlbum: function(album) {
        var a = album || {};
        return {
            platform: CONFIG.platform,
            id: a.id || a.albumID || '',
            mid: a.albummid || a.albumMid || '',
            title: (a.name || a.albumName || '').replace(/<em>|<\/em>/g, ''),
            artist: a.singer || a.singerName || '',
            artwork: a.pic || 'https://y.gtimg.cn/music/photo_new/T002R800x800M000{albummid}.jpg'.replace('{albummid}', a.albummid || a.albumMid || ''),
            rawData: a
        };
    },
    
    /**
     * 转换歌单数据
     * @param {Object} sheet - 原始歌单数据
     * @returns {Object} 标准化的歌单信息
     */
    transformSheet: function(sheet) {
        var item = sheet || {};
        return {
            platform: CONFIG.platform,
            id: item.dissid || item.docid || '',
            title: (item.dissname || '').replace(/<em>|<\/em>/g, '') || '',
            artwork: item.logo || '',
            description: (item.description || '').replace(/<em>|<\/em>/g, '') || '',
            playCount: item.listennum || item.listennum_long || 0,
            worksNums: item.songnum || 0,
            artist: item.nickname || '',
            createAt: item.createtime || '',
            rawData: item
        };
    },
    
    /**
     * 转换歌手数据
     * @param {Object} artist - 原始歌手数据
     * @returns {Object} 标准化的歌手信息
     */
    transformArtist: function(artist) {
        var item = artist || {};
        return {
            platform: CONFIG.platform,
            id: item.singerID || '',
            mid: item.singerMID || '',
            name: item.singerName || '',
            avatar: item.singerPic || '',
            worksNum: item.songNum || 0,
            // rawData: item
        };
    }
};

/**
 * API服务层
 */
var ApiService = {
    /**
     * 发起带重试的API请求
     * @param {string} endpoint - API端点
     * @param {Object} params - 请求参数
     * @param {number} retryCount - 重试次数
     * @returns {Promise} Promise对象
     */
    request: function(endpoint, params, retryCount) {
        
        var requestFn = function() {
            return axios.get(API_BASE, {
                params: Object.assign({ act: endpoint }, params),
                timeout: 10000
            }).then(function(response) {
                return response.data;
            });
        };
        
        retryCount = retryCount || CONFIG.requestRetryCount;
        
        return Utils.retryRequest(requestFn, retryCount).catch(function(error) {
            throw new Error('API请求失败(' + endpoint + '): ' + error.message);
        });
    },

    /**
     * 搜索功能
     * @param {string} query - 搜索关键词
     * @param {number} page - 页码
     * @param {string} type - 搜索类型
     * @returns {Promise} Promise对象
     */
    search: function(query, page, type) {
        var typeMap = {
            music: '0',
            album: '2', 
            sheet: '3',
            lyric: '7',
            artist: '1'
        };
        
        var searchType = typeMap[type] || 'song';
        page = page || 1;
        
        return this.request('search.search_by_type', {
            keyword: query,
            page: page,
            num: CONFIG.pageSize,
            search_type: searchType
        });
    }
};

/**
 * 业务逻辑层
 */
var Service = {
    /**
     * 搜索音乐内容
     * @param {string} query - 搜索关键词
     * @param {number} page - 页码
     * @param {string} type - 类型: music/album/sheet/lyric/artist/mv
     * @returns {Promise} Promise对象
     */
    search: function(query, page, type) {
        page = page || 1;
        type = type || 'music';
        
        if (CONFIG.supportedSearchType.indexOf(type) === -1) {
            return Promise.resolve({ isEnd: true, data: [] });
        }
        
        return ApiService.search(query, page, type).then(function(response) {
            var data = response.data || {};
            var transformer;
            
            switch (type) {
                case 'sheet':
                    transformer = DataTransformer.transformSheet;
                    break;
                case 'album':
                    transformer = DataTransformer.transformAlbum;
                    break;
                case 'artist':
                    transformer = DataTransformer.transformArtist;
                    break;
                default:
                    transformer = DataTransformer.transformSong;
            }
            var items = (data || []).map(transformer);
            var totalPages = Math.ceil(data.total / CONFIG.pageSize);
            var isEnd = page >= totalPages;
            
            return { isEnd: isEnd, data: items, total: data.total || items.length };
        }).catch(function(error) {
            console.error('搜索失败:', error);
            return { isEnd: true, data: [] };
        });
    },

    /**
     * 获取音源播放地址
     * @param {Object} mediaItem - 媒体项
     * @param {string} quality - 音质: low/standard/high/super
     */
    getMediaSource: function(mediaItem, quality) {
        quality = quality || 'standard';
        
        if (!mediaItem || !mediaItem.mid) {
            return Promise.resolve({});
        }
        
        const default_apikey = DEFAULT_APIKEY;
        const apikey = (typeof env !== 'undefined' && env.getUserVariables && env.getUserVariables().apikey) 
            ? env.getUserVariables().apikey 
            : default_apikey;
        
        return axios.get(GET_URL_BASE, {
            params: {
                apikey: apikey,
                action: 'media_source',
                id: mediaItem.mid,
                media_mid: mediaItem.media_mid || '',
                quality: quality
            },
            timeout: 10000
        }).then(function(response) {
            return response.data || {};
        }).catch(function(error) {
            throw new Error('获取播放地址失败: ' + (error.message || '网络错误'));
        });
    },

    /**
     * 获取歌词
     * @param {Object} musicItem - 音乐项
     * @returns {Promise} Promise对象
     */
    getLyric: function(musicItem) {
        return ApiService.request('lyric.get_lyric', { value: musicItem.mid, qrc: 0, trans: 1, roma: 1 })
            .then(function(data) {
                if (data.code == 200 && data.data.lyric) {
                    return { rawLrc: data.data.lyric || "", translation: data.data.trans || "", msg: "获取歌词成功" };
                } else {
                    return { rawLrc: "", translation: "", msg: "未获取到歌词信息" };
                }
            })
            .catch(function(error) {
                console.error('获取歌词失败:', error);
                return { rawLrc: "", translation: "", msg: "未获取到歌词信息" };
            });
    },

    /**
     * 获取专辑详情
     * @param {Object} albumItem - 专辑项
     * @param {number} page - 页码
     * @param {number} pagesize - 每页数量
     * @returns {Promise} Promise对象
     */
    getAlbumInfo: function(albumItem, page, pagesize) {
        page = page || 1;
        pagesize = pagesize || CONFIG.pageSize;
        
        return Promise.all([
            ApiService.request('album.get_detail', { value: albumItem.mid }),
            ApiService.request('album.get_song', { 
                value: albumItem.mid, 
                page: page,
                num: pagesize
            })
        ]).then(function(results) {
            var albumInfoRes = results[0];
            var songsRes = results[1];
            
            var albumInfo = (albumInfoRes.data) || {};
            var data = songsRes.data || {};
            var totalPages = Math.ceil(data.length / pagesize);
            var isEnd = page >= totalPages;
            var musicList = (data || []).map(DataTransformer.transformSong);
            
            var result = { isEnd: isEnd, musicList: musicList };
            if (page <= 1) {
                result.albumItem = { description: albumInfo.desc || '' };
            }
            
            return result;
        }).catch(function(error) {
            console.error('获取专辑详情失败:', error);
            return { isEnd: true, musicList: [] };
        });
    },

    /**
     * 获取歌单详情
     * @param {Object} sheetItem - 歌单项
     * @param {number} page - 页码
     * @param {number} pagesize - 每页数量
     * @returns {Promise} Promise对象
     */
    getMusicSheetInfo: function(sheetItem, page, pagesize) {
        page = page || 1;
        pagesize = pagesize || CONFIG.pageSize;
        
        return Promise.all([
            ApiService.request('songlist.get_detail', { 
                songlist_id: sheetItem.id, 
                page: page, 
                num: pagesize,
                onlysong: true
            })
        ]).then(function(results) {
            var songsRes = results[0];
            var data = songsRes.data || {};
            var totalPages = Math.ceil(data.total_song_num / pagesize);
            var isEnd = page >= totalPages;
            var musicList = (data.songlist || []).map(DataTransformer.transformSong);
            
            var result = { isEnd: isEnd, musicList: musicList };
            if (page <= 1) {
                result.sheetItem = { description: sheetItem.description || '' };
            }
            
            return result;
        }).catch(function(error) {
            console.error('获取歌单详情失败:', error);
            return { isEnd: true, musicList: [] };
        });
    },

    /**
     * 获取歌手作品列表
     * @param {Object} artistItem - 歌手项
     * @param {number} page - 页码
     * @param {string} type - 作品类型: music/album
     * @returns {Promise} Promise对象
     */
    getArtistWorks: function(artistItem, page, type = 'music') {
        page = page || 1;
        type = type || 'music';
        
        const pageSize = (typeof CONFIG !== 'undefined' && CONFIG.pageSize) || 30;
        const number = pageSize;
        const begin = (page - 1) * pageSize;
        
        const apiMap = {
            'music': { api: 'singer.get_songs_list', listKey: 'songList', transform: DataTransformer.transformSong },
            'album': { api: 'singer.get_album_list', listKey: 'albumList', transform: DataTransformer.transformAlbum }
        };
        
        const config = apiMap[type];
        if (!config) {
            return Promise.resolve({ isEnd: true, data: [] });
        }
        
        return ApiService.request(config.api, { 
            mid: artistItem.mid, 
            number: number, 
            begin: begin
        }).then(function(response) {
            const data = response.data || response;
            const list = data[config.listKey] || data.data || [];
            const transformedData = list.map(config.transform);
            const total = data.totalNum || data.total || 0;
            const totalPages = Math.ceil(total / pageSize);
            const isEnd = page >= totalPages;
            
            const result = { isEnd: isEnd, data: transformedData };
            
            if (page <= 1 && artistItem) {
                result.artistItem = { 
                    description: artistItem.intro || artistItem.description || '' 
                };
            }
            
            return result;
        }).catch(function(error) {
            console.error('获取歌手作品失败:', error);
            return { isEnd: true, data: [] };
        });
    },

    /**
     * 导入单曲作品
     * @param {string} urlLike - 歌曲分享链接或歌曲mid
     * @returns {Promise} Promise对象
     */
    importMusicItem: function(urlLike) {
        function getMid(str) {
            var match = str.match(/([a-z0-9]{14})/i);
            return match ? match[1] : null;
        }
        return Promise.resolve().then(function() {
            var mid = getMid(urlLike);
            if (mid) return mid;
            return axios.get(urlLike, {
                maxRedirects: 5,
                timeout: 3000
            })
            .then(function(response) {
                var finalUrl = response.request.res.responseUrl || response.config.url;
                return getMid(finalUrl);
            })
            .catch(function(error) {
                if (error.response && error.response.request) {
                    var finalUrl = error.response.request.res.responseUrl;
                    return getMid(finalUrl);
                }
                return null;
            })
            .then(function(foundMid) {
                if (!foundMid) {
                    throw new Error('无法从URL中提取歌曲ID');
                }
                return foundMid;
            });
        })
        .then(function(mid) {
            return ApiService.request('song.query_song', { value: mid });
        })
        .then(function(response) {
            return [DataTransformer.transformSong(response.data[0] || response)];
        })
        .catch(function(error) {
            console.error('导入单曲失败:', error);
            throw error;
        });
    },

    /**
     * 导入歌单作品
     * @param {string} urlLike - 歌单分享链接或ID
     * @returns {Promise} Promise对象
     */
    importMusicSheet: function(urlLike) {
        function getPlaylistId(str) {
            if (/^\d+$/.test(str)) return str;
            var match = str.match(/\b(\d{8,12})\b/);
            if (match) return match[1];
            if (str.includes('?')) {
                var urlParams = new URLSearchParams(str.split('?')[1]);
                return urlParams.get('id');
            }
            
            return null;
        }
        
        return Promise.resolve().then(function() {
            var playlistId = getPlaylistId(urlLike);
            if (playlistId) return playlistId;
            return axios.get(urlLike, {
                maxRedirects: 5,
                timeout: 3000
            })
            .then(function(response) {
                var finalUrl = response.request.res.responseUrl || response.config.url;
                return getPlaylistId(finalUrl);
            })
            .then(function(foundId) {
                if (!foundId) throw new Error('无法提取歌单ID');
                return foundId;
            });
        })
        .then(function(playlistId) {
            return ApiService.request('songlist.get_songlist', { songlist_id: playlistId });
        })
        .then(function(response) {
            var musicList = (response.data || []).map(DataTransformer.transformSong);
            return musicList;
        })
        .catch(function(error) {
            console.error('导入歌单失败:', error);
            throw error;
        });
    },
    
    /**
     * 获取音乐评论
     * @param {Object} musicItem - 音乐项
     * @param {number} page - 页码
     * @param {number} pagesize - 每页数量
     * @returns {Promise} Promise对象
     */
    getMusicComments: function(musicItem, page, pagesize) {
        page = page || 1;
        pagesize = pagesize || 10;
        
        return ApiService.request('comment.get_hot_comments', {
            biz_id: musicItem.id,
            page_num: page,
            page_size: pagesize
        }).then(function(response) {
            var totalPages = Math.ceil(response.data.TotalCmNum / pagesize);
            var isEnd = page >= totalPages;
            
            var data = (response.data.CommentList.Comments || []).map(function(comment) {
                return {
                    id: comment.SeqNo || '',
                    avatar: comment.Avatar || '',
                    nickName: comment.Nick || '匿名用户',
                    comment: comment.Content || '',
                    like: comment.PraiseNum || 0,
                    createAt: comment.PubTime ? new Date(comment.PubTime * 1000).toLocaleString() : ''
                };
            });
            
            return { isEnd: isEnd, data: data };
        });
    }
};

/**
 * 秋秋音乐插件模块
 * 版本 2.1.0
 */
module.exports = {
    // 基础信息
    author: CONFIG.author,
    platform: CONFIG.platform,
    version: CONFIG.version,
    srcUrl: CONFIG.srcUrl,
    
    // 配置
    primaryKey: CONFIG.primaryKey,
    cacheControl: CONFIG.cacheControl,
    hints: CONFIG.hints,
    userVariables: CONFIG.userVariables,
    supportedSearchType: CONFIG.supportedSearchType,
    
    // 核心方法
    search: Service.search,
    getLyric: Service.getLyric,
    getMediaSource: Service.getMediaSource,
    getAlbumInfo: Service.getAlbumInfo,
    getArtistWorks: Service.getArtistWorks,
    getMusicSheetInfo: Service.getMusicSheetInfo,
    importMusicItem: Service.importMusicItem,
    importMusicSheet: Service.importMusicSheet,
    getMusicComments: Service.getMusicComments
};