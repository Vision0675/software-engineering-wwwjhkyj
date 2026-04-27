// 引入腾讯地图SDK
const QQMapWX = require('../../utils/qqmap-wx-jssdk.js');

Page({
  data: {
    // 地图中心点（默认上海同济大学，你可以改成自己学校的坐标）
    centerLongitude: 121.490317,
    centerLatitude: 31.289133,
    // 地图缩放级别（17最适合校园查看）
    mapScale: 17,
    // 地图标记点
    markers: [],
    // 路线
    polyline: [],
    // 搜索关键词
    searchKeyword: '',
    // 地点详情弹窗
    showPoiPopup: false,
    currentPoi: {},
    // 加载状态
    isLoading: true,
    // 腾讯地图实例
    qqMap: null
  },

  onLoad() {
    // 初始化腾讯地图（已填入你的Key）
    this.initMapSDK();
    
    // 加载共济校圈预设地点
    this.loadCampusPOIs();
    
    // 模拟加载完成
    setTimeout(() => {
      this.setData({ isLoading: false });
    }, 1000);
  },

  // 初始化腾讯地图SDK
  initMapSDK() {
    this.setData({
      qqMap: new QQMapWX({
        key: 'OVCBZ-TNNW5-MAYIO-IYY2V-IVAEQ-2OBOE'
      })
    });
  },

  // 加载共济校圈预设地点（替换成你学校的实际地点）
  loadCampusPOIs() {
    const campusPOIs = [
      {
        id: 1,
        title: '第一教学楼',
        address: '共济大学第一教学楼',
        longitude: 121.490317,
        latitude: 31.289133,
        iconPath: 'https://img.icons8.com/color/48/0066ff/school-building.png',
        width: 40,
        height: 40
      },
      {
        id: 2,
        title: '图书馆',
        address: '共济大学图书馆',
        longitude: 121.488500,
        latitude: 31.287800,
        iconPath: 'https://img.icons8.com/color/48/0066ff/library.png',
        width: 40,
        height: 40
      },
      {
        id: 3,
        title: '学生一食堂',
        address: '共济大学第一食堂',
        longitude: 121.492000,
        latitude: 31.290500,
        iconPath: 'https://img.icons8.com/color/48/0066ff/restaurant.png',
        width: 40,
        height: 40
      },
      {
        id: 4,
        title: '学生宿舍3号楼',
        address: '共济大学学生宿舍区3号楼',
        longitude: 121.493500,
        latitude: 31.291200,
        iconPath: 'https://img.icons8.com/color/48/0066ff/home.png',
        width: 40,
        height: 40
      },
      {
        id: 5,
        title: '菜鸟驿站',
        address: '共济大学快递服务中心',
        longitude: 121.491800,
        latitude: 31.292000,
        iconPath: 'https://img.icons8.com/color/48/0066ff/package.png',
        width: 40,
        height: 40
      }
    ];

    this.setData({
      markers: campusPOIs
    });
  },

  // 定位到我的位置
  goToMyLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          centerLongitude: res.longitude,
          centerLatitude: res.latitude,
          polyline: [] // 清除之前的路线
        });
        wx.showToast({
          title: '已定位到当前位置',
          icon: 'success',
          duration: 1500
        });
      },
      fail: () => {
        wx.showToast({
          title: '定位失败，请检查权限',
          icon: 'none'
        });
      }
    });
  },

  // 地图缩放
  zoomIn() {
    this.setData({
      mapScale: Math.min(this.data.mapScale + 1, 20)
    });
  },

  zoomOut() {
    this.setData({
      mapScale: Math.max(this.data.mapScale - 1, 10)
    });
  },

  // 点击地图标记点
  onMarkerClick(e) {
    const markerId = e.detail.markerId;
    const poi = this.data.markers.find(item => item.id === markerId);
    
    if (poi) {
      this.setData({
        currentPoi: poi,
        showPoiPopup: true
      });
    }
  },

  // 点击地图空白处关闭弹窗
  onMapTap() {
    this.setData({
      showPoiPopup: false
    });
  },

  // 关闭地点详情弹窗
  closePoiPopup() {
    this.setData({
      showPoiPopup: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 执行搜索
  doSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索内容',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '正在搜索...'
    });

    // 调用腾讯地图搜索API，限定在校园范围内
    this.data.qqMap.search({
      keyword: keyword,
      location: {
        latitude: this.data.centerLatitude,
        longitude: this.data.centerLongitude
      },
      page_size: 10,
      success: (res) => {
        wx.hideLoading();
        
        if (res.data.length === 0) {
          wx.showToast({
            title: '未找到相关地点',
            icon: 'none'
          });
          return;
        }

        // 将搜索结果转换为地图标记点
        const searchMarkers = res.data.map((poi, index) => ({
          id: index + 100, // 避免与预设地点ID冲突
          title: poi.title,
          address: poi.address,
          longitude: poi.location.lng,
          latitude: poi.location.lat,
          iconPath: 'https://img.icons8.com/color/48/ff6600/marker.png',
          width: 30,
          height: 30
        }));

        this.setData({
          markers: searchMarkers,
          // 移动地图到第一个搜索结果
          centerLongitude: searchMarkers[0].longitude,
          centerLatitude: searchMarkers[0].latitude,
          polyline: [] // 清除之前的路线
        });

        wx.showToast({
          title: `找到${res.data.length}个结果`,
          icon: 'success'
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('搜索失败', err);
        wx.showToast({
          title: '搜索失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 规划步行路线
  planRoute() {
    const poi = this.data.currentPoi;
    if (!poi) return;

    wx.showLoading({
      title: '正在规划路线...'
    });

    this.data.qqMap.direction({
      mode: 'walking', // 步行模式，适合校园场景
      from: {
        latitude: this.data.centerLatitude,
        longitude: this.data.centerLongitude
      },
      to: {
        latitude: poi.latitude,
        longitude: poi.longitude
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.status !== 0) {
          wx.showToast({
            title: '路线规划失败',
            icon: 'none'
          });
          return;
        }

        // 解析路线坐标点
        const points = res.result.routes[0].polyline;
        const coors = [];
        
        // 解压腾讯地图返回的压缩坐标
        for (let i = 2; i < points.length; i++) {
          points[i] = Number(points[i-2]) + Number(points[i]) / 1000000;
        }
        
        for (let i = 0; i < points.length; i += 2) {
          coors.push({
            latitude: points[i],
            longitude: points[i+1]
          });
        }

        // 在地图上显示路线
        this.setData({
          polyline: [{
            points: coors,
            color: '#0066ff',
            width: 6,
            dottedLine: false
          }],
          showPoiPopup: false // 关闭弹窗
        });

        wx.showToast({
          title: '路线规划完成',
          icon: 'success'
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('路线规划失败', err);
        wx.showToast({
          title: '路线规划失败',
          icon: 'none'
        });
      }
    });
  },

  // 导航到选中地点
  navigateToPoi() {
    const poi = this.data.currentPoi;
    wx.openLocation({
      latitude: poi.latitude,
      longitude: poi.longitude,
      name: poi.title,
      address: poi.address,
      scale: 18
    });
  }
});