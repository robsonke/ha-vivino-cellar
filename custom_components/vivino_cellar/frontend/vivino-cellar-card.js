var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e4, o5) {
    if (this._$cssResult$ = true, o5 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e4;
  }
  get styleSheet() {
    let t3 = this.o;
    const s4 = this.t;
    if (e && void 0 === t3) {
      const e4 = void 0 !== s4 && 1 === s4.length;
      e4 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s4, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var i = (t3, ...e4) => {
  const o5 = 1 === t3.length ? t3[0] : e4.reduce((e5, s4, o6) => e5 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t3[o6 + 1], t3[0]);
  return new n(o5, t3, s);
};
var S = (s4, o5) => {
  if (e) s4.adoptedStyleSheets = o5.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const e4 of o5) {
    const o6 = document.createElement("style"), n4 = t.litNonce;
    void 0 !== n4 && o6.setAttribute("nonce", n4), o6.textContent = e4.cssText, s4.appendChild(o6);
  }
};
var c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e4 = "";
  for (const s4 of t4.cssRules) e4 += s4.cssText;
  return r(e4);
})(t3) : t3;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t3, s4) => t3;
var u = { toAttribute(t3, s4) {
  switch (s4) {
    case Boolean:
      t3 = t3 ? l : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s4) {
  let i5 = t3;
  switch (s4) {
    case Boolean:
      i5 = null !== t3;
      break;
    case Number:
      i5 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t3);
      } catch (t4) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t3, s4) => !i2(t3, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ??= Symbol("metadata"), a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y = class extends HTMLElement {
  static addInitializer(t3) {
    this._$Ei(), (this.l ??= []).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
      const i5 = Symbol(), h3 = this.getPropertyDescriptor(t3, i5, s4);
      void 0 !== h3 && e2(this.prototype, t3, h3);
    }
  }
  static getPropertyDescriptor(t3, s4, i5) {
    const { get: e4, set: r4 } = h(this.prototype, t3) ?? { get() {
      return this[s4];
    }, set(t4) {
      this[s4] = t4;
    } };
    return { get: e4, set(s5) {
      const h3 = e4?.call(this);
      r4?.call(this, s5), this.requestUpdate(t3, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t3 = n2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t4 = this.properties, s4 = [...r2(t4), ...o2(t4)];
      for (const i5 of s4) this.createProperty(i5, t4[i5]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s4 = litPropertyMetadata.get(t3);
      if (void 0 !== s4) for (const [t4, i5] of s4) this.elementProperties.set(t4, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s4] of this.elementProperties) {
      const i5 = this._$Eu(t4, s4);
      void 0 !== i5 && this._$Eh.set(i5, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e4 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e4) i5.unshift(c(s5));
    } else void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t3, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s4, i5) {
    this._$AK(t3, i5);
  }
  _$ET(t3, s4) {
    const i5 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i5);
    if (void 0 !== e4 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t3, null == h3 ? this.removeAttribute(e4) : this.setAttribute(e4, h3), this._$Em = null;
    }
  }
  _$AK(t3, s4) {
    const i5 = this.constructor, e4 = i5._$Eh.get(t3);
    if (void 0 !== e4 && this._$Em !== e4) {
      const t4 = i5.getPropertyOptions(e4), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
      this._$Em = e4;
      const r4 = h3.fromAttribute(s4, t4.type);
      this[e4] = r4 ?? this._$Ej?.get(e4) ?? r4, this._$Em = null;
    }
  }
  requestUpdate(t3, s4, i5, e4 = false, h3) {
    if (void 0 !== t3) {
      const r4 = this.constructor;
      if (false === e4 && (h3 = this[t3]), i5 ??= r4.getPropertyOptions(t3), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r4._$Eu(t3, i5)))) return;
      this.C(t3, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t3, s4, { useDefault: i5, reflect: e4, wrapped: h3 }, r4) {
    i5 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t3) && (this._$Ej.set(t3, r4 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r4) || (this._$AL.has(t3) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t3, s4)), true === e4 && this._$Em !== t3 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t3));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t5, s5] of this._$Ep) this[t5] = s5;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s5, i5] of t4) {
        const { wrapped: t5 } = i5, e4 = this[s5];
        true !== t5 || this._$AL.has(s5) || void 0 === e4 || this.C(s5, void 0, i5, e4);
      }
    }
    let t3 = false;
    const s4 = this._$AL;
    try {
      t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t3 = false, this._$EM(), s5;
    }
    t3 && this._$AE(s4);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Eq &&= this._$Eq.forEach((t4) => this._$ET(t4, this[t4])), this._$EM();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ??= []).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t3) => t3;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var u2 = Array.isArray;
var d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t3) => (i5, ...s4) => ({ _$litType$: t3, strings: i5, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t3, i5) {
  if (!u2(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
var N = (t3, i5) => {
  const s4 = t3.length - 1, e4 = [];
  let n4, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t3[i6];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n4 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n4 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n4 = void 0);
    const x2 = c4 === p2 && t3[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e4.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
  }
  return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e4];
};
var S2 = class _S {
  constructor({ strings: t3, _$litType$: i5 }, e4) {
    let r4;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i5);
    if (this.el = _S.createElement(f3, e4), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (r4 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r4.nodeType) {
        if (r4.hasAttributes()) for (const t4 of r4.getAttributeNames()) if (t4.endsWith(h2)) {
          const i6 = v2[a3++], s4 = r4.getAttribute(t4).split(o3), e5 = /([.?@])?(.*)/.exec(i6);
          d3.push({ type: 1, index: l3, name: e5[2], strings: s4, ctor: "." === e5[1] ? I : "?" === e5[1] ? L : "@" === e5[1] ? z : H }), r4.removeAttribute(t4);
        } else t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r4.removeAttribute(t4));
        if (y2.test(r4.tagName)) {
          const t4 = r4.textContent.split(o3), i6 = t4.length - 1;
          if (i6 > 0) {
            r4.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i6; s4++) r4.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r4.append(t4[i6], c3());
          }
        }
      } else if (8 === r4.nodeType) if (r4.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = r4.data.indexOf(o3, t4 + 1)); ) d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t3, i5) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t3, s4;
  }
};
function M(t3, i5, s4 = t3, e4) {
  if (i5 === E) return i5;
  let h3 = void 0 !== e4 ? s4._$Co?.[e4] : s4._$Cl;
  const o5 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o5 && (h3?._$AO?.(false), void 0 === o5 ? h3 = void 0 : (h3 = new o5(t3), h3._$AT(t3, s4, e4)), void 0 !== e4 ? (s4._$Co ??= [])[e4] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t3, h3._$AS(t3, i5.values), h3, e4)), i5;
}
var R = class {
  constructor(t3, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e4 = (t3?.creationScope ?? l2).importNode(i5, true);
    P.currentNode = e4;
    let h3 = P.nextNode(), o5 = 0, n4 = 0, r4 = s4[0];
    for (; void 0 !== r4; ) {
      if (o5 === r4.index) {
        let i6;
        2 === r4.type ? i6 = new k(h3, h3.nextSibling, this, t3) : 1 === r4.type ? i6 = new r4.ctor(h3, r4.name, r4.strings, this, t3) : 6 === r4.type && (i6 = new Z(h3, this, t3)), this._$AV.push(i6), r4 = s4[++n4];
      }
      o5 !== r4?.index && (h3 = P.nextNode(), o5++);
    }
    return P.currentNode = l2, e4;
  }
  p(t3) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t3[i5])), i5++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t3, i5, s4, e4) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s4, this.options = e4, this._$Cv = e4?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i5 = this) {
    t3 = M(this, t3, i5), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i5, _$litType$: s4 } = t3, e4 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e4) this._$AH.p(i5);
    else {
      const t4 = new R(e4, this), s5 = t4.u(this.options);
      t4.p(i5), this.T(s5), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i5 = C.get(t3.strings);
    return void 0 === i5 && C.set(t3.strings, i5 = new S2(t3)), i5;
  }
  k(t3) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e4 = 0;
    for (const h3 of t3) e4 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e4], s4._$AI(h3), e4++;
    e4 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e4), i5.length = e4);
  }
  _$AR(t3 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
      const s5 = i3(t3).nextSibling;
      i3(t3).remove(), t3 = s5;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i5, s4, e4, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e4, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t3, i5 = this, s4, e4) {
    const h3 = this.strings;
    let o5 = false;
    if (void 0 === h3) t3 = M(this, t3, i5, 0), o5 = !a2(t3) || t3 !== this._$AH && t3 !== E, o5 && (this._$AH = t3);
    else {
      const e5 = t3;
      let n4, r4;
      for (t3 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = M(this, e5[s4 + n4], i5, n4), r4 === E && (r4 = this._$AH[n4]), o5 ||= !a2(r4) || r4 !== this._$AH[n4], r4 === A ? t3 = A : t3 !== A && (t3 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
    }
    o5 && !e4 && this.j(t3);
  }
  j(t3) {
    t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === A ? void 0 : t3;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
  }
};
var z = class extends H {
  constructor(t3, i5, s4, e4, h3) {
    super(t3, i5, s4, e4, h3), this.type = 5;
  }
  _$AI(t3, i5 = this) {
    if ((t3 = M(this, t3, i5, 0) ?? A) === E) return;
    const s4 = this._$AH, e4 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e4);
    e4 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var Z = class {
  constructor(t3, i5, s4) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    M(this, t3);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.3");
var D = (t3, i5, s4) => {
  const e4 = s4?.renderBefore ?? i5;
  let h3 = e4._$litPart$;
  if (void 0 === h3) {
    const t4 = s4?.renderBefore ?? null;
    e4._$litPart$ = h3 = new k(i5.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
  }
  return h3._$AI(t3), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t3 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t3.firstChild, t3;
  }
  update(t3) {
    const r4 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r4, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ??= []).push("4.2.2");

// custom_components/vivino_cellar/frontend/src/logic/status.js
var STATUS_ORDER = ["near_past_peak", "ready", "can_wait", "hold", "past_peak", "unknown"];
var STATUS_LABELS = {
  near_past_peak: "Binnenkort drinken",
  ready: "Op dronk",
  can_wait: "Kan nog liggen",
  hold: "Nog wegleggen",
  past_peak: "Voorbij piek",
  unknown: "Venster onbekend"
};
var WINE_TYPES = {
  1: "Rood",
  2: "Wit",
  3: "Mousserend",
  4: "Ros\xE9",
  7: "Dessert",
  24: "Versterkt"
};
function reasonLine(wine, year) {
  const end = wine.end_year;
  switch (wine.window_status) {
    case "near_past_peak":
      return `Laatste jaar: drink in ${end ?? year}`;
    case "ready":
      return end ? `Op dronk tot ${end}` : "Op dronk";
    case "can_wait":
      return end ? `Kan nog liggen tot ${end}, mag ook nu` : "Kan nog liggen, mag ook nu";
    case "past_peak":
      return end ? `Voorbij de piek sinds ${end}: snel open` : "Voorbij de piek: snel open";
    case "hold":
      return wine.start_year ? `Nog wegleggen tot ${wine.start_year}` : "Nog wegleggen";
    default:
      return "Drinkvenster onbekend";
  }
}

// custom_components/vivino_cellar/frontend/src/logic/filters.js
var EMPTY_FILTERS = {
  type: "",
  country: "",
  region: "",
  grape: "",
  minBottles: 0,
  sort: "status"
};
function matchesFilters(wine, filters, statusFilter, query, skip = []) {
  const bottles = wine.bottles || [];
  if (bottles.length === 0) return false;
  if (bottles.length < (filters.minBottles || 0)) return false;
  const q = (query || "").toLowerCase();
  if (q && ![wine.name, wine.winery, wine.region, ...wine.grapes || []].some(
    (v2) => (v2 || "").toLowerCase().includes(q)
  ))
    return false;
  if (!skip.includes("type") && filters.type && String(wine.type_id) !== filters.type) return false;
  if (!skip.includes("country") && filters.country && wine.country !== filters.country) return false;
  if (!skip.includes("region") && filters.region && wine.region !== filters.region) return false;
  if (!skip.includes("grape") && filters.grape && !(wine.grapes || []).includes(filters.grape))
    return false;
  if (!skip.includes("status") && statusFilter && (wine.window_status || "unknown") !== statusFilter)
    return false;
  return true;
}
function filterOptions(wines, key, valuesOf, labelOf, ctx, alsoSkip = []) {
  const counts = /* @__PURE__ */ new Map();
  for (const wine of wines || []) {
    if (!matchesFilters(wine, ctx.filters, ctx.statusFilter, ctx.query, [key, ...alsoSkip])) continue;
    for (const v2 of valuesOf(wine)) {
      if (v2 === null || v2 === void 0 || v2 === "") continue;
      counts.set(String(v2), (counts.get(String(v2)) || 0) + wine.bottles.length);
    }
  }
  const selected = ctx.filters[key];
  if (selected && !counts.has(selected)) counts.set(selected, 0);
  return [...counts.entries()].map(([value, n4]) => ({ value, label: labelOf(value), n: n4 })).sort((a3, b3) => a3.label.localeCompare(b3.label, "nl"));
}
var byName = (a3, b3) => (a3.name || "").localeCompare(b3.name || "", "nl");
var nullsLast = (v2) => v2 === null || v2 === void 0 ? Infinity : v2;
var SORTERS = {
  drink_by: (a3, b3) => nullsLast(a3.end_year) - nullsLast(b3.end_year),
  rating: (a3, b3) => (b3.rating ?? -Infinity) - (a3.rating ?? -Infinity),
  vintage: (a3, b3) => nullsLast(a3.year) - nullsLast(b3.year),
  bottles: (a3, b3) => (b3.bottles || []).length - (a3.bottles || []).length,
  name: byName
};
function sortWines(wines, sort) {
  const by = SORTERS[sort];
  return [...wines].sort((a3, b3) => (by ? by(a3, b3) : 0) || byName(a3, b3));
}
function statusCounts(wines, ctx) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s4) => [s4, 0]));
  for (const wine of wines || []) {
    if (!matchesFilters(wine, ctx.filters, ctx.statusFilter, ctx.query, ["status"])) continue;
    const st = wine.window_status || "unknown";
    counts[st] = (counts[st] || 0) + wine.bottles.length;
  }
  return counts;
}

