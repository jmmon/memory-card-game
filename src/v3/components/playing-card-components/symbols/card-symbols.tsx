import { component$ } from "@builder.io/qwik";

/* 
* Symbols are pre-loaded directly in the html
* so they can be accessed by our SVGs instantly
* */

export default component$(() => {
  return (
    <>
      <svg data-usage="card-symbols" style="display: none;">
        <defs>
          {/*
            <!-- Symbols S H C D -->
          */}

          <symbol
            id="symbol-spades"
            viewBox="-600 -600 1200 1200"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M0 -500C100 -250 355 -100 355 185A150 150 0 0 1 55 185A10 10 0 0 0 35 185C35 385 85 400 130 500L-130 500C-85 400 -35 385 -35 185A10 10 0 0 0 -55 185A150 150 0 0 1 -355 185C-355 -100 -100 -250 0 -500Z"
              fill="black"
            ></path>
          </symbol>
          <symbol
            id="symbol-hearts"
            viewBox="-600 -600 1200 1200"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M0 -300C0 -400 100 -500 200 -500C300 -500 400 -400 400 -250C400 0 0 400 0 500C0 400 -400 0 -400 -250C-400 -400 -300 -500 -200 -500C-100 -500 0 -400 -0 -300Z"
              fill="red"
            ></path>
          </symbol>
          <symbol
            id="symbol-clubs"
            viewBox="-600 -600 1200 1200"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M30 150C35 385 85 400 130 500L-130 500C-85 400 -35 385 -30 150A10 10 0 0 0 -50 150A210 210 0 1 1 -124 -51A10 10 0 0 0 -110 -65A230 230 0 1 1 110 -65A10 10 0 0 0 124 -51A210 210 0 1 1 50 150A10 10 0 0 0 30 150Z"
              fill="black"
            ></path>
          </symbol>
          <symbol
            id="symbol-diamonds"
            viewBox="-600 -600 1200 1200"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-400 0C-350 0 0 -450 0 -500C0 -450 350 0 400 0C350 0 0 450 0 500C0 450 -350 0 -400 0Z"
              fill="red"
            ></path>
          </symbol>

          {/*
            border 
          */}
          <rect
            id="card-border"
            width="239"
            height="335"
            x="-119.5"
            y="-167.5"
            fill="#fff"
            stroke="#000"
            rx="12"
            ry="12"
          />

          {/*
            <!-- inner square -->
          */}
          <path id="card-square" d="M-82.4-130.4H82.4v260.8H-82.4z" />

          {/*
            <!-- Corner Numbers -->
          */}
          <symbol
            id="ace-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-270 460L-110 460M-200 450L0 -460L200 450M110 460L270 460M-120 130L120 130"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="ace-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-270 460L-110 460M-200 450L0 -460L200 450M110 460L270 460M-120 130L120 130"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="2-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-225 -225C-245 -265 -200 -460 0 -460C 200 -460 225 -325 225 -225C225 -25 -225 160 -225 460L225 460L225 300"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="2-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-225 -225C-245 -265 -200 -460 0 -460C 200 -460 225 -325 225 -225C225 -25 -225 160 -225 460L225 460L225 300"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="3-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-250 -320L-250 -460L200 -460L-110 -80C-100 -90 -50 -120 0 -120C200 -120 250 0 250 150C250 350 170 460 -30 460C-230 460 -260 300 -260 300"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="3-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-250 -320L-250 -460L200 -460L-110 -80C-100 -90 -50 -120 0 -120C200 -120 250 0 250 150C250 350 170 460 -30 460C-230 460 -260 300 -260 300"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="4-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M50 460L250 460M150 460L150 -460L-300 175L-300 200L270 200"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="4-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M50 460L250 460M150 460L150 -460L-300 175L-300 200L270 200"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="5-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M170 -460L-175 -460L-210 -115C-210 -115 -200 -200 0 -200C100 -200 255 -80 255 120C255 320 180 460 -20 460C-220 460 -255 285 -255 285"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="5-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M170 -460L-175 -460L-210 -115C-210 -115 -200 -200 0 -200C100 -200 255 -80 255 120C255 320 180 460 -20 460C-220 460 -255 285 -255 285"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="6-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-250 100A250 250 0 0 1 250 100L250 210A250 250 0 0 1 -250 210L-250 -210A250 250 0 0 1 0 -460C150 -460 180 -400 200 -375"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="6-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-250 100A250 250 0 0 1 250 100L250 210A250 250 0 0 1 -250 210L-250 -210A250 250 0 0 1 0 -460C150 -460 180 -400 200 -375"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="7-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-265 -320L-265 -460L265 -460C135 -200 -90 100 -90 460"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="7-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-265 -320L-265 -460L265 -460C135 -200 -90 100 -90 460"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="8-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-1 -50A205 205 0 1 1 1 -50L-1 -50A255 255 0 1 0 1 -50Z"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="8-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-1 -50A205 205 0 1 1 1 -50L-1 -50A255 255 0 1 0 1 -50Z"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="9-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M250 -100A250 250 0 0 1 -250 -100L-250 -210A250 250 0 0 1 250 -210L250 210A250 250 0 0 1 0 460C-150 460 -180 400 -200 375"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="9-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M250 -100A250 250 0 0 1 -250 -100L-250 -210A250 250 0 0 1 250 -210L250 210A250 250 0 0 1 0 460C-150 460 -180 400 -200 375"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          {/*
            <!-- 10 -->
          */}
          <symbol
            id="0-black"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-260 430L-260 -430M-50 0L-50 -310A150 150 0 0 1 250 -310L250 310A150 150 0 0 1 -50 310Z"
              stroke="black"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>
          <symbol
            id="0-red"
            viewBox="-500 -500 1000 1000"
            preserveAspectRatio="xMinYMid"
          >
            <path
              d="M-260 430L-260 -430M-50 0L-50 -310A150 150 0 0 1 250 -310L250 310A150 150 0 0 1 -50 310Z"
              stroke="red"
              stroke-width="80"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              fill="none"
            ></path>
          </symbol>

          <symbol
            id="j-black"
            preserveAspectRatio="xMinYMid"
            viewBox="-500 -500 1000 1000"
          >
            <path
              fill="none"
              stroke="#000"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              stroke-width="80"
              d="M50-460h200m-100 0v710a100 100 0 0 1-400 0v-30"
            />
          </symbol>
          <symbol
            id="j-red"
            preserveAspectRatio="xMinYMid"
            viewBox="-500 -500 1000 1000"
          >
            <path
              fill="none"
              stroke="red"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              stroke-width="80"
              d="M50-460h200m-100 0v710a100 100 0 0 1-400 0v-30"
            />
          </symbol>

          <symbol
            id="q-black"
            preserveAspectRatio="xMinYMid"
            viewBox="-500 -500 1000 1000"
          >
            <path
              fill="none"
              stroke="#000"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              stroke-width="80"
              d="M-260 100c300 0 220 360 520 360M-175 0v-285a175 175 0 0 1 350 0v570a175 175 0 0 1-350 0Z"
            />
          </symbol>
          <symbol
            id="q-red"
            preserveAspectRatio="xMinYMid"
            viewBox="-500 -500 1000 1000"
          >
            <path
              fill="none"
              stroke="red"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              stroke-width="80"
              d="M-260 100c300 0 220 360 520 360M-175 0v-285a175 175 0 0 1 350 0v570a175 175 0 0 1-350 0Z"
            />
          </symbol>

          <symbol
            id="k-black"
            preserveAspectRatio="xMinYMid"
            viewBox="-500 -500 1000 1000"
          >
            <path
              fill="none"
              stroke="#000"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              stroke-width="80"
              d="M-285-460h200m-100 0v920m-100 0h200M85-460h200m-100 20-355 595M85 460h200m-100-20L-10-70"
            />
          </symbol>
          <symbol
            id="k-red"
            preserveAspectRatio="xMinYMid"
            viewBox="-500 -500 1000 1000"
          >
            <path
              fill="none"
              stroke="red"
              stroke-linecap="square"
              stroke-miterlimit="1.5"
              stroke-width="80"
              d="M-285-460h200m-100 0v920m-100 0h200M85-460h200m-100 20-355 595M85 460h200m-100-20L-10-70"
            />
          </symbol>
        </defs>
      </svg>
    </>
  );
});
