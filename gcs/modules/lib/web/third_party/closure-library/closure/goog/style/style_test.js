// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Shared unit tests for styles.
 */

goog.provide('goog.style_test');

goog.require('goog.color');
goog.require('goog.dom');
goog.require('goog.events.BrowserEvent');
goog.require('goog.math.Coordinate');
goog.require('goog.math.Size');
goog.require('goog.style');
goog.require('goog.style_scrollbar_test');
goog.require('goog.testing.ExpectedFailures');
goog.require('goog.testing.PropertyReplacer');
goog.require('goog.testing.jsunit');
goog.require('goog.userAgent');
goog.require('goog.userAgent.product');
goog.require('goog.userAgent.product.isVersion');
goog.require('goog.testing.asserts');
goog.setTestOnly('Tests for styles');

// IE before version 6 will always be border box in compat mode.
var isBorderBox = goog.dom.isCss1CompatMode() ?
    (goog.userAgent.IE && !goog.userAgent.isVersion('6')) :
    true;
var EPSILON = 2;
var expectedFailures = new goog.testing.ExpectedFailures();
var $ = goog.dom.getElement;
var propertyReplacer = new goog.testing.PropertyReplacer();
var UserAgents = {
  GECKO: 'GECKO',
  IE: 'IE',
  OPERA: 'OPERA',
  WEBKIT: 'WEBKIT'
};


function setUpPage() {
  var viewportSize = goog.dom.getViewportSize();
  // When the window is too short or not wide enough, some tests, especially
  // those for off-screen elements, fail.  Oddly, the most reliable
  // indicator is a width of zero (which is of course erroneous), since
  // height sometimes includes a scroll bar.  We can make no assumptions on
  // window size on the Selenium farm.
  if (goog.userAgent.IE && viewportSize.width < 300) {
    // Move to origin, since IE won't resize outside the screen.
    window.moveTo(0, 0);
    window.resizeTo(640, 480);
  }
}

function setUp() {
  window.scrollTo(0, 0);
}

function tearDown() {
  expectedFailures.handleTearDown();
  var testVisibleDiv2 = goog.dom.getElement('test-visible2');
  testVisibleDiv2.setAttribute('style', '');
  testVisibleDiv2.innerHTML = '';
  var testViewport = goog.dom.getElement('test-viewport');
  testViewport.setAttribute('style', '');
  testViewport.innerHTML = '';
  propertyReplacer.reset();
  reinitializeUserAgent();
}

function testSetStyle() {
  var el = $('span1');
  goog.style.setStyle(el, 'textDecoration', 'underline');
  assertEquals('Should be underline', 'underline', el.style.textDecoration);
}

function testSetStyleMap() {
  var el = $('span6');

  var styles = {
    'background-color': 'blue',
    'font-size': '100px',
    textAlign: 'center'
  };

  goog.style.setStyle(el, styles);

  var answers = {
    backgroundColor: 'blue',
    fontSize: '100px',
    textAlign: 'center'
  };

  goog.object.forEach(answers, function(value, style) {
    assertEquals('Should be ' + value, value, el.style[style]);
  });
}

function testSetStyleWithNonCamelizedString() {
  var el = $('span5');
  goog.style.setStyle(el, 'text-decoration', 'underline');
  assertEquals('Should be underline', 'underline', el.style.textDecoration);
}

function testGetStyle() {
  var el = goog.dom.getElement('styleTest3');
  goog.style.setStyle(el, 'width', '80px');
  goog.style.setStyle(el, 'textDecoration', 'underline');

  assertEquals('80px', goog.style.getStyle(el, 'width'));
  assertEquals('underline', goog.style.getStyle(el, 'textDecoration'));
  assertEquals('underline', goog.style.getStyle(el, 'text-decoration'));
  // Non set properties are always empty strings.
  assertEquals('', goog.style.getStyle(el, 'border'));
}

function testGetStyleMsFilter() {
  // Element with -ms-filter style set.
  var e = goog.dom.getElement('msFilter');

  if (goog.userAgent.IE && goog.userAgent.isDocumentMode(8)) {
    // Only IE8 supports -ms-filter and returns it as value for the "filter"
    // property. When in compatibility mode, -ms-filter is not supported
    // and IE8 behaves as IE7 so the other case will apply.
    assertEquals('alpha(opacity=0)', goog.style.getStyle(e, 'filter'));
  } else {
    // Any other browser does not support ms-filter so it returns empty string.
    assertEquals('', goog.style.getStyle(e, 'filter'));
  }
}

function testGetStyleFilter() {
  // Element with filter style set.
  var e = goog.dom.getElement('filter');

  if (goog.userAgent.IE) {
    // Filter supported.
    assertEquals('alpha(opacity=0)', goog.style.getStyle(e, 'filter'));
  } else {
    assertEquals('', goog.style.getStyle(e, 'filter'));
  }
}

function testGetComputedStyleMsFilter() {
  // Element with -ms-filter style set.
  var e = goog.dom.getElement('msFilter');

  if (goog.userAgent.IE) {
    // IE always returns empty string for computed styles.
    assertEquals('', goog.style.getComputedStyle(e, 'filter'));
  } else {
    // Non IE returns 'none' for filter as it is an SVG property
    assertEquals('none', goog.style.getComputedStyle(e, 'filter'));
  }
}

function testGetComputedStyleFilter() {
  // Element with filter style set.
  var e = goog.dom.getElement('filter');

  if (goog.userAgent.IE) {
    // IE always returns empty string for computed styles.
    assertEquals('', goog.style.getComputedStyle(e, 'filter'));
  } else {
    // Non IE returns 'none' for filter as it is an SVG property
    assertEquals('none', goog.style.getComputedStyle(e, 'filter'));
  }
}

function testGetComputedPosition() {
  assertEquals('position not set', 'static',
               goog.style.getComputedPosition($('position-unset')));
  assertEquals('position:relative in style attribute', 'relative',
               goog.style.getComputedPosition($('style-position-relative')));
  if (goog.userAgent.IE && !goog.dom.isCss1CompatMode()) {
    assertEquals('position:fixed in style attribute', 'static',
        goog.style.getComputedPosition($('style-position-fixed')));
  } else {
    assertEquals('position:fixed in style attribute', 'fixed',
        goog.style.getComputedPosition($('style-position-fixed')));
  }
  assertEquals('position:absolute in css', 'absolute',
               goog.style.getComputedPosition($('css-position-absolute')));
}

function testGetComputedOverflowXAndY() {
  assertEquals('overflow-x:scroll in style attribute', 'scroll',
               goog.style.getComputedOverflowX($('style-overflow-scroll')));
  assertEquals('overflow-y:scroll in style attribute', 'scroll',
               goog.style.getComputedOverflowY($('style-overflow-scroll')));
  assertEquals('overflow-x:hidden in css', 'hidden',
               goog.style.getComputedOverflowX($('css-overflow-hidden')));
  assertEquals('overflow-y:hidden in css', 'hidden',
               goog.style.getComputedOverflowY($('css-overflow-hidden')));
}

function testGetComputedZIndex() {
  assertEquals('z-index:200 in style attribute', '200',
               '' + goog.style.getComputedZIndex($('style-z-index-200')));
  assertEquals('z-index:200 in css', '200',
               '' + goog.style.getComputedZIndex($('css-z-index-200')));
}

function testGetComputedTextAlign() {
  assertEquals('text-align:right in style attribute', 'right',
               goog.style.getComputedTextAlign($('style-text-align-right')));
  assertEquals(
      'text-align:right inherited from parent', 'right',
      goog.style.getComputedTextAlign($('style-text-align-right-inner')));
  assertEquals('text-align:center in css', 'center',
               goog.style.getComputedTextAlign($('css-text-align-center')));
}

function testGetComputedCursor() {
  assertEquals('cursor:move in style attribute', 'move',
               goog.style.getComputedCursor($('style-cursor-move')));
  assertEquals('cursor:move inherited from parent', 'move',
               goog.style.getComputedCursor($('style-cursor-move-inner')));
  assertEquals('cursor:poiner in css', 'pointer',
               goog.style.getComputedCursor($('css-cursor-pointer')));
}

function testGetBackgroundColor() {
  var dest = $('bgcolorDest');

  for (var i = 0; $('bgcolorTest' + i); i++) {
    var src = $('bgcolorTest' + i);
    var bgColor = goog.style.getBackgroundColor(src);

    dest.style.backgroundColor = bgColor;
    assertEquals('Background colors should be equal',
                 goog.style.getBackgroundColor(src),
                 goog.style.getBackgroundColor(dest));

    try {
      // goog.color.parse throws a generic exception if handed input it
      // doesn't understand.
      var c = goog.color.parse(bgColor);
      assertEquals('rgb(255,0,0)', goog.color.hexToRgbStyle(c.hex));
    } catch (e) {
      // Internet Explorer is unable to parse colors correctly after test 4.
      // Other browsers may vary, but all should be able to handle straight
      // hex input.
      assertFalse('Should be able to parse color "' + bgColor + '"', i < 5);
    }
  }
}

function testSetPosition() {
  var el = $('testEl');

  goog.style.setPosition(el, 100, 100);
  assertEquals('100px', el.style.left);
  assertEquals('100px', el.style.top);

  goog.style.setPosition(el, '50px', '25px');
  assertEquals('50px', el.style.left);
  assertEquals('25px', el.style.top);

  goog.style.setPosition(el, '10ex', '25px');
  assertEquals('10ex', el.style.left);
  assertEquals('25px', el.style.top);

  goog.style.setPosition(el, '10%', '25%');
  assertEquals('10%', el.style.left);
  assertEquals('25%', el.style.top);

  // ignores stupid units
  goog.style.setPosition(el, 0, 0);
  // TODO(user): IE errors if you set these values.  Should we make setStyle
  // catch these?  Or leave it up to the app.  Fixing the tests for now.
  //goog.style.setPosition(el, '10rainbows', '25rainbows');
  assertEquals('0px', el.style.left);
  assertEquals('0px', el.style.top);


  goog.style.setPosition(el, new goog.math.Coordinate(20,40));
  assertEquals('20px', el.style.left);
  assertEquals('40px', el.style.top);
}

