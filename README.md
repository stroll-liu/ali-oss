# ali-oss
阿里 OSS 前端 vue 上传组件
## 安装

```js
npm i @stroll/ali-oss

```
## 引入
```js
import Vue from 'vue'
import AliOSS from '@stroll/ali-oss'

Vue.use(AliOSS)

```
## 调用
```html
<AliOSS ref="AliOSS" :config="config" :uploadLimit="uploadLimit" @finished="finished" @unfinished="unfinished" />

```
## 方法说明
```js
mounted () {
  // 可通过 init 方法初始化或重置 config （不传参为初始化，传参为重置）；如果已初始化，重置参数均为可选
  this.$refs.AliOSS && this.$refs.AliOSS.init({
    ossUrl: '', // OSS域名
    Bucket: '', // OSS存储空间域名
    accessid: '', // OSS accessid
    accesskey: '', // OSS accesskey
  })
},
methods: {
  // 上传成功回调 非必传 ，list为上传后的地址列表
  finished (list) {
    // 。。。
  },
  // 上传失败回调 非必传 ，list为上传后的地址列表
  unfinished (list) {
    // 。。。
  }
}
```

## 参数说明
```js
uploadLimit: {
  dirname: 'crm', // 保存目录
  finished: true, // 上传状态
  autoUpload: false, // 是否添加文件后自动上传
  chooseBtnHide: false, // 选择文件按钮是否隐藏
  chooseBtnName: '选择文件', // 选择文件按钮
  uploadBtnHide: false, // 上传按钮是否隐藏
  uploadBtnName: '上传', // 上传按钮文案
  progressWidth: '100%', // 进度条宽度
  progressCss:'', // 进度条样式
  uploadedList: [], // 上传后返回的地址
  files: {
    extraList: [ // 不同格式的文件数量限制规则
      {
        extensions: ['dmg', 'jpg'], // 上传的扩展名
        limit: 5, // 类型上限
        existed: 0, // 类型已存在个数
      }
    ],
    limit: 2, // 上传上限
    existed: 0, // 已存在个数
    size: 1024 * 1024 * 3, // Byte限制
    progress: true, // 进度条
    extensions: ['jpg', 'png'], // 总的允许上传的扩展名
    repetition: true // 是否许重复(true 不允许)
    img: { 图片规格限制
      size: [10000, 10000], // 图片尺寸大小限制 [width, height]
      limit: ['=', '=']  // ['=', '!=', '<', '>', '<=', '>=']
    }
  }
}

config: { // （必传）
  cdnUrl: '', // 文件请求域名  （非必传）
  ossUrl: '', // OSS域名
  Bucket: '', // OSS存储空间域名
  accessid: '', // OSS accessid
  accesskey: '', // OSS accesskey
  policyText: {
    expiration: '2021-01-01T12:00:00.000Z', // 设置该Policy的失效时间，超过这个失效时间之后，就没有办法通过这个policy上传文件了
    conditions: [
      ['content-length-range', 0, 1048576000] // 设置上传文件的大小限制
    ]
  }
}

```
