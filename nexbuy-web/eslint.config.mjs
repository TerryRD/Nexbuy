import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Next.js core-web-vitals 已載 eslint-plugin-jsx-a11y plugin（不能再
  // import 一次否則 plugin redefinition error），但只開了 6 條 a11y rule
  // 在 warn level。這邊把 a11y 整套擴開、且把 violation 升 error。
  // 上線後 axe-core production audit 抓 runtime；ESLint 抓靜態違規
  // （alt-text / aria 屬性錯 / role 不對 / heading 結構等）。
  {
    rules: {
      // 升級為 error — 這些命中代表 a11y 真的壞了
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      // 補開（core-web-vitals 沒帶到，但常踩雷）
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/scope": "error",
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