function testGetClientPositionAbsPositionElement() {
  var div = goog.dom.createDom('DIV');
  div.style.position = 'absolute';
  div.style.left = '100px';
  div.style.top = '200px';
  document.body.appendChild(div);
  var pos = goog.style.getClientPosition(div);
  assertEquals(100, pos.x);
  assertEquals(200, pos.y);
}

function testGetClientPositionNestedElements() {
  var innerDiv = goog.dom.createDom('DIV');
  innerDiv.style.position = 'relative';
  innerDiv.style.left = '-10px';
  innerDiv.style.top = '-10px';
  var div = goog.dom.createDom('DIV');
  div.style.position = 'absolute';
  div.style.left = '150px';
  div.style.top = '250px';
  div.appendChild(innerDiv);
  document.body.appendChild(div);
  var pos = goog.style.getClientPosition(innerDiv);
  assertEquals(140, pos.x);
  assertEquals(240, pos.y);
}

function testGetClientPositionOfOffscreenElement() {
  var div = goog.dom.createDom('DIV');
  div.style.position = 'absolute';
  div.style.left = '2000px';
  div.style.top = '2000px';
  div.style.width = '10px';
  div.style.height = '10px';
  document.body.appendChild(div);

  try {
    window.scroll(0, 0);
    var pos = goog.style.getClientPosition(div);
    assertEquals(2000, pos.x);
    assertEquals(2000, pos.y);

    // The following tests do not work in Gecko 1.8 and below, due to an
    // obscure off-by-one bug in goog.style.getPageOffset.  Same for IE.
    if (!goog.userAgent.IE &&
        !(goog.userAgent.GECKO && !goog.userAgent.isVersion('1.9'))) {
      window.scroll(1, 1);
      var pos = goog.style.getClientPosition(div);
      assertEquals(1999, pos.x);
      assertEquals(1999, pos.y);

      window.scroll(2, 2);
      pos = goog.style.getClientPosition(div);
      assertEquals(1998, pos.x);
      assertEquals(1998, pos.y);

      window.scroll(100, 100);
      pos = goog.style.getClientPosition(div);
      assertEquals(1900, pos.x);
      assertEquals(1900, pos.y);
    }
  }
  finally {
    window.scroll(0, 0);
    document.body.removeChild(div);
  }
}

function testGetClientPositionEvent() {
  var mockEvent = {};
  mockEvent.clientX = 100;
  mockEvent.clientY = 200;
  var pos = goog.style.getClientPosition(mockEvent);
  assertEquals(100, pos.x);
  assertEquals(200, pos.y);
}

function testGetClientPositionTouchEvent() {
  var mockTouchEvent = {};

  mockTouchEvent.targetTouches = [{}];
  mockTouchEvent.targetTouches[0].clientX = 100;
  mockTouchEvent.targetTouches[0].clientY = 200;

  mockTouchEvent.touches = [{}];
  mockTouchEvent.touches[0].clientX = 100;
  mockTouchEvent.touches[0].clientY = 200;

  var pos = goog.style.getClientPosition(mockTouchEvent);
  assertEquals(100, pos.x);
  assertEquals(200, pos.y);
}

function testGetClientPositionAbstractedTouchEvent() {
  var e = new goog.events.BrowserEvent();
  e.event_ = {};
  e.event_.touches = [{}];
  e.event_.touches[0].clientX = 100;
  e.event_.touches[0].clientY = 200;
  e.event_.targetTouches = [{}];
  e.event_.targetTouches[0].clientX = 100;
  e.event_.targetTouches[0].clientY = 200;
  var pos = goog.style.getClientPosition(e);
  assertEquals(100, pos.x);
  assertEquals(200, pos.y);
}

function testGetPageOffsetAbsPositionedElement() {
  var div = goog.dom.createDom('DIV');
  div.style.position = 'absolute';
  div.style.left = '100px';
  div.style.top = '200px';
  document.body.appendChild(div);
  var pos = goog.style.getPageOffset(div);
  assertEquals(100, pos.x);
  assertEquals(200, pos.y);
}

function testGetPageOffsetNestedElements() {
  var innerDiv = goog.dom.createDom('DIV');
  innerDiv.style.position = 'relative';
  innerDiv.style.left = '-10px';
  innerDiv.style.top = '-10px';
  var div = goog.dom.createDom('DIV');
  div.style.position = 'absolute';
  div.style.left = '150px';
  div.style.top = '250px';
  div.appendChild(innerDiv);
  document.body.appendChild(div);
  var pos = goog.style.getPageOffset(innerDiv);
  assertEquals(140, pos.x);
  assertEquals(240, pos.y);
}

function testGetPageOffsetWithBodyPadding() {
  document.body.style.margin = '40px'
  document.body.style.padding = '60px'
  document.body.style.borderWidth = '70px';
  try {
    var div = goog.dom.createDom('DIV');
    div.style.position = 'absolute';
    div.style.left = '100px';
    div.style.top = '200px';
    // Margin will affect position, but padding and borders should not.
    div.style.margin = '1px';
    div.style.padding = '2px';
    div.style.borderWidth = '3px';
    document.body.appendChild(div);
    var pos = goog.style.getPageOffset(div);
    assertEquals(101, pos.x);
    assertEquals(201, pos.y);
  }
  finally {
    document.body.removeChild(div);
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.borderWidth = '';
  }
}

function testGetPageOffsetWithDocumentElementPadding() {
  document.documentElement.style.margin = '40px';
  document.documentElement.style.padding = '60px';
  document.documentElement.style.borderWidth = '70px';
  try {
    var div = goog.dom.createDom('DIV');
    div.style.position = 'absolute';
    div.style.left = '100px';
    div.style.top = '200px';
    // Margin will affect position, but padding and borders should not.
    div.style.margin = '1px';
    div.style.padding = '2px';
    div.style.borderWidth = '3px';
    document.body.appendChild(div);
    var pos = goog.style.getPageOffset(div);
    // FF3 (but not beyond) gets confused by document margins.
    if (goog.userAgent.GECKO && goog.userAgent.isVersion('1.9') &&
        !goog.userAgent.isVersion('1.9.1')) {
      assertEquals(141, pos.x);
      assertEquals(241, pos.y);
    } else {
      assertEquals(101, pos.x);
      assertEquals(201, pos.y);
    }
  }
  finally {
    document.body.removeChild(div);
    document.documentElement.style.margin = '';
    document.documentElement.style.padding = '';
    document.documentElement.style.borderWidth = '';
  }
}

function testGetPageOffsetElementOffscreen() {
  var div = goog.dom.createDom('DIV');
  div.style.position = 'absolute';
  div.style.left = '10000px';
  div.style.top = '20000px';
  document.body.appendChild(div);
  window.scroll(0, 0);
  try {
    var pos = goog.style.getPageOffset(div);
    assertEquals(10000, pos.x);
    assertEquals(20000, pos.y);

    // The following tests do not work in Gecko 1.8 and below, due to an
    // obscure off-by-one bug in goog.style.getPageOffset.  Same for IE.
    if (!(goog.userAgent.IE) &&
        !(goog.userAgent.GECKO && !goog.userAgent.isVersion('1.9'))) {
      window.scroll(1, 1);
      pos = goog.style.getPageOffset(div);
      assertEquals(10000, pos.x);
      assertEquals(20000, pos.y);

      window.scroll(1000, 2000);
      pos = goog.style.getPageOffset(div);
      assertEquals(10000, pos.x);
      assertEquals(20000, pos.y);

      window.scroll(10000, 20000);
      pos = goog.style.getPageOffset(div);
      assertEquals(10000, pos.x);
      assertEquals(20000, pos.y);
    }
  }
  // Undo changes.
  finally {
    document.body.removeChild(div);
    window.scroll(0, 0);
  }
}

function testGetPageOffsetFixedPositionElements() {
  // Skip these tests in certain browsers.
  // position:fixed is not supported in IE before version 7
  if (!goog.userAgent.IE || !goog.userAgent.isVersion('6')) {
    // Test with a position fixed element
    var div = goog.dom.createDom('DIV');
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.left = '10px';
    document.body.appendChild(div);
    var pos = goog.style.getPageOffset(div);
    assertEquals(10, pos.x);
    assertEquals(10, pos.y);

    // Test with a position fixed element as parent
    var innerDiv = goog.dom.createDom('DIV');
    div = goog.dom.createDom('DIV');
    div.style.position = 'fixed';
    div.style.top = '10px';
    div.style.left = '10px';
    div.style.padding = '5px';
    div.appendChild(innerDiv);
    document.body.appendChild(div);
    pos = goog.style.getPageOffset(innerDiv);
    assertEquals(15, pos.x);
    assertEquals(15, pos.y);
  }
}

function testGetPositionTolerantToNoDocumentElementBorder() {
  // In IE, removing the border on the document element undoes the normal
  // 2-pixel offset.  Ensure that we're correctly compensating for both cases.
  try {
    document.documentElement.style.borderWidth = '0';
    var div = goog.dom.createDom('DIV');
    div.style.position = 'absolute';
    div.style.left = '100px';
    div.style.top = '200px';
    document.body.appendChild(div);

    // Test all major positioning methods.
    // Temporarily disabled for IE8 - IE8 returns dimensions multiplied by 100
    expectedFailures.expectFailureFor(isIE8() && !goog.dom.isCss1CompatMode());
    try {
      // Test all major positioning methods.
      var pos = goog.style.getClientPosition(div);
      assertEquals(100, pos.x);
      assertEquals(200, pos.y);
      var offset = goog.style.getPageOffset(div);
      assertEquals(100, offset.x);
      assertEquals(200, offset.y);
    } catch (e) {
      expectedFailures.handleException(e);
    }
  } finally {
    document.documentElement.style.borderWidth = '';
  }
}

