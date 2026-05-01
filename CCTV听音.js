"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const CryptoJS = require("crypto-js");
const searchRows = 20;
const host="https://tv.cctv.com/ty/m/sxy/index.shtml";







async function getMediaSource(musicItem, quality) {
    
          const headers2 = {
            "Accept":"application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.9",
            "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "X-Requested-With":"XMLHttpRequest",
    };   
    
   
    const html2 = await axios_1.get("https://vdn.apps.cntv.cn/api/getIpadVideoInfo.do?pid="+musicItem.guid,headers2);   
    const obj=html2.data;
    const urlc=obj.match(/var html5VideoData = '(.*?)';getHtml5VideoData/)[1];
    const myobj=eval('(' + urlc + ')')
    const myurl=myobj.manifest.hls_audio_url;
 
 
    
        
        
    
       return {
          
            url:myurl,

        };
        
        
}

  async function getMusicInfo(musicItem) {
    // 根据音乐获取音乐详细信息
    var songkey=musicItem.id.match(/\/song\/(.*?).html/)[1]  
    
          const headers2 = {
            "Accept":"application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.9",
            "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "X-Requested-With":"XMLHttpRequest",
    };   
    
   
    
   // const html2 = await axios_1.get("http://tv.zanlagua.com/2T58.php?songkey="+songkey,headers2);   
   // const obj=html2.data; 
    
    
    return {
      artwork: obj["pic"],
      title:obj["title"].split('-')[1],
      artist:obj["title"].split('-')[0],
    };
  }

async function getRecommendSheetTags() {
                   const headers = {
    };
    const params = {

    };
      
       const html = await axios_1.get("https://tv.cctv.com/ty/m/sxy/data.jsonp?cb=fenlei", { headers, params });
              const obj=html.data;    
              const mydata=JSON.parse(obj.match(/fenlei\((.*?)\)/)[1]).data.list;

              /*
              const $ = (0, cheerio_1.load)(obj);  
              const rawAlbums2 = $("div.ilingku_fl");
              const albums2 = [];   
              console.log(rawAlbums2.length);
              */
          var arr1=[];  
          var arr2=[];
        for(let i=0;i<mydata.length;i++){
            
             
                    
                   
                        arr2.push({id:mydata[i].sc,title:mydata[i].sc})
                }
                arr1.push({title:"分类",data:arr2});
                
    
        
  
    // 获取推荐歌单 tag
    return {
      pinned: [
        {
          id: "1",
          title: "栏目",
        },
      ],
      data: arr1,
    };
  }

async function getRecommendSheetsByTag(tagItem,page) {
    // 获取某个 tag 下的所有歌单
         const headers = {
                   
            "Accept":"application/json, text/javascript, */*; q=0.01",
            "Accept-Encoding":"gzip, deflate",
            "Accept-Language":"zh-CN,zh;q=0.9",
            "User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            "X-Requested-With":"XMLHttpRequest",
   

    };
    const params = {

    };
    const albums2=[];
    if(page==""){page=1;}
    if(page<=0){page=1;}
    var isends2=false;
    
        
              
              const html = await axios_1.get("https://api.cntv.cn/newVideoset/getVideoAlbumListByPageIdTvty?sc="+tagItem.id+"&p="+page+"&id=&n=20&serviceId=tvty&cb=", { headers, params });
              
                            

              
              const obj=html.data.data.list;    

             
               
               for(let i=0;i<obj.length;i++){
                   
                   
                             
                                 albums2.push({
                                        id: obj[i].url,
                                        title:obj[i].title,
                                        artwork:obj[i].image,
                                        description: obj[i].brief+obj[i].colum_name,
                                        pindao:obj[i].colum_name,
                                    });
                 
               }
        
        
    
    return {
      isEnd: isends2,
      data: albums2,
    };
}
async function getMusicSheetInfo(sheetItem, page) {
     const headers = {
        
            };
            const params = {
        
            };
       
        

        
            var songkey=sheetItem.id.match(/\/tv.cctv.com\/.{4}\/.{2}\/.{2}\/(.*?).shtml/)[1]      
                
           
            
            const albums = [];
           const html = await axios_1.default.get("https://api.cntv.cn/NewVideo/getVideoListByAlbumIdNew?id="+songkey+"&serviceId=tvty&pub=2&mode=2&p="+page+"&n=100&sort=asc&cb=Callback1&cb=", { headers, params });
           const obj=html.data.data;
          const n=obj.total; 
          const rawAlbums=obj.list;
          
          
           var iendpage=false; 
           
      if(n<100){iendpage=true;}
   
            
          
             for(let i=0;i<rawAlbums.length;i++){
                 
                 albums.push({
                              platform: 'CCTV听音',
                              id:rawAlbums[i].id,
                              artist:sheetItem.pindao,
                              title: rawAlbums[i].title,
                              album: sheetItem.title,
                              artwork:rawAlbums[i].image,
                              guid:rawAlbums[i].guid,
                              
    
                 });
             }
             
           
  
        if(page<=1){
              return {
                isEnd: iendpage,
                musicList: albums,
                albumItem: {
                   
                },
              }
        }else{
               return {
                isEnd: iendpage,
                musicList: albums,

              }
        }
    
    
}

async function getAlbumInfo(albumItem, page) {
    console.log("getAlbumInfo");
    if (page <= 1) {
      return {
        isEnd: false,
        musicList: [],
        albumItem: {
          description: "这是专辑的补充说明",
        },
      };
    }

    // 其他页码正常返回
    return {
      isEnd: true,
      musicList: [],
    };
  }
  
   async function getLyric(musicItem) {
       var songkey=musicItem.id.match(/\/song\/(.*?).html/)[1]  
    return {
      lrc: "http://www.2t58.com/plug/down.php?ac=music&lk=lrc&id="+songkey, // 链接
      
    };
  } 
module.exports = {
  /** 用来说明插件信息的属性 */
  platform: "CCTV听音",
  version: "0.0.1", // 插件版本号
  hints: {
        importMusicSheet: [
            "cctv.com采集",

        ],
    },
    primaryKey: ["id"],
    cacheControl: "no-store",
    srcUrl: "http://tv.zanlagua.com/cctvty.js",
  /** 供给软件在合适的时机调用的函数 */


  getMediaSource,
  getMusicInfo,
  getRecommendSheetTags,
  getRecommendSheetsByTag,
  getMusicSheetInfo,
  getAlbumInfo,

  
};