
import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/app/_components/map"), );

export default function Home() {
  return (
    <div>
      <Map/>
    </div>
  );
}