function testSetSize() {
  var el = $('testEl');

  goog.style.setSize(el, 100, 100);
  assertEquals('100px', el.style.width);
  assertEquals('100px', el.style.height);

  goog.style.setSize(el, '50px', '25px');
  assertEquals('should be "50px"', '50px', el.style.width);
  assertEquals('should be "25px"', '25px', el.style.height);

  goog.style.setSize(el, '10ex', '25px');
  assertEquals('10ex', el.style.width);
  assertEquals('25px', el.style.height);

  goog.style.setSize(el, '10%', '25%');
  assertEquals('10%', el.style.width);
  assertEquals('25%', el.style.height);

  // ignores stupid units
  goog.style.setSize(el, 0, 0);
  // TODO(user): IE errors if you set these values.  Should we make setStyle
  // catch these?  Or leave it up to the app.  Fixing the tests for now.
  //goog.style.setSize(el, '10rainbows', '25rainbows');
  assertEquals('0px', el.style.width);
  assertEquals('0px', el.style.height);

  goog.style.setSize(el, new goog.math.Size(20,40));
  assertEquals('20px', el.style.width);
  assertEquals('40px', el.style.height);
}

function testSetWidthAndHeight() {
  var el = $('testEl');

  // Replicate all of the setSize tests above.

  goog.style.setWidth(el, 100);
  goog.style.setHeight(el, 100);
  assertEquals('100px', el.style.width);
  assertEquals('100px', el.style.height);

  goog.style.setWidth(el, '50px');
  goog.style.setHeight(el, '25px');
  assertEquals('should be "50px"', '50px', el.style.width);
  assertEquals('should be "25px"', '25px', el.style.height);

  goog.style.setWidth(el, '10ex');
  goog.style.setHeight(el, '25px');
  assertEquals('10ex', el.style.width);
  assertEquals('25px', el.style.height);

  goog.style.setWidth(el, '10%');
  goog.style.setHeight(el, '25%');
  assertEquals('10%', el.style.width);
  assertEquals('25%', el.style.height);

  goog.style.setWidth(el, 0);
  goog.style.setHeight(el, 0);
  assertEquals('0px', el.style.width);
  assertEquals('0px', el.style.height);

  goog.style.setWidth(el, 20);
  goog.style.setHeight(el, 40);
  assertEquals('20px', el.style.width);
  assertEquals('40px', el.style.height);

  // Additional tests testing each separately.
  goog.style.setWidth(el, '');
  goog.style.setHeight(el, '');
  assertEquals('', el.style.width);
  assertEquals('', el.style.height);

  goog.style.setHeight(el, 20);
  assertEquals('', el.style.width);
  assertEquals('20px', el.style.height);

  goog.style.setWidth(el, 40);
  assertEquals('40px', el.style.width);
  assertEquals('20px', el.style.height);
}

function testGetSize() {
  var el = $('testEl');
  goog.style.setSize(el, 100, 100);

  var dims = goog.style.getSize(el);
  assertEquals(100, dims.width);
  assertEquals(100, dims.height);

  goog.style.setStyle(el, 'display', 'none');
  dims = goog.style.getSize(el);
  assertEquals(100, dims.width);
  assertEquals(100, dims.height);

  el = $('testEl5');
  goog.style.setSize(el, 100, 100);
  dims = goog.style.getSize(el);
  assertEquals(100, dims.width);
  assertEquals(100, dims.height);

  el = $('span0');
  dims = goog.style.getSize(el);
  assertNotEquals(0, dims.width);
  assertNotEquals(0, dims.height);

  el = $('table1');
  dims = goog.style.getSize(el);
  assertNotEquals(0, dims.width);
  assertNotEquals(0, dims.height);

  el = $('td1');
  dims = goog.style.getSize(el);
  assertNotEquals(0, dims.width);
  assertNotEquals(0, dims.height);

  el = $('li1');
  dims = goog.style.getSize(el);
  assertNotEquals(0, dims.width);
  assertNotEquals(0, dims.height);

  el = goog.dom.getElementsByTagNameAndClass('html')[0];
  dims = goog.style.getSize(el);
  assertNotEquals(0, dims.width);
  assertNotEquals(0, dims.height);

  el = goog.dom.getElementsByTagNameAndClass('body')[0];
  dims = goog.style.getSize(el);
  assertNotEquals(0, dims.width);
  assertNotEquals(0, dims.height);
}

function testGetSizeSvgElements() {
  var svgEl = document.createElementNS &&
       document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (!svgEl || svgEl.getAttribute('transform') == '' ||
      (goog.userAgent.WEBKIT && !goog.userAgent.isVersion(534.8))) {
    // SVG not supported, or getBoundingClientRect not supported on SVG
    // elements.
    return;
  }

  document.body.appendChild(svgEl);
  el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  el.setAttribute('x', 10);
  el.setAttribute('y', 10);
  el.setAttribute('width', 32);
  el.setAttribute('height', 21);
  el.setAttribute('fill', '#000');

  svgEl.appendChild(el);

  dims = goog.style.getSize(el);
  assertEquals(32, dims.width);
  assertRoughlyEquals(21, dims.height, 0.01);

  dims = goog.style.getSize(svgEl);
  if (goog.userAgent.WEBKIT) {
    // The size of the <svg> will be the viewport size on WebKit browsers.
    assertTrue(dims.width >= 32);
    assertTrue(dims.height >= 21);
  } else {
    assertEquals(32, dims.width);
    assertRoughlyEquals(21, dims.height, 0.01);
  }

  el.style.visibility = 'none';

  dims = goog.style.getSize(el);
  assertEquals(32, dims.width);
  assertRoughlyEquals(21, dims.height, 0.01);

  dims = goog.style.getSize(svgEl);
  if (goog.userAgent.WEBKIT) {
    // The size of the <svg> will be the viewport size on WebKit browsers.
    assertTrue(dims.width >= 32);
    assertTrue(dims.height >= 21);
  } else {
    assertEquals(32, dims.width);
    assertRoughlyEquals(21, dims.height, 0.01);
  }
}

function testGetSizeInlineBlock() {
  var el = $('height-test-inner');
  var dims = goog.style.getSize(el);
  assertNotEquals(0, dims.height);
}

function testGetBounds() {
  var el = $('testEl');

  var dims = goog.style.getSize(el);
  var pos = goog.style.getPageOffset(el);

  var rect = goog.style.getBounds(el);

  // Relies on getSize and getPageOffset being correct.
  assertEquals(dims.width, rect.width);
  assertEquals(dims.height, rect.height);
  assertEquals(pos.x, rect.left);
  assertEquals(pos.y, rect.top);
}

function testInstallStyles() {
  var el = $('installTest0');
  var originalBackground = goog.style.getBackgroundColor(el);

  // Uses background-color because it's easy to get the computed value
  var result = goog.style.installStyles(
      '#installTest0 { background-color: rgb(255, 192, 203); }');

  // For some odd reason, the change in computed style does not register on
  // Chrome 19 unless the style property is touched.  The behavior goes
  // away again in Chrome 20.
  // TODO(nnaze): Remove special caseing once we switch the testing image
  // to Chrome 20 or higher.
  if (isChrome19()) {
    el.style.display = '';
  }

  assertColorRgbEquals('rgb(255,192,203)', goog.style.getBackgroundColor(el));

  goog.style.uninstallStyles(result);
  assertEquals(originalBackground, goog.style.getBackgroundColor(el));
}

function testSetStyles() {
  var el = $('installTest1');

  // Change to pink
  var ss = goog.style.installStyles(
      '#installTest1 { background-color: rgb(255, 192, 203); }');

  // For some odd reason, the change in computed style does not register on
  // Chrome 19 unless the style property is touched.  The behavior goes
  // away again in Chrome 20.
  // TODO(nnaze): Remove special caseing once we switch the testing image
  // to Chrome 20 or higher.
  if (isChrome19()) {
    el.style.display = '';
  }

  assertColorRgbEquals('rgb(255,192,203)', goog.style.getBackgroundColor(el));

  // Now change to orange
  goog.style.setStyles(ss,
      '#installTest1 { background-color: rgb(255, 255, 0); }');
  assertColorRgbEquals('rgb(255,255,0)', goog.style.getBackgroundColor(el));
}

function assertColorRgbEquals(expected, actual) {
  assertEquals(expected,
      goog.color.hexToRgbStyle(goog.color.parse(actual).hex));
}

function isChrome19() {
  return goog.userAgent.product.CHROME &&
         goog.string.startsWith(goog.userAgent.product.VERSION, '19.');
}

function testIsRightToLeft() {
  assertFalse(goog.style.isRightToLeft($('rtl1')));
  assertTrue(goog.style.isRightToLeft($('rtl2')));
  assertFalse(goog.style.isRightToLeft($('rtl3')));
  assertFalse(goog.style.isRightToLeft($('rtl4')));
  assertTrue(goog.style.isRightToLeft($('rtl5')));
  assertFalse(goog.style.isRightToLeft($('rtl6')));
  assertTrue(goog.style.isRightToLeft($('rtl7')));
  assertFalse(goog.style.isRightToLeft($('rtl8')));
  assertTrue(goog.style.isRightToLeft($('rtl9')));
  assertFalse(goog.style.isRightToLeft($('rtl10')));
}

function testPosWithAbsoluteAndScroll() {
  var el = $('pos-scroll-abs')
  var el1 = $('pos-scroll-abs-1');
  var el2 = $('pos-scroll-abs-2');

  el1.scrollTop = 200;
  var pos = goog.style.getPageOffset(el2);

  assertEquals(200, pos.x);
  // Don't bother with IE in quirks mode
  if (!goog.userAgent.IE || document.compatMode == 'CSS1Compat') {
    assertEquals(300, pos.y);
  }
}

function testPosWithAbsoluteAndWindowScroll() {
  window.scrollBy(0, 200);
  var el = $('abs-upper-left');
  var pos = goog.style.getPageOffset(el);
  assertEquals('Top should be about 0', 0, pos.y);
}

