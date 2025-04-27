
import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/app/_components/map"), );

export default function Home() {
  return (
    <div>
      <h1>Welcome to Next.js with Leaflet!</h1>
      <Map/>
    </div>
  );
}
