export default {
  handleErrorButtbindtap(e) {
    const {
      dataset
    } = e.currentTarget;

    if (dataset.href) {
      tt.redirectTo({
        url: dataset.href
      });
    } else {
      console.warn('no href specified');
    }
  }

};