function testGetBorderBoxSize() {
  // Strict mode
  var getBorderBoxSize = goog.style.getBorderBoxSize;

  var el = $('size-a');
  var rect = getBorderBoxSize(el);
  assertEquals('width:100px', 100, rect.width);
  assertEquals('height:100px', 100, rect.height);

  // with border: 10px
  el = $('size-b');
  rect = getBorderBoxSize(el);
  assertEquals('width:100px;border:10px', isBorderBox ? 100 : 120, rect.width);
  assertEquals('height:100px;border:10px', isBorderBox ? 100 : 120,
               rect.height);

  // with border: 10px; padding: 10px
  el = $('size-c');
  rect = getBorderBoxSize(el);
  assertEquals('width:100px;border:10px;padding:10px',
               isBorderBox ? 100 : 140, rect.width);
  assertEquals('height:100px;border:10px;padding:10px',
               isBorderBox ? 100 : 140, rect.height);

  // size, padding and borders are all in non pixel units
  // all we test here is that we get a number out
  el = $('size-d');
  rect = getBorderBoxSize(el);
  assertEquals('number', typeof rect.width);
  assertEquals('number', typeof rect.height);
  assertFalse(isNaN(rect.width));
  assertFalse(isNaN(rect.height));
}

function testGetContentBoxSize() {
  // Strict mode
  var getContentBoxSize = goog.style.getContentBoxSize;

  var el = $('size-a');
  var rect = getContentBoxSize(el);
  assertEquals('width:100px', 100, rect.width);
  assertEquals('height:100px', 100, rect.height);

  // with border: 10px
  el = $('size-b');
  rect = getContentBoxSize(el);
  assertEquals('width:100px;border:10px',
               isBorderBox ? 80 : 100, rect.width);
  assertEquals('height:100px;border:10px',
               isBorderBox ? 80 : 100, rect.height);

  // with border: 10px; padding: 10px
  el = $('size-c');
  rect = getContentBoxSize(el);
  assertEquals('width:100px;border:10px;padding:10px',
               isBorderBox ? 60 : 100, rect.width);
  assertEquals('height:100px;border:10px;padding:10px',
               isBorderBox ? 60 : 100, rect.height);

  // size, padding and borders are all in non pixel units
  // all we test here is that we get a number out
  el = $('size-d');
  rect = getContentBoxSize(el);
  assertEquals('number', typeof rect.width);
  assertEquals('number', typeof rect.height);
  assertFalse(isNaN(rect.width));
  assertFalse(isNaN(rect.height));

  // test whether getContentBoxSize works when width and height
  // aren't explicitly set, but the default of 'auto'.
  // 'size-f' has no margin, border, or padding, so offsetWidth/Height
  // should match the content box size
  el = $('size-f');
  rect = getContentBoxSize(el);
  assertEquals(el.offsetWidth, rect.width);
  assertEquals(el.offsetHeight, rect.height);
}

function testSetBorderBoxSize() {
  // Strict mode
  var el = $('size-e');
  var Size = goog.math.Size;
  var setBorderBoxSize = goog.style.setBorderBoxSize;

  // Clean up
  // style element has 100x100, no border and no padding
  el.style.padding = '';
  el.style.margin = '';
  el.style.borderWidth = '';
  el.style.width = '';
  el.style.height = '';

  setBorderBoxSize(el, new Size(100, 100));

  assertEquals(100, el.offsetWidth);
  assertEquals(100, el.offsetHeight);

  el.style.borderWidth = '10px';
  setBorderBoxSize(el, new Size(100, 100));

  assertEquals('width:100px;border:10px', 100, el.offsetWidth);
  assertEquals('height:100px;border:10px', 100, el.offsetHeight);

  el.style.padding = '10px';
  setBorderBoxSize(el, new Size(100, 100));
  assertEquals(100, el.offsetWidth);
  assertEquals(100, el.offsetHeight);

  el.style.borderWidth = '0';
  setBorderBoxSize(el, new Size(100, 100));
  assertEquals(100, el.offsetWidth);
  assertEquals(100, el.offsetHeight);

  if (goog.userAgent.GECKO) {
    assertEquals('border-box', el.style.MozBoxSizing);
  } else if (goog.userAgent.WEBKIT) {
    assertEquals('border-box', el.style.WebkitBoxSizing);
  } else if (goog.userAgent.OPERA ||
      goog.userAgent.IE && goog.userAgent.isDocumentMode(8)) {
    assertEquals('border-box', el.style.boxSizing);
  }

  // Try a negative width/height.
  setBorderBoxSize(el, new Size(-10, -10));

  // Setting the border box smaller than the borders will just give you
  // a content box of size 0.
  // NOTE(nicksantos): I'm not really sure why IE7 is special here.
  var isIeLt8Quirks = goog.userAgent.IE &&
      !goog.userAgent.isDocumentMode(8) &&
      !goog.dom.isCss1CompatMode();
  assertEquals(20, el.offsetWidth);
  assertEquals(isIeLt8Quirks ? 39 : 20, el.offsetHeight);
}

function testSetContentBoxSize() {
  // Strict mode
  var el = $('size-e');
  var Size = goog.math.Size;
  var setContentBoxSize = goog.style.setContentBoxSize;

  // Clean up
  // style element has 100x100, no border and no padding
  el.style.padding = '';
  el.style.margin = '';
  el.style.borderWidth = '';
  el.style.width = '';
  el.style.height = '';

  setContentBoxSize(el, new Size(100, 100));

  assertEquals(100, el.offsetWidth);
  assertEquals(100, el.offsetHeight);

  el.style.borderWidth = '10px';
  setContentBoxSize(el, new Size(100, 100));
  assertEquals('width:100px;border-width:10px', 120, el.offsetWidth);
  assertEquals('height:100px;border-width:10px', 120, el.offsetHeight);

  el.style.padding = '10px';
  setContentBoxSize(el, new Size(100, 100));
  assertEquals('width:100px;border-width:10px;padding:10px',
               140, el.offsetWidth);
  assertEquals('height:100px;border-width:10px;padding:10px',
               140, el.offsetHeight);

  el.style.borderWidth = '0';
  setContentBoxSize(el, new Size(100, 100));
  assertEquals('width:100px;padding:10px', 120, el.offsetWidth);
  assertEquals('height:100px;padding:10px', 120, el.offsetHeight);

  if (goog.userAgent.GECKO) {
    assertEquals('content-box', el.style.MozBoxSizing);
  } else if (goog.userAgent.WEBKIT) {
    assertEquals('content-box', el.style.WebkitBoxSizing);
  } else if (goog.userAgent.OPERA ||
      goog.userAgent.IE && goog.userAgent.isDocumentMode(8)) {
    assertEquals('content-box', el.style.boxSizing);
  }

  // Try a negative width/height.
  setContentBoxSize(el, new Size(-10, -10));

  // NOTE(nicksantos): I'm not really sure why IE7 is special here.
  var isIeLt8Quirks = goog.userAgent.IE &&
      !goog.userAgent.isDocumentMode('8') &&
      !goog.dom.isCss1CompatMode();
  assertEquals(20, el.offsetWidth);
  assertEquals(isIeLt8Quirks ? 39 : 20, el.offsetHeight);
}

function testGetPaddingBox() {
  // Strict mode
  var el = $('size-e');
  var Size = goog.math.Size;
  var getPaddingBox = goog.style.getPaddingBox;

  // Clean up
  // style element has 100x100, no border and no padding
  el.style.padding = '';
  el.style.margin = '';
  el.style.borderWidth = '';
  el.style.width = '';
  el.style.height = '';

  el.style.padding = '10px';
  var rect = getPaddingBox(el);
  assertEquals(10, rect.left);
  assertEquals(10, rect.right);
  assertEquals(10, rect.top);
  assertEquals(10, rect.bottom);

  el.style.padding = '0';
  rect = getPaddingBox(el);
  assertEquals(0, rect.left);
  assertEquals(0, rect.right);
  assertEquals(0, rect.top);
  assertEquals(0, rect.bottom);

  el.style.padding = '1px 2px 3px 4px';
  rect = getPaddingBox(el);
  assertEquals(1, rect.top);
  assertEquals(2, rect.right);
  assertEquals(3, rect.bottom);
  assertEquals(4, rect.left);

  el.style.padding = '1mm 2em 3ex 4%';
  rect = getPaddingBox(el);
  assertFalse(isNaN(rect.top));
  assertFalse(isNaN(rect.right));
  assertFalse(isNaN(rect.bottom));
  assertFalse(isNaN(rect.left));
  assertTrue(rect.top >= 0);
  assertTrue(rect.right >= 0);
  assertTrue(rect.bottom >= 0);
  assertTrue(rect.left >= 0);
}

function testGetPaddingBoxUnattached() {
  var el = document.createElement('div');
  var box = goog.style.getPaddingBox(el);
  if (goog.userAgent.WEBKIT) {
    assertTrue(isNaN(box.top));
    assertTrue(isNaN(box.right));
    assertTrue(isNaN(box.bottom));
    assertTrue(isNaN(box.left));
  } else {
    assertObjectEquals(new goog.math.Box(0, 0, 0, 0), box);
  }
}

function testGetMarginBox() {
  // Strict mode
  var el = $('size-e');
  var Size = goog.math.Size;
  var getMarginBox = goog.style.getMarginBox;

  // Clean up
  // style element has 100x100, no border and no padding
  el.style.padding = '';
  el.style.margin = '';
  el.style.borderWidth = '';
  el.style.width = '';
  el.style.height = '';

  el.style.margin = '10px';
  var rect = getMarginBox(el);
  assertEquals(10, rect.left);
  // In webkit the right margin is the calculated distance from right edge and
  // not the computed right margin so it is not reliable.
  // See https://bugs.webkit.org/show_bug.cgi?id=19828
  if (!goog.userAgent.WEBKIT) {
    assertEquals(10, rect.right);
  }
  assertEquals(10, rect.top);
  assertEquals(10, rect.bottom);

  el.style.margin = '0';
  rect = getMarginBox(el);
  assertEquals(0, rect.left);
  // In webkit the right margin is the calculated distance from right edge and
  // not the computed right margin so it is not reliable.
  // See https://bugs.webkit.org/show_bug.cgi?id=19828
  if (!goog.userAgent.WEBKIT) {
    assertEquals(0, rect.right);
  }
  assertEquals(0, rect.top);
  assertEquals(0, rect.bottom);

  el.style.margin = '1px 2px 3px 4px';
  rect = getMarginBox(el);
  assertEquals(1, rect.top);
  // In webkit the right margin is the calculated distance from right edge and
  // not the computed right margin so it is not reliable.
  // See https://bugs.webkit.org/show_bug.cgi?id=19828
  if (!goog.userAgent.WEBKIT) {
    assertEquals(2, rect.right);
  }
  assertEquals(3, rect.bottom);
  assertEquals(4, rect.left);

  el.style.margin = '1mm 2em 3ex 4%';
  rect = getMarginBox(el);
  assertFalse(isNaN(rect.top));
  assertFalse(isNaN(rect.right));
  assertFalse(isNaN(rect.bottom));
  assertFalse(isNaN(rect.left));
  assertTrue(rect.top >= 0);
  // In webkit the right margin is the calculated distance from right edge and
  // not the computed right margin so it is not reliable.
  // See https://bugs.webkit.org/show_bug.cgi?id=19828
  if (!goog.userAgent.WEBKIT) {
    assertTrue(rect.right >= 0);
  }
  assertTrue(rect.bottom >= 0);
  assertTrue(rect.left >= 0);
}

