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
let checkText = /^\s*(\w*)(\s*\{\{\w*\}\})*(\s*\w*)*/
let staticText = /^\s*\w+/      //静态文字
let vueData = /^\s*\{\{([a-zA-Z_]+)\}\}/   // 动态数据{{data}}
let endTag = /^\s*<\/(\w+)>/
let stack = []   
let html = '<div id="app" class="class">{{msg}}<span>Vue</span></div>'

  //开始标签
function parseStartTag(){
  if(html.match(startTagStart)){
    const start = html.match(startTagStart)
    const match ={
      tagName:start[1],
      attrs:[]
    }
    html = html.substring(start[0].length)
    let end , attr 
    while(!(end = html.match(startTagEnd))){
      attr = html.match(attribute)
      match.attrs.push(attr)
      html = html.substring(attr[0].length)
    }
    return match
  }
}
  //文本
function parseText(){
    let end , 
        token = [] 
    while(html.match(vueData) || html.match(staticText)){
      if(html.match(staticText)){
        let stText = html.match(staticText)
          token.push(stText[0])
          html = html.substring(stText[0].length)
      }else if(html.match(vueData)){
        let stText = html.match(vueData)
        token.push(`_s(${stText[1].trim()})`)        //动态数据 _s函数进行操作
        html = html.substring(stText[0].length)
      }
    }
    return token
}
//开始标签的结束
function parseEndTag(){
    let mid = html.match(startTagEnd)
    html = html.substring(mid[0].length)
}
//结束标签
function parseEnd(){
    let mid = html.match(endTag)
    html = html.substring(mid[0].length)
}

//解析html
function parseHtml(){
  let stack = [],currentParent,root
   //开始标签
   while(html.length!== 0){
     //开始标签
    if(html.match(startTagStart)){
      let mid = parseStartTag()
      let element = {
        type:1,
        tag:mid.tagName,
        lowerCasedTag:mid.tagName.toLowerCase(),
        attrsMap:'makeAttrsMap(mid.attrs)',
        children:[]
      }
      if(!root){
        root = element
      }
      if(currentParent){
        currentParent.children.push(element)
      }
      stack.push(element)
      currentParent = element
    }
    // 开始标签的闭合
    if(html.match(startTagEnd)){
      parseEndTag()
    }
    //文本
    if(html.match(vueData) || html.match(staticText)){
      let mid = this.parseText()
      currentParent.children.push({
        type:2,
        text:mid
      })
    }
    if(html.match(endTag)){
      parseEnd()
    }
} 
console.log(stack,currentParent,root)
}
