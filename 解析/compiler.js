
/*
  对template进行解析【调用compileToFunctions(template, options, vm)函数】
     compileToFunctions =  createCompilerCreator(baseCompile)(baseOptions).compileToFunctions
                        =  createCompiler(baseOptions).compileToFunctions
     compileToFunctions -> compileToFunctions(template, options, vm)
     compileToFunctions 中调用 baseCompile 解析模板
*/
/* 1- compileToFunctions
      - 函数接受处理后的模板 和一些配置选项【dist/vue.js p10597】
   2- 最终合并基础配置和web配置 调用 baseCompile,baseCompile分为三个步骤
   3-
*/


/* 2.1- parse 过程,解析模板 parse(template, options)
         -




*/

const modifierCode = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
}




const commentRex = /^<!--/                       //注释
const endTag = /^<\/([a-zA-Z][\w-_]*)>/        //结束标签
const startTagOpen = /^<([a-zA-Z][\w-_]*)\s*/  //开始标签的开口
const startTagClose = /^\s*(\/?)>/            //开始标签的结束
const attribute = /^\s*([^\s"'<>\/=]+)\s*(=?)\s*(?:"([^"]+)"|'([^']+)')?/  //匹配 class= "clA1"  class = 'cla2'  disable
const activeAttr = /^\s*(v-[a-zA-Z]+:|:+|@+)((?:\[)?[a-zA-Z]+(?:\]?))\s*(=)\s*(?:"([^"]*)"|'([^']*)')/   //检查动态属性 v-bind:[class] = '{}'
const textData = /(?:\{\{([\w\s]*)\}\})/  //匹配文本加动态文本
const forMatch = /\(([a-z]*\,[a-z]*)\)\s*in\s*([a-z]*)/
const dirRe = /^v-|^:|^@/
const modifierRE = /\.[^.\]]+(?=[^\]]*$)/g
const bindRe = /v-bind:|:/
const onRe = /^v-on:|^@/
const dynamicArgRE = /^\[.*\]$/
const camelize = /-(\w)/g
const argRE = /:(.*)$/



