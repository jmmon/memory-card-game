import{l as u,I as m,P as v,C as b,$ as i,w as o,c as s,_ as d,a as x,p as y}from"./q-b0c5ea11.js";import{CARD_FLIP_ANIMATION_DURATION as g,CARD_FLIP_ANIMATION_DURATION_HALF as _}from"./q-be04c247.js";import{MIN_MAX_COLUMNS_OFFSET as T,MIN_MAX_ROWS_OFFSET as I,COLUMN_COUNT as w,isCardRemoved as P,getXYFromPosition as k}from"./q-c0a5c9c7.js";const O=()=>{const[e]=u();return String(e.flippedCardId.value)===e.card.id},$=e=>{const r=m(!1),a=v(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_q1vfKdrYjyM",[e])),l=v(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_0ppQ0MndseM",[e]));b(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_fFlaNr0DGX4",[r,a]));const f=v(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_3ythHt3w8u8",[e])),p=v(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_0BV2GzxLSEg",[f,e]));return i("div",{class:`[perspective:1400px] aspect-[2.25/3.5] m-auto w-full max-w-full h-auto max-h-full bg-transparent border rounded-[12px] border-gray-50/20 flip-card transition-all ${l.value&&String(e.flippedCardId.value)!==e.card.id&&String(e.flippedCardId.value)!==e.card.pairId?"opacity-0":"opacity-100 cursor-pointer"}`},{"data-id":o(t=>t.card.id,[e]),style:o((t,n,h)=>({gridColumn:`${t.value.x+1} / ${t.value.x+2}`,gridRow:`${t.value.y+1} / ${t.value.y+2}`,zIndex:h.value||n.value?1e3:0}),[f,r,a])},i("div",null,{class:`w-full h-full relative text-center [transform-style:preserve-3d]   [transition-property:transform]  duration-[${g}ms] rounded-[12px]`,"data-id":o(t=>t.card.id,[e]),style:o((t,n)=>n.value?{transform:t.value}:"",[p,a])},[i("div",null,{class:"absolute w-full h-full border-2 border-gray-50 text-white bg-[dodgerblue] flex flex-col justify-center [backface-visibility:hidden] rounded-[12px]","data-id":o(t=>t.card.id,[e])},i("div",null,{class:"w-1/2 h-auto aspect-square rounded-[50%] bg-white/40 mx-auto","data-id":o(t=>t.card.id,[e])},null,3,null),3,null),i("div",null,{class:"absolute w-full h-full border-2 border-gray-50 text-black bg-gray-300 [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-[12px]","data-id":o(t=>t.card.id,[e])},i("div",null,{class:"flex justify-center items-center w-full h-full ","data-id":o(t=>t.card.id,[e])},o((t,n)=>t.value?n.card.text:"",[r,e]),3,null),3,null)],3,null),3,"CD_0")},F=()=>{const[e,r]=u(),a=T-e.value.x,f=(r.slotDimensions.value.width+r.gap)*a,p=I-e.value.y,n=(r.slotDimensions.value.height+r.gap)*p,h=e.value.x<w/2;return`translateX(${f}px) 
        translateY(${n}px) 
        rotateY(${h?"":"-"}180deg) 
        scale(2)`},S=`
    /* container, set width/height */
    .flip-card {
      width: 250px;
      height: 400px;
      background-color: transparent; 
      border: 1px solid #f1f1f120;
      border-radius: 10px;
      perspective: 700px; /* for 3D effect, adjust based on width, and card area compared to viewport */

      margin: auto; /* center in frame */
    }

    /* front and back varying styles */
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform ${g}ms;
      transform-style: preserve-3d;
    }

    /* set up front/back, make backface hidden */
    .flip-card-inner .back,
    .flip-card-inner .front {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid #f1f1f1;

      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;    
    }

    /* front and back varying styles */
    .flip-card-inner .front {
      background-color: #bbb;
      color: black;
      transform: rotateY(180deg);
    }
    .flip-card-inner .back {
      background-color: dodgerblue;
      color: white;
    }

    .flip-card-inner .back .circle {
      border-radius: 50%;
      background-color: #ffffff40;
      width: 100px;
      height: 100px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }


    /* this runs the horizontal flip when we have 'flipped' class added */
    .flip-card.flipped .flip-card-inner {
      transform: rotateY(180deg) scale(2);
    }

    `,A=e=>{const[r,a]=u();e.track(()=>a.value);let l;a.value?l=setTimeout(()=>{r.value=!0},_-100):l=setTimeout(()=>{r.value=!1},_+100),e.cleanup(()=>{l&&clearTimeout(l)})},D=e=>{const[r,a]=u();e.track(()=>a.isFrontShowing.value);let l;a.isFrontShowing.value?l=setTimeout(()=>{r.value=!0},_-100):l=setTimeout(()=>{r.value=!1},_+100),e.cleanup(()=>{l&&clearTimeout(l)})},E=()=>{const[e]=u();return P(e.pairs.value,Number(e.card.id))},L=e=>{const r=m(!1);return x(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_MN060JazZFc")),b(s(()=>d(()=>Promise.resolve().then(()=>c),void 0),"s_cqQt6GbyILc",[r,e])),i("div",{onClick$:e.handleToggle$},{class:o(a=>`flip-card ${a.isFrontShowing.value?"flipped":""} rounded-md transition-all cursor-pointer ${a.isRemoved.value?"opacity-0":"opacity-100"}`,[e])},i("div",null,{class:"flip-card-inner rounded-md"},[i("div",null,{class:"back  rounded-md"},i("div",null,{class:"circle"},null,3,null),3,null),i("div",null,{class:"front  rounded-md"},i("div",null,{class:" flex justify-center items-center w-full h-full "},o((a,l)=>a.value?l.cardText:"",[r,e]),3,null),3,null)],3,null),2,"pm_2")},R=()=>{const[e]=u();return k(e.card.position,w)},c=Object.freeze(Object.defineProperty({__proto__:null,_hW:y,s_0BV2GzxLSEg:F,s_0ppQ0MndseM:E,s_3ythHt3w8u8:R,s_MN060JazZFc:S,s_cqQt6GbyILc:D,s_fFlaNr0DGX4:A,s_q1vfKdrYjyM:O,s_u06161XpKuY:L,s_vJDFZyqLvzw:$},Symbol.toStringTag,{value:"Module"}));export{y as _hW,F as s_0BV2GzxLSEg,E as s_0ppQ0MndseM,R as s_3ythHt3w8u8,S as s_MN060JazZFc,D as s_cqQt6GbyILc,A as s_fFlaNr0DGX4,O as s_q1vfKdrYjyM,L as s_u06161XpKuY,$ as s_vJDFZyqLvzw};