// custom_components/vivino_cellar/frontend/src/logic/util.js
function safeUrl(url) {
  if (!url) return null;
  const full = String(url).startsWith("//") ? `https:${url}` : String(url);
  return /^https?:\/\//i.test(full) ? full : null;
}
function bottleId(bottle) {
  return bottle.bottle_id ?? bottle.id;
}
function vintageId(wine) {
  return wine.vintage_id ?? wine.id;
}
function bottleSpots(bottles) {
  const spots = /* @__PURE__ */ new Map();
  for (const b3 of bottles || []) {
    const location = b3.location_name || "Kelder";
    const bin = b3.bin || null;
    const key = JSON.stringify([location, bin]);
    if (!spots.has(key)) spots.set(key, { location, bin, bottles: [] });
    spots.get(key).bottles.push(b3);
  }
  return [...spots.values()];
}
function formatRating(value) {
  return typeof value === "number" ? value.toFixed(1).replace(".", ",") : "";
}
function viewWines(wines, pendingIds) {
  return (wines || []).map((wine) => {
    const bottles = (wine.bottles || []).filter((b3) => !pendingIds.has(bottleId(b3)));
    return { ...wine, bottles, bottle_count: bottles.length };
  });
}

// custom_components/vivino_cellar/frontend/src/logic/cellar-lines.js
var MAX_SPOTS = 2;
function cellarLines(wine) {
  const status = wine.window_status || "unknown";
  const when = status === "hold" && wine.start_year ? `vanaf ${wine.start_year}` : wine.end_year ? `tot ${wine.end_year}` : "";
  const rating = typeof wine.rating === "number" ? `\u2605 ${formatRating(wine.rating)}` : "";
  const first = [STATUS_LABELS[status] || status, when, rating].filter(Boolean).join(" \xB7 ");
  const spots = bottleSpots(wine.bottles).map(
    (s4) => `${s4.location}${s4.bin ? ` \xB7 vak ${s4.bin}` : ""} \xB7 ${s4.bottles.length}\xD7`
  );
  const extra = spots.length - MAX_SPOTS;
  const second = spots.slice(0, MAX_SPOTS).join(" \xB7 ") + (extra > 0 ? ` \xB7 +${extra}` : "");
  return [first, second];
}

// custom_components/vivino_cellar/frontend/src/logic/colors.js
var STATUS_COLORS = {
  light: {
    near_past_peak: "#8e5500",
    ready: "#29702d",
    can_wait: "#006f62",
    hold: "#1461b8",
    past_peak: "#ba2626",
    unknown: "#626262"
  },
  dark: {
    near_past_peak: "#ffb74d",
    ready: "#81c784",
    can_wait: "#5bbcb3",
    hold: "#64b5f6",
    past_peak: "#f5918f",
    unknown: "#aeaeae"
  }
};
var TINT = { light: 0.12, dark: 0.18 };
var TOAST_ERROR_BG = "#c62828";

// custom_components/vivino_cellar/frontend/src/styles/theme.js
var statusVars = (theme) => r(
  Object.entries(STATUS_COLORS[theme]).map(([status, color]) => `--vc-status-${status}: ${color};`).join("\n")
);
var tokenStyles = i`
  :host {
    --vc-gap: 12px;
    --vc-radius: var(--ha-card-border-radius, 12px);
    --vc-radius-sm: 8px;
    --vc-control-height: 40px;
    --vc-button-height: 36px;
    --vc-font: var(--ha-font-family-body, Roboto, system-ui, sans-serif);
    --vc-text: var(--primary-text-color, #212121);
    --vc-muted: var(--secondary-text-color, #727272);
    --vc-divider: var(--divider-color, rgba(0, 0, 0, 0.12));
    --vc-surface: var(--card-background-color, var(--ha-card-background, #fff));
    --vc-surface-2: var(--secondary-background-color, #f5f5f5);
    --vc-accent: var(--primary-color, #03a9f4);
    --vc-on-accent: var(--text-primary-color, #fff);
    --vc-tint: ${r(TINT.light * 100)}%;

    /* Status colours, light theme */
    ${statusVars("light")}
    --vc-toast-error: ${r(TOAST_ERROR_BG)};
    --vc-star: #f5a623;

  }

  /* Status colours, dark theme (set by the root from hass.themes.darkMode) */
  :host([dark]) {
    ${statusVars("dark")}
    --vc-tint: ${r(TINT.dark * 100)}%;
  }

`;
var themeStyles = i`
  :host {
    font-family: var(--vc-font, Roboto, sans-serif);
    color: var(--vc-text, inherit);
  }

  .s-near_past_peak { --vc-edge: var(--vc-status-near_past_peak); }
  .s-ready { --vc-edge: var(--vc-status-ready); }
  .s-can_wait { --vc-edge: var(--vc-status-can_wait); }
  .s-hold { --vc-edge: var(--vc-status-hold); }
  .s-past_peak { --vc-edge: var(--vc-status-past_peak); }
  .s-unknown { --vc-edge: var(--vc-status-unknown); }

  * { box-sizing: border-box; }

  button, input, select, textarea { font: inherit; color: inherit; }

  :focus-visible {
    outline: 2px solid var(--vc-accent);
    outline-offset: 2px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: var(--vc-button-height);
    padding: 0 16px;
    border-radius: 999px;
    border: 1px solid var(--vc-divider);
    background: transparent;
    color: var(--vc-text);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
  }
  .btn[disabled] { opacity: 0.45; cursor: default; }
  .btn-primary { background: var(--vc-accent); border-color: var(--vc-accent); color: var(--vc-on-accent); }
  .btn-link { border: none; background: none; padding: 0; height: auto; color: var(--vc-accent); text-decoration: underline; }
  .btn ha-icon { --mdc-icon-size: 18px; }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--vc-muted);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: none;
  }
  .icon-btn:hover { background: var(--vc-surface-2); }

  .input, .select {
    height: var(--vc-control-height);
    width: 100%;
    min-width: 0;
    padding: 0 12px;
    border-radius: var(--vc-radius-sm);
    border: 1px solid var(--vc-divider);
    background: var(--vc-surface);
    color: var(--vc-text);
    font-size: 14px;
  }
  .select { cursor: pointer; }
  .select.active { border-color: var(--vc-accent); color: var(--vc-accent); }
  textarea.input { height: auto; padding: 10px 12px; resize: vertical; }

  .chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: var(--vc-button-height);
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--vc-divider);
    background: var(--vc-surface);
    color: var(--vc-text);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .chip[aria-pressed="true"] {
    border-color: var(--vc-accent);
    color: var(--vc-accent);
    background: color-mix(in srgb, var(--vc-accent) var(--vc-tint), transparent);
    font-weight: 600;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 999px;
    color: var(--vc-edge, var(--vc-muted));
    background: color-mix(in srgb, var(--vc-edge, var(--vc-muted)) var(--vc-tint), transparent);
  }
  .badge ha-icon { --mdc-icon-size: 14px; }

  .muted { color: var(--vc-muted); }
  .section-label {
    font-size: 11px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--vc-muted);
    margin: 4px 4px 6px;
  }
  .empty { padding: 24px 8px; text-align: center; color: var(--vc-muted); }

  .bottle-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vc-surface-2);
    color: var(--vc-muted);
    border-radius: var(--vc-radius-sm);
  }
`;

