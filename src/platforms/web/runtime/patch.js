/* @flow */

import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'
import attrs from "./modules/attrs";
import klass from "./modules/class";
import events from "./modules/events";
import domProps from "./modules/dom-props";
import style from "./modules/style";
import transition from "./modules/transition";

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

export const patch: Function = createPatchFunction({ nodeOps, modules })


nodeOps:节点操作

let modules =  {
    attrs,
    klass,
    events,
    domProps,
    style,
    transition
    baseModules:{
      指令:directive,
      ref:ref
}
  }

