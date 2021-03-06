import { formatNumber, request } from '../../util/getErrorMessage';
var app = getApp();
app.globalData.loadingCount = 0;
Page({
  data: {
    type: 'empty',
    title: '什么都没有了',
    startX: 0,
    //开始坐标
    startY: 0,
    isPhoneXSeries: false,
    scrollTop: 0,
    list: [1]
  },
  //手指触摸动作开始 记录起点X坐标
  touchstart: function (e) {
    //开始触摸时 重置所有删除
    this.data.list.forEach(function (v, i) {
      if (v.isTouchMove) //只操作为true的
        v.isTouchMove = false;
    });
    this.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      list: this.data.list
    });
  },
  //滑动事件处理
  touchmove: function (e) {
    var that = this,
        index = e.currentTarget.dataset.index,
        //当前索引
    startX = that.data.startX,
        //开始X坐标
    startY = that.data.startY,
        //开始Y坐标
    touchMoveX = e.changedTouches[0].clientX,
        //滑动变化坐标
    touchMoveY = e.changedTouches[0].clientY,
        //滑动变化坐标
    //获取滑动角度
    angle = that.angle({
      X: startX,
      Y: startY
    }, {
      X: touchMoveX,
      Y: touchMoveY
    });
    that.data.list.forEach(function (v, i) {
      v.isTouchMove = false; //滑动超过30度角 return

      if (Math.abs(angle) > 30) return;

      if (i == index) {
        if (touchMoveX > startX) //右滑
          v.isTouchMove = false;else //左滑
          v.isTouchMove = true;
      }
    }); //更新数据

    that.setData({
      list: that.data.list
    });
  },

  /**
   * 计算滑动角度
   * @param {Object} start 起点坐标
   * @param {Object} end 终点坐标
   */
  angle: function (start, end) {
    var _X = end.X - start.X,
        _Y = end.Y - start.Y; //返回角度 /Math.atan()返回数字的反正切值


    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },

  getExpressList() {
    this.addLoading();
    const customerDetailId = tt.getStorageSync('customerDetailId');
    request({
      hideLoading: this.hideLoading(),
      url: app.globalData.url + 'customerSpecialDeliveryController.do?listInfo&customerDetailId=' + customerDetailId,
      method: 'GET',
      success: res => {
        this.setData({
          list: res.data.obj
        });
      }
    });
  },

  selectExpress(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id;
    const expressInfo = this.data.list.filter(item => item.id === id)[0];
    tt.setStorage({
      key: 'expressInfo',
      data: expressInfo,
      success: () => {
        tt.navigateBack({
          delta: 1
        });
      }
    });
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    this.getExpressList();
  },

  addLoading() {
    if (app.globalData.loadingCount < 1) {
      tt.showLoading({
        content: '加载中...'
      });
    }

    app.globalData.loadingCount += 1;
  },

  hideLoading() {
    if (app.globalData.loadingCount <= 1) {
      tt.hideLoading();
      app.globalData.loadingCount = 0;
    } else {
      app.globalData.loadingCount -= 1;
    }
  },

  onShow() {},

  addExpressInfo(e) {
    tt.navigateTo({
      url: '/pages/addExpressInfo/index'
    });
  },

  update(e) {
    const id = e.currentTarget.dataset.id;
    this.data.list.forEach(item => {
      if (item.id === id) {
        tt.setStorage({
          key: 'expressInfo',
          data: item,
          success: res => {
            tt.navigateTo({
              url: '/pages/addExpressInfo/index?type=edit'
            });
          }
        });
      }
    });
    console.log();
  },

  delete(e) {
    const id = e.currentTarget.dataset.id;
    const url = app.globalData.url + 'customerSpecialDeliveryController.do?doBatchDel&ids=' + id;
    tt.showModal({
      title: '温馨提示',
      content: '确认删除该物流信息吗?',
      confirmText: '是',
      cancelText: '否',
      success: res => {
        this.setData({
          x: 0
        });

        if (res.confirm) {
          this.addLoading();
          request({
            hideLoading: this.hideLoading,
            url,
            method: 'GET',
            success: res => {
              console.log(res);

              if (res.data.success) {
                // 删除成功
                this.onLoad();
              } else {
                tt.showModal({
                  content: '删除失败',
                  confirmText: '好的',
                  showCancel: false
                });
              }
            }
          });
        }
      }
    });
  }

});