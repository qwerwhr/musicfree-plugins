const axios = require('axios');

/**
 * 酷狗音乐概念版插件配置
 * 版本: 2.3.0
 * 作者：简云
 * 邮箱：603212202@qq.com
 * 创建时间：2026/1/16 am
 * 更新日志：
 *  2026-1-19： 优化已知bug，更新歌词获取逻辑，修复单曲|歌单导入功能
 *  2026-1-22：
 *      1.（原本最大导入300首）修复歌单全量导入问题最大支持9000首 再多的话估计没人有哪个歌单。。如果有自己改函数importMusicSheet倒数第七行
 *      2.优化标题显示问题
 */
var CONFIG = {
    platform: "KuGou Lite",
    author: "简云",
    version: "2.3.0",
    srcUrl: "https://gitee.com/csdjrw/music-free-plugin/raw/master/kugou.lite.js",
    primaryKey: ["id", "hash"],
    cacheControl: "no-store",
    hints: {
        importMusicItem: ["请输入酷狗歌曲分享链接或 hash","示例：https://t1.kugou.com/9DqkVdfFXV2 | E2CE163CAF00541E3813F9EC3F11FA76"],
        importMusicSheet: ["请输入酷狗概念版歌单链接或 歌单id", "示例：https://t1.kugou.com/9DtRX6bFXV2 | collection_3_2025087921_4_0", "普通版歌单链接暂不支持导入"],
    },
    // 以下可无视
    userVariables: [
        {
            key: "QQ",
            title: "您的QQ号码",
        },
        {
            key: "userid",
            title: "你的酷狗音乐账号USERID",
        },
        {
            key: "token",
            title: "你的酷狗音乐账号TOKEN",
        }
    ],
    pageSize: 30,
    supportedSearchType: ['music', 'album', 'sheet', 'lyric', 'artist', 'mv'],
    requestRetryCount: 3, // 请求重试次数
    requestRetryDelay: 1000 // 重试延迟时间(毫秒)
};


