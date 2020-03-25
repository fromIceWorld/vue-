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

// ----------------------------------------------------------------模板解析------------------------------------------------
let startTagStart = /^\s*<([a-zA-Z_]+)/     //开始标签的开始
let startTagEnd = /^\s*>/     //开始标签的结束
let attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/   //匹配属性
let checkText = /^\s*(\w*)(\s*\{\{\w*\}\})(\s*\w*)/
let staticText = /^\s*\w+/      //静态文字
let vueData = /^\s*\{\{([a-zA-Z_]+)\}\}/   // 动态数据{{data}}
let endTag = /^\s*<\/(\w+)>/
let stack = []   
let html = '<div id="app" class="class">{{msg}}<span>Vue</span></div>'

  //开始标签
function parseStartTag(html){
  if(html.match(startTagStart)){
    const start = html.match(startTagStart)
    const match ={
      tagName:start[1],
      attrs:[]
    }
    let tag = html.substring(start[0].length)
    let end , attr 
    while(!(end = tag.match(startTagEnd))){
      attr = tag.match(attribute)
      match.attrs.push(attr)
      tag = tag.substring(attr[0].length)
    }
    return match
  }
}
  //文本
function parseText(text){
  if(text.match(checkText)){
    const textData = text.match(checkText)
    let end , 
        token = [] 
    while(!(end = text.match(startTagStart))){
      if(text.match(staticText)){
        let stText = text.match(staticText)
          token.push(stText[0])
          text = text.substring(stText[0].length)
      }else if(text.match(vueData)){
        let stText = text.match(vueData)
        token.push(`_s(${stText[1].trim()})`)        //动态数据 _s函数进行操作
        text = text.substring(stText[0].length)
      }
    }
    return token
  }
}
//结束标签
function parseEndTag(html){
  if(html.match(endTag)){

  }
}

//解析html
function parseHtml(html){
   
}