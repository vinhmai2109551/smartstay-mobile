import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

/**
 * SmartStay AI mark — the same artwork as the web chatbot
 * (frontend/src/assets/icon/smartstay-ai.svg; `bordered` = smartstay-ai-bordered.svg).
 */
export function SmartStayAiIcon({
  size = 40,
  bordered = false,
}: {
  size?: number;
  bordered?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="ssBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4F46E5" />
          <Stop offset="1" stopColor="#7C3AED" />
        </LinearGradient>
      </Defs>
      <Circle
        cx="50"
        cy="50"
        r="46"
        fill="url(#ssBg)"
        stroke={bordered ? "#FFFFFF" : undefined}
        strokeWidth={bordered ? 4 : undefined}
      />
      <Rect x="34" y="26" width="28" height="12" rx="3" fill="#FCD34D" />
      <Rect x="29" y="36" width="38" height="5" rx="2.5" fill="#F59E0B" />
      <Rect x="25" y="43" width="46" height="34" rx="12" fill="#FFFFFF" />
      <Path
        d="M35 59Q39 53 43 59M53 59Q57 53 61 59"
        fill="none"
        stroke="#5B44E6"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M42 67Q48 71 54 67"
        fill="none"
        stroke="#5B44E6"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle
        cx="80"
        cy="80"
        r="14"
        fill="#FCD34D"
        stroke="#0B1E46"
        strokeWidth={3}
      />
      <Circle cx="80" cy="74.5" r="1.8" fill="#92400E" />
      <Path d="M73 84A7 7 0 0 1 87 84Z" fill="#92400E" />
      <Rect x="71" y="85" width="18" height="3" rx="1.5" fill="#92400E" />
    </Svg>
  );
}
