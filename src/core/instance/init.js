/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0


export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

                                                            let startTag, endTag
                                                            /* istanbul ignore if
                                                            *
                                                            * 测试性能
                                                            *  */
                                                            if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
                                                              startTag = `vue-perf-start:${vm._uid}`
                                                              endTag = `vue-perf-end:${vm._uid}`
                                                              mark(startTag)
                                                            }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) { //组件标志
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.

      //优化内部组件实例化，因为动态选项合并速度很慢，而且没有一个内部组件选项需要特殊处理。
      initInternalComponent(vm, options)
    }


    else {
      vm.$options = mergeOptions(
        //构造函数中的options
        Vue.options = {
                              components: {
                                    KeepAlive,
                                    Transition,
                                    TransitionGroup
                                  },
                              directives:{
                                      model,
                                      show
                                    },
                              filters: Object.create(null),
                              _base: Vue
                            },
        resolveConstructorOptions(vm.constructor),
          //new Vue时传入的options
        options || {},
        vm
      )
    }


                                                            /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    }
    else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm

    /*
     ---------------------------------初始化------------------------------                        */

    /*---------------------------------生命周期初始化-----------
    *   vm.$parent = 父组件
        vm.$root = parent ? parent.$root : vm
        vm.$children = []
        vm.$refs = {}
        vm._watcher = null
        vm._inactive = null
        vm._directInactive = false
        vm._isMounted = false
        vm._isDestroyed = false
        vm._isBeingDestroyed = false
    *
    *  1-初始化一些属性
    *  2-将第一个【非抽象父组件】保存到实例中 并将自身保存到父组件的 $children中
    *
    * ----------------------------------------*/
      initLifecycle(vm)


    //----------------------------------事件初始化-------------------------
      initEvents(vm)   //父组件给子组件的注册事件中 把自定义事件传给子组件，在子组件实例化的时候进行初始化；浏览器原生事件在父组件中处理


    //----------------------------------render初始化--------------------------
      initRender(vm)
    //调用beforeCreated钩子函数
      callHook(vm, 'beforeCreate')
    //初始化Injections
      initInjections(vm) // resolve injections before data/props
    //初始化状态
      initState(vm)
    //初始化Provide
      initProvide(vm) // resolve provide after data/props
    //调用created钩子函数
      callHook(vm, 'created')

                                                  /* istanbul ignore if */
                                                  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
                                                    vm._name = formatComponentName(vm, false)
                                                    mark(endTag)
                                                    measure(`vue ${vm._name} init`, startTag, endTag)
                                                  }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}




//在 _init(options)执行过程中，生成了 Vue 实例 vm,
//对 vm 实例添加一些标记及属性：
    vm._uid = uid++;
    vm._isVue = true;
    vm._self = vm;
//初始化组件(options._isComponent)

/如果是组件的话 调用组件初始化方法：initInternalComponent

/非组件的话，将vm中的 options 和vm构造函数上的options进行合并:
/vm.$options = mergeOptions(resolveConstructorOptions(vm.constructor),
/                           options || {},
/                           vm)

//添加vm._renderProxy属性
/如果支持proxy属性的话 ,对vm进行代理(proxy)处理,vm._renderProxy = new Proxy(vm,handler)
/否则 vm._renderProxy还等于自身


// 及初始化初始化一些属性














export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

//获取vue构造函数的option

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}


/*
* 1-   init 中 将option 与vue construtor 中的option进行合并
*
*
* */