function testGetBorderBox() {
  // Strict mode
  var el = $('size-e');
  var Size = goog.math.Size;
  var getBorderBox = goog.style.getBorderBox;

  // Clean up
  // style element has 100x100, no border and no padding
  el.style.padding = '';
  el.style.margin = '';
  el.style.borderWidth = '';
  el.style.width = '';
  el.style.height = '';

  el.style.borderWidth = '10px';
  var rect = getBorderBox(el);
  assertEquals(10, rect.left);
  assertEquals(10, rect.right);
  assertEquals(10, rect.top);
  assertEquals(10, rect.bottom);

  el.style.borderWidth = '0';
  rect = getBorderBox(el);
  assertEquals(0, rect.left);
  assertEquals(0, rect.right);
  assertEquals(0, rect.top);
  assertEquals(0, rect.bottom);

  el.style.borderWidth = '1px 2px 3px 4px';
  rect = getBorderBox(el);
  assertEquals(1, rect.top);
  assertEquals(2, rect.right);
  assertEquals(3, rect.bottom);
  assertEquals(4, rect.left);

  // % does not work for border widths in IE
  el.style.borderWidth = '1mm 2em 3ex 4pt';
  rect = getBorderBox(el);
  assertFalse(isNaN(rect.top));
  assertFalse(isNaN(rect.right));
  assertFalse(isNaN(rect.bottom));
  assertFalse(isNaN(rect.left));
  assertTrue(rect.top >= 0);
  assertTrue(rect.right >= 0);
  assertTrue(rect.bottom >= 0);
  assertTrue(rect.left >= 0);

  el.style.borderWidth = 'thin medium thick 1px';
  rect = getBorderBox(el);
  assertFalse(isNaN(rect.top));
  assertFalse(isNaN(rect.right));
  assertFalse(isNaN(rect.bottom));
  assertFalse(isNaN(rect.left));
  assertTrue(rect.top >= 0);
  assertTrue(rect.right >= 0);
  assertTrue(rect.bottom >= 0);
  assertTrue(rect.left >= 0);
}

function testGetFontFamily() {
  // I tried to use common fonts for these tests. It's possible the test fails
  // because the testing platform doesn't have one of these fonts installed:
  //   Comic Sans MS or Century Schoolbook L
  //   Times
  //   Helvetica

  var tmpFont = goog.style.getFontFamily($('font-tag'));
  assertTrue('FontFamily should be detectable when set via <font face>',
             'Times' == tmpFont || 'Times New Roman' == tmpFont);
  tmpFont = goog.style.getFontFamily($('small-text'));
  assertTrue('Multiword fonts should be reported with quotes stripped.',
             'Comic Sans MS' == tmpFont ||
                 'Century Schoolbook L' == tmpFont);
  // Firefox fails this test & retuns a generic 'monospace' instead of the
  // actually displayed font (e.g., "Times New").
  //tmpFont = goog.style.getFontFamily($('pre-font'));
  //assertEquals('<pre> tags should use a fixed-width font',
  //             'Times New',
  //             tmpFont);
  tmpFont = goog.style.getFontFamily($('inherit-font'));
  assertEquals('Explicitly inherited fonts should be detectable',
               'Helvetica',
               tmpFont);
  tmpFont = goog.style.getFontFamily($('times-font-family'));
  assertEquals('Font-family set via style attribute should be detected',
               'Times',
               tmpFont);
  tmpFont = goog.style.getFontFamily($('bold-font'));
  assertEquals('Implicitly inherited font should be detected',
               'Helvetica',
               tmpFont);
  tmpFont = goog.style.getFontFamily($('css-html-tag-redefinition'));
  assertEquals('HTML tag CSS rewrites should be detected',
               'Times',
               tmpFont);
  tmpFont = goog.style.getFontFamily($('no-text-font-styles'));
  assertEquals('Font family should exist even with no text',
               'Helvetica',
               tmpFont);
  tmpFont = goog.style.getFontFamily($('icon-font'));
  assertNotEquals('icon is a special font-family value',
                  'icon',
                  tmpFont.toLowerCase());
  tmpFont = goog.style.getFontFamily($('font-style-badfont'));
  // Firefox fails this test and reports the specified "badFont", which is
  // obviously not displayed.
  //assertEquals('Invalid fonts should not be returned',
  //             'Helvetica',
  //             tmpFont);
  tmpFont = goog.style.getFontFamily($('img-font-test'));
  assertTrue('Even img tags should inherit the document body\'s font',
             tmpFont != '');
  tmpFont = goog.style.getFontFamily($('nested-font'));
  assertEquals('An element with nested content should be unaffected.',
               'Arial',
               tmpFont);
}

function testGetFontSize() {
  assertEquals('Font size should be determined even without any text',
               30,
               goog.style.getFontSize($('no-text-font-styles')));
  assertEquals('A 5em font should be 5x larger than its parent.',
               150,
               goog.style.getFontSize($('css-html-tag-redefinition')));
  assertTrue('Setting font size=-1 should result in a positive font size.',
             goog.style.getFontSize($('font-tag')) > 0);
  assertEquals('Inheriting a 50% font-size should have no additional effect',
               goog.style.getFontSize($('font-style-badfont')),
               goog.style.getFontSize($('inherit-50pct-font')));
  assertTrue('In pretty much any display, 3in should be > 8px',
             goog.style.getFontSize($('times-font-family')) >
                 goog.style.getFontSize($('no-text-font-styles')));
  assertTrue('With no applied styles, font-size should still be defined.',
             goog.style.getFontSize($('no-font-style')) > 0);
  assertEquals('50% of 30px is 15',
               15,
               goog.style.getFontSize($('font-style-badfont')));
  assertTrue('x-small text should be smaller than small text',
             goog.style.getFontSize($('x-small-text')) <
                 goog.style.getFontSize($('small-text')));
  // IE fails this test, the decimal portion of px lengths isn't reported
  // by getCascadedStyle. Firefox passes, but only because it ignores the
  // decimals altogether.
  //assertEquals('12.5px should be the same as 0.5em nested in a 25px node.',
  //             goog.style.getFontSize($('font-size-12-point-5-px')),
  //             goog.style.getFontSize($('font-size-50-pct-of-25-px')));

  assertEquals('Font size should not doubly count em values',
      2, goog.style.getFontSize($('em-font-size')));
}

function testGetLengthUnits() {
  assertEquals('px', goog.style.getLengthUnits('15px'));
  assertEquals('%', goog.style.getLengthUnits('99%'));
  assertNull(goog.style.getLengthUnits(''));
}

function testParseStyleAttribute() {
  var css = 'left: 0px; text-align: center';
  var expected = {'left': '0px', 'textAlign': 'center'};

  assertObjectEquals(expected, goog.style.parseStyleAttribute(css));
}

function testToStyleAttribute() {
  var object = {'left': '0px', 'textAlign': 'center'};
  var expected = 'left:0px;text-align:center;';

  assertEquals(expected, goog.style.toStyleAttribute(object));
}

function testStyleAttributePassthrough() {
  var object = {'left': '0px', 'textAlign': 'center'};

  assertObjectEquals(object,
      goog.style.parseStyleAttribute(goog.style.toStyleAttribute(object)));
}

function testGetFloat() {
  assertEquals('', goog.style.getFloat($('no-float')));
  assertEquals('none', goog.style.getFloat($('float-none')));
  assertEquals('left', goog.style.getFloat($('float-left')));
}

function testSetFloat() {
  var el = $('float-test');

  goog.style.setFloat(el, 'left');
  assertEquals('left', goog.style.getFloat(el));

  goog.style.setFloat(el, 'right');
  assertEquals('right', goog.style.getFloat(el));

  goog.style.setFloat(el, 'none');
  assertEquals('none', goog.style.getFloat(el));

  goog.style.setFloat(el, '');
  assertEquals('', goog.style.getFloat(el));
}

function testIsElementShown() {
  var el = $('testEl');

  goog.style.showElement(el, false);
  assertFalse(goog.style.isElementShown(el));

  goog.style.showElement(el, true);
  assertTrue(goog.style.isElementShown(el));
}

function testGetOpacity() {
  var el1 = {
    style: {
      opacity: '0.3'
    }
  };

  var el2 = {
    style: {
      MozOpacity: '0.1'
    }
  };

  var el3 = {
    style: {
      filter: 'some:other,filter;alpha(opacity=25.5);alpha(more=100);'
    }
  };

  assertEquals(0.3, goog.style.getOpacity(el1));
  assertEquals(0.1, goog.style.getOpacity(el2));
  assertEquals(0.255, goog.style.getOpacity(el3));

  el1.style.opacity = '0';
  el2.style.MozOpacity = '0';
  el3.style.filter = 'some:other,filter;alpha(opacity=0);alpha(more=100);';

  assertEquals(0, goog.style.getOpacity(el1));
  assertEquals(0, goog.style.getOpacity(el2));
  assertEquals(0, goog.style.getOpacity(el3));

  el1.style.opacity = '';
  el2.style.MozOpacity = '';
  el3.style.filter = '';

  assertEquals('', goog.style.getOpacity(el1));
  assertEquals('', goog.style.getOpacity(el2));
  assertEquals('', goog.style.getOpacity(el3));

  var el4 = {
    style: {}
  }

  assertEquals('', goog.style.getOpacity(el4));
  assertEquals('', goog.style.getOpacity($('test-opacity')));
}

