import type { PdfTemplateProps } from "./types";
import { ModernTemplate } from "./ModernTemplate";
import { ClassicTemplate } from "./ClassicTemplate";
import { CompactTemplate } from "./CompactTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { BrandedHeroTemplate } from "./BrandedHeroTemplate";
import { ServiceTemplate } from "./ServiceTemplate";
import { BilingualTemplate } from "./BilingualTemplate";
import { ConstructionTemplate } from "./ConstructionTemplate";
import { RetailReceiptTemplate } from "./RetailReceiptTemplate";

export function PdfTemplate(props: PdfTemplateProps) {
  switch (props.doc.customizations.style) {
    case "classic":
      return <ClassicTemplate {...props} />;
    case "compact":
      return <CompactTemplate {...props} />;
    case "minimal":
      return <MinimalTemplate {...props} />;
    case "branded":
      return <BrandedHeroTemplate {...props} />;
    case "service":
      return <ServiceTemplate {...props} />;
    case "bilingual":
      return <BilingualTemplate {...props} />;
    case "construction":
      return <ConstructionTemplate {...props} />;
    case "retail":
      return <RetailReceiptTemplate {...props} />;
    case "modern":
    default:
      return <ModernTemplate {...props} />;
  }
}

export {
  ModernTemplate,
  ClassicTemplate,
  CompactTemplate,
  MinimalTemplate,
  BrandedHeroTemplate,
  ServiceTemplate,
  BilingualTemplate,
  ConstructionTemplate,
  RetailReceiptTemplate,
};
