//--------------------------------------------------------数据双向绑定----------------------------
// ------------------------------------------------------------------------------------------------------

//import {defineReactive, observe} from "./src/core/observer";

// initData(vm) ==data==>observer(data)====>
// ob = new Observer(data)
// new Dep()
// data.__ob__ = this
//
// 1-Array
// 赋值->改造->再放回


function observeArray (items) {
  for (let i = 0, l = items.length; i < l; i++) {
    observe(items[i])
  }
}
function observe(value) {
  if(typeof value === 'object'){
   let ob = new Observer(value)
  }
}

function setArray(value){
  let methods = ['push', 'unshift', 'shift', 'pop', 'splice','sort','reverse']
  let proto = Array.prototype
  let native = Object.create(Array.prototype)
  let ob = this.__ob__

 methods.forEach(method=>{
   const original = proto[method]
   Object.defineProperty(native,method,{
     value:function(...args){
       let result = original.apply(this,args)
       let inserted
       switch(method){
         case 'push':
         case 'unshift':
           inserted =args
           break
         case 'splice':
           inserted = args.slice(2)
           break
       }
       if(inserted) ob.observeArray(inserted)
       ob.dep.notice()
       return result
     },
     enumerable:true,
     configurable:true,
     writable:true
   })
 })
  value.__proto__ = native
}

// 2-Object

class Dep{
  constructor(){
    this.subs = []
  }
  addSub(watcher){
    this.subs.push(watcher)
  }
  removeSub(sub){
    remove(this.subs, sub)
  }
  depend(){
    if(Dep.target){
      Dep.target.addDep(this)
    }
  }
  notify(){
    const subs = this.subs.slice()
    for(let i = 0 ;i<sub.length ;i++){
      subs[i].update()
    }
  }
}





class Observer{
  constructor(value){
    this.dep = new Dep()
    this.value = value
    Object.defineProperty(value, '__ob__',{
      value:this,
      enumerable:false,
      configurable:true,
      writable:true
    })
    if(Array.isArray(value)){
      this.observeArray(value)
    }else{
      this.walk(value)
    }
  }
  observeArray (items) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
  walk(obj){
    const keys = Object.keys(obj)
    for(let i =0 ;i<keys.length; i++){
      defineReactive(obj,keys[i])
    }
  }
}

function defineReactive(obj, key) {
    const dep = new Dep()
    let val = obj[key]
    let childOb = observe(val)
    Object.defineProperty(obj, key, {
      get:function(){
        console.log('收集')
        const value = val
        if(Dep.target){
          dep.depend()
          if(childOb){
            childOb.dep.depend()
            if(Array.isArray(value)){
              dependArray(value)
            }
          }
        }
        return value
      },
      set: function(newVal){
        console.log('更改')
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return
        }
        val = newVal
        childOb = observe(newVal)
        dep.notify()
      }
    })
}

function dependArray (value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