function testSetOpacity() {
  var el1 = {
    style: {
      opacity: '0.3'
    }
  };
  goog.style.setOpacity(el1, 0.8);

  var el2 = {
    style: {
      MozOpacity: '0.1'
    }
  };
  goog.style.setOpacity(el2, 0.5);

  var el3 = {
    style: {
      filter: 'alpha(opacity=25)'
    }
  };
  goog.style.setOpacity(el3, 0.1);

  assertEquals(0.8, Number(el1.style.opacity));
  assertEquals(0.5, Number(el2.style.MozOpacity));
  assertEquals('alpha(opacity=10)', el3.style.filter);

  goog.style.setOpacity(el1, 0);
  goog.style.setOpacity(el2, 0);
  goog.style.setOpacity(el3, 0);

  assertEquals(0, Number(el1.style.opacity));
  assertEquals(0, Number(el2.style.MozOpacity));
  assertEquals('alpha(opacity=0)', el3.style.filter);

  goog.style.setOpacity(el1, '');
  goog.style.setOpacity(el2, '');
  goog.style.setOpacity(el3, '');

  assertEquals('', el1.style.opacity);
  assertEquals('', el2.style.MozOpacity);
  assertEquals('', el3.style.filter);
}

function testFramedPageOffset() {
  // Set up a complicated iframe ancestor chain.
  var iframe = goog.dom.getElement('test-frame-offset');
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeWindow = goog.dom.getWindow(iframeDoc);

  var iframePos = 'style="display:block;position:absolute;' +
      'top:50px;left:50px;width:50px;height:50px;"';
  iframeDoc.write('<iframe id="test-frame-offset-2" ' +
      iframePos + '></iframe>' +
      '<div id="test-element-2" ' +
      ' style="position:absolute;left:300px;top:300px">hi mom!</div>');
  iframeDoc.close();
  var iframe2 = iframeDoc.getElementById('test-frame-offset-2');
  var testElement2 = iframeDoc.getElementById('test-element-2');
  var iframeDoc2 = goog.dom.getFrameContentDocument(iframe2);
  var iframeWindow2 = goog.dom.getWindow(iframeDoc2);

  iframeDoc2.write(
      '<div id="test-element-3" ' +
      ' style="position:absolute;left:500px;top:500px">hi mom!</div>');
  iframeDoc2.close();
  var testElement3 = iframeDoc2.getElementById('test-element-3');

  assertCoordinateApprox(300, 300, 0,
      goog.style.getPageOffset(testElement2));
  assertCoordinateApprox(500, 500, 0,
      goog.style.getPageOffset(testElement3));

  assertCoordinateApprox(350, 350, 0,
      goog.style.getFramedPageOffset(testElement2, window));
  assertCoordinateApprox(300, 300, 0,
      goog.style.getFramedPageOffset(testElement2, iframeWindow));

  assertCoordinateApprox(600, 600, 0,
      goog.style.getFramedPageOffset(testElement3, window));
  assertCoordinateApprox(550, 550, 0,
      goog.style.getFramedPageOffset(testElement3, iframeWindow));
  assertCoordinateApprox(500, 500, 0,
      goog.style.getFramedPageOffset(testElement3, iframeWindow2));

  // Scroll the iframes a bit.
  window.scrollBy(0, 5);
  iframeWindow.scrollBy(0, 11);
  iframeWindow2.scrollBy(0, 18);

  // On Firefox 2, scrolling inner iframes causes off by one errors
  // in the page position, because we're using screen coords to compute them.
  assertCoordinateApprox(300, 300, 2,
      goog.style.getPageOffset(testElement2));
  assertCoordinateApprox(500, 500, 2,
      goog.style.getPageOffset(testElement3));

  assertCoordinateApprox(350, 350 - 11, 2,
      goog.style.getFramedPageOffset(testElement2, window));
  assertCoordinateApprox(300, 300, 2,
      goog.style.getFramedPageOffset(testElement2, iframeWindow));

  assertCoordinateApprox(600, 600 - 18 - 11, 2,
      goog.style.getFramedPageOffset(testElement3, window));
  assertCoordinateApprox(550, 550 - 18, 2,
      goog.style.getFramedPageOffset(testElement3, iframeWindow));
  assertCoordinateApprox(500, 500, 2,
      goog.style.getFramedPageOffset(testElement3, iframeWindow2));
}

/**
 * Asserts that the coordinate is approximately equal to the given
 * x and y coordinates, give or take delta.
 */
function assertCoordinateApprox(x, y, delta, coord) {
  assertTrue('Expected x: ' + x + ', actual x: ' + coord.x,
      coord.x >= x - delta && coord.x <= x + delta);
  assertTrue('Expected y: ' + y + ', actual y: ' + coord.y,
      coord.y >= y - delta && coord.y <= y + delta);
}

function testTranslateRectForAnotherFrame() {
  var rect = new goog.math.Rect(1, 2, 3, 4);
  var thisDom = goog.dom.getDomHelper();
  goog.style.translateRectForAnotherFrame(rect, thisDom, thisDom);
  assertEquals(1, rect.left);
  assertEquals(2, rect.top);
  assertEquals(3, rect.width);
  assertEquals(4, rect.height);

  var iframe = $('test-translate-frame-standard');
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  var iframeDom = goog.dom.getDomHelper(iframeDoc);
  // Cannot rely on iframe starting at origin.
  iframeDom.getWindow().scrollTo(0, 0);
  // iframe is at (100, 150) and its body is not scrolled.
  rect = new goog.math.Rect(1, 2, 3, 4);
  goog.style.translateRectForAnotherFrame(rect, iframeDom, thisDom);
  assertEquals(1 + 100, rect.left);
  assertEquals(2 + 150, rect.top);
  assertEquals(3, rect.width);
  assertEquals(4, rect.height);

  iframeDom.getWindow().scrollTo(11, 13);
  rect = new goog.math.Rect(1, 2, 3, 4);
  goog.style.translateRectForAnotherFrame(rect, iframeDom, thisDom);
  assertEquals(1 + 100 - 11, rect.left);
  assertEquals(2 + 150 - 13, rect.top);
  assertEquals(3, rect.width);
  assertEquals(4, rect.height);

  iframe = $('test-translate-frame-quirk');
  iframeDoc = goog.dom.getFrameContentDocument(iframe);
  iframeDom = goog.dom.getDomHelper(iframeDoc);
  // Cannot rely on iframe starting at origin.
  iframeDom.getWindow().scrollTo(0, 0);
  // iframe is at (100, 350) and its body is not scrolled.
  rect = new goog.math.Rect(1, 2, 3, 4);
  goog.style.translateRectForAnotherFrame(rect, iframeDom, thisDom);
  assertEquals(1 + 100, rect.left);
  assertEquals(2 + 350, rect.top);
  assertEquals(3, rect.width);
  assertEquals(4, rect.height);

  iframeDom.getWindow().scrollTo(11, 13);
  rect = new goog.math.Rect(1, 2, 3, 4);
  goog.style.translateRectForAnotherFrame(rect, iframeDom, thisDom);
  assertEquals(1 + 100 - 11, rect.left);
  assertEquals(2 + 350 - 13, rect.top);
  assertEquals(3, rect.width);
  assertEquals(4, rect.height);
};

function testGetVisibleRectForElement() {
  var container = goog.dom.getElement('test-visible');
  var el = goog.dom.getElement('test-visible-el');
  var dom = goog.dom.getDomHelper(el);
  var winScroll = dom.getDocumentScroll();
  var winSize = dom.getViewportSize();

  // Skip this test if the window size is small.  Firefox3/Linux in Selenium
  // sometimes fails without this check.
  if (winSize.width < 20 || winSize.height < 20) {
    return;
  }

  // Move the container element to the window's viewport.
  var h = winSize.height < 100 ? winSize.height / 2 : 100;
  goog.style.setSize(container, winSize.width / 2, h);
  goog.style.setPosition(container, 8, winScroll.y + winSize.height - h);
  var visible = goog.style.getVisibleRectForElement(el);
  var bounds = goog.style.getBounds(container);
  // VisibleRect == Bounds rect of the offsetParent
  assertNotNull(visible);
  assertEquals(bounds.left, visible.left);
  assertEquals(bounds.top, visible.top);
  assertEquals(bounds.left + bounds.width, visible.right);
  assertEquals(bounds.top + bounds.height, visible.bottom);

  // Move a part of the container element to outside of the viewpoert.
  goog.style.setPosition(container, 8, winScroll.y + winSize.height - h / 2);
  visible = goog.style.getVisibleRectForElement(el);
  bounds = goog.style.getBounds(container);
  // Confirm VisibleRect == Intersection of the bounds rect of the
  // offsetParent and the viewport.
  assertNotNull(visible);
  assertEquals(bounds.left, visible.left);
  assertEquals(bounds.top, visible.top);
  assertEquals(bounds.left + bounds.width, visible.right);
  assertEquals(winScroll.y + winSize.height, visible.bottom);

  // Move the container element to outside of the viewpoert.
  goog.style.setPosition(container, 8, winScroll.y + winSize.height);
  visible = goog.style.getVisibleRectForElement(el);
  assertNull(visible);

  // Test the case with body element of height 0
  var iframe = goog.dom.getElement('test-visible-frame');
  var iframeDoc = goog.dom.getFrameContentDocument(iframe);
  el = iframeDoc.getElementById('test-visible');
  visible = goog.style.getVisibleRectForElement(el);

  var iframeViewportSize = goog.dom.getDomHelper(el).getViewportSize();
  // NOTE(user): For iframe, the clipping viewport is always the iframe
  // viewport, and not the actual browser viewport.
  assertNotNull(visible);
  assertEquals(0, visible.top);
  assertEquals(iframeViewportSize.height, visible.bottom);
  assertEquals(0, visible.left);
  assertEquals(iframeViewportSize.width, visible.right);
};

