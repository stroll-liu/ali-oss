<template>
  <div class="uploadAli">
    <button
      class="chooseBtn"
      ref="chooseBtn"
      v-show="!uploadAli.chooseBtnHide"
      @click="chooseFiles()"
    >{{uploadAli.chooseBtnName || '选择文件'}}</button>
    <button
      ref="uploadBtn"
      class="uploadBtn"
      type="primary"
      v-show="!uploadAli.uploadBtnHide"
    >{{uploadAli.uploadBtnName || '上传'}}</button>
    <button v-if="uploaderObj.files && uploaderObj.files.length && multiSelection"
      type="success"
      @click="resetFiles">全部清除
    </button>
    <div v-if="uploaderObj.files && uploaderObj.files.length !== 0" class="files">
      <div
        class="progress"
        :style="`width: ${uploadAli.progressWidth}`"
        v-for="(item,i) in uploaderObj.files || []"
        :key="i">
          <span class="fileName">
            {{showFileMsg(item)}}
          </span>
          {{item.percent}}
          <span class="icon-shanchu" @click="removeFile(item)">⊗</span>
          <div v-if="uploadAli.files.progress">
            <div :style="`
              width: ${item.percent || 0}%;${uploadAli.progressCss}
            `"></div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js'
import { Base64 } from 'js-base64'
import plupload from 'plupload'
export default {
  name: 'AliOSS',
  props: {
    uploadLimit: {
      type: Object,
      default: () => ({})
    },
    config: {
      type: Object,
      default: () => ({
        ossUrl: '',
        Bucket: '',
        accessid: '',
        accesskey: '',
        policyText: {
          expiration: '2021-01-01T12:00:00.000Z', 
          conditions: [
            ['content-length-range', 0, 1048576000]
          ]
        }
      })
    }
  },
  data () {
    return {
      uploadAli: {
        init: true,
        dirname: 'crm',
        finished: true,
        autoUpload: false,
        chooseBtnHide: false,
        chooseBtnName: '选择文件',
        uploadBtnHide: false,
        uploadBtnName: '上传',
        progressWidth: '100%',
        progressCss: `
          border-radius: 1% / 50%;
          height: 5px;
          background-color: green;`,
        uploadedList: [],
        files: {
          extraList: [],
          limit: 1,
          existed: 0,
          size: 1024 * 1024 * 3,
          progress: true,
          extensions: ['jpg', 'png'],
          repetition: true
        }
      },
      fileStatus: {
        5: `（完成）`,
        4: `（失败）`
      },
      sizeContrast: {
        '=': '等于',
        '!=': '不等于',
        '>': '大于',
        '<': '小于',
        '>=': '大于等于',
        '<=': '小于等于'
      },
      uploaderObj: {},
      fileList: [],
      policyBase64: '',
      signature: ''
    }
  },
  computed: {
    // 多选
    multiSelection () {
      return this.uploadAli.files.limit !== 1
    },
    uploaderErr () {
      return {
        '-200': '网络发生错误',
        '-300': '磁盘读写错误',
        '-600': `上传文件体积不能超过${this.computeSize(this.uploadAli.files.size)}`,
        '-601': '选择的文件类型不符合要求',
        '-602': '选取文件重复'
      }
    }
  },
  async mounted () {
    await this.setUploadAli()
    this.uploadAli.init && await this.init()
  },
  methods: {
    async init (config) {
      if (config) {
        const arr = []
        Object.keys(this.config).forEach(key => {
          arr.push(key)
        })
        Object.keys(config).forEach(key => {
          if (arr.includes(key)) {
            this.config[key] = config[key]
          }
        })
      }
      this.policyBase64 = Base64.encode(JSON.stringify(this.config.policyText))
      const hash = CryptoJS.HmacSHA1(this.policyBase64, this.config.accesskey)
      this.signature = hash.toString(CryptoJS.enc.Base64)
      await this.pluploadInit()
    },
    async setUploadAli () {
      const arr = []
      Object.keys(this.uploadAli).forEach(key => {
        arr.push(key)
      })
      Object.keys(this.uploadLimit).forEach(key => {
        if (arr.includes(key)) {
          if (key === 'files') {
            const filesArr = []
            Object.keys(this.uploadAli[key]).forEach(k => {
              filesArr.push(k)
            })
            Object.keys(this.uploadLimit[key]).forEach(k => {
              if (filesArr.includes(k)) {
                this.uploadAli[key][k] = this.uploadLimit[key][k]
              }
            })
          } else {
            this.uploadAli[key] = this.uploadLimit[key]
          }
        }
      })
    },
    // 显示上传文件信息
    showFileMsg (file) {
      let name = file.name
      let size = this.computeSize(file.size)
      return `文件：${name} - 大小：${size}${this.fileStatus[file.status] || '（'+file.percent+'%）'}`
    },
    // 文件大小
    computeSize (size) {
      if (size < 1024) {
        return  `${size}B`
      } else if (size >= 1024 && size < 1024 * 1024) {
        return  `${(size / 1024).toFixed(1)}KB`
      } else if (size >= 1024 * 1024 && size < 1024 * 1024 * 1024) {
        return  `${(size / 1024 / 1024).toFixed(1)}MB`
      } else if (size >= 1024 * 1024 * 1024 && size < 1024 * 1024 * 1024 * 1024) {
        return  `${(size / 1024 / 1024 / 1024).toFixed(1)}GB`
      }
    },

    // 选择文件
    chooseFiles () {
      this.addFileFilterImg()
    },
    // 全部清除
    resetFiles () {
      this.uploaderObj.stop()
      this.uploadAli.finished = true
      let length = this.uploaderObj.files ? this.uploaderObj.files.length : 0
      for (let i = length; i > 0; i--) {
        this.uploaderObj.removeFile(this.uploaderObj.files[i - 1])
      }
      this.uploadAli.uploadedList = []
      this.fileList = []
    },
    // 删除单个文件
    removeFile (file) {
      if (file.status === 2) {
        this.uploaderObj.stop()
        console.log('上传已终止')
      }
      this.uploaderObj.removeFile(file)

      this.uploadAli.finished = true
      this.uploaderObj.files && this.uploaderObj.files.some(item => {
        if ([1, 2].includes(item.status)) {
          this.uploadAli.finished = false
          return true
        }
      })
      this.listKillFile(file)
    },
    // 删除上传队列（fileList） 和 已上传队列（uploadedList）中的文件
    listKillFile (file) {
      this.uploadAli.uploadedList.some((item, i, arr) => {
        if (item.id === file.id) {
          arr.splice(i, 1)
          return true
        }
      })
      this.fileList.some((item, i, arr) => {
        if (item.id === file.id) {
          arr.splice(i, 1)
          return true
        }
      })
    },

    // plupload初始化
    async pluploadInit () {
      this.addFileFilterImg()

      this.uploaderObj = new plupload.Uploader({
        url: this.config.ossUrl,
        browse_button: this.$refs.chooseBtn,
        multi_selection: this.multiSelection,
        filters: {
          mime_types: this.uploadAli.files.extensions.length
            ? [{ extensions: this.uploadAli.files.extensions.join() }]
            : undefined,
          prevent_duplicates: this.uploadAli.files.repetition,
          max_file_size: this.uploadAli.files.size || '',
          imgSize: this.uploadAli.files.img && this.uploadAli.files.img.size ? this.uploadAli.files.img.size : ''
        },
        runtimes: 'html5,flash,silverlight,html4',
        flashSwfUrl: 'plupload/js/Moxie.swf',
        silverlightXapUrl: 'plupload/js/Moxie.xap',
        init: {
          PostInit: this.PostInit,
          FileFiltered: this.FileFiltered,
          FilesAdded: this.FilesAdded,
          BeforeUpload: this.BeforeUpload,
          UploadComplete: this.UploadComplete,
          UploadProgress: this.UploadProgress,
          FileUploaded: this.FileUploaded,
          // StateChanged: this.StateChanged,
          Error: this.Error
        }
      })
      this.uploaderObj.init()
    },
    // 状态改变
    StateChanged (uploader) {
      console.log('uploader', uploader)
    },
    // 上传初始化动作 绑定上传按钮
    PostInit (uploader) {
      this.$refs.uploadBtn.onclick = () => {
        uploader.start()
      }
    },
    // 文件选择后
    FileFiltered (uploader, file) {
      if (this.multiSelection) {
        if (this.uploadAli.files.limit && uploader.files.length > (this.uploadAli.files.limit - this.uploadAli.files.existed || 0)) {
          console.log(`上传文件数量不能超过${this.uploadAli.files.limit}个`)
          uploader.removeFile(file)
        } else if (this.checkExtraList(file, uploader)) {
          this.printExtraListInfo(file)
          uploader.removeFile(file)
        } else {
          this.uploadAli.finished = false
        }
      } else {
        if (uploader.files.length > 1) {
          this.listKillFile(uploader.files[0])
          uploader.removeFile(uploader.files[0])
        }
        this.uploadAli.finished = false
      }
    },
    // 添加文件后
    FilesAdded (uploader) {
      if (this.uploadAli.autoUpload) {
        uploader.start()
      }
    },
    // 单个文件上传之前
    BeforeUpload (uploader, file) {
      let fileName = `${+new Date()}_${file.name}`
      this.fileList.push({
        fileName,
        id: file.id,
        name: file.name
      })
      const newMultipartParams = {
        'Filename': 'console/',
        'key': `${this.uploadAli.dirname || 'crm'}/${fileName}`,
        'policy': this.policyBase64,
        'OSSAccessKeyId': this.config.accessid,
        'success_action_status': '200',
        'signature': this.signature,
        'multi_selection': false
      }
      uploader.setOption({
        'url': this.config.Bucket,
        'multipart_params': newMultipartParams
      })
    },
    // 整个队列中文件上传完成后
    UploadComplete () {
      this.uploadAli.finished = true
    },
    // 单个文件上传后
    FileUploaded (uploader, file, info) {
      if (info.status === 200) {
        this.getFileUrl(file)
      }
    },
    // 错误异常处理
    Error (uploader, err) {
      console.log(uploader, err)
      if (err.code) {
        console.log(this.uploaderErr[err.code])
      } else {
        console.log(err)
      }
    },

    // 添加自定义 过滤类型
    addFileFilterImg () {
      if (!this.uploadAli.files.img) {
        return
      }

      plupload.addFileFilter('imgSize', (imgSize, file, cb) => {
        if (file.type.includes('image') && !file.type.includes('gif')) {
          let img = new plupload.moxie.image.Image()

          img.onload = () => {
            let flag = true
            let msg = []
            let imgMsg = [this.contrast(img.width, 0), this.contrast(img.height, 1)]
            imgMsg.forEach(item => {
              if (!item.flag) {
                flag = false
              }
              if (item.rule) {
                msg.push(`图片${item.type}需${item.rule}${item.imgSize}像素`)
              }
            })

            if (msg.length > 0) {
              console.log(msg.join('，'))
            }

            img.destroy()
            img = null
            cb(flag)
          }
          img.onerror = () => {
            img.destroy()
            img = null
            cb(false)
          }
          img.load(file.getSource())
        } else {
          cb(true)
        }
      })
    },
    async imgRules () {
      return {
        '=': (size, imgSize) => size === imgSize,
        '!=': (size, imgSize) => size !== imgSize,
        '>': (size, imgSize) => size > imgSize,
        '<': (size, imgSize) => size < imgSize,
        '>=': (size, imgSize) => size >= imgSize,
        '<=': (size, imgSize) => size <= imgSize
      }
    },
    // 对比尺寸
    async contrast (size, num) {
      let imgSize = ''
      let sizeContrast = ''
      if (this.uploadAli.files.img) {
        if (this.uploadAli.files.img.size) {
          imgSize = this.uploadAli.files.img.size[num] || ''
        }
        if (this.uploadAli.files.img.limit) {
          sizeContrast = this.uploadAli.files.img.limit[num] || ''
        }
      }
      const imgRules = await this.imgRules()
      return {
        flag: imgRules[sizeContrast](size, imgSize),
        rule: this.sizeContrast[sizeContrast || '='],
        type: num === 1 ? '高' : '宽',
        imgSize
      }
    },
    // 获取扩展名
    getSuffix (fileName) {
      let pos = fileName.lastIndexOf('.')
      let suffix = ''
      if (pos !== -1) {
        suffix = fileName.substring(pos + 1)
      }
      return suffix
    },
    // 检查ExtraList文件
    checkExtraList (file, uploader) {
      let flag = false
      const suffixStr = this.getSuffix(file.name)
      const extraObj = this.uploadAli.files.extraList.find(item => item.extensions.includes(suffixStr))
      if (extraObj) {
        let count = 0
        uploader.files.forEach(item => {
          if (extraObj.extensions.includes(this.getSuffix(item.name))) {
            count++
            if (count > (extraObj.limit - extraObj.existed)) {
              flag = true
            }
          }
        })
      }
      return flag
    },
    // 对ExtraList输出message
    printExtraListInfo (file) {
      const suffixStr = this.getSuffix(file.name)
      const extraObj = this.uploadAli.files.extraList.find(item => item.extensions.includes(suffixStr)) ||  { extensions: [] }
      let msg = ''
      extraObj.extensions.forEach(item => {
        msg += item + ' '
      })
      console.log(`文件类型为${msg}的数量不能超过${extraObj.limit}个`)
    },
    // 获取file Url
    getFileUrl (file) {
      this.fileList.some(item => {
        if (item.id === file.id) {
          this.uploadAli.uploadedList.push({
            ...item,
            url: `${this.config.cdnUrl || this.config.Bucket}${this.uploadAli.dirname || 'crm'}/${item.fileName}`
          })
          return true
        }
      })
    }
  },
  watch: {
    'uploadAli.finished' (val) {
      if (val) {
        this.$emit('finished', this.uploadAli.uploadedList)
      } else {
        this.$emit('unfinished', this.uploadAli.uploadedList)
      }
    },
    uploadLimit: {
      handler () {
        console.log('v')
        this.setUploadAli()
      },
      deep: true
    }
  }
}
</script>

<style scoped>
button {
  outline: none;
  color: #fff;
  background-color: rgb(45, 140, 240);
  border-color: #2d8cf0;
  padding: 3px 15px;
  margin: 6px 9px 6px 0;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: rgba(45, 140, 240, .7);
}
.files {
  padding: 10px;
}
.fileName {
  word-break: break-word
}
.icon-shanchu {
  cursor: pointer;
}
.icon-shanchu:hover {
  color: red
}
.progress {
  display: block;
  max-width: 720px;
  transition: width 0.5s;
}
</style>
