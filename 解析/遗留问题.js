/*
1- vm.$options.data 为甚麽可能会是 function类型 ?                                   [在iniData函数中]
     在new Vue时的mergeoptions中，合并data时返回的是一个函数
2- 当对数据进行观察赋能的时候,value 可能会是 VNode 的实例吗 ? 甚麽情况下会是 VNode 实例    [observer函数中]
3- 当用户设置的(!getter || setter) && arguments.length ===2                        [defineReactive函数]
     当没有getter 有 setter 只传入 obj 和 key 缓存 value = obj[key]  【神魔情况下不满足】
4- customSetter // 【神魔情况下有，代表什莫意思】                                    [defineReactive函数set]
    - 在initInject中使用,对set设置拦截，试图修改inject值的话 就运行customSetter函数，
        进行告警:[修改inject属性,在组件刷新时又会恢复]

5- depIds/newDepIds/newDeps/deps之间的关系 【watcher中和get中有设计】
6- 合并配置时,mergeoptions(parent, child, vm),child可能是函数？甚麽情况下是函数？？
7- 合并配置时,配置中有_base属性？？？甚麽情况下有？？？
8- element为甚麽不能是body或者html
9- 为甚麽会出现空的节点（type:3,text:' '）
10-服务端渲染,没有computedWatcher 为甚麽？？？？？？？？？？？？
*/

