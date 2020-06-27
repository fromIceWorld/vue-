
/*
*  对html进行解析
*  非<script> / <style> 开头的为html
*     以‘<’开头的,可能为 注释 / 条件注释 / 开始标签 / 结束标签；
   先判断是否为结束标签，再判断是否为开始标签，都不是的话，就是文本标签；
*
* */

const commentRex = /^<!--/                       //注释
const endTag = /^<\/([a-zA-Z][\w-_]*)>/        //结束标签
const startTagOpen = /^<([a-zA-Z][\w-_]*)\s*/  //开始标签的开口
const startTagClose = /^\s*(\/?)>/            //开始标签的结束
const attribute = /^\s*([a-zA-Z-_]+)\s*(=?)\s*(?:"([^"]+)"|'([^']+)')?/  //匹配 class= "clA1"  class = 'cla2'  disable
const activeAttr = /^\s*(v-[a-zA-Z]+:|:+|@+)((?:\[)?[a-zA-Z]+(?:\]?))\s*(=)\s*(?:"([^"]*)"|'([^']*)')/   //检查动态属性 v-bind:[class] = '{}'
const textData = /(?:\{\{([\w\s]*)\}\})/  //匹配文本加动态文本
const forMatch = /\(([a-z]*\,[a-z]*)\)\s*in\s*([a-z]*)/;

var html = '<div class="cla1" key="key1" v-for="(item,index) in arr"><p ref="ref1" v-if="true">efwe{{word}}</p></div>';



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
       type:1,
       attrs:[],
       children:[]
     }
     advance(match[0].length)
     let end,attr
     while (!(end =  html.match(startTagClose)) &&(attr = html.match(attribute) || html.match(activeAttr))){
       advance(attr[0].length)
       element.attrs.push({name:attr[1],value:attr[3]})
     }
     //处理标签内的属性
     process(element);
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
   //处理标签内的属性
   function process(el){
     //处理for属性
     processFor(el);  
     processIf(el);
     processOnce(el);
     processElement(el);
   }
   function getAndRemoveAttr(el,name){
    let exp ;
    for(let i=0,len=el.attrs.length;i<len;i++){
      if(el.attrs[i].name===name){
        exp = el.attrs[i].value
        el.attrs.splice(i,1)
      }
    }
    return exp
   }
   //处理for标签
   function processFor(el){
     let exp = getAndRemoveAttr(el,'v-for')
     if(exp){
      let result =exp.match(forMatch)
      if(result){
         el.for = result[2]
         let attr = result[1].split(',')
         el.alias = attr[0]
         el.iterator1 = attr[1]
         el.iterator2 = attr[2]
      }else{
        let result = exp.split(',')
         el.for = result[1]
         el.alias = result[0]
      }
     }
   }
   //处理if / else / elseif标签
  function processIf(el){
    let exp = getAndRemoveAttr(el,'v-if')
    if(exp){
        el.if = exp;
        el.ifCondition = [];
        el.ifCondition.push({exp,block:el})
      } else {
        if (getAndRemoveAttr(el, 'v-else') != null) {
          el.else = true
        }
        const elseif = getAndRemoveAttr(el, 'v-else-if')
        if (elseif) {
          el.elseif = elseif
        }
      }
   }
  //处理once标签
  function processOnce(el){
    let once = getAndRemoveAttr(el,'v-once')
    if(once!==null){
        el.once = true;
      } 
    }
//处理剩余属性
  function processElement(el){
    processKey(el);
    // determine whether this is a plain element after（Vue注释）
    // removing structural attributes（Vue注释）
    //当标签没有key属性且 v-for / v-if /v- once 属性被移除时 el被认为是纯的
  // element.plain = (
  //   !element.key &&
  //   !element.scopedSlots &&
  //   !element.attrsList.length
  // )

    processRef(el);

  }
  function processKey(el){
    let exp = getBindingAttr(el,'key')
    if(exp){
      el.key = exp;
    }
  }
  function processRef(el){
    let ref = getBindingAttr(el,'ref')
    if(ref){
      el.ref = ref;
      el.refInFor = checkInFor(el);//与$ref有关
    }
  }
  function  checkInFor(el){
    let parent = el;
    while(parent){
      if(parent.for !== undefined){
        return true
      }
      parent = parent.parent
    }
    return false;

  }
  //对绑定属性的处理（v-on: || :）
  function getBindingAttr(el,name){
    const dynamicValue =
    getAndRemoveAttr(el, ':' + name) ||
    getAndRemoveAttr(el, 'v-bind:' + name)
    if(dynamicValue!= null){
      return parseFilters(dynamicValue)//对动态key的处理（key可能包含过滤器）
    }else{//对静态key处理
      const staticValue = getAndRemoveAttr(el, name)
      if (staticValue != null) {
        return JSON.stringify(staticValue)
      }
    }
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
  debugger
  console.log(currentParent,stack)
  return stack[0]
}


let ast = parse(html)

generator(ast[0])

//生成code
function generator(ast){debugger
  const code = ast ? genElement(ast) : '_c("div")'
  return {
    render: `with(this){return ${code}}`,
    //staticRenderFns: state.staticRenderFns
  }
}
function genElement(el){debugger
  if (el.for && !el.forProcessed) {
    return genFor(el)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el)
  } else{
    let data = genData(el)
    let children = genChildren(el)
    let code = `_c('${el.tag}'${data ? `,${data}` : ''} ${children ? `,${children}` : ''})`
    console.log(code)
    return code
  }
}
//处理标签内的属性
function genData(el){
let data = '{'
  // key
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  data = data.replace(/,$/, '') + '}'
  return data
}
//处理有for属性的标签
function genFor(el){
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''
  el.forProcessed = true;
  return `${'_l'}((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
      `return ${(genElement)(el)}` +
    '})'
}
function genIf(el){
  el.ifProcessed = true
  return genIfcondition(el.ifCondition)
}
function genIfcondition(ifCondition){
  if (ifCondition.exp) {
    return `(${ifCondition.exp})?${
      genTernaryExp(ifCondition.block)
    }:${
      genIfConditions(ifCondition)
    }`
  } else {
    return `${genTernaryExp(ifCondition.block)}`
  }
}
  // v-if with v-once should generate code like (a)?_m(0):_m(1)
function genTernaryExp (el) {
  return genElement(el,)
}
function genChildren(el){
  let children = el.children
  if(children){
    return `${children.map(c=>genNode(c)).join(',')}`
  }
}
function genNode(el){
  if (el.type === 1) {
    return genElement(el)
  }
}
















