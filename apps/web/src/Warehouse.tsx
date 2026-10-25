/** Original vector scenery; devices and parcels remain live HTML controls. */
export function Warehouse() {
  return (
    <svg
      className="warehouse-art"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor="#c6d8df" />
          <stop offset="1" stopColor="#839da9" />
        </linearGradient>
        <linearGradient id="ground" x2="0" y2="1">
          <stop stopColor="#607c8a" />
          <stop offset="1" stopColor="#a0b5bc" />
        </linearGradient>
        <pattern
          id="tiles"
          width="100"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M100 0H0V50"
            fill="none"
            stroke="#d0dfe4"
            strokeOpacity=".14"
          />
        </pattern>
        <pattern
          id="rollers"
          width="15"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <rect width="15" height="80" fill="#263c4b" />
          <path d="M3 0V80M6 0V80" stroke="#69828d" strokeWidth="2" />
        </pattern>
        <linearGradient id="glass" x2="0" y2="1">
          <stop stopColor="#a5d9ec" />
          <stop offset="1" stopColor="#edf7ef" />
        </linearGradient>
      </defs>
      <path fill="url(#wall)" d="M0 0H1000V350H0z" />
      <path fill="url(#ground)" d="M0 350H1000V600H0z" />
      <path fill="url(#tiles)" d="M0 350H1000V600H0z" />
      {[65, 315, 565, 815].map((x) => (
        <g key={x}>
          <rect x={x} y="42" width="155" height="108" rx="3" fill="#55727f" />
          <rect x={x + 7} y="49" width="141" height="94" fill="url(#glass)" />
          <path
            d={`M${x + 78} 49V143M${x + 7} 100H${x + 148}`}
            stroke="#eff7f6"
            strokeWidth="6"
          />
        </g>
      ))}
      {[25, 265, 515, 765, 975].map((x) => (
        <g key={x}>
          <rect x={x} width="12" height="355" fill="#4b6573" />
          <rect x={x + 3} width="3" height="355" fill="#90a6b0" />
          <rect x={x - 3} y="300" width="18" height="55" fill="#e7bb55" />
        </g>
      ))}
      <path d="M0 18H1000M0 165H1000" stroke="#55717f" strokeWidth="8" />
      {[145, 395, 645, 895].map((x) => (
        <g key={x}>
          <path d={`M${x} 0V25`} stroke="#223c4c" strokeWidth="3" />
          <path
            d={`M${x - 17} 40L${x - 7} 25H${x + 7}L${x + 17} 40Z`}
            fill="#263e4d"
          />
          <path
            d={`M${x - 13} 42H${x + 13}`}
            stroke="#fff2b8"
            strokeWidth="4"
          />
        </g>
      ))}
      {[290, 540].map((x) => (
        <g key={x}>
          <rect x={x} y="193" width="155" height="145" fill="#314e61" />
          {[198, 250, 302].map((y) => (
            <g key={y}>
              <path
                d={`M${x} ${y + 30}H${x + 155}`}
                stroke="#ddaa52"
                strokeWidth="6"
              />
              {[7, 56, 106].map((dx, i) => (
                <g key={dx}>
                  <rect
                    x={x + dx}
                    y={y}
                    width="40"
                    height="27"
                    fill={i === 1 ? '#d5b787' : '#6587a0'}
                  />
                  <path
                    d={`M${x + dx + 15} ${y}V${y + 27}`}
                    stroke="#e4d6ae"
                    strokeWidth="6"
                  />
                </g>
              ))}
            </g>
          ))}
          <path
            d={`M${x} 190V345M${x + 155} 190V345`}
            stroke="#567d9b"
            strokeWidth="8"
          />
        </g>
      ))}
      {[0, 920].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="185"
            width="80"
            height="180"
            fill="#263b49"
            stroke="#d0dde0"
            strokeWidth="8"
          />
          <path
            d={`M${x + 8} 202H${x + 72}M${x + 8} 216H${x + 72}M${x + 8} 230H${x + 72}`}
            stroke="#526c7b"
            strokeWidth="5"
          />
          <rect x={x + 15} y="282" width="48" height="70" fill="#b59a71" />
          <path d={`M${x + 39} 282V352`} stroke="#e4d3ac" strokeWidth="8" />
        </g>
      ))}
      <path
        d="M90 600L170 350M900 600L830 350"
        stroke="#f4cf69"
        strokeWidth="9"
      />
      <path
        d="M130 600L200 350M860 600L800 350"
        stroke="#e6eef0"
        strokeWidth="3"
        strokeDasharray="24 20"
      />
      <ellipse cx="480" cy="550" rx="70" ry="14" fill="#234353" opacity=".25" />
      <g className="warehouse-cart">
        <path d="M425 515L478 495L536 515L480 540Z" fill="#35566e" />
        <path
          d="M425 515V532L480 556V540ZM480 540L536 515V532L480 556"
          fill="#233c50"
        />
        <path d="M448 486L480 474L514 486L480 500Z" fill="#dec59a" />
        <path d="M448 486V517L480 531V500" fill="#b99766" />
        <path d="M480 500L514 486V517L480 531" fill="#c8ab7e" />
        <path
          d="M437 535L451 541M509 541L524 535"
          stroke="#73e7ce"
          strokeWidth="4"
        />
      </g>
      <path
        d="M0 379H1000V443H0Z"
        fill="url(#rollers)"
        stroke="#263e50"
        strokeWidth="5"
      />
      <path d="M0 379H1000M0 444H1000" stroke="#b5c7cb" strokeWidth="7" />
      {[100, 350, 600, 850].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 449V482M${x + 65} 449V482`}
            stroke="#3d5969"
            strokeWidth="9"
          />
          <path
            d={`M${x + 40} 408h40m-10-10 10 10-10 10`}
            stroke="#9edbd7"
            strokeWidth="3"
            fill="none"
            opacity=".6"
          />
        </g>
      ))}
      <text
        x="42"
        y="570"
        fill="#35576b"
        fontSize="14"
        fontFamily="monospace"
        letterSpacing="4"
      >
        OPS / FLOOR 01
      </text>
    </svg>
  );
}
