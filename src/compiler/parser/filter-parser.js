/* @flow */

const validDivisionCharRE = /[\w).+\-_$\]]/

export function parseFilters (exp: string): string {
  let inSingle = false               // '
  let inDouble = false               // "
  let inTemplateString = false       // `
  let inRegex = false                // /
  let curly = 0                      // 大括号计数 {
  let square = 0                     // 中括号 [ 计数
  let paren = 0                      // 括号 ( 计数
  let lastFilterIndex = 0
  let c, prev, i, expression, filters

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) inSingle = false   //   '  反斜杠\
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) inDouble = false   //   "  反斜杠\
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false //   `  反斜杠\
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) inRegex = false          //   /  反斜杠\
    } else if (
      c === 0x7C &&                                        //   |
      exp.charCodeAt(i + 1) !== 0x7C &&                    //  非或 ||
      exp.charCodeAt(i - 1) !== 0x7C &&                    //  非或 ||
      !curly && !square && !paren                          // 当前字符串不在 [] / () / {} 内
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1                            //  过滤器开始的位置
        expression = exp.slice(0, i).trim()                //  表达式
      } else {
        pushFilter()                                       //  保存过滤器
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break                   // "
        case 0x27: inSingle = true; break                   // '
        case 0x60: inTemplateString = true; break           // `
        case 0x28: paren++; break                           // (
        case 0x29: paren--; break                           // )
        case 0x5B: square++; break                          // [
        case 0x5D: square--; break                          // ]
        case 0x7B: curly++; break                           // {
        case 0x7D: curly--; break                           // }
      }
      if (c === 0x2f) {                                     // /
        let j = i - 1
        let p
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !validDivisionCharRE.test(p)) {         //    /[\w).+\-_$\]]/
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

function wrapFilter (exp: string, filter: string): string {
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
