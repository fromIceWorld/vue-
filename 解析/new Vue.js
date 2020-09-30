function Vue (options) {
  if (
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

let app = new Vue({
  el:'#app',
  data:{
    msg:[{name:'one',age:1},{name:'two',age:2}],
    name:'Vue'
  },
  methods:{}
})

/*
* 1- 先对调用方式做检查,Vue构造函数只能通过 new 调用
* 2- 调用_init(options) 函数
* */

// 初始化实例 用到的 _init函数精简后

Vue.prototype._init = function (options) {
  var vm = this;
  vm._uid = uid$2++;
  vm._isVue = true;
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    );
  {
    initProxy(vm);   // r-2108
  }
  // expose real self
  vm._self = vm;
  initLifecycle(vm);
  initEvents(vm);
  initRender(vm);
  callHook(vm, 'beforeCreate');
  initInjections(vm); // resolve injections before data/props
  initState(vm);
  initProvide(vm); // resolve provide after data/props
  callHook(vm, 'created');

  if (vm.$options.el) {
    vm.$mount(vm.$options.el);
  }
};

/*
* 1- 实例化Vue产生vm 初始化vm
* 2- 添加_uid / _isVue / _self 属性
* 3- 合并options属性(用户写的options和Vue构造函数的基础options)
* 4- 对vm中的数据进行代理,将代理属性赋值给vm._renderProxy ,在渲染获取值时给出友好提示
* 5- 初始化生命周期
* 6- 初始化事件
* 7- 初始化渲染
* 8- 调用'beforeCreate'钩子函数
* 9- 初始化inject
* 10- 初始化state
* 11- 初始化provide
* 12- 调用'created'钩子函数
*
*
* */

/* 3- 合并options属性，mergeOptions(parent, child, vm)
 - 对options.components中的组件名称校验,
 - child是函数？ 初始化情况下child不是函数
 - 规范化props[child] ->3.1
 - 规范化inject[child]
 - 规范化directives[child]

*/

/* 3.1 规范化props[child]
 1- props 是数组格式 ['pro1', 'pro2'],
      - 将prop名称从中划线相连的格式转化为驼峰格式（如果是中划线连接的字符串）
        返回res:{pro1:{type:null},pro2:{type:null}}
      -props是数组格式的话,其中每一项必须是字符串
 2- props 是对象格式res: {pro1:{type:Number,default:0,require:true,validator:(value)=>{}}}
      - 将prop名称从中划线相连的格式转化为驼峰格式（如果是中划线连接的字符串）
      - 当pro1是对象的话直接返回，否则返回{type:value}
 3- 当不是数组或者对象的话，直接告警
 4- 当转化成功，直接赋值给options.props = res

*/

/* 3.2 规范化inject[child]
 1- inject 是数组格式 ['inject1', 'inject2'],
        返回{inject1:{from:inject1}
 2- inject 是对象格式{inject1:{from:'provide1',default:0}
      - 当inject1是对象的话,修正from属性【当对象中有的话用对象里面的from，没有的话，from是key}】
      - 当inject1不是对象的话， 直接from就是inject[key]对应的值
 3- 当不是数组或者对象的话，直接告警

*/

/* 3.3 规范化指令directives[child]
 1- 当定义的指令是函数的话，将函数转化为对象格式挂到指令生命周期的bind 和update上
 2- 指令是对象的话，满足条件，不操作

 */
/* 3.4 当options中没有_base属性或者为false 将extend 和mixin属性合并到parent属性(mergeOptions)
 - 将child的options 和 parent+extend+mixins 的选项进行合并
 - 针对不同的属性有相应的合并策略 ->3.4.1
 -
* */

/* 3.4.1 不同属性的合并策略
 - data的合并策略
     data在new Vue时 是返回的一个函数 mergedInstanceDataFn,
      【在 Vue.extend中有不同表现,后续分析】
 - 生命周期钩子函数合并策略
     当有parentVal 和childVal 时,parent.concat(child)
     只有parent 就返回parent
     只有child 就将child【数组的话直接返回，非数组转化为数组】返回
     最后将数组去重
 - component / directive / filter 合并策略 mergeAssets
     将parent中的这些属性放到原型上，然后将child里面的数据放入对象中
 - watch
     先对firefox中的watch属性做判断，排除firefox中的watch影响
     没有child 就将parent放到原型上
     没有parent 就返回child
     当两者都有的话,将两者合并到一个对象里
         value值都转换为数组形式，parent和child当有相同的key，生成 key:[parent,child]
 - props / methods / computed
     没有parent 就返回 child
     都有的话，就将两者合并，但是child和parent如果有相同key，child就会覆盖parent
 - provide
     和data的合并策略一样都是返回一个函数 mergedInstanceDataFn
 - el / propsData
     el / propsData 只能在 new Vue中有这些
     用默认合并策略:
     没有定义 childVal 就返回parent
     定义了 childVal 就返回childVal

*


*/

/* 4- initProxy(vm)
  - 对于vm中的属性 进行一层代理;在渲染时给出友好提示

*/


/*  5- 初始化生命周期
 - 建立父子关系,当父实例不是抽象节点的话，将自身放入父节点的children里，自身的$parent指向父实例
      当父实例是抽象节点的话,再向上级找;
      当没有parent 整明当前节点是根节点,将$root指向自身
 - 实例添加一些声明周期状态属性(_inactive / _directInactive / _isMounted /_isDestroyed / _isBeingDestroyed)
 - 实例添加一些其他属性($children / $refs / _watcher)

*/

/*  6- 初始化事件
 - 初始化组件与父组件交互的事件 【与组件有关,暂时不管】

* */

/*  7- 初始化渲染
 - 初始化一些组件的属性【与组件有关，暂时不管】
 - 与初始渲染有关的就vm.$createElement / vm._c 渲染有关

* */

/*  8- 调用'beforeCreate'钩子函数

* */

/*  9- 初始化inject
 - 改造inject 符合规范,
 - vue 故意设置inject 是非双向绑定的,当传入的是一个可监听的对象，那么对象的属性是可响应
 - 设置inject set属性,当设置inject时会给出提示,因为修改inject在组件刷新时,又会恢复

* */

/*  10- 初始化state
 - vm._watchers = []
 - initProps
 - initMethods
 - initData
 - initComputed
 - initWatch

*/

/* 10.1- initProps
 1- propsData【应该是组件解析时传入的,在编译时确定了再分析】

*/

/* 10.2- initMethods
 1- methods 里面的键对应的值应该是function
 2- methods 里面的键不应与pros中的key冲突
 3- methosd 里面的key不应与vm实例上的key冲突【因为会将methods挂到vm上，直接vm.method 能直接调用methods中的方法】
 4- 以上三步校验通过的话,方法bind绑定 vm ;返回的函数赋值给vm

*/

/* 10.3- initData
 1- 在 -> './observer'

*/

/* 10.3- initComputed
 1- 对于计算属性,会为实例添加一个专门收集计算属性的watcher的属性vm._computedWatchers
 2- 然后根据用户写入的computed[key]是函数还是用户自己写的get/set来设置不同的getter / setter 属性描述符
 3- 当用户写的computed是函数的话,非ssr情况下 返回一个计算属性的getter函数【涉及watcher后续分析】,set为noop空函数
 4- 当用户是写的computed是带有get/set的对象的话直接将get / set 设置成计算属性的get/set
 5- 然后处理计算属性的set,当计算属性是空函数noop的话,再重新设置set函数【目的:当用户想改变计算属性的时，给出告警提示】
 6- 最后将计算属性挂到实例上 vm.computed1

*/

/*  10.4- initWatcher
 1- watch 中key对应 四种格式的value [string | function | object | array]
 2- 对象格式直接获取handler 和对象
 3- string类型的话 直接取vm[string]
 4- 调用 vm.$watch(key, handler, options)【$watch属性后续分析】

*/

/*  11- initProvide
 1- 返回 vm._provide 属性

*/

/*  12- 调用created钩子函数

*/

/*  13- 将实例挂载到el上

 1- el 有string和element两种类型,会根据string类型id获取element,其他类型直接返回
 2- element不能是body或者html？？？
 3- 我们在渲染内容时只有一种渲染方式就是转换为render函数,所以接下来判断render函数是否存在
      - render函数不存在的话,找template,template存在的话
          - template 是string类型的话,判断是否是#开头(要用#id查element),根据id获取element返回innerHTML
          - template 是element 直接获取innerHTML
          - 都不满足 认为template无效
        - template属性不存在的话根据el(此时el已经是element或者其他) 获取 outerHTML
          - el是有outerHTML的话,返回outerHTML
          - 没有outerHTML,创建一个空的节点？？？,再返回innerHTML
        - 编译template返回渲染函数【在'../compiler'】保存在options
 4- 执行挂载[调用动用mount函数]
      - 最终调用 mountComponent




*/



/*  13.1- mountComponent(vm, element)
 1- 将element属性存到vm.$el上
 2- 当实例没有render函数,直接赋值一个空的函数(创建空的VNode)
 3- 调用beforeMount钩子函数
 4- 定义一个updateComponent函数
        updateComponent = function () {
            vm._update(vm._render(), hydrating);
          };
 5- 运行渲染函数
         new Watcher(vm, updateComponent, noop, {
              before: function before () {
                if (vm._isMounted && !vm._isDestroyed) {
                  callHook(vm, 'beforeUpdate');
                }
              }
            }, true )

6- hydrating = false //????????
7-
*/










// Vue构造函数的options
Vue.options ={
  components:{
    KeepAlive, Transition, TransitionGroup
  },
  directives:{model, show},
  filters:{},
  _base:Vue

}
