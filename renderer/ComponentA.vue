<template>
    <div>姓名：{{name}}</div>
</template>

<script>
export default {
  name:'ComponentA',
  props:{
    name:{
      type:String,
      require:true
    }
  }
}
</script>