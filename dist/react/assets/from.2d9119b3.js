import{o as l,c as d,k as a,b as f,O as i,h as I,l as O,r as w,p as h,q as S,t as k,v as A,w as y,x as L,y as E}from"./remesh-logger.7aafe251.js";function v(e,n){return n===void 0&&(n=0),l(function(r,t){r.subscribe(d(t,function(o){return a(t,e,function(){return t.next(o)},n)},function(){return a(t,e,function(){return t.complete()},n)},function(o){return a(t,e,function(){return t.error(o)},n)}))})}function m(e,n){return n===void 0&&(n=0),l(function(r,t){t.add(e.schedule(function(){return r.subscribe(t)},n))})}function F(e,n){return f(e).pipe(m(n),v(n))}function P(e,n){return f(e).pipe(m(n),v(n))}function R(e,n){return new i(function(r){var t=0;return n.schedule(function(){t===e.length?r.complete():(r.next(e[t++]),r.closed||this.schedule())})})}function T(e,n){return new i(function(r){var t;return a(r,n,function(){t=e[O](),a(r,n,function(){var o,u,c;try{o=t.next(),u=o.value,c=o.done}catch(x){r.error(x);return}c?r.complete():r.next(u)},0,!0)}),function(){return I(t==null?void 0:t.return)&&t.return()}})}function s(e,n){if(!e)throw new Error("Iterable cannot be null");return new i(function(r){a(r,n,function(){var t=e[Symbol.asyncIterator]();a(r,n,function(){t.next().then(function(o){o.done?r.complete():r.next(o.value)})},0,!0)})})}function g(e,n){return s(w(e),n)}function q(e,n){if(e!=null){if(h(e))return F(e,n);if(S(e))return R(e,n);if(k(e))return P(e,n);if(A(e))return s(e,n);if(y(e))return T(e,n);if(L(e))return g(e,n)}throw E(e)}function _(e,n){return n?q(e,n):f(e)}export{_ as f};
//# sourceMappingURL=from.2d9119b3.js.map
