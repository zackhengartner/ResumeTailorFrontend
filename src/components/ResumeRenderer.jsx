import GoogleTemplate from "./templates/GoogleTemplate";
import HarvardTemplate from "./templates/HarvardTemplate";
import ATSTemplate from "./templates/ATSTemplate";

export default function ResumeRenderer({ layout, data }) {
  if (layout === "google") return <GoogleTemplate data={data} />;
  if (layout === "harvard") return <HarvardTemplate data={data} />;
  return <ATSTemplate data={data} />;
}