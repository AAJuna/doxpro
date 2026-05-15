import type { PdfTemplateProps } from "./types";
import { ModernTemplate } from "./ModernTemplate";
import { ClassicTemplate } from "./ClassicTemplate";
import { CompactTemplate } from "./CompactTemplate";

export function PdfTemplate(props: PdfTemplateProps) {
  switch (props.doc.customizations.style) {
    case "classic":
      return <ClassicTemplate {...props} />;
    case "compact":
      return <CompactTemplate {...props} />;
    case "modern":
    default:
      return <ModernTemplate {...props} />;
  }
}

export { ModernTemplate, ClassicTemplate, CompactTemplate };