// custom_components/vivino_cellar/frontend/src/components/events.js
function fire(el, type, detail = {}) {
  el.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

// custom_components/vivino_cellar/frontend/src/components/wine-row.js
var VcWineRow = class extends i4 {
  constructor() {
    super();
    this.lines = [];
  }
  _open() {
    fire(this, "vc-open", { vintageId: vintageId(this.wine) });
  }
  _key(e4) {
    if (e4.target !== e4.currentTarget) return;
    if (e4.key === "Enter" || e4.key === " ") {
      e4.preventDefault();
      this._open();
    }
  }
  _drink(e4) {
    e4.stopPropagation();
    fire(this, "vc-drink", { vintageId: vintageId(this.wine) });
  }
  render() {
    const w2 = this.wine;
    if (!w2) return A;
    const name = w2.name || "Onbekende wijn";
    const image = safeUrl(w2.image_url);
    const status = w2.window_status || "unknown";
    return b2`
      <div
        class="row s-${status}"
        role="button"
        tabindex="0"
        aria-label="Details: ${name}"
        @click=${this._open}
        @keydown=${this._key}
      >
        ${image ? b2`<img class="thumb" src=${image} alt="" loading="lazy" @error=${(e4) => e4.target.style.visibility = "hidden"} />` : b2`<div class="thumb bottle-placeholder"><ha-icon icon="mdi:bottle-wine"></ha-icon></div>`}
        <div class="text">
          <div class="name">${name}${w2.year ? b2` <span class="year">${w2.year}</span>` : A}</div>
          ${(this.lines || []).filter(Boolean).map((l3) => b2`<div class="line">${l3}</div>`)}
        </div>
        <button
          class="icon-btn glass"
          title="Ontkurken"
          aria-label="Ontkurken: ${name}"
          ?disabled=${!(w2.bottles || []).length}
          @click=${this._drink}
        >
          <ha-icon icon="mdi:glass-wine"></ha-icon>
        </button>
      </div>
    `;
  }
};
__publicField(VcWineRow, "properties", {
  wine: { attribute: false },
  lines: { attribute: false }
  // [string, string?]
});
__publicField(VcWineRow, "styles", [
  themeStyles,
  i`
      :host { display: block; }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 6px 8px 10px;
        border-radius: var(--vc-radius-sm);
        border: 1px solid var(--vc-divider);
        border-left: 4px solid var(--vc-edge);
        background: var(--vc-surface);
        cursor: pointer;
      }
      .row:hover { background: color-mix(in srgb, var(--vc-surface-2) 60%, var(--vc-surface)); }
      .thumb {
        width: 32px;
        height: 54px;
        flex: none;
        object-fit: contain;
        border-radius: 6px;
      }
      .thumb.bottle-placeholder ha-icon { --mdc-icon-size: 18px; }
      .text { flex: 1; min-width: 0; }
      .name {
        font-size: 14.5px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .year { font-weight: 400; color: var(--vc-muted); }
      .line {
        font-size: 12.5px;
        color: var(--vc-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .glass { color: var(--vc-accent); border: 1px solid var(--vc-divider); }
      .glass[disabled] { opacity: 0.35; cursor: default; }
    `
]);
if (!customElements.get("vc-wine-row")) customElements.define("vc-wine-row", VcWineRow);

// custom_components/vivino_cellar/frontend/src/components/cellar-tab.js
var SORTS = {
  status: "Drinkvenster",
  drink_by: "Drinken voor",
  rating: "Beoordeling",
  vintage: "Jaargang (oud eerst)",
  bottles: "Aantal flessen",
  name: "Naam"
};
var MIN_BOTTLES = [0, 2, 3, 6];
var VcCellarTab = class extends i4 {
  constructor() {
    super();
    this.filters = { ...EMPTY_FILTERS };
    this.expanded = {};
    this.query = "";
  }
  get _ctx() {
    return { filters: this.filters, statusFilter: this.statusFilter || null, query: this.query || "" };
  }
  _set(key, value) {
    const filters = { ...this.filters, [key]: key === "minBottles" ? Number(value) : value };
    if (key === "country") filters.region = "";
    fire(this, "vc-filters", { filters });
  }
  _active() {
    const f3 = this.filters;
    return Boolean(this.statusFilter || this.query || f3.type || f3.country || f3.region || f3.grape || f3.minBottles);
  }
  _select(key, allLabel, options) {
    const current = this.filters[key];
    return b2`
      <select class="select ${current ? "active" : ""}" aria-label=${allLabel} @change=${(e4) => this._set(key, e4.target.value)}>
        <option value="" ?selected=${!current}>${allLabel}</option>
        ${options.map((o5) => b2`<option value=${o5.value} ?selected=${o5.value === current}>${o5.label} (${o5.n})</option>`)}
      </select>
    `;
  }
  _row(w2) {
    return b2`<vc-wine-row .wine=${w2} .lines=${cellarLines(w2)} data-id=${vintageId(w2)}></vc-wine-row>`;
  }
  render() {
    const all = this.wines || [];
    const ctx = this._ctx;
    const f3 = this.filters;
    const wines = all.filter((w2) => matchesFilters(w2, f3, ctx.statusFilter, ctx.query));
    const bottles = wines.reduce((n4, w2) => n4 + w2.bottles.length, 0);
    const counts = statusCounts(all, ctx);
    const typeOpts = filterOptions(all, "type", (w2) => [w2.type_id], (v2) => WINE_TYPES[v2] || `Type ${v2}`, ctx);
    const countryOpts = filterOptions(all, "country", (w2) => [w2.country], (v2) => v2, ctx, ["region"]);
    const regionOpts = filterOptions(all, "region", (w2) => [w2.region], (v2) => v2, ctx);
    const grapeOpts = filterOptions(all, "grape", (w2) => w2.grapes || [], (v2) => v2, ctx);
    let list;
    if (f3.sort === "status") {
      list = STATUS_ORDER.map((status) => {
        if (ctx.statusFilter && status !== ctx.statusFilter) return A;
        const group = sortWines(wines.filter((w2) => (w2.window_status || "unknown") === status), "drink_by");
        if (!group.length) return A;
        const open = ctx.statusFilter === status || Boolean(this.expanded[status]);
        const n4 = group.reduce((s4, w2) => s4 + w2.bottles.length, 0);
        return b2`
          <section class="group s-${status}">
            <button class="group-head" aria-expanded=${open} @click=${() => fire(this, "vc-toggle-group", { status })}>
              <span class="badge">${STATUS_LABELS[status]}</span>
              <span class="muted">${n4} ${n4 === 1 ? "fles" : "flessen"}</span>
              <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
            </button>
            ${open ? b2`<div class="list">${group.map((w2) => this._row(w2))}</div>` : A}
          </section>
        `;
      });
    } else {
      list = b2`<div class="list">${sortWines(wines, f3.sort).map((w2) => this._row(w2))}</div>`;
    }
    return b2`
      <input
        class="input search"
        type="search"
        placeholder="Zoek op wijn, wijnhuis, regio of druif…"
        .value=${this.query || ""}
        @input=${(e4) => fire(this, "vc-filters", { query: e4.target.value })}
      />

      <div class="pills ${ctx.statusFilter ? "filtering" : ""}">
        ${STATUS_ORDER.map((status) => {
      const active = ctx.statusFilter === status;
      const n4 = counts[status] || 0;
      return b2`<button
            class="pill s-${status} ${active ? "active" : ""}"
            aria-pressed=${active}
            ?disabled=${n4 === 0 && !active}
            @click=${() => fire(this, "vc-filters", { statusFilter: active ? null : status })}
          >
            ${STATUS_LABELS[status]}: ${n4}
          </button>`;
    })}
      </div>

      <div class="selects">
        ${this._select("type", "Alle soorten", typeOpts)}
        ${this._select("country", "Alle landen", countryOpts)}
        ${this._select("region", "Alle regio's", regionOpts)}
        ${this._select("grape", "Alle druiven", grapeOpts)}
        <select class="select ${f3.minBottles ? "active" : ""}" aria-label="Aantal flessen" @change=${(e4) => this._set("minBottles", e4.target.value)}>
          ${MIN_BOTTLES.map((n4) => b2`<option value=${n4} ?selected=${n4 === f3.minBottles}>${n4 ? `${n4}+ flessen` : "Elk aantal"}</option>`)}
        </select>
        <select class="select sort" aria-label="Sorteren" @change=${(e4) => this._set("sort", e4.target.value)}>
          ${Object.entries(SORTS).map(([k2, label]) => b2`<option value=${k2} ?selected=${k2 === f3.sort}>Sorteer: ${label}</option>`)}
        </select>
      </div>

      <div class="result">
        <span>${wines.length} ${wines.length === 1 ? "wijn" : "wijnen"} · ${bottles} ${bottles === 1 ? "fles" : "flessen"}</span>
        ${this._active() ? b2`<button
              class="btn btn-link"
              @click=${() => fire(this, "vc-filters", { filters: { ...EMPTY_FILTERS, sort: f3.sort }, statusFilter: null, query: "" })}
            >
              Wis filters
            </button>` : A}
      </div>

      ${wines.length ? list : b2`<div class="empty">Geen wijnen voor deze filters.</div>`}
    `;
  }
};
__publicField(VcCellarTab, "properties", {
  wines: { attribute: false },
  filters: { attribute: false },
  statusFilter: { type: String },
  query: { type: String },
  expanded: { attribute: false }
});
__publicField(VcCellarTab, "styles", [
  themeStyles,
  i`
      :host { display: flex; flex-direction: column; gap: 12px; }
      .search { -webkit-appearance: none; }
      .pills { display: flex; flex-wrap: wrap; gap: 6px; }
      .pill {
        height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1.5px solid transparent;
        font-size: 13px;
        cursor: pointer;
        color: var(--vc-edge);
        background: color-mix(in srgb, var(--vc-edge) var(--vc-tint), transparent);
        transition: opacity 0.15s ease;
      }
      .pill.active { border-color: var(--vc-edge); font-weight: 600; }
      .pill[disabled] { opacity: 0.4; cursor: default; }
      .pills.filtering .pill:not(.active) { opacity: 0.45; }
      .selects {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 8px;
      }
      .selects .sort { grid-column: 1 / -1; }
      .result {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        color: var(--vc-muted);
      }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .group { display: flex; flex-direction: column; gap: 8px; }
      .group-head {
        display: flex;
        align-items: center;
        gap: 10px;
        height: var(--vc-control-height);
        padding: 0 8px;
        border: none;
        border-radius: var(--vc-radius-sm);
        background: var(--vc-surface-2);
        cursor: pointer;
        font-size: 13px;
      }
      .group-head .chev { margin-left: auto; --mdc-icon-size: 20px; color: var(--vc-muted); transition: transform 0.2s; }
      .group-head[aria-expanded="true"] .chev { transform: rotate(180deg); }
    `
]);
if (!customElements.get("vc-cellar-tab")) customElements.define("vc-cellar-tab", VcCellarTab);

// custom_components/vivino_cellar/frontend/src/components/modal.js
var VcModal = class extends i4 {
  updated() {
    const dialog = this.renderRoot.querySelector("dialog");
    if (!dialog || dialog.open) return;
    if (this._shown) {
      fire(this, "vc-close");
      return;
    }
    this._shown = true;
    try {
      dialog.showModal();
      dialog.querySelector("[autofocus]")?.focus();
    } catch {
      dialog.setAttribute("open", "");
    }
  }
  /**
   * Esc, Android back, or the browser closing the dialog itself: tell the
   * root, so its state matches and the next render does not reopen it.
   */
  _cancel(e4) {
    e4.preventDefault();
    fire(this, "vc-close");
  }
  _closed() {
    fire(this, "vc-close");
  }
  _backdrop(e4) {
    if (e4.target === e4.currentTarget) fire(this, "vc-close");
  }
};
__publicField(VcModal, "modalStyles", i`
    dialog {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 16px;
      border: none;
      background: transparent;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    dialog:not([open]) { display: none; }
    dialog::backdrop { background: rgba(0, 0, 0, 0.5); }
    .sheet {
      width: 100%;
      max-width: 520px;
      max-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 16px;
      background: var(--vc-surface);
      color: var(--vc-text);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    .body { overflow-y: auto; padding: 16px; }
    .foot {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--vc-divider);
      background: var(--vc-surface-2);
    }
  `);

// custom_components/vivino_cellar/frontend/src/components/detail-sheet.js
var SOURCES = { vivino: "volgens Vivino", ai_estimate: "AI-schatting" };
var VcDetailSheet = class extends VcModal {
  willUpdate(changed) {
    if (!changed.has("draft") || !this.draft) return;
    const prev = changed.get("draft");
    const fresh = !prev || prev.vid !== this.draft.vid || prev.status === "loading" && this.draft.status !== "loading";
    if (fresh) {
      this._rating = this.draft.rating ?? null;
      this._note = this.draft.note ?? "";
    }
  }
  get _changed() {
    if (this._rating === null || this._rating === void 0) return false;
    const s4 = this.saved;
    return !s4 || s4.rating !== this._rating || (s4.note || "") !== (this._note || "");
  }
  _save() {
    if (!this._changed || this.draft?.status === "saving") return;
    fire(this, "vc-rate", { vintageId: vintageId(this.wine), rating: this._rating, note: this._note || "" });
  }
  _stars() {
    const value = this._rating ?? 0;
    return [1, 2, 3, 4, 5].map((n4) => {
      const icon = value >= n4 ? "mdi:star" : value >= n4 - 0.5 ? "mdi:star-half-full" : "mdi:star-outline";
      const label = (v2) => `${String(v2).replace(".", ",")} ${v2 === 1 ? "ster" : "sterren"}`;
      return b2`
        <span class="star ${value >= n4 - 0.5 ? "on" : ""}">
          <ha-icon icon=${icon}></ha-icon>
          <button class="half left" aria-label=${label(n4 - 0.5)} ?disabled=${n4 === 1}
            @click=${() => this._rating = n4 - 0.5}></button>
          <button class="half right" aria-label=${label(n4)} @click=${() => this._rating = n4}></button>
        </span>
      `;
    });
  }
  _ratingSection() {
    const d3 = this.draft;
    if (!d3) return A;
    if (d3.status === "loading") {
      return b2`<section class="rating"><h4>Jouw beoordeling</h4><div class="muted">Laden…</div></section>`;
    }
    const status = d3.status === "saving" ? b2`<span class="muted">Opslaan…</span>` : d3.status === "error" ? b2`<span class="err">${d3.error || "Mislukt"}</span>` : d3.status === "saved" && !this._changed ? b2`<span class="ok">Opgeslagen op Vivino</span>` : this.saved ? A : b2`<span class="muted">Nog niet beoordeeld</span>`;
    return b2`
      <section class="rating">
        <h4>Jouw beoordeling</h4>
        <div class="stars" role="group" aria-label="Kies een beoordeling">
          ${this._stars()}
          <span class="value">${this._rating ? formatRating(this._rating) : "\u2013"}</span>
        </div>
        <textarea
          class="input"
          id="rating-note"
          rows="2"
          placeholder="Notitie (optioneel)"
          .value=${this._note ?? ""}
          @input=${(e4) => this._note = e4.target.value}
        ></textarea>
        <div class="actions">
          ${status}
          <button class="btn btn-primary save" ?disabled=${!this._changed || d3.status === "saving"} @click=${this._save}>
            Opslaan
          </button>
        </div>
      </section>
    `;
  }
  render() {
    const w2 = this.wine;
    if (!w2) return A;
    const name = w2.name || "Onbekende wijn";
    const status = w2.window_status || "unknown";
    const image = safeUrl(w2.image_url);
    const link = safeUrl(w2.vivino_url);
    const window2 = w2.start_year && w2.end_year ? `${w2.start_year} \u2013 ${w2.end_year}` : w2.start_year ? `vanaf ${w2.start_year}` : w2.end_year ? `tot ${w2.end_year}` : "onbekend";
    const source = SOURCES[w2.window_source];
    const type = [WINE_TYPES[w2.type_id], w2.style].filter(Boolean).join(" \xB7 ");
    const origin = [w2.region, w2.country].filter(Boolean).join(", ");
    const foods = (w2.foods || []).map((f3) => f3.name).filter(Boolean).join(", ");
    const grapes = (w2.grapes || []).filter(Boolean).join(", ");
    const spots = bottleSpots(w2.bottles || []);
    const row = (label, value) => value ? b2`<div class="dl-row"><dt>${label}</dt><dd>${value}</dd></div>` : A;
    return b2`
      <dialog aria-labelledby="t" @cancel=${this._cancel} @close=${this._closed} @click=${this._backdrop}>
        <div class="sheet s-${status}">
          <div class="hero">
            ${image ? b2`<img class="photo" src=${image} alt="" @error=${(e4) => e4.target.style.visibility = "hidden"} />` : b2`<div class="photo bottle-placeholder"><ha-icon icon="mdi:bottle-wine"></ha-icon></div>`}
            <div class="heading">
              <div class="name" id="t">${name}${w2.year ? ` ${w2.year}` : ""}</div>
              ${w2.winery ? b2`<div class="muted">${w2.winery}</div>` : A}
              <div class="badges">
                ${typeof w2.rating === "number" ? b2`<span class="badge star-badge"><ha-icon icon="mdi:star"></ha-icon>${formatRating(w2.rating)}${w2.ratings_count ? ` \xB7 ${w2.ratings_count} beoordelingen` : ""}</span>` : A}
                <span class="badge">${STATUS_LABELS[status] || status}</span>
              </div>
              <div class="reason">${reasonLine(w2, (/* @__PURE__ */ new Date()).getFullYear())}</div>
            </div>
          </div>
          <div class="body">
            <dl>
              ${row("Drinkvenster", b2`${window2}${source ? b2` <span class="muted">(${source})</span>` : A}`)}
              ${row("Soort", type)}
              ${row("Herkomst", origin)}
              ${row("Druiven", grapes)}
              ${row("Past bij", foods)}
              ${row(
      "Flessen",
      spots.length ? spots.map((s4) => b2`<div>${s4.location}${s4.bin ? ` \xB7 vak ${s4.bin}` : ""}: ${s4.bottles.length}×</div>`) : "Geen flessen op voorraad"
    )}
            </dl>
            ${this._ratingSection()}
          </div>
          <div class="foot">
            ${link ? b2`<a class="vivino" href=${link} target="_blank" rel="noopener noreferrer">
                  Bekijk op Vivino <ha-icon icon="mdi:open-in-new"></ha-icon>
                </a>` : A}
            <button class="btn" id="close" autofocus @click=${() => fire(this, "vc-close")}>Sluiten</button>
            ${(w2.bottles || []).length ? b2`<button class="btn btn-primary" @click=${() => fire(this, "vc-drink", { vintageId: vintageId(w2) })}>
                  <ha-icon icon="mdi:glass-wine"></ha-icon> Ontkurken
                </button>` : A}
          </div>
        </div>
      </dialog>
    `;
  }
};
__publicField(VcDetailSheet, "properties", {
  wine: { attribute: false },
  draft: { attribute: false },
  // {vid, rating, note, status, error} from the root
  saved: { attribute: false },
  // {rating, note} | null | undefined (not loaded)
  _rating: { state: true },
  _note: { state: true }
});
__publicField(VcDetailSheet, "styles", [
  themeStyles,
  VcModal.modalStyles,
  i`
      .hero {
        display: flex;
        gap: 16px;
        padding: 16px;
        border-bottom: 1px solid var(--vc-divider);
        border-left: 4px solid var(--vc-edge);
      }
      .photo { width: 64px; height: 108px; flex: none; object-fit: contain; border-radius: var(--vc-radius-sm); }
      .heading { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
      .name { font-size: 18px; font-weight: 600; line-height: 1.25; }
      .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
      .star-badge { --vc-edge: var(--vc-star); }
      .reason { font-size: 13px; font-weight: 500; color: var(--vc-edge); }
      dl { margin: 0; display: grid; gap: 10px; }
      .dl-row { display: grid; grid-template-columns: 110px 1fr; gap: 8px; font-size: 14px; }
      dt { color: var(--vc-muted); }
      dd { margin: 0; overflow-wrap: anywhere; }
      .rating {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid var(--vc-divider);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .rating h4 { margin: 0; font-size: 14px; }
      .stars { display: flex; align-items: center; gap: 2px; }
      .star { position: relative; width: 36px; height: 36px; display: inline-flex; color: var(--vc-divider); }
      .star.on { color: var(--vc-star); }
      .star ha-icon { --mdc-icon-size: 34px; pointer-events: none; }
      .half { position: absolute; top: 0; width: 50%; height: 100%; padding: 0; border: none; background: transparent; cursor: pointer; }
      .half.left { left: 0; }
      .half.right { right: 0; }
      .half[disabled] { cursor: default; }
      .value { margin-left: 10px; font-weight: 600; }
      .actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
      .actions .save { margin-left: auto; }
      .ok { color: var(--vc-status-ready); }
      .err { color: var(--vc-status-past_peak); }
      .vivino {
        margin-right: auto;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--vc-accent);
        font-size: 14px;
      }
      .vivino ha-icon { --mdc-icon-size: 16px; }
      @media (max-width: 420px) {
        .dl-row { grid-template-columns: 1fr; gap: 2px; }
      }
    `
]);
if (!customElements.get("vc-detail-sheet")) customElements.define("vc-detail-sheet", VcDetailSheet);

// custom_components/vivino_cellar/frontend/src/logic/ranking.js
var CHIPS = [
  { id: "borrelen", label: "\u{1F942} Borrelen" },
  { id: "verfrissend", label: "\u{1F9CA} Verfrissend" },
  { id: "winteravond", label: "\u{1F525} Winteravond" },
  { id: "eten", label: "\u{1F37D} Bij het eten" },
  { id: "bijzonder", label: "\u2728 Iets bijzonders" },
  { id: "moet_op", label: "\u23F3 Moet op" }
];
var RED = 1;
var WHITE = 2;
var SPARKLING = 3;
var ROSE = 4;
var DESSERT = 7;
var FORTIFIED = 24;
var FULL_GRAPES = /* @__PURE__ */ new Set(
  [
    "cabernet sauvignon",
    "syrah",
    "shiraz",
    "malbec",
    "nebbiolo",
    "tempranillo",
    "aglianico",
    "tannat",
    "petite sirah",
    "mourv\xE8dre",
    "mourvedre",
    "primitivo",
    "zinfandel",
    "sagrantino"
  ]
);
var LIGHT_GRAPES = /* @__PURE__ */ new Set(
  ["pinot noir", "gamay", "zweigelt", "schiava", "frappato", "cinsault"]
);
var SAVE_FOR_LATER = 4.3;
var DRINKABLE = { near_past_peak: 0, ready: 1, can_wait: 2 };
var nullsLast2 = (v2) => v2 === null || v2 === void 0 ? Infinity : v2;
var inStock = (w2) => (w2.bottles || []).length > 0;
function bodyOf(wine) {
  if (typeof wine.style_body === "number") return wine.style_body;
  const grapes = (wine.grapes || []).map((g2) => String(g2).toLowerCase());
  if (grapes.some((g2) => FULL_GRAPES.has(g2))) return 4;
  if (grapes.some((g2) => LIGHT_GRAPES.has(g2))) return 2;
  return 3;
}
function byDefault(a3, b3) {
  return (DRINKABLE[a3.window_status] ?? 9) - (DRINKABLE[b3.window_status] ?? 9) || nullsLast2(a3.end_year) - nullsLast2(b3.end_year) || (b3.rating ?? 0) - (a3.rating ?? 0);
}
var CHIP_RULES = {
  borrelen: {
    keep: (w2) => [SPARKLING, ROSE, WHITE].includes(w2.type_id) || w2.type_id === RED && bodyOf(w2) <= 3,
    rank: (a3, b3) => {
      const group = (w2) => [SPARKLING, ROSE].includes(w2.type_id) ? 0 : w2.type_id === WHITE ? 1 : 2;
      return group(a3) - group(b3) || bodyOf(a3) - bodyOf(b3);
    }
  },
  verfrissend: {
    keep: (w2) => [WHITE, ROSE, SPARKLING].includes(w2.type_id),
    rank: (a3, b3) => (b3.style_acidity ?? -Infinity) - (a3.style_acidity ?? -Infinity) || bodyOf(a3) - bodyOf(b3)
  },
  winteravond: {
    keep: (w2) => w2.type_id === RED && bodyOf(w2) >= 4 || [FORTIFIED, DESSERT].includes(w2.type_id),
    rank: (a3, b3) => bodyOf(b3) - bodyOf(a3) || (b3.rating ?? 0) - (a3.rating ?? 0)
  },
  bijzonder: {
    keep: () => true,
    rank: (a3, b3) => (b3.rating ?? -Infinity) - (a3.rating ?? -Infinity) || nullsLast2(a3.year) - nullsLast2(b3.year)
  }
};
function rankTonight(wines, chipId) {
  const stock = (wines || []).filter(inStock);
  if (chipId === "moet_op") {
    const near = stock.filter((w2) => w2.window_status === "near_past_peak").sort(byDefault);
    const past = stock.filter((w2) => w2.window_status === "past_peak").sort((a3, b3) => (b3.end_year ?? -Infinity) - (a3.end_year ?? -Infinity) || byDefault(a3, b3));
    return [...near, ...past];
  }
  const drinkable = stock.filter((w2) => w2.window_status in DRINKABLE);
  const rule = CHIP_RULES[chipId];
  if (!rule) return drinkable.sort(byDefault);
  let picks = drinkable.filter(rule.keep);
  if (chipId === "borrelen") {
    const everyday = picks.filter((w2) => (w2.rating ?? 0) < SAVE_FOR_LATER);
    if (everyday.length) picks = everyday;
  }
  return picks.sort((a3, b3) => rule.rank(a3, b3) || byDefault(a3, b3));
}
function describe(wine) {
  const type = WINE_TYPES[wine.type_id];
  const body = bodyOf(wine);
  if (wine.type_id === RED && body >= 4) return "Vol, krachtig";
  if (wine.type_id !== RED && type && (wine.style_acidity ?? 0) >= 3.5) return `Fris, ${type.toLowerCase()}`;
  const adjective = body <= 2 ? "Licht" : body >= 4 ? "Vol" : "Soepel";
  return type ? `${adjective}, ${type.toLowerCase()}` : adjective;
}
function hintLine(wine, chipId, year) {
  const end = wine.end_year;
  if (wine.window_status === "past_peak") return end ? `Voorbij de piek \xB7 sinds ${end}` : "Voorbij de piek";
  if (wine.window_status === "can_wait") return end ? `Kan nog liggen \xB7 tot ${end}` : "Kan nog liggen";
  const text = describe(wine);
  if (wine.window_status === "near_past_peak") return `${text} \xB7 drink in ${end ?? year}`;
  return end ? `${text} \xB7 tot ${end}` : text;
}

// custom_components/vivino_cellar/frontend/src/components/mood-chips.js
var VcMoodChips = class extends i4 {
  _pick(id) {
    if (id === "eten") {
      fire(this, "vc-tab", { tab: "pairing", focusDish: true });
      return;
    }
    fire(this, "vc-chip", { chip: this.chip === id ? null : id });
  }
  render() {
    const chips = CHIPS.filter((c4) => c4.id !== "eten" || this.showEatChip);
    return b2`
      <div class="chips" role="group" aria-label="Waar heb je zin in?">
        ${chips.map(
      (c4) => b2`<button class="chip" aria-pressed=${this.chip === c4.id} @click=${() => this._pick(c4.id)}>
            ${c4.label}
          </button>`
    )}
      </div>
    `;
  }
};
__publicField(VcMoodChips, "properties", {
  chip: { type: String },
  showEatChip: { type: Boolean }
});
__publicField(VcMoodChips, "styles", [
  themeStyles,
  i`
      :host { display: block; }
      .chips {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        padding: 2px 0 4px;
        margin: 0 -2px;
      }
      .chips::-webkit-scrollbar { display: none; }
    `
]);
if (!customElements.get("vc-mood-chips")) customElements.define("vc-mood-chips", VcMoodChips);

// custom_components/vivino_cellar/frontend/src/components/top-pick.js
var VcTopPick = class extends i4 {
  _open() {
    fire(this, "vc-open", { vintageId: vintageId(this.wine) });
  }
  render() {
    const w2 = this.wine;
    if (!w2) return A;
    const name = w2.name || "Onbekende wijn";
    const image = safeUrl(w2.image_url);
    const sub = [w2.winery, w2.region].filter(Boolean).join(" \xB7 ");
    return b2`
      <div
        class="pick s-${w2.window_status || "unknown"}"
        role="button"
        tabindex="0"
        aria-label="Details: ${name}"
        @click=${this._open}
        @keydown=${(e4) => {
      if (e4.target === e4.currentTarget && (e4.key === "Enter" || e4.key === " ")) {
        e4.preventDefault();
        this._open();
      }
    }}
      >
        ${image ? b2`<img class="photo" src=${image} alt="" @error=${(e4) => e4.target.style.visibility = "hidden"} />` : b2`<div class="photo bottle-placeholder"><ha-icon icon="mdi:bottle-wine"></ha-icon></div>`}
        <div class="text">
          <div class="name">${name}${w2.year ? b2` <span class="year">${w2.year}</span>` : A}</div>
          ${sub ? b2`<div class="muted sub">${sub}</div>` : A}
          <div class="reason">${reasonLine(w2, (/* @__PURE__ */ new Date()).getFullYear())}</div>
          <button
            class="btn btn-primary"
            @click=${(e4) => {
      e4.stopPropagation();
      fire(this, "vc-drink", { vintageId: vintageId(w2) });
    }}
          >
            <ha-icon icon="mdi:glass-wine"></ha-icon> Ontkurken
          </button>
        </div>
      </div>
    `;
  }
};
__publicField(VcTopPick, "properties", { wine: { attribute: false } });
__publicField(VcTopPick, "styles", [
  themeStyles,
  i`
      :host { display: block; }
      .pick {
        display: flex;
        gap: 14px;
        padding: 14px;
        border-radius: var(--vc-radius);
        background: var(--vc-surface-2);
        border-left: 4px solid var(--vc-edge);
        cursor: pointer;
      }
      .photo { width: 60px; height: 104px; flex: none; object-fit: contain; border-radius: var(--vc-radius-sm); }
      .photo.bottle-placeholder { background: var(--vc-surface); }
      .text { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
      .name { font-size: 17px; font-weight: 600; line-height: 1.25; }
      .year { font-weight: 400; color: var(--vc-muted); }
      .sub { font-size: 13px; }
      .reason { font-size: 13.5px; font-weight: 500; color: var(--vc-edge); margin: 4px 0 8px; }
    `
]);
if (!customElements.get("vc-top-pick")) customElements.define("vc-top-pick", VcTopPick);

// custom_components/vivino_cellar/frontend/src/components/now-tab.js
var VcNowTab = class extends i4 {
  render() {
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const ranked = rankTonight(this.wines || [], this.chip === "eten" ? null : this.chip);
    const [top, ...rest] = ranked;
    const more = rest.slice(0, Math.max(0, (this.limit || 5) - 1));
    return b2`
      ${this.hint ? b2`<button
            class="hint ${this.hint.chip === "winteravond" ? "cold" : "warm"}"
            @click=${() => this.chip !== this.hint.chip && fire(this, "vc-chip", { chip: this.hint.chip })}
          >
            ${this.hint.text}
          </button>` : A}
      <vc-mood-chips .chip=${this.chip} ?showEatChip=${this.showEatChip}></vc-mood-chips>

      ${top ? b2`
            <vc-top-pick .wine=${top}></vc-top-pick>
            ${more.length ? b2`<div class="section-label">Ook goed vanavond</div>
                  <div class="list">
                    ${more.map(
      (w2) => b2`<vc-wine-row .wine=${w2} .lines=${[hintLine(w2, this.chip, year)]} data-id=${vintageId(w2)}></vc-wine-row>`
    )}
                  </div>` : A}
          ` : b2`<div class="empty">
            ${this.chip ? b2`Niets voor deze keuze.
                  <button class="btn-link btn" @click=${() => fire(this, "vc-chip", { chip: null })}>Toon alles</button>` : "Niets op dronk op dit moment."}
          </div>`}

      ${this.pastPeakCount && this.chip !== "moet_op" ? b2`<button class="past" @click=${() => fire(this, "vc-tab", { tab: "cellar", statusFilter: "past_peak" })}>
            <ha-icon icon="mdi:alert"></ha-icon>
            ${this.pastPeakCount} ${this.pastPeakCount === 1 ? "fles" : "flessen"} voorbij de piek · Bekijken
          </button>` : A}
    `;
  }
};
__publicField(VcNowTab, "properties", {
  wines: { attribute: false },
  chip: { type: String },
  limit: { type: Number },
  hint: { attribute: false },
  // {chip, text} | null
  showEatChip: { type: Boolean },
  pastPeakCount: { type: Number }
});
__publicField(VcNowTab, "styles", [
  themeStyles,
  i`
      :host { display: flex; flex-direction: column; gap: 12px; }
      .hint {
        text-align: left;
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
      }
      .hint.warm {
        color: var(--vc-status-near_past_peak);
        background: color-mix(in srgb, var(--vc-status-near_past_peak) var(--vc-tint), transparent);
      }
      .hint.cold {
        color: var(--vc-status-hold);
        background: color-mix(in srgb, var(--vc-status-hold) var(--vc-tint), transparent);
      }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .section-label { margin-bottom: -4px; }
      .past {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: none;
        padding: 4px 2px;
        color: var(--vc-status-past_peak);
        font-size: 13.5px;
        cursor: pointer;
        text-align: left;
      }
      .past ha-icon { --mdc-icon-size: 16px; }
    `
]);
if (!customElements.get("vc-now-tab")) customElements.define("vc-now-tab", VcNowTab);

// custom_components/vivino_cellar/frontend/src/components/pairing-tab.js
var VcPairingTab = class extends i4 {
  willUpdate(changed) {
    if (changed.has("pairing") && this._dish === void 0) this._dish = this.pairing?.dish || "";
  }
  updated(changed) {
    if (changed.has("focusDish") && this.focusDish) this.renderRoot.querySelector("#dish")?.focus();
  }
  _search() {
    fire(this, "vc-pairing-search", { dish: this._dish || "", foodIds: [] });
  }
  _toggleFood(id) {
    const ids = new Set(this.pairing?.foodIds || []);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    this._dish = "";
    if (ids.size) fire(this, "vc-pairing-search", { dish: "", foodIds: [...ids] });
    else fire(this, "vc-pairing-reset");
  }
  _reset() {
    this._dish = "";
    fire(this, "vc-pairing-reset");
  }
  _results() {
    const p3 = this.pairing || {};
    if (p3.loading) return b2`<div class="empty">Zoeken…</div>`;
    if (p3.error) return b2`<div class="error">${p3.error}</div>`;
    if (!p3.results) return A;
    if (!p3.results.length) return b2`<div class="empty">Geen passende wijn in je kelder.</div>`;
    const byId = new Map((this.wines || []).map((w2) => [vintageId(w2), w2]));
    return b2`
      <div class="section-label">Past erbij</div>
      <div class="list">
        ${p3.results.map((match) => {
      const wine = { ...match, ...byId.get(vintageId(match)) || {} };
      if (!(wine.bottles || []).length) return A;
      const status = wine.window_status || "unknown";
      const when = [STATUS_LABELS[status], wine.end_year ? `tot ${wine.end_year}` : ""].filter(Boolean).join(" \xB7 ");
      return b2`<vc-wine-row .wine=${wine} .lines=${[match.explanation, when]}></vc-wine-row>`;
    })}
      </div>
    `;
  }
  render() {
    const p3 = this.pairing || {};
    const selected = p3.foodIds || /* @__PURE__ */ new Set();
    const categories = this.categories || [];
    return b2`
      <div class="search">
        <input
          id="dish"
          class="input"
          type="search"
          placeholder="Wat eet je? Bijv. pasta met truffel"
          .value=${this._dish ?? ""}
          @input=${(e4) => this._dish = e4.target.value}
          @keydown=${(e4) => e4.key === "Enter" && this._search()}
        />
        <button class="btn btn-primary" ?disabled=${!(this._dish || "").trim()} @click=${this._search}>
          Zoek
        </button>
      </div>

      ${categories.length ? b2`<div class="foods" role="group" aria-label="Of kies een categorie">
            ${categories.map(
      (c4) => b2`<button class="chip" aria-pressed=${selected.has(c4.id)} @click=${() => this._toggleFood(c4.id)}>
                ${c4.name}
              </button>`
    )}
          </div>` : A}

      ${p3.results || p3.error || (this._dish || "") || selected.size ? b2`<button class="btn btn-link reset" @click=${this._reset}>Opnieuw</button>` : A}

      ${this._results()}
    `;
  }
};
__publicField(VcPairingTab, "properties", {
  wines: { attribute: false },
  // cellar wines (pending drinks hidden)
  categories: { attribute: false },
  pairing: { attribute: false },
  // {dish, foodIds:Set, results, loading, error}
  focusDish: { type: Boolean },
  _dish: { state: true }
});
__publicField(VcPairingTab, "styles", [
  themeStyles,
  i`
      :host { display: flex; flex-direction: column; gap: 12px; }
      .search { display: flex; gap: 8px; }
      .search .input { flex: 1; -webkit-appearance: none; }
      .foods { display: flex; flex-wrap: wrap; gap: 6px; }
      .reset { align-self: flex-start; font-size: 13px; }
      .list { display: flex; flex-direction: column; gap: 8px; }
      .error {
        color: var(--vc-status-past_peak);
        background: color-mix(in srgb, var(--vc-status-past_peak) var(--vc-tint), transparent);
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
        font-size: 13px;
      }
    `
]);
if (!customElements.get("vc-pairing-tab")) customElements.define("vc-pairing-tab", VcPairingTab);

// custom_components/vivino_cellar/frontend/src/components/spot-picker.js
var VcSpotPicker = class extends VcModal {
  render() {
    const w2 = this.wine;
    if (!w2) return A;
    return b2`
      <dialog aria-label="Welke fles pak je?" @cancel=${this._cancel} @close=${this._closed} @click=${this._backdrop}>
        <div class="sheet picker">
          <div class="head"><ha-icon icon="mdi:glass-wine"></ha-icon> Welke fles pak je?</div>
          <div class="body">
            <div class="wine">${w2.name || "Wijn"}${w2.year ? ` (${w2.year})` : ""}</div>
            ${bottleSpots(w2.bottles).map(
      (s4, i5) => b2`
                <button class="spot" @click=${() => fire(this, "vc-pick-spot", { index: i5 })}>
                  <span><ha-icon icon="mdi:map-marker"></ha-icon> ${s4.location}${s4.bin ? ` \xB7 vak ${s4.bin}` : ""}</span>
                  <span class="count">${s4.bottles.length}×</span>
                </button>
              `
    )}
          </div>
          <div class="foot">
            <button class="btn" @click=${() => fire(this, "vc-close")}>Annuleren</button>
          </div>
        </div>
      </dialog>
    `;
  }
};
__publicField(VcSpotPicker, "properties", { wine: { attribute: false } });
__publicField(VcSpotPicker, "styles", [
  themeStyles,
  VcModal.modalStyles,
  i`
      .picker { max-width: 420px; }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        font-weight: 600;
        border-bottom: 1px solid var(--vc-divider);
      }
      .head ha-icon { color: var(--vc-accent); }
      .body { display: flex; flex-direction: column; gap: 8px; }
      .wine { font-weight: 500; margin-bottom: 4px; }
      .spot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: var(--vc-control-height);
        padding: 8px 12px;
        border-radius: var(--vc-radius-sm);
        border: 1px solid var(--vc-divider);
        background: var(--vc-surface);
        cursor: pointer;
        text-align: left;
      }
      .spot:hover { border-color: var(--vc-accent); }
      .spot ha-icon { --mdc-icon-size: 16px; color: var(--vc-muted); }
      .count { font-weight: 600; }
    `
]);
if (!customElements.get("vc-spot-picker")) customElements.define("vc-spot-picker", VcSpotPicker);

// custom_components/vivino_cellar/frontend/src/components/toast-stack.js
var VcToastStack = class extends i4 {
  constructor() {
    super();
    this.pending = [];
    this.errors = [];
    this.undoMs = 8e3;
  }
  render() {
    const undoable = this.pending.filter(([, p3]) => !p3.committing);
    if (!undoable.length && !this.errors.length) return b2``;
    const now = Date.now();
    return b2`
      <div class="stack" role="status" aria-live="polite">
        ${this.errors.map(
      (e4) => b2`
            <div class="toast error">
              <ha-icon icon="mdi:alert"></ha-icon>
              <span class="text">${e4.message}</span>
              <button class="action" @click=${() => fire(this, "vc-dismiss-error", { id: e4.id })}>
                Sluiten
              </button>
            </div>
          `
    )}
        ${undoable.map(
      ([id, p3]) => b2`
            <div class="toast">
              <ha-icon icon="mdi:glass-wine"></ha-icon>
              <span class="text">Ontkurkt: ${p3.label}</span>
              <button class="action" @click=${() => fire(this, "vc-undo", { bottleId: id })}>
                Ongedaan maken
              </button>
              <div
                class="progress"
                style="animation-duration:${this.undoMs}ms;animation-delay:-${Math.min(
        now - p3.startedAt,
        this.undoMs
      )}ms"
              ></div>
            </div>
          `
    )}
      </div>
    `;
  }
};
__publicField(VcToastStack, "properties", {
  pending: { attribute: false },
  // [[bottleId, {label, startedAt, committing}]]
  errors: { attribute: false },
  // [{id, message}]
  undoMs: { type: Number }
});
__publicField(VcToastStack, "styles", [
  themeStyles,
  i`
      .stack {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        width: min(440px, calc(100vw - 32px));
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 10;
      }
      .toast {
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
        background: var(--vc-text);
        color: var(--vc-surface);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-size: 14px;
      }
      .toast.error { background: var(--vc-toast-error); color: #fff; }
      .text { flex: 1; min-width: 0; }
      .action {
        border: none;
        background: none;
        color: inherit;
        font-weight: 600;
        cursor: pointer;
        padding: 6px;
        text-decoration: underline;
      }
      .progress {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        width: 100%;
        background: var(--vc-accent);
        transform-origin: left;
        animation-name: shrink;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
      }
      @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
    `
]);
if (!customElements.get("vc-toast-stack")) customElements.define("vc-toast-stack", VcToastStack);

