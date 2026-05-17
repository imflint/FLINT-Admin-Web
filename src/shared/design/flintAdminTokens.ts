import type { ThemeConfig } from "antd";

export const flintAdminTokens = {
  colorPrimary: "#1677FF",
  colorSecondary: "#8B5CF6",
  colorSuccess: "#16A34A",
  colorWarning: "#D97706",
  colorDanger: "#DC2626",
  colorBgContainer: "#FFFFFF",
  colorText: "#111827",
  borderRadius: 8,
  fontFamily:
    "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif",
  fontFamilyMono: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
} as const;

export const flintAntTheme: ThemeConfig = {
  token: {
    colorPrimary: flintAdminTokens.colorPrimary,
    colorSuccess: flintAdminTokens.colorSuccess,
    colorWarning: flintAdminTokens.colorWarning,
    colorError: flintAdminTokens.colorDanger,
    colorBgContainer: flintAdminTokens.colorBgContainer,
    colorText: flintAdminTokens.colorText,
    borderRadius: flintAdminTokens.borderRadius,
    fontFamily: flintAdminTokens.fontFamily
  },
  components: {
    Layout: {
      bodyBg: "#F6F8FB",
      headerBg: flintAdminTokens.colorBgContainer,
      siderBg: flintAdminTokens.colorBgContainer
    },
    Card: {
      borderRadiusLG: flintAdminTokens.borderRadius
    },
    Table: {
      headerBg: "#F9FAFB"
    }
  }
};
