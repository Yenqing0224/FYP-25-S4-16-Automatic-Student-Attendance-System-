<template>
  <div class="top-right-btn" :style="style">
    <el-row>
      <el-tooltip v-if="search" class="item" effect="dark" :content="showSearch ? 'Hide Search' : 'Show Search'" placement="top">
        <el-button circle icon="Search" @click="toggleSearch()" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" content="Refresh" placement="top">
        <el-button circle icon="Refresh" @click="refresh()" />
      </el-tooltip>
      <el-tooltip v-if="columns" class="item" effect="dark" content="Show/Hide Columns" placement="top">
        <div class="show-btn">
          <el-popover placement="bottom" trigger="click">
            <div class="tree-header">Show/Hide Columns</div>
            <el-tree
              ref="columnRef"
              :data="columns"
              show-checkbox
              node-key="key"
              :props="{ label: 'label', children: 'children' } as any"
              @check="columnChange"
            ></el-tree>
            <template #reference>
              <el-button circle icon="Menu" />
            </template>
          </el-popover>
        </div>
      </el-tooltip>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { propTypes } from '@/utils/propTypes';

const props = defineProps({
  showSearch: propTypes.bool.def(true),
  columns: propTypes.fieldOption,
  search: propTypes.bool.def(true),
  gutter: propTypes.number.def(10)
});

const columnRef = ref<ElTreeInstance>();
const emits = defineEmits(['update:showSearch', 'queryTable']);

const style = computed(() => {
  const ret: any = {};
  if (props.gutter) {
    ret.marginRight = `${props.gutter / 2}px`;
  }
  return ret;
});

// Search
function toggleSearch() {
  emits('update:showSearch', !props.showSearch);
}

// Refresh
function refresh() {
  emits('queryTable');
}

// Toggle column visibility
function columnChange(...args: any[]) {
  props.columns?.forEach((item) => {
    item.visible = args[1].checkedKeys.includes(item.key);
  });
}

// Initialize column visibility on mount
onMounted(() => {
  props.columns?.forEach((item) => {
    if (item.visible) {
      columnRef.value?.setChecked(item.key, true, false);
      // value.value.push(item.key);
    }
  });
});
</script>

<style lang="scss" scoped>
:deep(.el-transfer__button) {
  border-radius: 50%;
  display: block;
  margin-left: 0px;
}
:deep(.el-transfer__button:first-child) {
  margin-bottom: 10px;
}

.my-el-transfer {
  text-align: center;
}
.tree-header {
  width: 100%;
  line-height: 24px;
  text-align: center;
}
.show-btn {
  margin-left: 12px;
}
</style>
