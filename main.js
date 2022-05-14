// ==UserScript==
// @name         Leetcode 助手
// @namespace    http://tampermonkey.net/
// @homepageURL   https://github.com/h-hg/leetcode-optimization
// @supportURL    https://github.com/h-hg/leetcode-optimization/issues
// @version      0.1.1
// @description  禁英文站跳中文站，增加中英站互跳按钮，中文站剪切板净化，删除中英站一些广告
// @author       Hunter Hwang
// @license      MIT
// @match        https://leetcode.com/*
// @match        https://leetcode.com/problems/*
// @match        https://leetcode.cn/problems/*
// @icon         https://assets.leetcode.com/static_assets/public/icons/favicon-192x192.png
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_webRequest
// ==/UserScript==

(function() {
  'use strict';
  function handleCopy(e) {
    e.stopPropagation();
    const copytext = window.getSelection();
    const clipdata = e.clipboardData || window.clipboardData;
 
    if (clipdata) {
      clipdata.setData("Text", copytext);
    }
  }
  /**
   * @link https://stackoverflow.com/questions/22125865/wait-until-flag-true
   */
  function waitFor(condition, callback) {
    if (!condition()) {
      window.setTimeout(waitFor.bind(null, condition, callback), 1000);
    } else {
      callback();
    }
  }
  function isCNSite() {
    return location.hostname === 'leetcode.cn'
  }
  function getProblemName() {
    var tmp = location.href.match(/problems\/([^\/]+)/);
    return (tmp != null && tmp[1] != 'all') ? tmp[1] : null;
  }
  function hasProblemId() {
    var tag = isCNSite() ? 'h4[data-cypress="QuestionTitle"] a' : 'div[data-cy="question-title"]';
    return document.querySelector(tag) != null;
  }
  function getProblemId() {
    var tag = isCNSite() ? 'h4[data-cypress="QuestionTitle"] a' : 'div[data-cy="question-title"]';
    return document.querySelector(tag).textContent.match('([0-9]+)')[1];
  }
  function getOthterLangUrl() {
    var matchRes = location.href.match(/problems\/([^\/]+)\/?([a-z]+)?/);
    if(matchRes == null || matchRes[1] == 'all')
      return null;
    var problemName = matchRes[1], tab = matchRes[2];

    if(tab == 'discuss') {
      tab = 'comments';
    } else if(tab == 'comments') {
      tab = 'discuss';
    } else if(tab == 'submissions' || tab == 'solution') {
    } else {
      tab = '';
    }

    return `https://leetcode${isCNSite() ? '' : '-cn'}.com/problems/${problemName}/${tab}`
  }
  function banAutoJump2Cn() {
    GM_webRequest([
      {selector: 'https://assets.leetcode.cn/*', action: 'cancel'},
    ], function (info, message, details) {
      console.log(info, message, details);
    });
  }
  function html2elem(html) {
    let template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  }
  function getMenuItems() {
      var name = getProblemName(), id = getProblemId();
      return {
        [isCNSite() ? 'English' : '中文'] : getOthterLangUrl(),
        'labuladong': `https://labuladong.github.io/article/?qno=${id}`,
         '九章算法': `https://www.jiuzhang.com/solution/${name}`,
      }
  }
  function createBall() {
    // add css
    GM_addStyle(`
      .leetcode-wrapper {
        position: fixed;
        top: 30%;
        left: 10px;
        z-index: 1;
      }
      .leetcode-wrapper .btn {
        cursor: move;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid black;
        opacity: 0.1;
      }
      .leetcode-wrapper:hover .btn {
        background:url(https://leetcode.com/favicon-96x96.png) no-repeat;
        background-size:cover;
        opacity: 0.8;
      }
      .leetcode-wrapper .menu {
        display: none;
        position: absolute;
        background-color: #f9f9f9;
        min-width: 100px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      }
      .leetcode-wrapper:hover .menu {
        display: block;
      }
      .leetcode-wrapper .menu a {
        color: black;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }
      .leetcode-wrapper .menu a:hover {
        background-color: #f1f1f1
      }
    `);

    // add html
    var wrapper = html2elem(`
      <div class="leetcode-wrapper">
      <button id="leetcode-btn" class="btn"></button>
        <div class="menu">
          <!-- <a href="", target="_blank"></a> -->
        </div>
      </div>
    `);
    var menu = wrapper.querySelector('.menu');
    waitFor(hasProblemId, () => {
      var items = getMenuItems();
      for(var key in items) {
        var link = document.createElement('a');
        link.appendChild(document.createTextNode(key));
        link.href = items[key];
        link.target = '_blank';
        menu.appendChild(link);
      }
      document.body.appendChild(wrapper);
      var btn = document.getElementById('leetcode-btn');
      btn.addEventListener('mouseenter', function(e){
        menu.firstElementChild.href = getOthterLangUrl();
      })
    })
  }
  // prevent auto jump to leetcode.cn
  if(!isCNSite()) {
    banAutoJump2Cn();
  }

  // AD
  if(isCNSite()) {

  } else {
    GM_addStyle(`
      /* 顶部中文横幅 */
      #cn-banner {
        display: none!important;
      }';
      #region_switcher{
        display: none!important;
      }
      /* 顶部 LeetCode is hiring! Apply Now! */
      .feedback-anchor {
        display: none!important;
      };
    `);
  }

  // problems navigator
  let problemName = getProblemName();
  if(problemName != null) {
    createBall();
  }
  document.addEventListener("copy", handleCopy, true);
})();
