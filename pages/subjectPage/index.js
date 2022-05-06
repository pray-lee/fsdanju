var app = getApp();
Page({
  data: {
    isPhoneXSeries: false,
    subjectList: [],
    searchResult: [],
    inputValue: ''
  },

  onLoad() {
    this.setData({
      isPhoneXSeries: app.globalData.isPhoneXSeries
    });
    tt.getStorage({
      key: 'subjectList',
      success: res => {
        this.setData({
          subjectList: res.data,
          searchResult: res.data
        });
      }
    });
  },

  goBack(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    const subjectExtraId = e.currentTarget.dataset.extraid;
    const obj = {
      id,
      name,
      subjectExtraId
    };
    console.log(obj, 'goBack');
    tt.setStorageSync('subject', obj);
    console.log('设置科目id成功');
    tt.navigateBack({
      delta: 1
    });
  },

  bindinput(e) {
    const value = e.detail.value;

    if (!!app.globalData.timeOutInstance) {
      clearTimeout(app.globalData.timeOutInstance);
    }

    this.setData({
      inputValue: value
    });
    this.searchFn(value);
  },

  clearWord() {
    this.setData({
      inputValue: ''
    });
    this.searchFn('');
  },

  searchFn(value) {
    app.globalData.timeOutInstance = setTimeout(() => {
      var searchResult = this.data.subjectList.filter(item => item.name.indexOf(value) !== -1);
      this.setData({
        searchResult: searchResult
      });
    }, 300);
  }

});