// custom_components/vivino_cellar/frontend/src/logic/weather.js
var WARM_C = 24;
var COLD_C = 8;
function weatherSuggestion(hass, entityId) {
  if (!hass || !entityId) return null;
  const raw = hass.states?.[entityId]?.attributes?.temperature;
  const temp = typeof raw === "number" ? raw : Number.parseFloat(raw);
  if (!Number.isFinite(temp)) return null;
  const fahrenheit = hass.config?.unit_system?.temperature === "\xB0F";
  const celsius = fahrenheit ? (temp - 32) * 5 / 9 : temp;
  const shown = Math.round(temp);
  if (celsius >= WARM_C) return { chip: "verfrissend", text: `\u2600\uFE0F Het is ${shown}\xB0. Iets fris?` };
  if (celsius <= COLD_C) return { chip: "winteravond", text: `\u2744\uFE0F Het is ${shown}\xB0. Iets voor bij de haard?` };
  return null;
}

// custom_components/vivino_cellar/frontend/src/vivino-cellar-card.js
var DEFAULT_TABS = ["now", "pairing", "cellar"];
var TAB_ALIASES = { windows: "cellar" };
var TAB_LABELS = { now: "Nu drinken", pairing: "Wijn & Spijs", cellar: "Kelder" };
var DEFAULT_TITLE = "Wijnkelder";
var DEFAULT_NOW_LIMIT = 5;
var UNDO_MS = 8e3;
var ERROR_TOAST_MS = 8e3;
var VivinoCellarCard = class extends i4 {
  constructor() {
    super();
    this._config = this._parseConfig({});
    this._tab = this._config.default_tab;
    this._data = null;
    this._loading = false;
    this._error = null;
    this._refreshing = false;
    this._pending = /* @__PURE__ */ new Map();
    this._errors = [];
    this._detailId = null;
    this._pickerId = null;
    this._myRatings = /* @__PURE__ */ new Map();
    this._ratingDraft = null;
    this._statusFilter = null;
    this._filters = { ...EMPTY_FILTERS };
    this._query = "";
    this._expanded = { near_past_peak: true, ready: true, can_wait: false, hold: false, past_peak: false, unknown: false };
    this._chip = null;
    this._chipTouched = false;
    this._weatherApplied = false;
    this._focusDish = false;
    this._pairing = { dish: "", foodIds: /* @__PURE__ */ new Set(), results: null, loading: false, error: null };
    this._unsubscribe = null;
    this._subscribing = false;
    this._subscribeTried = false;
    this._onPageHide = () => this._flushPending();
    this._listen();
  }
  // ---------------------------------------------------------------------------
  // Card API
  // ---------------------------------------------------------------------------
  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = this._parseConfig(config);
    this._tab = this._config.tabs.includes(this._config.default_tab) ? this._config.default_tab : this._config.tabs[0];
  }
  _parseConfig(config) {
    const tabs = (Array.isArray(config.tabs) && config.tabs.length ? config.tabs : DEFAULT_TABS).map((t3) => TAB_ALIASES[t3] || t3).filter((t3) => TAB_LABELS[t3]);
    return {
      ...config,
      tabs: tabs.length ? tabs : DEFAULT_TABS,
      default_tab: TAB_ALIASES[config.default_tab] || config.default_tab || "now"
    };
  }
  getCardSize() {
    return 6;
  }
  static getStubConfig() {
    return {};
  }
  get title() {
    return this._config.title || this._data?.settings?.title || DEFAULT_TITLE;
  }
  get nowLimit() {
    const n4 = Number(this._config.now_limit) || Number(this._data?.settings?.now_limit);
    return n4 > 0 ? n4 : DEFAULT_NOW_LIMIT;
  }
  // ---------------------------------------------------------------------------
  // Lifecycle and data
  // ---------------------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pagehide", this._onPageHide);
    if (this.hass) this._subscribe();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("pagehide", this._onPageHide);
    this._flushPending();
    this._unsubscribeUpdates();
    this._subscribeTried = false;
  }
  willUpdate(changed) {
    if (changed.has("hass") && this.hass) {
      this.toggleAttribute("dark", Boolean(this.hass.themes?.darkMode));
      if (this.isConnected) this._subscribe();
    }
    this._applyWeatherChip();
  }
  get _weather() {
    return weatherSuggestion(this.hass, this._data?.settings?.weather_entity);
  }
  /** Once per load: preselect the weather's chip, unless the user chose or it has no wines. */
  _applyWeatherChip() {
    if (this._weatherApplied || this._chipTouched || !this._data || !this.hass) return;
    this._weatherApplied = true;
    const hint = this._weather;
    if (hint && rankTonight(this._wines, hint.chip).length) this._chip = hint.chip;
  }
  async _subscribe() {
    if (!this.hass || this._unsubscribe || this._subscribing || this._subscribeTried) return;
    this._subscribeTried = true;
    this._subscribing = true;
    if (!this._data) this._loading = true;
    try {
      this._unsubscribe = await this.hass.connection.subscribeMessage(
        (data) => {
          this._data = data;
          this._loading = false;
          this._error = null;
        },
        { type: "vivino_cellar/subscribe" }
      );
      if (!this.isConnected) this._unsubscribeUpdates();
    } catch {
      await this._loadOnce();
    } finally {
      this._subscribing = false;
    }
  }
  _unsubscribeUpdates() {
    if (!this._unsubscribe) return;
    const unsub = this._unsubscribe;
    this._unsubscribe = null;
    Promise.resolve(unsub()).catch(() => {
    });
  }
  async _loadOnce() {
    if (!this.hass) return;
    this._loading = true;
    try {
      this._data = await this.hass.callWS({ type: "vivino_cellar/cellar" });
      this._error = null;
    } catch (err) {
      this._error = err?.message || "Fout bij ophalen van keldergegevens.";
    } finally {
      this._loading = false;
    }
  }
  async _refresh() {
    if (!this.hass || this._refreshing) return;
    this._refreshing = true;
    try {
      await this.hass.callWS({ type: "vivino_cellar/refresh" });
      if (!this._unsubscribe) this._data = await this.hass.callWS({ type: "vivino_cellar/cellar" });
      this._error = null;
    } catch (err) {
      this._error = err?.message || "Fout bij vernieuwen van kelder.";
    } finally {
      this._refreshing = false;
    }
  }
  /** Wines with bottles of pending (undoable) drinks hidden. */
  get _wines() {
    return viewWines(this._data?.wines, new Set(this._pending.keys()));
  }
  _wine(vid) {
    return this._wines.find((w2) => vintageId(w2) === vid) || null;
  }
  // ---------------------------------------------------------------------------
  // Drinking with undo
  // ---------------------------------------------------------------------------
  _drink(vid) {
    const wine = this._wine(vid);
    if (!wine || wine.bottles.length === 0) return;
    this._detailId = null;
    this._ratingDraft = null;
    if (bottleSpots(wine.bottles).length > 1) {
      this._pickerId = vid;
      return;
    }
    this._startDrink(wine, wine.bottles[0]);
  }
  _pickSpot(index) {
    const wine = this._wine(this._pickerId);
    this._pickerId = null;
    const spot = wine && bottleSpots(wine.bottles)[index];
    if (spot) this._startDrink(wine, spot.bottles[0]);
  }
  _startDrink(wine, bottle) {
    const id = bottleId(bottle);
    if (this._pending.has(id)) return;
    const name = wine.name || "Fles";
    this._pending.set(id, {
      timer: setTimeout(() => this._commitDrink(id), UNDO_MS),
      startedAt: Date.now(),
      vintageId: vintageId(wine),
      label: wine.year ? `${name} (${wine.year})` : name,
      committing: false
    });
    this.requestUpdate();
  }
  _undo(id) {
    const pending = this._pending.get(id);
    if (!pending || pending.committing) return;
    clearTimeout(pending.timer);
    this._pending.delete(id);
    this.requestUpdate();
  }
  async _commitDrink(id) {
    const pending = this._pending.get(id);
    if (!pending || pending.committing || !this.hass) return;
    pending.committing = true;
    clearTimeout(pending.timer);
    this.requestUpdate();
    try {
      await this.hass.callWS({ type: "vivino_cellar/drink", bottle_id: id, vintage_id: pending.vintageId });
      this._pending.delete(id);
      if (!this._unsubscribe) await this._loadOnce();
    } catch (err) {
      this._pending.delete(id);
      this._showError(`Ontkurken van ${pending.label} mislukt: ${err?.message || err}`);
    }
    this.requestUpdate();
  }
  _flushPending() {
    for (const [id, pending] of this._pending) {
      if (!pending.committing) this._commitDrink(id);
    }
  }
  _showError(message) {
    const entry = { id: Date.now() + Math.random(), message };
    this._errors = [...this._errors, entry];
    setTimeout(() => this._dismissError(entry.id), ERROR_TOAST_MS);
  }
  _dismissError(id) {
    this._errors = this._errors.filter((e4) => e4.id !== id);
  }
  // ---------------------------------------------------------------------------
  // Detail sheet and rating
  // ---------------------------------------------------------------------------
  _openDetail(vid) {
    this._detailId = vid;
    this._loadRating(vid);
  }
  _closeModal() {
    if (this._pickerId !== null) {
      this._pickerId = null;
      return;
    }
    this._detailId = null;
    this._ratingDraft = null;
  }
  async _loadRating(vid) {
    const known = this._myRatings.get(vid);
    this._ratingDraft = {
      vid,
      rating: known?.rating ?? null,
      note: known?.note ?? "",
      status: this._myRatings.has(vid) ? "idle" : "loading",
      error: null
    };
    if (this._myRatings.has(vid) || !this.hass) return;
    try {
      const res = await this.hass.callWS({ type: "vivino_cellar/rating", vintage_id: vid });
      const mine = res && res.rating !== null ? { rating: res.rating, note: res.note || "" } : null;
      this._myRatings.set(vid, mine);
      if (this._ratingDraft?.vid === vid && this._ratingDraft.status === "loading") {
        this._ratingDraft = { ...this._ratingDraft, rating: mine?.rating ?? null, note: mine?.note ?? "", status: "idle" };
      }
    } catch (err) {
      if (this._ratingDraft?.vid === vid) {
        this._ratingDraft = { ...this._ratingDraft, status: "error", error: err?.message || String(err) };
      }
    }
  }
  async _saveRating({ vintageId: vid, rating, note }) {
    if (!this.hass || this._ratingDraft?.status === "saving") return;
    this._ratingDraft = { vid, rating, note, status: "saving", error: null };
    try {
      const res = await this.hass.callWS({ type: "vivino_cellar/rate", vintage_id: vid, rating, note: note || "" });
      this._myRatings.set(vid, { rating: res.rating ?? rating, note: res.note ?? note });
      if (this._ratingDraft?.vid === vid) this._ratingDraft = { ...this._ratingDraft, status: "saved" };
    } catch (err) {
      if (this._ratingDraft?.vid === vid) {
        this._ratingDraft = { ...this._ratingDraft, status: "error", error: err?.message || String(err) };
      }
    }
  }
  // ---------------------------------------------------------------------------
  // Pairing
  // ---------------------------------------------------------------------------
  async _pairingSearch({ dish, foodIds }) {
    if (!this.hass) return;
    const cleanDish = (dish || "").trim();
    const ids = [...foodIds || []];
    const state = { ...this._pairing, dish: cleanDish, foodIds: new Set(ids) };
    if (!cleanDish && ids.length === 0) {
      this._pairing = { ...state, results: null, error: "Voer een gerecht in of kies een categorie." };
      return;
    }
    this._pairing = { ...state, loading: true, error: null };
    try {
      const payload = cleanDish ? { type: "vivino_cellar/pairing", dish: cleanDish } : { type: "vivino_cellar/pairing", food_ids: ids };
      const res = await this.hass.callWS(payload);
      this._pairing = { ...this._pairing, loading: false, results: res.matches || res.pairings || [] };
    } catch (err) {
      this._pairing = { ...this._pairing, loading: false, results: null, error: err?.message || "Fout bij zoeken naar pairing." };
    }
  }
  // ---------------------------------------------------------------------------
  // Events from child elements
  // ---------------------------------------------------------------------------
  _listen() {
    const on = (type, fn) => this.addEventListener(type, (e4) => fn(e4.detail || {}));
    on("vc-drink", ({ vintageId: vid }) => this._drink(vid));
    on("vc-pick-spot", ({ index }) => this._pickSpot(index));
    on("vc-open", ({ vintageId: vid }) => this._openDetail(vid));
    on("vc-close", () => this._closeModal());
    on("vc-undo", ({ bottleId: id }) => this._undo(id));
    on("vc-dismiss-error", ({ id }) => this._dismissError(id));
    on("vc-rate", (detail) => this._saveRating(detail));
    on("vc-rating-draft", (draft) => {
      this._ratingDraft = { ...this._ratingDraft, ...draft, status: "idle", error: null };
    });
    on("vc-tab", ({ tab, statusFilter, focusDish }) => {
      if (!this._config.tabs.includes(tab)) return;
      this._tab = tab;
      this._focusDish = Boolean(focusDish);
      if (statusFilter !== void 0) this._statusFilter = statusFilter;
    });
    on("vc-chip", ({ chip }) => {
      this._chipTouched = true;
      this._chip = chip;
    });
    on("vc-filters", ({ filters, statusFilter, query }) => {
      if (filters) this._filters = filters;
      if (statusFilter !== void 0) this._statusFilter = statusFilter;
      if (query !== void 0) this._query = query;
    });
    on("vc-toggle-group", ({ status }) => {
      this._expanded = { ...this._expanded, [status]: !this._expanded[status] };
    });
    on("vc-pairing-search", (detail) => this._pairingSearch(detail));
    on("vc-pairing-reset", () => {
      this._pairing = { dish: "", foodIds: /* @__PURE__ */ new Set(), results: null, loading: false, error: null };
    });
  }
  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  _lastRefresh() {
    const iso = this._data?.last_refresh_time;
    if (!iso) return "Nooit";
    const d3 = new Date(iso);
    return Number.isNaN(d3.getTime()) ? iso : d3.toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  render() {
    const wines = this._wines;
    const total = wines.reduce((n4, w2) => n4 + w2.bottles.length, 0);
    return b2`
      <ha-card>
        <div class="card">
          <header class="hdr">
            <div class="logo"><ha-icon icon="mdi:barrel"></ha-icon></div>
            <div class="titles">
              <div class="title">${this.title}</div>
              <div class="muted sub">${total} flessen · bijgewerkt ${this._lastRefresh()}</div>
            </div>
            <button
              class="icon-btn ${this._refreshing ? "spinning" : ""}"
              title="Vernieuwen"
              aria-label="Vernieuwen"
              ?disabled=${this._refreshing}
              @click=${this._refresh}
            >
              <ha-icon icon="mdi:refresh"></ha-icon>
            </button>
          </header>

          ${this._data?.last_update_success === false ? b2`<div class="banner warn">
                <ha-icon icon="mdi:alert"></ha-icon>
                Laatste update van Vivino mislukt. Gegevens kunnen verouderd zijn; controleer de Vivino-sessie.
              </div>` : A}
          ${this._error ? b2`<div class="banner error"><ha-icon icon="mdi:alert-circle"></ha-icon>${this._error}</div>` : A}

          ${this._config.tabs.length > 1 ? b2`<nav class="tabs" role="tablist">
                ${this._config.tabs.map(
      (t3) => b2`<button
                    role="tab"
                    class="tab"
                    aria-selected=${this._tab === t3}
                    @click=${() => {
        this._tab = t3;
        this._focusDish = false;
      }}
                  >
                    ${TAB_LABELS[t3]}
                  </button>`
    )}
              </nav>` : A}

          ${this._loading && !this._data ? b2`<div class="empty">Kelder laden…</div>` : this._renderTab(wines)}
        </div>
      </ha-card>
      ${this._renderModals(wines)}
      <vc-toast-stack .pending=${[...this._pending.entries()]} .errors=${this._errors} .undoMs=${UNDO_MS}></vc-toast-stack>
    `;
  }
  _renderTab(wines) {
    if (this._tab === "now") {
      const pastPeak = wines.filter((w2) => w2.window_status === "past_peak").reduce((n4, w2) => n4 + w2.bottles.length, 0);
      return b2`<vc-now-tab
        .wines=${wines}
        .chip=${this._chip}
        .limit=${this.nowLimit}
        .hint=${this._weather}
        ?showEatChip=${this._config.tabs.includes("pairing")}
        .pastPeakCount=${pastPeak}
      ></vc-now-tab>`;
    }
    if (this._tab === "cellar") {
      return b2`<vc-cellar-tab
        .wines=${wines}
        .filters=${this._filters}
        .statusFilter=${this._statusFilter}
        .query=${this._query}
        .expanded=${this._expanded}
      ></vc-cellar-tab>`;
    }
    return b2`<vc-pairing-tab
      .wines=${wines}
      .categories=${this._data?.food_categories || []}
      .pairing=${this._pairing}
      ?focusDish=${this._focusDish}
    ></vc-pairing-tab>`;
  }
  _renderModals() {
    const detail = this._detailId !== null ? this._wine(this._detailId) : null;
    const picker = this._pickerId !== null ? this._wine(this._pickerId) : null;
    return b2`
      ${detail ? b2`<vc-detail-sheet
            .wine=${detail}
            .draft=${this._ratingDraft}
            .saved=${this._myRatings.get(this._detailId)}
          ></vc-detail-sheet>` : A}
      ${picker ? b2`<vc-spot-picker .wine=${picker}></vc-spot-picker>` : A}
    `;
  }
};
__publicField(VivinoCellarCard, "properties", {
  hass: { attribute: false },
  narrow: { type: Boolean },
  panel: { attribute: false },
  _config: { state: true },
  _data: { state: true },
  _loading: { state: true },
  _error: { state: true },
  _refreshing: { state: true },
  _tab: { state: true },
  _errors: { state: true },
  _detailId: { state: true },
  _pickerId: { state: true },
  _ratingDraft: { state: true },
  _statusFilter: { state: true },
  _filters: { state: true },
  _query: { state: true },
  _expanded: { state: true },
  _chip: { state: true },
  _pairing: { state: true }
});
__publicField(VivinoCellarCard, "styles", [
  tokenStyles,
  themeStyles,
  i`
      :host { display: block; }
      ha-card { overflow: visible; }
      .card { padding: 16px; container-type: inline-size; }
      .hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--vc-accent);
        background: color-mix(in srgb, var(--vc-accent) var(--vc-tint), transparent);
        flex: none;
      }
      .titles { flex: 1; min-width: 0; }
      .title { font-size: 18px; font-weight: 600; line-height: 1.2; }
      .sub { font-size: 12.5px; }
      .spinning ha-icon { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .banner {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        font-size: 13px;
        padding: 10px 12px;
        border-radius: var(--vc-radius-sm);
        margin-bottom: 12px;
      }
      .banner ha-icon { --mdc-icon-size: 18px; flex: none; }
      .banner.warn {
        color: var(--vc-status-near_past_peak);
        background: color-mix(in srgb, var(--vc-status-near_past_peak) var(--vc-tint), transparent);
      }
      .banner.error {
        color: var(--vc-status-past_peak);
        background: color-mix(in srgb, var(--vc-status-past_peak) var(--vc-tint), transparent);
      }
      .tabs {
        display: flex;
        gap: 2px;
        padding: 3px;
        margin-bottom: 12px;
        border-radius: 12px;
        background: var(--vc-surface-2);
      }
      .tab {
        flex: 1 1 0;
        min-width: 0;
        height: 34px;
        border: none;
        border-radius: 9px;
        background: transparent;
        color: var(--vc-muted);
        font-size: 13.5px;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tab[aria-selected="true"] {
        background: var(--vc-surface);
        color: var(--vc-text);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      }
      @container (max-width: 360px) {
        .card { padding: 12px; }
        .tab { font-size: 12.5px; }
      }
    `
]);
if (!customElements.get("vivino-cellar-card")) {
  customElements.define("vivino-cellar-card", VivinoCellarCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((c4) => c4.type === "vivino-cellar-card")) {
  window.customCards.push({
    type: "vivino-cellar-card",
    name: "Vivino Cellar Card",
    description: "Vivino cellar: what to drink tonight, food pairing and the whole cellar",
    preview: false
  });
}
export {
  STATUS_ORDER,
  VivinoCellarCard
};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
