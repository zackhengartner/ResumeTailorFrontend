import GoogleTemplate from "./templates/GoogleTemplate";
import HarvardTemplate from "./templates/HarvardTemplate";
import ATSTemplate from "./templates/ATSTemplate";
import ModernTemplate from "./templates/ModernTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";
import ExecutiveTemplate from "./templates/ExecutiveTemplate";
import SignatureTemplate from "./templates/SignatureTemplate";
import SWETemplate from "./templates/SWETemplate";
import ClassicSerifTemplate from "./templates/ClassicSerifTemplate";
import LatexTemplate from "./templates/LatexTemplate";

const TEMPLATES = {
  google: GoogleTemplate,
  harvard: HarvardTemplate,
  ats: ATSTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  signature: SignatureTemplate,
  swe: SWETemplate,
  classicserif: ClassicSerifTemplate,
  latex: LatexTemplate,
};

export default function ResumeRenderer({ layout, data }) {
  const Template = TEMPLATES[layout] || ATSTemplate;
  return <Template data={data} />;
}