const API_BASE = 'http://api.vsaa.cn/api/music.kugou.lite';

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
     * 构建新的title
     * 清理多余歌手信息
     * @param {string} title - 标题信息
     * @returns {string} 干净的标题
     */
    formatTitle: function(title) {
        if (!title || typeof title !== 'string') {
            return title || '';
        }
        const match = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        
        if (match && match[2]) {
            return match[2].trim();
        }
        return title.trim();
    },

    /**
     * 格式化歌手信息
     * @param {string|string[]} singer - 歌手信息，可以是字符串或字符串数组
     * @returns {string} 格式化后的歌手字符串，数组元素用" / "分隔
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
     * @param {number} ms - 延迟毫秒数，必须是非负数
     * @returns {Promise<void>} 在指定延迟后解析的Promise对象
     * @throws {TypeError} 如果ms不是数字
     * @throws {RangeError} 如果ms是负数
     * @example
     * await Utils.delay(1000); // 等待1秒
     */
    delay: function(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    },

    /**
     * 带重试的请求函数
     * @param {Function} requestFn - 返回Promise的请求函数
     * @param {number} [retries] - 最大重试次数，默认使用CONFIG.requestRetryCount
     * @param {number} [delay] - 重试延迟(毫秒)，默认使用CONFIG.requestRetryDelay
     * @returns {Promise<any>} 请求成功的Promise对象
     * @throws {Error} 所有重试失败后抛出错误
     * @example
     * await Utils.retryRequest(() => fetch('api/data'), 3, 1000);
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
        var result = {
            platform: CONFIG.platform,
            id: item.FileHash || (item.audio_info && item.audio_info.hash) || item.hash || (item.deprecated && item.deprecated.hash) || '',
            title: '',
            artist: '',
            artwork: '',
            album: '',
            duration: 0,
            albumid: '',
            mixsongid: ''
        };
        
        // 处理标题
        var mainName = item.OriSongName || (item.base && item.base.audio_name) || item.name || item.audio_name || item.songname || '';
        var suffix = item.Suffix ? item.Suffix.trim() : '';
        result.title = Utils.formatTitle(suffix ? mainName + ' ' + suffix : mainName);
        
        // 处理歌手
        if (Array.isArray(item.singerinfo) && item.singerinfo.length > 0) {
            result.artist = item.singerinfo[0].name || '';
        } else {
            result.artist = item.SingerName || (item.base && item.base.author_name) || item.author_name || item.singername || '';
        }
        
        // 处理封面
        var imageUrl = item.Image || (item.trans_param && item.trans_param.union_cover) || item.cover;
        result.artwork = imageUrl ? Utils.buildImage(imageUrl) : '';
        
        // 处理专辑
        result.album = item.AlbumName || (item.album_info && item.album_info.album_name) || (item.albuminfo && item.albuminfo.name) || item.album_name || item.albumname || '';
        
        // 处理时长
        var duration = 0;
        if (item.Duration) {
            duration = item.Duration;
        } else if (item.audio_info && item.audio_info.duration) {
            duration = item.audio_info.duration / 1000;
        } else if (item.timelen) {
            duration = item.timelen / 1000;
        } else if (item.timelength) {
            duration = item.timelength / 1000;
        } else if (item.deprecated && item.deprecated.duration) {
            duration = item.deprecated.duration / 1000;
        } else if (item.info && item.info.duration) {
            duration = item.info.duration / 1000;
        }
        result.duration = Math.floor(duration);
        
        // 处理专辑ID
        result.albumid = item.album_audio_id || item.AlbumID || (item.base && item.base.album_id) || item.album_id || (item.album_info && item.album_info.album_id) || '';
        
        // 处理混合歌曲ID
        result.mixsongid = item.MixSongID || item.mixsongid || item.album_audio_id || '';
        
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
            id: a.albumid || a.album_id || '',
            title: a.albumname || a.album_name || '',
            artist: Utils.formatArtist(a.singer || a.author_name) || '',
            artwork: Utils.buildImage(a.img || a.sizable_cover) || '',
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
            id: item.gid || item.global_collection_id || '',
            title: Utils.formatTitle(item.specialname || ''),
            artwork: Utils.buildImage(item.img || item.imgurl) || '',
            description: item.desc || item.intro || '',
            playCount: item.total_play_count || item.play_count || 0,
            worksNums: item.song_count || item.songcount || 0,
            artist: item.nickname || '',
            createAt: item.publish_time || item.publishtime || '',
            mixsongid: item.MixSongID || item.mixsongid || '',
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
            id: item.singerid || item.AuthorId || '',
            name: item.singername || item.AuthorName || '',
            avatar: Utils.buildImage(item.Avatar || item.img) || '',
            worksNum: item.songcount || item.AudioCount || 0,
            rawData: item
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
        console.log('请求接口: ' + endpoint + '，参数:', params);
        
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
            music: 'song',
            album: 'album', 
            sheet: 'special',
            lyric: 'lyric',
            artist: 'author'
        };
        
        var searchType = typeMap[type] || 'song';
        page = page || 1;
        
        return this.request('search', {
            keywords: query,
            page: page,
            pagesize: CONFIG.pageSize,
            type: searchType
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
            
            var items = (data.lists || []).map(transformer);
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
     * @param {Object} mediaItem - 音乐项
     * @param {string} quality - 音质: low/standard/high/super
     * @returns {Promise} Promise对象
     */
    getMediaSource: function(mediaItem, quality) {
        quality = quality || 'standard';
        
        if (!mediaItem || !mediaItem.id) {
            return Promise.resolve({});
        }
        
        var qualityMap = {
            low: "128",
            standard: "320",
            high: "flac",
            super: "high",
        };
        
        var qualityValue = qualityMap[quality] || '128';
        
        return ApiService.request('song.url', {
            hash: mediaItem.id,
            quality: qualityValue
        }).then(function(response) {
            var url = Array.isArray(response.url) ? response.url[0] : response.url;
            if (url && url.indexOf('http') === 0) {
                return { url: url };
            }
            return {};
        }).catch(function(error) {
            console.error('获取音源失败:', error);
            return {};
        });
    },

    /**
     * 获取歌词
     * @param {Object} musicItem - 音乐项
     * @returns {Promise} Promise对象
     */
    getLyric: function(musicItem) {
        return ApiService.request('search.lyric', { hash: musicItem.id })
            .then(function(searchResult) {
                var candidate = searchResult.candidates && searchResult.candidates[0];
                
                if (!candidate || !candidate.id || !candidate.accesskey) {
                    return { rawLrc: "", translation: "", msg: "未获取到歌词id-key" };
                }
                
                return ApiService.request('lyric', {
                    id: candidate.id,
                    accesskey: candidate.accesskey,
                    fmt: 'lrc',
                    decode: 'true'
                }).then(function(response) {
                    return {
                        rawLrc: response.decodeContent || "",
                        translation: "",
                    };
                });
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
            ApiService.request('album.detail', { id: albumItem.id }),
            ApiService.request('album.songs', { 
                id: albumItem.id, 
                page: page, 
                pagesize: pagesize 
            })
        ]).then(function(results) {
            var albumInfoRes = results[0];
            var songsRes = results[1];
            
            var albumInfo = (albumInfoRes.data && albumInfoRes.data[0]) || {};
            var data = songsRes.data || {};
            var totalPages = Math.ceil(data.total / pagesize);
            var isEnd = page >= totalPages;
            var musicList = (data.songs || []).map(DataTransformer.transformSong);
            
            var result = { isEnd: isEnd, musicList: musicList };
            if (page <= 1) {
                result.albumItem = { description: albumInfo.intro || '' };
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
            ApiService.request('playlist.detail', { ids: sheetItem.id }),
            ApiService.request('playlist.track.all', { 
                id: sheetItem.id, 
                page: page, 
                pagesize: pagesize 
            })
        ]).then(function(results) {
            var sheetInfoRes = results[0];
            var songsRes = results[1];
            
            var sheetInfo = (sheetInfoRes.data && sheetInfoRes.data[0]) || {};
            var data = songsRes.data || {};
            var totalPages = Math.ceil(data.count / pagesize);
            var isEnd = page >= totalPages;
            var musicList = (data.songs || []).map(DataTransformer.transformSong);
            
            var result = { isEnd: isEnd, musicList: musicList };
            if (page <= 1) {
                result.sheetItem = { description: sheetInfo.intro || '' };
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
     * @param {string} type - 作品类型: music/album/videos
     * @param {string} sort - 排序方式: hot/new
     * @returns {Promise} Promise对象
     */
    getArtistWorks: function(artistItem, page, type, sort) {
        page = page || 1;
        type = type || 'music';
        sort = sort || 'hot';
        
        return ApiService.request('artist.detail', { id: artistItem.id })
            .then(function(artistInfoRes) {
                var artistInfo = artistInfoRes.data || {};
                
                if (type === 'music') {
                    return ApiService.request('artist.audios', { 
                        id: artistItem.id, 
                        page: page, 
                        pagesize: CONFIG.pageSize, 
                        sort: sort 
                    }).then(function(audios) {
                        var data = (audios.data || []).map(DataTransformer.transformSong);
                        var total = audios.total || 0;
                        var totalPages = Math.ceil(total / CONFIG.pageSize);
                        var isEnd = page >= totalPages;
                        
                        var result = { isEnd: isEnd, data: data };
                        if (page <= 1) {
                            result.artistItem = { description: artistInfo.intro || '' };
                        }
                        
                        return result;
                    });
                } else if (type === 'album') {
                    return ApiService.request('artist.albums', { 
                        id: artistItem.id, 
                        page: page, 
                        pagesize: CONFIG.pageSize
                    }).then(function(albums) {
                        var data = (albums.data || []).map(DataTransformer.transformAlbum);
                        var total = albums.total || 0;
                        var totalPages = Math.ceil(total / CONFIG.pageSize);
                        var isEnd = page >= totalPages;
                        
                        var result = { isEnd: isEnd, data: data };
                        if (page <= 1) {
                            result.artistItem = { description: artistInfo.intro || '' };
                        }
                        
                        return result;
                    });
                }
                
                return { isEnd: true, data: [] };
            })
            .catch(function(error) {
                console.error('获取歌手作品失败:', error);
                return { isEnd: true, data: [] };
            });
    },

    /**
     * 导入单曲作品
     * @param {string} urlLike - 歌曲分享链接或hash
     * @returns {Promise} Promise对象
     */
    importMusicItem: function(urlLike) {
        var hash = '';
        
        return Promise.resolve().then(function() {
            // 检查是否为32位哈希
            if (/^[A-F0-9]{32}$/i.test(urlLike)) {
                hash = urlLike.toUpperCase();
                return null;
            }
            
            var urlObj = new URL(urlLike);
            
            if (urlObj.hostname === 't1.kugou.com') {
                return fetch(urlLike, { 
                    method: 'HEAD',
                    redirect: 'follow'
                }).then(function(response) {
                    var redirectUrl = response.url;
                    var hashMatch = redirectUrl.match(/hash=([A-F0-9]{32})/i);
                    if (hashMatch) {
                        hash = hashMatch[1].toUpperCase();
                    }
                });
            } else if (urlObj.hostname === 'm.kugou.com' && urlObj.searchParams.has('chain')) {
                return fetch(urlLike)
                    .then(function(response) {
                        return response.text();
                    })
                    .then(function(html) {
                        var hashMatch = html.match(/"hash":"([A-F0-9]{32})"/i);
                        if (hashMatch) {
                            hash = hashMatch[1].toUpperCase();
                        }
                    });
            } else if (urlLike.includes('hash=')) {
                var hashMatch = urlLike.match(/hash=([A-F0-9]{32})/i);
                if (hashMatch) {
                    hash = hashMatch[1].toUpperCase();
                }
                return null;
            }
            
            return null;
        }).then(function() {
            if (!hash) {
                throw new Error('无法从链接中提取歌曲hash');
            }
            
            return ApiService.request('privilege.lite', { hash: hash });
        }).then(function(response) {
            var musicItem = [response.data[0]].map(DataTransformer.transformSong);
            return musicItem;
        }).catch(function(error) {
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
        var playlistId = '';
        
        return Promise.resolve().then(function() {
            // 检查是否为歌单ID格式
            if (/^[a-z0-9_]+$/i.test(urlLike)) {
                playlistId = urlLike;
                return null;
            }
            
            var urlObj = new URL(urlLike);
            
            if (urlObj.hostname === 't1.kugou.com') {
                return fetch(urlLike, { 
                    method: 'HEAD',
                    redirect: 'follow'
                }).then(function(response) {
                    var redirectUrl = response.url;
                    var globalIdMatch = redirectUrl.match(/global_specialid=([^&]+)/i);
                    var specialIdMatch = redirectUrl.match(/specialid=([^&]+)/i);
                    
                    if (globalIdMatch) {
                        playlistId = globalIdMatch[1];
                    } else if (specialIdMatch && specialIdMatch[1] !== '0') {
                        playlistId = specialIdMatch[1];
                    }
                });
            } else if (urlLike.includes('global_specialid=') || urlLike.includes('specialid=')) {
                var globalIdMatch = urlLike.match(/global_specialid=([^&]+)/i);
                var specialIdMatch = urlLike.match(/specialid=([^&]+)/i);
                
                if (globalIdMatch) {
                    playlistId = globalIdMatch[1];
                } else if (specialIdMatch && specialIdMatch[1] !== '0') {
                    playlistId = specialIdMatch[1];
                }
                return null;
            }
            
            return null;
        }).then(function() {
            if (!playlistId) {
                console.error('无法从链接中提取歌单ID,请确认链接有效,原始传入值:', urlLike);
                return [];
            }
            
            // 递归函数获取所有页面数据
            function fetchAllPages(page, maxPages, allMusicList) {
                if (page > maxPages) {
                    console.warn('已达到最大循环次数限制', maxPages);
                    return allMusicList
                }
                
                return Service.getMusicSheetInfo({ id: playlistId }, page, 300).then(function(data) {
                    // console.log("当前page",page,"是否最后一页",data.isEnd,"当前第1条数据",data.musicList[0])
                    if (!data || !data.musicList) {
                        return allMusicList;
                    }
                    if (Array.isArray(data.musicList)) {
                        allMusicList = allMusicList.concat(data.musicList);
                    }
                    if (data.isEnd === true) {
                        return allMusicList;
                    } else {
                        return fetchAllPages(page + 1, maxPages, allMusicList);
                    }
                }).catch(function(error) {
                    console.error('获取第', page, '页数据失败:', error);
                    return allMusicList;
                });
            }
            return fetchAllPages(1, 30, []);
            
        }).catch(function(error) {
            console.error('导入歌单失败:', error);
            return [];
        });
    },

    /**
     * 获取排行榜列表
     * @returns {Promise} Promise对象
     */
    getTopLists: function() {
        return Promise.resolve([
        {
          title: "推荐榜",
          data: [
            {
              id: "49224",
              description: "排序方式：按年龄段的喜爱热度高低排序\r\n更新频率：每天",
              coverImg: "http://imge.kugou.com/mcommon/500/20241211/20241211185955370846.jpg",
              title: "00后热歌榜",
            },
            {
              id: "49223",
              description: "排序方式：按年龄段的喜爱热度高低排序\r\n更新频率：每天",
              coverImg: "http://imge.kugou.com/mcommon/500/20241211/20241211185910253287.jpg",
              title: "90后热歌榜",
            },
            {
              id: "49225",
              description: "排序方式：按年龄段的喜爱热度高低排序\r\n更新频率：每天",
              coverImg: "http://imge.kugou.com/mcommon/500/20241211/20241211185822886829.jpg",
              title: "80后热歌榜",
            },
            {
              id: "31308",
              description: "数据来源：30天内发行的内地新歌\r\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名\r\n更新频率：每周一至周五",
              coverImg: "http://imge.kugou.com/mcommon/500/20241211/20241211192146592398.png",
              title: "内地榜",
            },
            {
              id: "33165",
              description: "数据来源：粤语歌曲\r\n排序方式：按歌曲完整播放日均量排序\r\n更新频率：每周三",
              coverImg: "http://imge.kugou.com/mcommon/500/20241219/20241219200119140556.png",
              title: "粤语金曲榜",
            },
            {
              id: "51340",
              description: "数据来源：伤感歌曲，包括抒情伤怀、孤单寂寞和失恋类型的歌曲\r\n排序方式：伤感歌曲偏好用户中，按歌曲日均喜爱用户数排序\r\n更新频率：每周三",
              coverImg: "http://imge.kugou.com/mcommon/500/20241219/20241219195213930623.png",
              title: "伤感榜",
            },
            {
              id: "38236",
              description: "数据来源：酷狗概念版听歌数据\n排序方式：按歌曲搜索播放量排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251226/20251226203441798562.jpg",
              title: "助力周榜-助力歌曲上开屏",
            },
            {
              id: "38235",
              description: "数据来源：酷狗概念版听歌数据\n排序方式：按歌曲搜索播放量涨幅排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260112/20260112151021709893.jpg",
              title: "概念版飙升榜",
            },
            {
              id: "44412",
              description: "数据来源：说唱歌曲\n排序方式：说唱歌曲偏好用户中，按歌曲日均喜爱用户数排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251010/20251010164238149570.jpg",
              title: "概念版说唱先锋榜",
            },
            {
              id: "33162",
              description: "数据来源：90天内发行的ACG新歌\n排序方式：按歌曲热度、歌手等级和发行时间综合评分排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260109/20260109143730730925.jpg",
              title: "概念版ACG新歌榜",
            }
          ]
        },
        {
          title: "新歌榜",
          data: [
            {
              id: "31308",
              description: "数据来源：30天内发行的内地新歌\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260116/20260116112441287392.jpg",
              title: "内地榜",
            },
            {
              id: "31313",
              description: "数据来源：90天内发行的香港地区新歌\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260112/20260112101822488071.jpg",
              title: "香港地区榜",
            },
            {
              id: "54848",
              description: "数据来源：90天内发行的台湾地区新歌\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260114/20260114172821141416.jpg",
              title: "台湾地区榜",
            },
            {
              id: "31310",
              description: "数据来源：30天内发行的欧美新歌\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260115/20260115031250222064.jpg",
              title: "欧美榜",
            },
            {
              id: "31311",
              description: "数据来源：60天内发行的韩国乐坛新歌\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260113/20260113165112428365.jpg",
              title: "韩国榜",
            },
            {
              id: "31312",
              description: "数据来源：90天内发行的日本乐坛新歌\n排序方式：酷狗音乐的喜爱用户数和发行时间等综合评分排序取前100名",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260114/20260114114741430315.jpg",
              title: "日本榜",
            }
          ]
        },
        {
          title: "特色榜单",
          data: [
            {
              id: "33160",
              description: "数据来源：电音歌曲\n排序方式：电音歌曲偏好用户中，按歌曲日均喜爱用户数排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20260113/20260113030841850883.jpg",
              title: "电音热歌榜",
            },
            {
              id: "33163",
              description: "数据来源：影视歌曲\n排序方式：影视歌曲偏好用户中，按歌曲日均喜爱用户数排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20250808/20250808181823962480.jpg",
              title: "影视金曲榜",
            },
            {
              id: "33165",
              description: "数据来源：粤语歌曲\n排序方式：按歌曲完整播放日均量排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20250925/20250925231951239621.jpg",
              title: "粤语金曲榜",
            },
            {
              id: "33166",
              description: "数据来源：英语/西班牙语/葡萄牙语/法语/德语/德语歌曲\n排序方式：按歌曲完整播放日均量排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251011/20251011045342504858.jpg",
              title: "欧美金曲榜",
            },
            {
              id: "30972",
              description: "酷狗音乐人原创作品官方榜单，以推荐优秀原创作品为目的，按歌曲热度和收藏转化等维度排序，每天更新。",
              coverImg: "http://imge.kugou.com/stdmusic/500/20230413/20230413131617714479.jpg",
              title: "酷狗原创榜",
            }
          ]
        },
        {
          title: "全球榜单",
          data: [
            {
              id: "4681",
              description: "数据来源：美国Billboard Top100\n排序方式：根据歌曲在美国的实体销量、电台播放量、流媒体下载量等指标进行排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251003/20251003103331182410.jpg",
              title: "美国BillBoard榜",
            },
            {
              id: "4673",
              description: "数据来源：日本Oricon Top20\n排序方式：根据日本实体CD销量进行排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251226/20251226145452773355.jpg",
              title: "日本公信榜",
            },
            {
              id: "4680",
              description: "数据来源：英国Single Chart Top 40\n排序方式：根据歌曲在英国的一周销量进行排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20221103/20221103212010985439.jpg",
              title: "英国单曲榜",
            },
            {
              id: "38623",
              description: "数据来源：韩国Melon\n排序方式：根据Melon的销售、下载、播放等指标进行排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251015/20251015143813398620.jpg",
              title: "韩国Melon榜",
            },
            {
              id: "25028",
              description: "数据来源：Beatport音乐网站\n排序方式：根据Beatport网站上的播放次数计算排序",
              coverImg: "http://imge.kugou.com/stdmusic/500/20251028/20251028194551221232.jpg",
              title: "Beatport电子舞曲榜",
            }
          ]
        }
      ]);
    },
    
    /**
     * 获取排行榜详情
     * @param {Object} topListItem - 排行榜项
     * @param {number} page - 页码
     * @param {number} pagesize - 每页数量
     * @returns {Promise} Promise对象
     */
    getTopListDetail: function(topListItem, page, pagesize) {
        page = page || 1;
        pagesize = pagesize || CONFIG.pageSize;
        
        return ApiService.request('rank.audio', { 
            rankid: topListItem.id, 
            page: page, 
            pagesize: pagesize 
        }).then(function(response) {
            var totalPages = Math.ceil(response.total / pagesize);
            var isEnd = page >= totalPages;
            var musicList = ((response.data && response.data.songlist) || []).map(DataTransformer.transformSong);
            return { isEnd: isEnd, topListItem: topListItem, musicList: musicList };
        }).catch(function(error) {
            console.error('获取排行榜详情失败:', error);
            return { isEnd: true, musicList: [] };
        });
    },
    
    /**
     * 获取推荐歌单标签
     * @returns {Promise} Promise对象
     */
    getRecommendSheetTags: function() {
        return ApiService.request('playlist.tags', {})
            .then(function(response) {
                if (!response.data || !Array.isArray(response.data)) {
                    throw new Error('标签数据格式错误');
                }
                
                var pinned = [];
                var data = response.data.map(function(category) {
                    var categoryData = {
                        title: category.tag_name || '',
                        data: (category.son || []).map(function(tag) {
                            return {
                                id: tag.tag_id || '',
                                title: tag.tag_name || ''
                            };
                        })
                    };
                    
                    if (categoryData.data.length > 0) {
                        pinned.push({
                            id: categoryData.data[0].id,
                            title: categoryData.data[0].title
                        });
                    }
                    
                    return categoryData;
                });
                
                return { pinned: pinned, data: data };
            })
            .catch(function(error) {
                console.error('获取推荐歌单标签失败:', error);
                return { pinned: [], data: [] };
            });
    },
    
    /**
     * 获取某个 tag 下的所有歌单
     * @param {Object} tag - 标签
     * @param {number} page - 页码
     * @param {number} pagesize - 每页数量
     * @returns {Promise} Promise对象
     */
    getRecommendSheetsByTag: function(tag, page, pagesize) {
        page = page || 1;
        pagesize = pagesize || CONFIG.pageSize;
        
        return ApiService.request('top.playlist', {
            category_id: tag.id, 
            page: page, 
            pagesize: pagesize
        }).then(function(response) {
            var data = ((response.data && response.data.special_list) || []).map(DataTransformer.transformSheet);
            return { isEnd: true, data: data };
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
        pagesize = pagesize || CONFIG.pageSize;
        
        return ApiService.request('comment.music', {
            mixsongid: musicItem.mixsongid,
            page: page,
            pagesize: pagesize,
            show_classify: 0,
            show_hotword_list: 0
        }).then(function(response) {
            var totalPages = Math.ceil(response.count / pagesize);
            var isEnd = page >= totalPages;
            
            var data = (response.list || []).map(function(comment) {
                return {
                    id: comment.id || '',
                    avatar: comment.user_pic || '',
                    nickName: comment.user_name || '匿名用户',
                    comment: comment.content || '',
                    like: (comment.like && comment.like.count) || 0,
                    createAt: comment.add_time || '',
                    udetails: comment.udetails || {},
                    score: comment.score || 0
                };
            });
            
            return { isEnd: isEnd, data: data };
        });
    }
};

/**
 * 酷狗音乐插件模块
 * 版本 2.3.0
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
    getTopLists: Service.getTopLists,
    getTopListDetail: Service.getTopListDetail,
    getRecommendSheetTags: Service.getRecommendSheetTags,
    getRecommendSheetsByTag: Service.getRecommendSheetsByTag,
    getMusicComments: Service.getMusicComments
};