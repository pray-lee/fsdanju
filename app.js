import { login } from "./util/getErrorMessage";
App({
  onLaunch(options) {
    console.log('running....'); // 获取设备信息

    const {
      model,
      environment
    } = tt.getSystemInfoSync();
    const isIphoneXSeries = model.indexOf('iPhone X') !== -1;
    this.globalData.isPhoneXSeries = isIphoneXSeries ? true : false;
    this.globalData.isWxWork = environment ? true : false;
  },

  onShow(options) {// 从后台被 scheme 重新打开
    // options.query == {number:1}
    // login(this)
  },

  globalData: {
    // url: 'https://www.caika.net/jeecg/',
    // appId: 'cli_a28eda58bd78d00c',
    // tenantCode: 'db_ck_saas_v1_test',
    // tenantCode: 'db_ck_goski_test',
    // 雅学院
    // url: 'https://www.caika.net/caika/',
    // appId: 'cli_a2b866ef0639900d',
    // tenantCode: 'db_ck_wenhua2021',
    // goski
    url: 'https://www.caika.net/goski/',
    appId: 'cli_a209d304ca799013',
    tenantCode: 'db_ck_goski',
    // 智取科技
    // url: 'https://www.caika.net/caika/',
    // appId: 'cli_a385a5567abbd00b',
    // tenantCode: 'db_ck_education',

  }
});
// vud0lKenArwgwr0ojKxOJbt2V13h17TY
// bIy2ZRiezhogd25Qeg3D6b0pRkSNv2Oh
// https://www.caika.net/caika/feishuController/callBack.do