//--------------------------------------------------------数据双向绑定----------------------------
// ------------------------------------------------------------------------------------------------------
//遍历属性，循环监听
function Observer(data){
  Object.keys(data).forEach(prop=>{
    type(data,prop,data[prop])
  })
}

//监听data
function define(data,prop,val){
  console.log(data,prop,val)
  Object.defineProperty(data,prop,{
    get(){
      //读取属性
      console.log('获取属性'+prop)
      return val
    },
    set(newVal){
      console.log(val,this,val)
      // 设置属性
      val = newVal
      console.log('val:' +val)
      console.log('设置属性'+prop + '为'+newVal)},

  })
}

// 判定属性类型 分类进行监听
function type(data,prop,val){
    let type = Object.prototype.toString.call(data[prop])
    switch(type){
      case "[object Number]" :  //Number类型
      case "[object String]" : //String类型
              this.define(data,prop,val)
              console.log("[object Number]");
              break;
      case "[object Object]" :  //Object类型
              this.Observer(data[prop])
              this.define(data,prop,data[prop])
              console.log("[object Object]");
              break;
      case "[object Array]" :  //Array类型
              this.Observer(data[prop])
              this.define(data,prop,data[prop])
              console.log("[object Array]");
              break;
      default:
            console.log('啥都不是')
  }
}


