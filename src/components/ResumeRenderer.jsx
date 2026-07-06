import GoogleTemplate from "./templates/GoogleTemplate";
import HarvardTemplate from "./templates/HarvardTemplate";
import ATSTemplate from "./templates/ATSTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ExecutiveTemplate from "./templates/ExecutiveTemplate";
import SignatureTemplate from "./templates/SignatureTemplate";

const TEMPLATES = {
  google: GoogleTemplate,
  harvard: HarvardTemplate,
  ats: ATSTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  signature: SignatureTemplate,
};

export default function ResumeRenderer({ layout, data }) {
  const Template = TEMPLATES[layout] || ATSTemplate;
  return <Template data={data} />;
}
