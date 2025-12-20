<template>
  <div class="user-info-head" @click="editCropper()">
    <img :src="options.img" title="Click to upload avatar" class="img-circle img-lg" />
    <el-dialog v-model="open" :title="title" width="800px" append-to-body @opened="modalOpened" @close="closeDialog">
      <el-row>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <vue-cropper
            v-if="visible"
            ref="cropper"
            :img="options.img"
            :info="true"
            :auto-crop="options.autoCrop"
            :auto-crop-width="options.autoCropWidth"
            :auto-crop-height="options.autoCropHeight"
            :fixed-box="options.fixedBox"
            :output-type="options.outputType"
            @real-time="realTime"
          />
        </el-col>
        <el-col :xs="24" :md="12" :style="{ height: '350px' }">
          <div class="avatar-upload-preview">
            <img :src="options.previews.url" :style="options.previews.img" />
          </div>
        </el-col>
      </el-row>
      <br />
      <el-row>
        <el-col :lg="2" :md="2">
          <el-upload action="#" :http-request="requestUpload" :show-file-list="false" :before-upload="beforeUpload">
            <el-button>
              Select
              <el-icon class="el-icon--right">
                <Upload />
              </el-icon>
            </el-button>
          </el-upload>
        </el-col>
        <el-col :lg="{ span: 1, offset: 2 }" :md="2">
          <el-button icon="Plus" @click="changeScale(1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="Minus" @click="changeScale(-1)"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshLeft" @click="rotateLeft()"></el-button>
        </el-col>
        <el-col :lg="{ span: 1, offset: 1 }" :md="2">
          <el-button icon="RefreshRight" @click="rotateRight()"></el-button>
        </el-col>
        <el-col :lg="{ span: 2, offset: 6 }" :md="2">
          <el-button type="primary" @click="uploadImg()">Submit</el-button>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import 'vue-cropper/dist/index.css';
import { VueCropper } from 'vue-cropper';
import { uploadAvatar } from '@/api/system/user';
import { useUserStore } from '@/store/modules/user';
import { UploadRawFile } from 'element-plus';

interface Options {
  img: string | any; // Cropped image source
  autoCrop: boolean; // Whether to create crop box by default
  autoCropWidth: number; // Default crop box width
  autoCropHeight: number; // Default crop box height
  fixedBox: boolean; // Fixed crop box size (not resizable)
  fileName: string;
  previews: any; // Preview data
  outputType: string;
  visible: boolean;
}

const userStore = useUserStore();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const open = ref(false);
const visible = ref(false);
const title = ref('Change Avatar');

const cropper = ref<any>({});
// Image crop options
const options = reactive<Options>({
  img: userStore.avatar,
  autoCrop: true,
  autoCropWidth: 200,
  autoCropHeight: 200,
  fixedBox: true,
  outputType: 'png',
  fileName: '',
  previews: {},
  visible: false
});

/** Open avatar editor */
const editCropper = () => {
  open.value = true;
};
/** Callback when dialog opened */
const modalOpened = () => {
  visible.value = true;
};
/** Override default upload behavior */
const requestUpload = (): any => {};
/** Rotate left */
const rotateLeft = () => {
  cropper.value.rotateLeft();
};
/** Rotate right */
const rotateRight = () => {
  cropper.value.rotateRight();
};
/** Zoom image */
const changeScale = (num: number) => {
  num = num || 1;
  cropper.value.changeScale(num);
};
/** Before upload hook */
const beforeUpload = (file: UploadRawFile): any => {
  if (file.type.indexOf('image/') == -1) {
    proxy?.$modal.msgError('Invalid file format. Please upload image files such as JPG or PNG.');
  } else {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      options.img = reader.result;
      options.fileName = file.name;
    };
  }
};
/** Upload avatar */
const uploadImg = async () => {
  cropper.value.getCropBlob(async (data: any) => {
    const formData = new FormData();
    formData.append('avatarfile', data, options.fileName);
    const res = await uploadAvatar(formData);
    open.value = false;
    options.img = res.data.imgUrl;
    userStore.setAvatar(options.img);
    proxy?.$modal.msgSuccess('Avatar updated successfully');
    visible.value = false;
  });
};
/** Realtime preview */
const realTime = (data: any) => {
  options.previews = data;
};
/** Close dialog */
const closeDialog = () => {
  options.img = userStore.avatar;
  options.visible = false;
};
</script>

<style lang="scss" scoped>
.user-info-head {
  position: relative;
  display: inline-block;
  height: 120px;
}

.user-info-head:hover:after {
  content: '+';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: #eee;
  background: rgba(0, 0, 0, 0.5);
  font-size: 24px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  cursor: pointer;
  line-height: 110px;
  border-radius: 50%;
}
</style>