var html = '<div class="cla1" key="key1" v-for="(item,index) in arr">' +
              '<p ref="refp" v-bind:[class]="bindClass" @click.prevent="handlep" v-if="true">efwe{{word}}</p>' +
              '<componentFirst :value="data" @select="change" ></componentFirst><template slot-scope="rowData"></template>' +
              '<slot name="slot1"></slot>' +
            '</div>';



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
       attrsList:[],
       children:[]
     }
     advance(match[0].length)
     let end,attr
     while (!(end =  html.match(startTagClose)) &&(attr = html.match(attribute) || html.match(activeAttr))){
       advance(attr[0].length)
       element.attrsList.push({name:attr[1],value:attr[3]})
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
   //处理过滤器

 function parseFilters (exp) {
   const validDivisionCharRE = /[\w).+\-_$\]]/
   function wrapFilter (exp, filter) {
     const i = filter.indexOf('(')
     if (i < 0) {
       // _f: resolveFilter
       return `_f("${filter}")(${exp})`
     } else {
       const name = filter.slice(0, i)
       const args = filter.slice(i + 1)
       return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
     }
   }
     let inSingle = false             // '
     let inDouble = false             // "
     let inTemplateString = false     // `
     let inRegex = false              //  /
     let curly = 0                    // {}
     let square = 0                   // []
     let paren = 0                    // ()
     let lastFilterIndex = 0
     let c, prev, i, expression, filters

     for (i = 0; i < exp.length; i++) {
       prev = c
       c = exp.charCodeAt(i)
       if (inSingle) {
         if (c === 0x27 && prev !== 0x5C) inSingle = false   //  反斜杠\
       } else if (inDouble) {
         if (c === 0x22 && prev !== 0x5C) inDouble = false
       } else if (inTemplateString) {
         if (c === 0x60 && prev !== 0x5C) inTemplateString = false
       } else if (inRegex) {
         if (c === 0x2f && prev !== 0x5C) inRegex = false
       } else if (
         c === 0x7C &&      // |
         exp.charCodeAt(i + 1) !== 0x7C &&
         exp.charCodeAt(i - 1) !== 0x7C &&
         !curly && !square && !paren
       ) {
         if (expression === undefined) {
           // first filter, end of expression
           lastFilterIndex = i + 1
           expression = exp.slice(0, i).trim()
         } else {
           pushFilter()
         }
       } else {
         switch (c) {
           case 0x22: inDouble = true; break         // "
           case 0x27: inSingle = true; break         // '
           case 0x60: inTemplateString = true; break // `
           case 0x28: paren++; break                 // (
           case 0x29: paren--; break                 // )
           case 0x5B: square++; break                // [
           case 0x5D: square--; break                // ]
           case 0x7B: curly++; break                 // {
           case 0x7D: curly--; break                 // }
         }
         if (c === 0x2f) { //  /
           let j = i - 1
           let p
           // find first non-whitespace prev char
           for (; j >= 0; j--) {
             p = exp.charAt(j)
             if (p !== ' ') break
           }
           if (!p || !validDivisionCharRE.test(p)) {
             inRegex = true
           }
         }
       }
     }

     if (expression === undefined) {
       expression = exp.slice(0, i).trim()
     } else if (lastFilterIndex !== 0) {
       pushFilter()
     }

     function pushFilter () {
       (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim())
       lastFilterIndex = i + 1
     }

     if (filters) {
       for (i = 0; i < filters.length; i++) {
         expression = wrapFilter(expression, filters[i])
       }
     }

     return expression
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
    for(let i=0,len=el.attrsList.length;i<len;i++){
      if(el.attrsList[i].name===name){
        exp = el.attrsList[i].value
        el.attrsList.splice(i,1)
        return exp
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
    if(once!=null){
        el.once = true;
      }
    }
    //添加事件
   function addHandler(el, name, value, modifiers, important,  isDynamic) {
     modifiers = modifiers || {}
     if(modifiers.prevent &&modifiers.passive){
       console.log('---warn---(prevent,passive)不能同时存在')
     }
     if(modifiers.right){
       if(isDynamic){
         name = `(${name})==='click'?'contextmenu':(${name})`
       }else if(name === 'click'){
         name = 'contextmenu'
         delete modifiers.right
       }
     }else if(modifiers.middle){
       if(isDynamic){
         name = `(${name})==='click'?'mouseup':(${name})`
       }else if(name === 'click'){
         name = 'mouseup'
       }
     }

     // check capture modifier
     if (modifiers.capture) {
       delete modifiers.capture
       name = prependModifierMarker('!', name, isDynamic)
     }
     if (modifiers.once) {
       delete modifiers.once
       name = prependModifierMarker('~', name, isDynamic)
     }
     /* istanbul ignore if */
     if (modifiers.passive) {
       delete modifiers.passive
       name = prependModifierMarker('&', name, isDynamic)
     }
     let events
     if (modifiers.native) {
       delete modifiers.native
       events = el.nativeEvents || (el.nativeEvents = {})
     } else {
       events = el.events || (el.events = {})
     }
     const newHandler ={
       value,
       modifiers
     }
     const handlers = events[name]
     if (Array.isArray(handlers)) {
       important ? handlers.unshift(newHandler) : handlers.push(newHandler)
     } else if (handlers) {
       events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
     } else {
       events[name] = newHandler
     }
     el.plain = false

   }
   function prependModifierMarker(symbol,name,isDynamic) {
     return isDynamic ? `_p(${name},"${symbol}")` :symbol+name

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
    //处理插槽 <template slot="xxx">(2.5已被废除), <div slot-scope="xxx">
    processSlotContent(el);
    //处理<slot/>
    processSlotOutlet(el);
    processComponent(el);
    // <div :custom-prop="someVal" @custom-event="handleEvent" other-prop="static-prop"></div>
    processAttrs(el);

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
  function processSlotContent(el) {//slot不要和v-for属性同时在一个el上，最好把slot放到v-for下一级template中
       el.slotScope =  getAndRemoveAttr(el, 'slot-scope')
  }
  function processSlotOutlet(el) {
    if(el.tag === 'slot'){
      el.slotName = getBindingAttr(el, 'name')
    }
  }
  function processComponent(el) {
    let binding
    if((binding = getBindingAttr(el,'is'))){
      el.component = binding
    }
  }
  function genAssignmentCode(value,assignment) {
     const res = parseModel(value)
    if(res.key === null){
      return `${value}=${assignment}`
    }else{
      `$set(${res.exp},${res.key},${assignment})`
    }
  }
  function parseModel(val) {
    val = val.trim()
    let len = val.length

    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
      let index = val.lastIndexOf('.')
      if (index > -1) {
        return {
          exp: val.slice(0, index),
          key: '"' + val.slice(index + 1) + '"'
        }
      } else {
        return {
          exp: val,
          key: null
        }
      }
    }
  }
  function processAttrs(el) {//处理    // <div :custom-prop="someVal" @custom-event="handleEvent" other-prop="static-prop"></div>
    let list = el.attrsList,
          i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for(i=0,l=list.length;i<l;i++){
      name = rawName = list[i].name
      value = list[i].value
      if(dirRe.test(name)){//   /^v-|^@|^:/  查询绑定属性
        el.hasBindings = true
        modifiers = parseModifiers(name.replace(dirRe, '')) //  {prop:true,camel:true,sync:true}
        name = name.replace(modifierRE,'')
        if(bindRe.test(name)){//  v-bind
          name = name.replace(bindRe,'')
          value = parseFilters(value)
          isDynamic = dynamicArgRE.test(name) //v-bind:[key]
          if (isDynamic) {
            name = name.slice(1, -1)  // key
          }
          if(modifiers){
            if(modifiers.prop && !isDynamic){
              name = name.replace(camelize,(a,c)=>c.toUpperCase())
              if(name === 'innerHtml'){
                name = 'innerHTML'
              }
            }
            if(modifiers.camel && !isDynamic){
              name = name.replace(camelize,(a,c)=>c.toUpperCase())

            }
            if(modifiers.sync){
              syncGen = genAssignmentCode(value, `$event`)
              if (!isDynamic) {
                addHandler(
                  el,
                  `update:${camelize(name)}`,
                  syncGen,
                  null,
                  false,
                  false
                )
              } else {
                // handler w/ dynamic event name
                addHandler(
                  el,
                  `"update:"+(${name})`,
                  syncGen,
                  null,
                  false,
                  true // dynamic
                )
              }


            }
          }
        }else if(onRe.test(name)){
            name = name.replace(onRe,'')
            isDynamic = dynamicArgRE.test(name) //v-bind:[key]
            if (isDynamic) {
              name = name.slice(1, -1)  // key
            }
            addHandler(el, name, value, modifiers, false,  isDynamic)
          }else{//其他指令 v-model v-html v-text v-show v-cloak 或者自定义指令
            name = name.replace(dirRe,'')
            const argMatch = name.match(argRE)
            let arg = argMatch && argMatch[1]
            isDynamic = false
            if (arg) {
              name = name.slice(0, -(arg.length + 1))
              if (dynamicArgRE.test(arg)) {
                arg = arg.slice(1, -1)
                isDynamic = true
              }
            }
          addDirective(el, name, rawName, value, arg, isDynamic, modifiers)

        }
      }else{
        addAttr(el, name, JSON.stringify(value), isDynamic)

      }

    }

  }
  //添加非指令属性
   function addAttr(el, name, value, isDynamic) {
     const attrsList = isDynamic
       ? (el.dynamicAttrs || (el.dynamicAttrs = []))
       : (el.attrsList || (el.attrsList = []))
     attrsList.push({ name, value, isDynamic })
     el.plain = false
   }

  //设置指令集
  function addDirective(el, name, rawName, value, arg, isDynamic, modifiers) {
     (el.directives || (el.directives = [])).push({
       name,
       rawName,
       value,
       arg,
       isDynamic,
       modifiers
     })
  }
  function parseModifiers(name){
     const match = name.match(modifierRE)
     if (match) {
       const ret = {}
       match.forEach(m => { ret[m.slice(1)] = true })
       return ret
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
  console.log(currentParent,stack)
  return stack[0]
}


let ast = parse(html)

let render = generator(ast)
console.log(render)

//生成code
function generator(ast){
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
  if (el.events) {
    data += `${genHandlers(el.events, false)},`
  }
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  data = data.replace(/,$/, '') + '}'
  return data
}
//处理有for属性的标签
function genFor(el){debugger
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
   if(!ifCondition.length){
     return '_e()'
   }
   const condition = ifCondition.shift()
  if (condition.exp) {
    return `(${condition.exp})?${
      genTernaryExp(condition.block)
    }:${
      arguments.callee(ifCondition)
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
    return `[${children.map(c=>genNode(c)).join(',')}]`
  }
}
function genNode(el){
  if (el.type === 1) {
    return genElement(el)
  }else{
    return genText(el)
  }

}
function genHandlers (events){
  const prefix = 'on:'
  let staticHandlers = ``
  for (const name in events) {
    const handlerCode = genHandler(events[name])
    staticHandlers += `"${name}":${handlerCode},`
  }
  staticHandlers = `{${staticHandlers.slice(0, -1)}}`
    return prefix + staticHandlers
}

function genText(text) {
  return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : JSON.stringify(text.text)
    })`
}


function genHandler (handler) {
  if (!handler) {
    return 'function(){}'
  }
    let code = ''
    let genModifierCode = ''
    for (const key in handler.modifiers) { //   prevent : '$event.preventDefault();'
      if (modifierCode[key]) {
        genModifierCode += modifierCode[key]
      }
    }
    if (genModifierCode) {
      code += genModifierCode
    }
    const handlerCode = handler.value
    return `function($event){${code}${handlerCode}}`

}











