/*
*  对html进行解析
*  非<script> / <style> 开头的为html
*     以‘<’开头的,可能为 注释 / 条件注释 / 开始标签 / 结束标签
*
*
*
*
*
*
*
* */

const commentRex = /^<!--/                       //注释
const endTag = /^<\/([a-zA-Z][\w-_]*)>/        //结束标签
const startTagOpen = /^<([a-zA-Z][\w-_]*)\s*/  //开始标签的开口
const startTagClose = /^\s*(\/?)>/            //开始标签的结束
const attribute = /^\s*([a-zA-Z-_]+)\s*(=?)\s*(?:"([^"]+)"|'([^']+)')?/  //匹配 class= "clA1"  class = 'cla2'  disable
const activeAttr = /^\s*(v-[a-zA-Z]+:|:+|@+)((?:\[)?[a-zA-Z]+(?:\]?))\s*(=)\s*(?:"([^"]*)"|'([^']*)')/   //检查动态属性 v-bind:[class] = '{}'
const textData = /(?:\{\{([\w\s]*)\}\})/  //匹配文本加动态文本
var html = '<div class="cla1"><p>efwe{{word}}</p></div>';


 function parse(html){
   let currentParent = '',
     stack = []
   //截取html
   function advance(n) {
     html = html.substring(n)
   }
//处理结束标签
   function parseEndTag(match) {
     advance(match[0].length)
     let index = stack.length-1,el;
     while(index >=0 && stack[index].tag === match[1]){
       el = stack[index];
       index--;
     }
     if(stack.length>=2){
       stack[index].children.push(el)
       currentParent = stack[index]
       stack.length = index+1
     }
   }
//处理开始标签
   function handleStartTag(match) {
     const element = {
       tag:match[1],
       attrs:[],
       children:[]
     }
     advance(match[0].length)
     let end,attr
     while (!(end =  html.match(startTagClose)) &&(attr = html.match(attribute) || html.match(activeAttr))){
       advance(attr[0].length)
       element.attrs.push({name:attr[1],value:attr[3]})
     }
     stack.push(element)
     currentParent = element;
     advance(end && end[0].length || 0)
   }
//处理注释
   function comment(text){
     const element={
       type:3,
       text:text,
       isComment:true
     }
     currentParent.children.push(element)
   }
   //处理文本
   function parseText(text,textEnd) {
      let lastIndex = 0,result,token = [],rowToken = [],index,endText;
      while(result =text.match(textData)){
        index = result.index
        if(index>lastIndex){
            token.push(text.slice(lastIndex,index));
            rowToken.push(text.slice(lastIndex,index));
            text = text.slice(index)
        }
        token.push(`_s(${result[1]})`);
        rowToken.push({'@binding':result[1]})
        text = text.slice(result[0].length)
        lastIndex = index +result[0].length
      }
      if(lastIndex < text.length){
        endText = text.slice(lastIndex)
        token.push(`_s(${endText})`);
        rowToken.push(endText)
      }
     let child = {
       type: 2,
       expression: token.join('+'),
       tokens: rowToken,
       text
     }
      currentParent.children.push(child)
   }
   while (html){
     let textEnd = html.indexOf('<')
    if(textEnd === 0){
      //comment
      if(commentRex.test(html)){
        const commentEnd =  html.indexOf('-->');
        comment(html.substring(4,commentEnd));
        advance(commentEnd + 3)
      }
      //endTag
      const match = html.match(endTag)
      if(match){
        parseEndTag(match)
      }
      //startTag
      const matchStartTag = html.match(startTagOpen);
      if(matchStartTag){
        handleStartTag(matchStartTag)
      }
    }
    let text,rest,next;
    if(textEnd >= 0){
      let rest = html.slice(textEnd)
      while(!startTagOpen.test(rest) && !endTag.test(rest)){
         next = rest.indexOf('<',1)
        if(next === -1) break
        textEnd += next;
        rest = html.slice(textEnd)
        text = html.substring(0, textEnd)
      }
      if(text){
        advance(textEnd)
        parseText(text,textEnd)
      }

    }
  }
  console.log(currentParent,stack)
}


parse(html)























