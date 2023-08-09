import{l as c,G as P,P as v,I as y,C as p,a as I,$ as u,w as o,c as l,_ as i,p as T}from"./q-b0c5ea11.js";import{C as b,a as g,g as A,b as x,c as L}from"./q-ad44cc7e.js";import{A as R}from"./q-01d7dbd8.js";const E=()=>{const[e,a]=c(),s=(e.boardLayout.columns-1)/2,r=(e.boardLayout.rows-1)/2,n=e.boardLayout.height/e.boardLayout.rows,m=e.boardLayout.width/e.boardLayout.columns,_=s-a.value.x,h=m*_,f=r-a.value.y,t=n*f,w=a.value.x<e.boardLayout.columns/2;return`translateX(${h}px) 
        translateY(${t}px) 
        rotateY(${w?"":"-"}180deg) 
        scale(2)`},D=`
    .shake-card {
      animation: shake-card ${b}ms;
    }

    @keyframes shake-card {
      0% {
        transform: translateX(0%);
      }
      10% {
        transform: translateX(-7%);  
        box-shadow: 5px 0px 5px 5px rgba(255, 63, 63, 0.5);
      }
      23% {
        transform: translateX(5%);  
        box-shadow: -4px 0px 4px 4px rgba(255, 63, 63, 0.4);
      }
      56% {
        transform: translateX(-3%);  
        box-shadow: 3px 0px 3px 3px rgba(255, 63, 63, 0.3);
      }
      84% {
        transform: translateX(1%);  
        box-shadow: -2px 0px 2px 2px rgba(255, 63, 63, 0.2);
      }
      100% {
        transform: translateX(0%);  
        box-shadow: 1px 0px 1px 1px rgba(255, 63, 63, 0.1);
      }
    }
  `,O=e=>{const a=P(R),s=v(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_UwZAWmVpfpc",[a,e])),r=y(!1);p(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_uy0IYF0bCe4",[s,r]));const n=v(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_phd9q70lXoo",[a,e])),m=y(!1);p(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_ItqywBfH0Hs",[n,m]));const _=v(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_uITHJWgWGWM",[a,e])),h=v(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_FwPK69jgjy4",[a,_]));I(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_Yl5HlkVkVDw"));const f=y(!1);return p(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_wjyzvEMkgN0",[e,f])),p(l(()=>i(()=>Promise.resolve().then(()=>d),void 0),"s_g8uoQ9h9U3w",[f])),u("div",{style:{width:a.cardLayout.width+"px",height:a.cardLayout.height+"px",gridColumn:`${_.value.x+1} / ${_.value.x+2}`,gridRow:`${_.value.y+1} / ${_.value.y+2}`,zIndex:n.value?20:m.value?10:0,borderRadius:a.cardLayout.roundedCornersPx+"px"}},{class:"mx-auto aspect-[2.25/3.5] flex flex-col justify-center transition-all"},u("div",{class:`w-[90%] h-[90%] mx-auto [perspective:1400px] bg-transparent border border-gray-50/20 flip-card transition-all [animation-timing-function:ease-in-out] ${r.value&&a.game.flippedCardId!==e.card.id&&a.game.flippedCardId!==e.card.pairId?"opacity-0 scale-105":"opacity-100 scale-100 cursor-pointer"} ${f.value===!0?"shake-card":""}`},{"data-id":o(t=>t.card.id,[e]),style:o(t=>({borderRadius:t.cardLayout.roundedCornersPx+"px"}),[a])},u("div",{style:{transform:n.value?h.value:"",transitionDuration:g+"ms",borderRadius:a.cardLayout.roundedCornersPx+"px"}},{class:"w-full h-full relative text-center [transform-style:preserve-3d] [transition-property:transform]","data-id":o(t=>t.card.id,[e])},[u("div",null,{class:"absolute w-full h-full border-2 border-gray-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden]","data-id":o(t=>t.card.id,[e]),style:o(t=>({borderRadius:t.cardLayout.roundedCornersPx+"px"}),[a])},u("div",null,{class:"w-1/2 h-auto aspect-square rounded-[50%] bg-white/40 mx-auto flex flex-col justify-center items-center","data-id":o(t=>t.card.id,[e]),"data-name":"circle"},null,3,null),3,null),u("div",null,{class:"absolute w-full border border-white h-full flex justify-center items-center text-black bg-gray-300 [transform:rotateY(180deg)] [backface-visibility:hidden] ","data-id":o(t=>t.card.id,[e]),style:o(t=>({borderRadius:t.cardLayout.roundedCornersPx+"px"}),[a])},m.value&&(e.card.image?u("img",null,{class:"w-full h-full",src:o(t=>t.card.image,[e])},null,3,"z4_0"):u("div",null,{"data-id":o(t=>t.card.id,[e])},o(t=>t.card.text,[e]),3,null)),1,null)],1,null),1,null),1,"z4_1")},k=()=>{const[e,a]=c();return A(a.card.position,e.boardLayout.columns)},C=e=>{const[a,s]=c();e.track(()=>a.value);let r;const n=.5;a.value===!1?r=setTimeout(()=>{s.value=!1},x+x*n):r=setTimeout(()=>{s.value=!0},x-x*n),e.cleanup(()=>{r&&clearTimeout(r)})},S=e=>{const[a]=c();if(e.track(()=>a.value),a.value===!1)return;let s;s=setTimeout(()=>{a.value=!1},b),e.cleanup(()=>{s&&clearTimeout(s)})},V=()=>{const[e,a]=c();return e.game.flippedCardId===a.card.id},M=()=>{const[e,a]=c();return L(e.game.successfulPairs).includes(a.card.id)},j=e=>{const[a,s]=c();if(e.track(()=>a.card.isMismatched),a.card.isMismatched===!1)return;let r;r=setTimeout(()=>{a.card.isMismatched=!1,s.value=!0},g-200),e.cleanup(()=>{r&&clearTimeout(r)})},$=e=>{const[a,s]=c();e.track(()=>a.value);let r;a.value===!1?s.value=!1:r=setTimeout(()=>{s.value=!0},g),e.cleanup(()=>{r&&clearTimeout(r)})},d=Object.freeze(Object.defineProperty({__proto__:null,_hW:T,s_FwPK69jgjy4:E,s_ItqywBfH0Hs:C,s_PgJv50da8U4:O,s_UwZAWmVpfpc:M,s_Yl5HlkVkVDw:D,s_g8uoQ9h9U3w:S,s_phd9q70lXoo:V,s_uITHJWgWGWM:k,s_uy0IYF0bCe4:$,s_wjyzvEMkgN0:j},Symbol.toStringTag,{value:"Module"}));export{T as _hW,E as s_FwPK69jgjy4,C as s_ItqywBfH0Hs,O as s_PgJv50da8U4,M as s_UwZAWmVpfpc,D as s_Yl5HlkVkVDw,S as s_g8uoQ9h9U3w,V as s_phd9q70lXoo,k as s_uITHJWgWGWM,$ as s_uy0IYF0bCe4,j as s_wjyzvEMkgN0};