function testGetVisibleRectForElementWithBodyScrolled() {
  var container = goog.dom.getElement('test-visible2');
  var dom = goog.dom.getDomHelper(container);
  var el = dom.createDom('div', undefined, 'Test');
  el.style.position = 'absolute';
  dom.append(container, el);

  container.style.position = 'absolute';
  goog.style.setPosition(container, 20, 500);
  goog.style.setSize(container, 100, 150);

  // Scroll body container such that container is exactly at top.
  window.scrollTo(0, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(20, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(120, visibleRect.right, EPSILON);

  // Top 100px is clipped by window viewport.
  window.scrollTo(0, 600);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(600, visibleRect.top, EPSILON);
  assertRoughlyEquals(20, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(120, visibleRect.right, EPSILON);

  var winSize = dom.getViewportSize();

  // Left 50px is clipped by window viewport.
  // Right part is clipped by window viewport.
  goog.style.setSize(container, 10000, 150);
  window.scrollTo(70, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(70, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(70 + winSize.width, visibleRect.right, EPSILON);

  // Bottom part is clipped by window viewport.
  goog.style.setSize(container, 100, 2000);
  window.scrollTo(0, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(20, visibleRect.left, EPSILON);
  assertRoughlyEquals(120, visibleRect.right, EPSILON);
  assertRoughlyEquals(500 + winSize.height, visibleRect.bottom, EPSILON);

  goog.style.setPosition(container, 10000, 10000);
  assertNull(goog.style.getVisibleRectForElement(el));
}

function testGetVisibleRectForElementWithNestedAreaAndNonOffsetAncestor() {
  // IE7 quirks mode somehow consider container2 below as offset parent
  // of the element, which is incorrect.
  if (goog.userAgent.IE && !goog.userAgent.isDocumentMode(8) &&
      !goog.dom.isCss1CompatMode()) {
    return;
  }

  var container = goog.dom.getElement('test-visible2');
  var dom = goog.dom.getDomHelper(container);
  var container2 = dom.createDom('div');
  var el = dom.createDom('div', undefined, 'Test');
  el.style.position = 'absolute';
  dom.append(container, container2);
  dom.append(container2, el);

  container.style.position = 'absolute';
  goog.style.setPosition(container, 20, 500);
  goog.style.setSize(container, 100, 150);

  // container2 is a scrollable container but is not an offsetParent of
  // the element. It is ignored in the computation.
  container2.style.overflow = 'hidden';
  container2.style.marginTop = '50px';
  container2.style.marginLeft = '100px';
  goog.style.setSize(container2, 150, 100);

  // Scroll body container such that container is exactly at top.
  window.scrollTo(0, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(20, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(120, visibleRect.right, EPSILON);

  // Top 100px is clipped by window viewport.
  window.scrollTo(0, 600);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(600, visibleRect.top, EPSILON);
  assertRoughlyEquals(20, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(120, visibleRect.right, EPSILON);

  var winSize = dom.getViewportSize();

  // Left 50px is clipped by window viewport.
  // Right part is clipped by window viewport.
  goog.style.setSize(container, 10000, 150);
  window.scrollTo(70, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(70, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(70 + winSize.width, visibleRect.right, EPSILON);

  // Bottom part is clipped by window viewport.
  goog.style.setSize(container, 100, 2000);
  window.scrollTo(0, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(20, visibleRect.left, EPSILON);
  assertRoughlyEquals(120, visibleRect.right, EPSILON);
  assertRoughlyEquals(500 + winSize.height, visibleRect.bottom, EPSILON);

  goog.style.setPosition(container, 10000, 10000);
  assertNull(goog.style.getVisibleRectForElement(el));
}

function testGetVisibleRectForElementInsideNestedScrollableArea() {
  var container = goog.dom.getElement('test-visible2');
  var dom = goog.dom.getDomHelper(container);
  var container2 = dom.createDom('div');
  var el = dom.createDom('div', undefined, 'Test');
  el.style.position = 'absolute';
  dom.append(container, container2);
  dom.append(container2, el);

  container.style.position = 'absolute';
  goog.style.setPosition(container, 100 /* left */, 500 /* top */);
  goog.style.setSize(container, 300 /* width */, 300 /* height */);

  container2.style.overflow = 'hidden';
  container2.style.position = 'relative';
  goog.style.setPosition(container2, 100, 50);
  goog.style.setSize(container2, 150, 100);

  // Scroll body container such that container is exactly at top.
  window.scrollTo(0, 500);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(550, visibleRect.top, EPSILON);
  assertRoughlyEquals(200, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(350, visibleRect.right, EPSILON);

  // Left 50px is clipped by container.
  goog.style.setPosition(container2, -50, 50);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(550, visibleRect.top, EPSILON);
  assertRoughlyEquals(100, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(200, visibleRect.right, EPSILON);

  // Right part is clipped by container.
  goog.style.setPosition(container2, 100, 50);
  goog.style.setWidth(container2, 1000, 100);
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(550, visibleRect.top, EPSILON);
  assertRoughlyEquals(200, visibleRect.left, EPSILON);
  assertRoughlyEquals(650, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(400, visibleRect.right, EPSILON);

  // Top 50px is clipped by container.
  goog.style.setStyle(container2, 'width', '150px');
  goog.style.setStyle(container2, 'top', '-50px');
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(500, visibleRect.top, EPSILON);
  assertRoughlyEquals(200, visibleRect.left, EPSILON);
  assertRoughlyEquals(550, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(350, visibleRect.right, EPSILON);

  // Bottom part is clipped by container.
  goog.style.setStyle(container2, 'top', '50px');
  goog.style.setStyle(container2, 'height', '1000px');
  var visibleRect = goog.style.getVisibleRectForElement(el);
  assertNotNull(visibleRect);
  assertRoughlyEquals(550, visibleRect.top, EPSILON);
  assertRoughlyEquals(200, visibleRect.left, EPSILON);
  assertRoughlyEquals(800, visibleRect.bottom, EPSILON);
  assertRoughlyEquals(350, visibleRect.right, EPSILON);

  // Outside viewport.
  goog.style.setStyle(container2, 'top', '10000px');
  goog.style.setStyle(container2, 'left', '10000px');
  assertNull(goog.style.getVisibleRectForElement(el));
}

function testGeckoMacOrX11RoundPosition() {
  if ((goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.GECKO &&
      goog.userAgent.isVersion('1.9')) {

    var pos = new goog.math.Coordinate(1.5, 1.4);
    var el = document.createElement('div');
    goog.style.setPosition(el, pos);
    assertEquals('The left position should have been rounded',
                 '2px', el.style.left);
    assertEquals('The top position should have been rounded',
                 '1px', el.style.top);
  }
}

function testScrollIntoContainerViewQuirks() {
  if (goog.dom.isCss1CompatMode()) return;

  var container = goog.dom.getElement('scrollable-container');

  // Scroll the minimum amount to make the elements visible.
  goog.style.scrollIntoContainerView(goog.dom.getElement('item7'), container);
  assertEquals('scroll to item7', 79, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item8'), container);
  assertEquals('scroll to item8', 100, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item7'), container);
  assertEquals('item7 still visible', 100, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item1'), container);
  assertEquals('scroll to item1', 17, container.scrollTop);

  // Center the element in the first argument.
  goog.style.scrollIntoContainerView(goog.dom.getElement('item1'), container,
                                     true);
  assertEquals('center item1', 0, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item4'), container,
                                     true);
  assertEquals('center item4', 48, container.scrollTop);

  // The element is higher than the container.
  goog.dom.getElement('item3').style.height = '140px';
  goog.style.scrollIntoContainerView(goog.dom.getElement('item3'), container);
  assertEquals('show item3 with increased height', 59, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item3'), container,
                                                         true);
  assertEquals('center item3 with increased height', 87, container.scrollTop);
  goog.dom.getElement('item3').style.height = '';

  // Scroll to non-integer position.
  goog.dom.getElement('item4').style.height = '21px';
  goog.style.scrollIntoContainerView(goog.dom.getElement('item4'), container,
                                     true);
  assertEquals('scroll position is rounded down', 48, container.scrollTop);
  goog.dom.getElement('item4').style.height = '';
}

function testScrollIntoContainerViewStandard() {
  if (!goog.dom.isCss1CompatMode()) return;

  var container = goog.dom.getElement('scrollable-container');

  // Scroll the minimum amount to make the elements visible.
  goog.style.scrollIntoContainerView(goog.dom.getElement('item7'), container);
  assertEquals('scroll to item7', 115, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item8'), container);
  assertEquals('scroll to item8', 148, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item7'), container);
  assertEquals('item7 still visible', 148, container.scrollTop);
  goog.style.scrollIntoContainerView(goog.dom.getElement('item1'), container);
  assertEquals('scroll to item1', 17, container.scrollTop);

  // Center the element in the first argument.
  goog.style.scrollIntoContainerView(
      goog.dom.getElement('item1'), container, true);
  assertEquals('center item1', 0, container.scrollTop);
  goog.style.scrollIntoContainerView(
      goog.dom.getElement('item4'), container, true);
  assertEquals('center item4', 66, container.scrollTop);

  // The element is higher than the container.
  goog.dom.getElement('item3').style.height = '140px';
  goog.style.scrollIntoContainerView(goog.dom.getElement('item3'), container);
  assertEquals('show item3 with increased height', 83, container.scrollTop);
  goog.style.scrollIntoContainerView(
      goog.dom.getElement('item3'), container, true);
  assertEquals('center item3 with increased height', 93, container.scrollTop);
  goog.dom.getElement('item3').style.height = '';

  // Scroll to non-integer position.
  goog.dom.getElement('item4').style.height = '21px';
  goog.style.scrollIntoContainerView(
      goog.dom.getElement('item4'), container, true);
  assertEquals('scroll position is rounded down', 66, container.scrollTop);
  goog.dom.getElement('item4').style.height = '';
}

function testOffsetParent() {
  var parent = goog.dom.getElement('offset-parent');
  var child = goog.dom.getElement('offset-child');
  assertEquals(parent, goog.style.getOffsetParent(child));
}

function testOverflowOffsetParent() {
  var parent = goog.dom.getElement('offset-parent-overflow');
  var child = goog.dom.getElement('offset-child-overflow');
  assertEquals(parent, goog.style.getOffsetParent(child));
}

function testGetViewportPageOffset() {
  var testViewport = goog.dom.getElement('test-viewport');
  testViewport.style.height = '5000px';
  testViewport.style.width = '5000px';
  var offset = goog.style.getViewportPageOffset(document);
  assertEquals(0, offset.x);
  assertEquals(0, offset.y);

  window.scrollTo(0, 100);
  offset = goog.style.getViewportPageOffset(document);
  assertEquals(0, offset.x);
  assertEquals(100, offset.y);

  window.scrollTo(100, 0);
  offset = goog.style.getViewportPageOffset(document);
  assertEquals(100, offset.x);
  assertEquals(0, offset.y);
}

function testGetsTranslation() {
  var element = document.getElementById('translation');

  expectedFailures.expectFailureFor(
      goog.userAgent.IE && !goog.userAgent.product.isVersion(9),
      'CSS transforms were only introduced in IE9');

  // First check the element is actually translated, and we haven't missed
  // one of the vendor-specific transform properties
  var position = goog.style.getClientPosition(element);
  var translation = goog.style.getCssTranslation(element);
  var expectedTranslation = new goog.math.Coordinate(20, 30);

  expectedFailures.run(function() {
    assertObjectEquals(new goog.math.Coordinate(30, 40), position);
    assertObjectEquals(expectedTranslation, translation);
  });
}

/**
 * Return whether a given user agent has been detected.
 * @param {number} agent Value in UserAgents.
 * @return {boolean} Whether the user agent has been detected.
 */
function getUserAgentDetected_(agent) {
  switch (agent) {
    case UserAgents.GECKO:
      return goog.userAgent.detectedGecko_;
    case UserAgents.IE:
      return goog.userAgent.detectedIe_;
    case UserAgents.OPERA:
      return goog.userAgent.detectedOpera_;
    case UserAgents.WEBKIT:
      return goog.userAgent.detectedWebkit_;
  }
  return null;
}

/**
 * Rerun the initialization code to set all of the goog.userAgent constants.
 */
function reinitializeUserAgent() {
  goog.userAgent.init_();

  // Unfortunately we can't isolate the useragent setting in a function
  // we can call, because things rely on it compiling to nothing when
  // one of the ASSUME flags is set, and the compiler isn't smart enough
  // to do that when the setting is done inside a function that's inlined.
  goog.userAgent.OPERA = goog.userAgent.detectedOpera_;
  goog.userAgent.IE = goog.userAgent.detectedIe_;
  goog.userAgent.GECKO = goog.userAgent.detectedGecko_;
  goog.userAgent.WEBKIT = goog.userAgent.detectedWebkit_;
  goog.userAgent.MOBILE = goog.userAgent.detectedMobile_;
  goog.userAgent.SAFARI = goog.userAgent.WEBKIT;

  goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
  goog.userAgent.initPlatform_();

  goog.userAgent.VERSION = goog.userAgent.determineVersion_();
}

/**
 * Test browser detection for a user agent configuration.
 * @param {Array.<number>} expectedAgents Array of expected userAgents.
 * @param {string} uaString User agent string.
 * @param {string=} opt_product Navigator product string.
 * @param {string=} opt_vendor Navigator vendor string.
 */
function assertUserAgent(expectedAgents, uaString, opt_product, opt_vendor) {
  var mockGlobal = {
    'navigator': {
      'userAgent': uaString,
      'product': opt_product,
      'vendor': opt_vendor
    }
  };
  propertyReplacer.set(goog, 'global', mockGlobal);
  reinitializeUserAgent();
  for (var ua in UserAgents) {
    var isExpected = goog.array.contains(expectedAgents, UserAgents[ua]);
    assertEquals(isExpected, getUserAgentDetected_(UserAgents[ua]));
  }
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for Webkit.
 */
function testGetVendorStyleNameWebkit() {
  var mockElement = {
    'style': {
      'WebkitTransform': ''
    }
  };

  assertUserAgent([UserAgents.WEBKIT], 'WebKit');
  assertEquals('-webkit-transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for Webkit.
 */
function testGetVendorStyleNameWebkitNoPrefix() {
  var mockElement = {
    'style': {
      'WebkitTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.WEBKIT], 'WebKit');
  assertEquals(
      'transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for Gecko.
 */
function testGetVendorStyleNameGecko() {
  var mockElement = {
    'style': {
      'MozTransform': ''
    }
  };

  assertUserAgent([UserAgents.GECKO], 'Gecko', 'Gecko');
  assertEquals('-moz-transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for Gecko.
 */
function testGetVendorStyleNameGeckoNoPrefix() {
  var mockElement = {
    'style': {
      'MozTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.GECKO], 'Gecko', 'Gecko');
  assertEquals(
      'transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for IE.
 */
function testGetVendorStyleNameIE() {
  var mockElement = {
    'style': {
      'msTransform': ''
    }
  };

  assertUserAgent([UserAgents.IE], 'MSIE');
  assertEquals('-ms-transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for IE.
 */
function testGetVendorStyleNameIENoPrefix() {
  var mockElement = {
    'style': {
      'msTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.IE], 'MSIE');
  assertEquals(
      'transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for Opera.
 */
function testGetVendorStyleNameOpera() {
  var mockElement = {
    'style': {
      'OTransform': ''
    }
  };

  assertUserAgent([UserAgents.OPERA], 'Opera');
  assertEquals('-o-transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for Opera.
 */
function testGetVendorStyleNameOperaNoPrefix() {
  var mockElement = {
    'style': {
      'OTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.OPERA], 'Opera');
  assertEquals(
      'transform',
      goog.style.getVendorStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for Webkit.
 */
function testGetVendorJsStyleNameWebkit() {
  var mockElement = {
    'style': {
      'WebkitTransform': ''
    }
  };

  assertUserAgent([UserAgents.WEBKIT], 'WebKit');
  assertEquals('WebkitTransform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for Webkit.
 */
function testGetVendorJsStyleNameWebkitNoPrefix() {
  var mockElement = {
    'style': {
      'WebkitTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.WEBKIT], 'WebKit');
  assertEquals(
      'transform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for Gecko.
 */
function testGetVendorJsStyleNameGecko() {
  var mockElement = {
    'style': {
      'MozTransform': ''
    }
  };

  assertUserAgent([UserAgents.GECKO], 'Gecko', 'Gecko');
  assertEquals('MozTransform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for Gecko.
 */
function testGetVendorJsStyleNameGeckoNoPrefix() {
  var mockElement = {
    'style': {
      'MozTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.GECKO], 'Gecko', 'Gecko');
  assertEquals(
      'transform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for IE.
 */
function testGetVendorJsStyleNameIE() {
  var mockElement = {
    'style': {
      'msTransform': ''
    }
  };

  assertUserAgent([UserAgents.IE], 'MSIE');
  assertEquals('msTransform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for IE.
 */
function testGetVendorJsStyleNameIENoPrefix() {
  var mockElement = {
    'style': {
      'msTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.IE], 'MSIE');
  assertEquals(
      'transform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * with a vendor prefix for Opera.
 */
function testGetVendorJsStyleNameOpera() {
  var mockElement = {
    'style': {
      'OTransform': ''
    }
  };

  assertUserAgent([UserAgents.OPERA], 'Opera');
  assertEquals('OTransform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the proper vendor style name for a CSS property
 * when it exists without a vendor prefix for Opera.
 */
function testGetVendorJsStyleNameOperaNoPrefix() {
  var mockElement = {
    'style': {
      'OTransform': '',
      'transform': ''
    }
  };

  assertUserAgent([UserAgents.OPERA], 'Opera');
  assertEquals(
      'transform',
      goog.style.getVendorJsStyleName_(mockElement, 'transform'));
}

/**
 * Test for the setting a style name for a CSS property
 * with a vendor prefix for Webkit.
 */
function testSetVendorStyleWebkit() {
  var mockElement = {
    'style': {
      'WebkitTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.WEBKIT], 'WebKit');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, mockElement.style.WebkitTransform);
}

/**
 * Test for the setting a style name for a CSS property
 * with a vendor prefix for Mozilla.
 */
function testSetVendorStyleGecko() {
  var mockElement = {
    'style': {
      'MozTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.GECKO], 'Gecko', 'Gecko');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, mockElement.style.MozTransform);
}

/**
 * Test for the setting a style name for a CSS property
 * with a vendor prefix for IE.
 */
function testSetVendorStyleIE() {
  var mockElement = {
    'style': {
      'msTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.IE], 'MSIE');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, mockElement.style.msTransform);
}

/**
 * Test for the setting a style name for a CSS property
 * with a vendor prefix for Opera.
 */
function testSetVendorStyleOpera() {
  var mockElement = {
    'style': {
      'OTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.OPERA], 'Opera');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, mockElement.style.OTransform);
}

/**
 * Test for the getting a style name for a CSS property
 * with a vendor prefix for Webkit.
 */
function testGetVendorStyleWebkit() {
  var mockElement = {
    'style': {
      'WebkitTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.WEBKIT], 'WebKit');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, goog.style.getStyle(mockElement, 'transform'));
}

/**
 * Test for the getting a style name for a CSS property
 * with a vendor prefix for Mozilla.
 */
function testGetVendorStyleGecko() {
  var mockElement = {
    'style': {
      'MozTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.GECKO], 'Gecko', 'Gecko');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, goog.style.getStyle(mockElement, 'transform'));
}

/**
 * Test for the getting a style name for a CSS property
 * with a vendor prefix for IE.
 */
function testGetVendorStyleIE() {
  var mockElement = {
    'style': {
      'msTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.IE], 'MSIE');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, goog.style.getStyle(mockElement, 'transform'));
}

/**
 * Test for the getting a style name for a CSS property
 * with a vendor prefix for Opera.
 */
function testGetVendorStyleOpera() {
  var mockElement = {
    'style': {
      'OTransform': ''
    }
  };
  var styleValue = 'translate3d(0,0,0)';

  assertUserAgent([UserAgents.OPERA], 'Opera');
  goog.style.setStyle(mockElement, 'transform', styleValue);
  assertEquals(styleValue, goog.style.getStyle(mockElement, 'transform'));
}

function isIE8() {
  return goog.userAgent.IE && goog.userAgent.isDocumentMode(8) &&
      !goog.userAgent.isDocumentMode(9);
}
