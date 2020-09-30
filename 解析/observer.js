

//1- 在initData 中 对data属性进行设置initData(vm)


function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'     //
    ? getData(data, vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
    warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      proxy(vm, "_data", key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}


/*
* 1-获取我们的data _data数据，当我们的data是函数时【情况？】获取返回data
* 2-我们返回的data必须是一个对象[object,object]
* 3-data上的数据不能和props / methods 重名
* 4-满足以上条件的话，对 vm 中的data 进行代理到vm  vm.key就可以直接获取data中的 key值,不需要vm.$options.data.key获取
*      拿到 定义的data =>  data = _data = vm.$options.data ;
*      然后再将data 代理到vm; 直接vm.key获取数据
* 5-对data进行观察赋能《赋予观察者能力》
*
* 总结：在initData中 是对data 的规范进行检查 及调整，通过的话才进行下一步 《观察赋能》 observer(data, true)
*
* */
// initData 的辅助函数


function getData (data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, "data()");
    return {}
  } finally {
    popTarget();
  }
}


// 观察赋能函数 observer

function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}
/*
* 1- 当data不是对象时 | 是虚拟dom VNode 实例时【神魔情况下是 VNode实例？】，直接返回。
* 2- 设置 观察者能力标志(__ob__),当 数据有 __ob__ 并且 __ob__ 是 Observer实例，说明已经具有观测能力，直接获取
* 3- (shouldObserve 标志为true,非服务端渲染,数据是数组)
*           或者(数据是纯对象, 数据是可扩展的， 数据的_isVue标志为空或者false【_isVue标志从哪来？？？】) 对数据进行观测
* 4- ob = new Observer(value) //对数据添加观测能力
* 5- 是根数据的话,为__ob__添加 vmCount属性
*
* 总结:observe 函数 对数据进行检查,__ob__防止重复赋能, 符合规则的话，进行赋能
* */


// new Observer(value)

var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    if (hasProto) {
      protoAugment(value, arrayMethods);
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    this.observeArray(value);
  } else {
    this.walk(value);
  }

};

/*
* 1- 对 数据 进行赋能的结果是
*
*   ob.value = value
*   ob.dep = new Dep()
*   ob.vmCount = 0
*
*   value.__ob__ = ob
*  数据会增加一个__ob__属性,__ob__又包含数据,相互引用,
* 2- 对不同类型的数据(数组 / 对象)进行不同的赋能方式
*
* */


// 数组类型数据的赋能
  if (hasProto) {
    protoAugment(value, arrayMethods);
  } else {
    copyAugment(value, arrayMethods, arrayKeys);
  }
  this.observeArray(value);

/*
* 1-当有__proto__属性时,将改造的数组方法(...)劫持数组的原型中的方法
* 2-当没有__proto__属性时,直接将定义的方法赋值给数据
* 3-当数据有Vue设定的劫持方法后,对数据进行赋能,
*     因为是数组,对数组中的每一项进行检测赋能observer,又循环到我们刚开始的点observer
*
* */


// 对象类型数据的赋能
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);
  }
};

/*
* 1-对对象的每一项进行观察赋能 defineReactive(obj,key)
*
* */


// 对象属性赋能 defineReactive(obj,key)
function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  var childOb = !shallow && observe(val);     //返回 value.__ob__
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if ( customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) { return }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}
/*
* 1- 我们调用的 defineReactive 函数 只传了两个参数(obj, key)
* 2- 生成一个收集容器 dep
* 3- 判断obj.key 是否是可配置的,不可配置的话 直接返回
* 4- 将数据原本 设置的getter/setter 缓存下来[保留用户自己设置的getter/setter]
* 5- 当用户设置的(!getter || setter) && arguments.length ===2
*     当没有getter 有 setter 只传入 obj 和 key 缓存 value = obj[key]  【神魔情况下不满足】
* 6- shallow 为空 或者是false,将会继续对 缓存的value 进行深入观测赋能;返回值是value.__ob__
* 7- 设置 obj.key 的get属性: 【依赖的互相收集过程】
*       获取 value; 当前属于渲染环境的话(Dep.target存在),调用dep.depend() 在dep.depend中调用Dep.target.addDep(this)函数,
*       参数 this 就是实例 dep,运行addDep(dep)将数据的dep 传到 watcher.addDep 中。
*       在addDep中, watcher里面的收集容器 newDepIds(收集depId) / newDeps(收集dep) 存储dep
*       将未收集的dep 放入容器中,当depIds 中没有当前dep, dep将当前 watcher收集到subs【关于newDepIds/newDeps/depIds在watcher中有交互,watcher详解】
*       最后把value返回
* 8- 设置 obj.key 的set属性
*       获取到obj.key的值
*       当要设置的值与原值一样[newVal === val / NaN]，直接返回
*       customSetter // 【神魔情况下有，代表什莫意思】
*       有setter 直接调用,没有的话直接赋值
*       对设置的val新值进行观察赋能
*       最后调用dep.notify()  //  通知收集到的subs中的 watcher进行更新。
*
*
*
* */




// 数据中的Dep

var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  if ( !config.async) {
    // subs aren't sorted in scheduler if not running async
    // we need to sort them now to make sure they fire in correct
    // order
    subs.sort(function (a, b) { return a.id - b.id; });
  }
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};
/*

Dep.target 是 watcher

* 1- Dep 实例化一个容器用于收集依赖，每一个实例有自己的id
* 2- addSub 方法将依赖收集到 subs
* 3- removeSub 方法 将依赖从subs 删除
* 4- depend 调用 watcher 的addDe【需要与watcher同时分析】
  5- notify 调用 subs中收集的watcher的update方法,进行更新【id排序？？？？】
* */
