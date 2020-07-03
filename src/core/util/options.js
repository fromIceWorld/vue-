/* @flow */

import config from '../config'
import { warn } from './debug'
import { set } from '../observer/index'
import { unicodeRegExp } from './lang'
import { nativeWatch, hasSymbol } from './env'

import {
  ASSET_TYPES,
  LIFECYCLE_HOOKS
} from 'shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 *
 *
 * 选项覆盖策略是处理如何将父选项值和子选项值合并到最终值的函数。
 */
const strats = config.optionMergeStrategies

/**
 * Options with restrictions
 * 有限制的选项
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.
 * 递归地将两个数据对象合并在一起的助手
 */
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal)
    }
  }
  return to
}

/**
 * Data
 *
 *
 */
export function mergeDataOrFn (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * Hooks and props are merged as arrays.
 * 钩子和 props 合并为数组
 */
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}

function dedupeHooks (hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 * 当vm存在（实例创建）时，我们需要在构造函数选项、实例选项和父选项之间进行三方合并。
 */
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 *
 * 观察者散列不应该互相覆盖，所以我们将它们合并为数组。
 */
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}

/**
 * Other object hashes.
 * 其他对象哈希
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}
strats.provide = mergeDataOrFn








/**
 * Default strategy.
 *
 * 默认策略
 */
//----------------------------当前实例合并构造函数属性  当前实例属性优先
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Validate component names
 * 验证组件名称
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

export function validateComponentName (name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 *
 * 确保所有props选项语法都规范化为基于对象的格式。
 */
function normalizeProps (options: Object, vm: ?Component) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}

/**
 * Normalize all injections into Object-based format
 *
 * 将所有注入规范化为基于对象的格式
 */
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
 * Normalize raw function directives into object format.
 *
 * 将原始函数指令规范化为对象格式
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

function assertObjectType (name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}


/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 *
 * 将两个选项对象合并为一个新对象。用于实例化和继承的核心实用程序
 *
 * parent
 * 获取vue构造函数上的components /directives / filters /_base
 * child
 * new Vue时传入的options
 *
 */


//这个函数 不止在 _init()函数中用到，还在Vue.extends()中用到
//-子组件的实现方式就是通过实例化子类完成的，子类又是通过 Vue.extend 创造出来的,可以通过是否传递vm判断是子组件还是实例
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)
  }
  if (typeof child === 'function') {
    child = child.options
  }
  //规范化props
  normalizeProps(child, vm)
  //规范化Inject
  normalizeInject(child, vm)
  //规范化Directive
  normalizeDirectives(child)
  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  /*
  * 对子选项应用extends和mixins，但前提是它是一个原始选项对象，
  * 而不是另一个mergeOptions调用的结果。只有合并的选项才具有“基础”属性。
  *
  *
  * */
  //------------------------------------将当前实例中的 extends 和 mixins 放入 parent
  if (!child._base) {
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  //------------------------------------合并 parent 和child（当前实例）

  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  // 对不同的属性进行不同的合并策略
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 *
 * 解析asset。使用此函数是因为子实例需要访问其祖先链中定义的asset。
 */
export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}


/*-------------mergeOptions分析----------

检查用户传入的component的名称是否符合规定

1-normalizeProps将props属性都转化为对象格式：
  props:['key'] => props:{
                        key:{
                          type:null
                        }
                      }
  ------------------------------------------------
  props:{       =>  props:{
    key:Number         key:{
  }                       type:Number
                        }
                      }
  ------------------------------------------------
  props:{        =>    标准格式
    key:{
      type:Number,
      default:0
    }
  }


2-normalizeInject将inject属性转化为对象格式：

  inject:{
    key:{
      from:key,
      default:'value'
    }
  }
3-normalizeDirectives将指令规范化
  derectives:{     ==>
    test:function(){}
  }
   derectives:{     ==>
    test:{
      bind:function(){},
      update:function(){},
    }
  }
4-将options中的extend和mixins与parent合并（运行mergeOptions合并）
5-将parent和child中的数据集中到options
  ①将parent中的数据合并到options
    parent={
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
    }
6-在合并属性的时候，根据key的不同采取不同的合并的策略

前提：parent除了Vue构造函数上的属性还extend 和mixin了一些属性

-----components / directives filters 采取 mergeAssets 合并策略：
会将Vue构造函数中的components /directives / filters 中的数据放到实例对应的属性的原型上，然后将传入的 components /directives / filters 放入实例的属性上

-----data 采取自己的合并策略
data最终采用mergeDataOrFn合并策略，返回 mergedInstanceDataFn 函数
所以options['data'] = mergedInstanceDataFn

-----生命周期函数 采取mergeHook合并策略
将parent中的生命周期函数与传入的生命周期函数进行合并为[parentHook,childHook]，再进行去重

-----watch 采取自己的合并策略
如果child没有watch属性，直接将parent中的watch对象挂到options.watch属性原型上，
如果parent没有watch属性，直接将child返回
当两者都有的话，如果监听的是一个值，也就是 watch[key]相同，会将两个相同的回调函数放到同一个数组，同样是[parent,child]形式，
最终形成的形式是 watch[key]=[func,fun2],回调函数形成数组格式

-----props methods inject computed 采取一种合并策略
如果没有parent属性的话，直接将child返回
当有parent属性，会新建一个原型为空的空对象，将parent合并到空对象中，再将child属性合并进去，如果有相同的属性，进行覆盖。

-----provide 采取 mergeDataOrFn 合并策略
同样返回一个函数mergedInstanceDataFn

-----其他的采取 defaultStrat 合并策略
child属性优先，有child属性就直接返回，没有child就返回parent(_base属于默认策略)


-----el / propsData
在非生产环境下，对 el propsData 进行规范，如果在Vue.extent中 组件有el 会进行告警，同样采取默认合并策略
*/
