import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

/*----------------------------
* 为Vue构造函数的原型上添加 _init 函数
*
* -------------------*/
initMixin(Vue)

/*----------------------------
* 为Vue构造函数的原型上添加 $set $delete $data $props $watch函数
*
* -------------------*/
stateMixin(Vue)

/*----------------------------
* 为Vue构造函数的原型上添加 $on $once $off $emit $watch函数
*
* -------------------*/

eventsMixin(Vue)

/*----------------------------
* 为Vue构造函数的原型上添加 _update $forceUpdate $destroy 函数
*
* -------------------*/
lifecycleMixin(Vue)

/*----------------------------
* 为Vue构造函数的原型上添加 $nextTick _render  函数
*
* -------------------*/
renderMixin(Vue)

export default Vue
