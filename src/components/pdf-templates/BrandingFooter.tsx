import { Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    fontFamily: "Helvetica",
  },
});

/**
 * Tiny subtle branding footer shown on Free-tier PDFs as the upgrade hook.
 * Pro / Lifetime tiers pass show=false and this renders nothing.
 *
 * Uses react-pdf's `fixed` prop so it appears on every page in multi-page docs.
 */
export function BrandingFooter({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Text style={styles.footer} fixed>
      Dibuat dengan doxpro · doxpro.id
    </Text>
  );
}
