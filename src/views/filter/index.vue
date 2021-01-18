<template>
   <div>
     <el-row>
      <el-col :span="12">
          <div class="grid-content bg-purple">
            <span>原图</span>
            <canvas id="origin" :width="width" :height="height" v-show="image"></canvas>
          </div>
     </el-col>
      <el-col :span="12">
        <div class="grid-content bg-purple-light">
          <span>滤镜</span>
          <canvas id="new" :width="width" :height="height" v-show="image"></canvas>
        </div>
        </el-col>
    </el-row>
    <div class="opating">
      <el-upload
        class="upload-demo"
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleChange"
        >
         <el-button>点击生成</el-button>
      </el-upload>
      <el-dropdown  @command="handleCommand">
        <el-button type="primary">
          {{typeStyle.find(item=>item.value === currentStyle).type}}<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-for="(data,index) in typeStyle" :command="data.value" :key="index">{{data.type}}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
      <div class="download">
        <el-button @click="saveAsPNG">下载保证为PNG</el-button>
         <el-button @click="saveAsJPG">下载保证为JPG</el-button> 
      </div>
         
   </div>
</template>

<script>
const FileSaver = require('file-saver');
  export default {
    data() {
      return {
        imageUrl:'',
        width:0,
        height:0,
        image:'',
        currentStyle:'gray',
        typeStyle:[
          {
            type:'灰色',
            value:'gray',
          },
          {
            type:'复古',
            value:'retro',
          },
          {
            type:'浮雕',
            value:'relief',
          },
          {
            type:'模糊',
            value:'bulr',
          },
        ]
      };
    },
    methods: {
      handleChange(file) {
        let that = this;
        let imageUrl = URL.createObjectURL(file.raw)
        let image = new Image(); // 创建图片
        image.crossOrigin = 'Anonymous'; // 解决一些跨域问题
        image.onload = function() {
            that.width = image.width; // 设置canvas的宽
            that.height = image.height; // 设置canvas的高
            that.image = image;
            // 等待canvas的宽高属性渲染完毕绘制canvas
            that.$nextTick(() => { 
                that.drawFilterImage(image);
            })
        }
        image.src = imageUrl;
      },

      handleCommand(value){
        this.currentStyle = value;
      },
      //过滤图像
      drawFilterImage(image){
          let canvasOrigin = document.getElementById('origin');
          let imgOrigin = canvasOrigin.getContext('2d');
          let canvasNew = document.getElementById('new');
          let imgNew = canvasNew.getContext('2d');
          imgOrigin.drawImage(image, 0, 0, image.width, image.height);
          imgNew.drawImage(image, 0, 0, image.width, image.height);
          let imageData = imgOrigin.getImageData(0, 0, this.width, this.height);
          const filterData = this.chooseFilter(imageData,this.currentStyle);
          console.log(filterData)
          imgNew.putImageData(filterData,0,0);
      },
      //选择对应滤镜
      chooseFilter(imageData,type){
        //灰色
        if(type === "gray") return this.gray(imageData)
        //复古
        if(type === "retro") return this.retro(imageData)
        //浮雕
        if(type === "relief") return this.reliefCover(imageData)
        //高斯模糊
        if(type==='bulr') return this.gaussBlur(imageData)
      },


    retro(imgData){
      const data = imgData.data;
      for(let i = 0; i < data.length; i+=4) {
              let r = data[i],
                  g = data[i+1],
                  b = data[i+2];
              data[i] = (r*0.393)+(g*0.769)+(b*0.189);
              data[i+1] = (r*0.349)+(g*0.686)+(b*0.168);
              data[i+2] = (r*0.272)+(g*0.534)+(b*0.131);
          }
      return imgData
    },

    gray(imgData){
      const data = imgData.data;
      for(var i = 0; i < data.length; i+=4) {
              let grey = (data[i] + data[i+1] + data[i+2]) / 3;
              data[i] = data[i+1] = data[i+2] = grey;
          }
      return imgData
    },

    reliefCover(imgData){
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        for(let i = 0; i < data.length; i+=4) {
             if ((i+1) % 4 !== 0) { // 每个像素点的第四个（0,1,2,3  4,5,6,7）是透明度。这里取消对透明度的处理
                if ((i+4) % (width*4) == 0) { // 每行最后一个点，特殊处理。因为它后面没有边界点，所以变通下，取它前一个点
                      data[i] = data[i-4];
                      data[i+1] = data[i-3];
                      data[i+2] = data[i-2];
                      data[i+3] = data[i-1];
                      i+=4;
                    }
                    else{ // 取下一个点和下一行的同列点
                        data[i] = 255/2         // 平均值
                                  + 2*data[i]   // 当前像素点
                                  - data[i+4]   // 下一点
                                  - data[i+width*4]; // 下一行的同列点
                    }
                }
                else {  // 最后一行，特殊处理
                    if ((i+1) % 4 !== 0) {
                        data[i] = data[i-width*4];
                    }
                }
              }
          return imgData
    },

    gaussBlur (imgData) {
        const pixes = imgData.data;
        const width = imgData.width;
        const height = imgData.height;
        let gaussMatrix = [],
            gaussSum = 0,
            x, y,
            r, g, b, a,
            i, j, k, len;

        const radius = 10;
        const sigma = 5;

        a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
        b = -1 / (2 * sigma * sigma);
        //生成高斯矩阵
        for (i = 0, x = -radius; x <= radius; x++, i++) {
            g = a * Math.exp(b * x * x);
            gaussMatrix[i] = g;
            gaussSum += g;

        }

        //归一化, 保证高斯矩阵的值在[0,1]之间
        for (i = 0, len = gaussMatrix.length; i < len; i++) {
            gaussMatrix[i] /= gaussSum;
        }
        //x 方向一维高斯运算
        for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
                r = g = b = a = 0;
                gaussSum = 0;
                for (j = -radius; j <= radius; j++) {
                    k = x + j;
                    if (k >= 0 && k < width) {//确保 k 没超出 x 的范围
                        //r,g,b,a 四个一组
                        i = (y * width + k) * 4;
                        r += pixes[i] * gaussMatrix[j + radius];
                        g += pixes[i + 1] * gaussMatrix[j + radius];
                        b += pixes[i + 2] * gaussMatrix[j + radius];
                        // a += pixes[i + 3] * gaussMatrix[j];
                        gaussSum += gaussMatrix[j + radius];
                    }
                }
                i = (y * width + x) * 4;
                // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
                // console.log(gaussSum)
                pixes[i] = r / gaussSum;
                pixes[i + 1] = g / gaussSum;
                pixes[i + 2] = b / gaussSum;
                // pixes[i + 3] = a ;
            }
        }
        //y 方向一维高斯运算
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                r = g = b = a = 0;
                gaussSum = 0;
                for (j = -radius; j <= radius; j++) {
                    k = y + j;
                    if (k >= 0 && k < height) {//确保 k 没超出 y 的范围
                        i = (k * width + x) * 4;
                        r += pixes[i] * gaussMatrix[j + radius];
                        g += pixes[i + 1] * gaussMatrix[j + radius];
                        b += pixes[i + 2] * gaussMatrix[j + radius];
                        // a += pixes[i + 3] * gaussMatrix[j];
                        gaussSum += gaussMatrix[j + radius];
                    }
                }
                i = (y * width + x) * 4;
                pixes[i] = r / gaussSum;
                pixes[i + 1] = g / gaussSum;
                pixes[i + 2] = b / gaussSum;
            }
        }
        return imgData;
},

      saveAsPNG(){
        const canvasNew = document.getElementById('new');
        canvasNew.toBlob(function(blob) {
            saveAs(blob, "newFilter.png");
        });
      },
      saveAsJPG(){
        const canvasNew = document.getElementById('new');
        canvasNew.toBlob(function(blob) {
            saveAs(blob, "newFilter.jpg");
        });
      }
    }
  }
</script>

<style>
 .grid-content{ width: 300px; padding: 10px; font-size: 18px; font-weight: bold; margin-bottom: 10px;}
 .grid-content span{  display: block; padding-bottom: 20px;}
 .grid-content canvas{ width: 100%;}
 .upload-demo{
   padding: 0px 10px
 }
 .opating{
   display: flex;
 }
 .download{
   margin: 20px 10px;
 }
 .avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .avatar-uploader .el-upload:hover {
    border-color: #409EFF;
  }
  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
    border: solid 1px #ccc;
  }
  .avatar {
    width: 178px;
    height: 178px;
    display: block;
  }

   .el-dropdown {
    vertical-align: top;
  }
  .el-dropdown + .el-dropdown {
    margin-left: 15px;
  }
  .el-icon-arrow-down {
    font-size: 12px;
  }
  </style>