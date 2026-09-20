/* @ds-bundle: {"format":4,"namespace":"VITALDesignSystem_2895b5","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"OfflineBanner","sourcePath":"components/feedback/OfflineBanner.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"SessionBar","sourcePath":"components/navigation/SessionBar.jsx"},{"name":"QueueRow","sourcePath":"components/status/QueueRow.jsx"},{"name":"STATUS_META","sourcePath":"components/status/StatusBadge.jsx"},{"name":"STATUS_GROUP_STYLE","sourcePath":"components/status/StatusBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/status/StatusBadge.jsx"},{"name":"StatusTrail","sourcePath":"components/status/StatusTrail.jsx"}],"sourceHashes":{"components/core/Button.jsx":"88a336d8c0fb","components/core/Card.jsx":"490d18ef3df3","components/core/Icon.jsx":"bc4eddddab7a","components/core/IconButton.jsx":"c7f2cc762923","components/data/DataTable.jsx":"29e56136580e","components/feedback/Dialog.jsx":"e1bec2fe94af","components/feedback/EmptyState.jsx":"40b70439ec50","components/feedback/OfflineBanner.jsx":"c8fc88252408","components/feedback/Skeleton.jsx":"05ccd3de0a28","components/feedback/Toast.jsx":"f3c224b05ba7","components/forms/Checkbox.jsx":"6ad98f92b28f","components/forms/Input.jsx":"bc5c0820ff78","components/forms/Select.jsx":"319a5aa88a9c","components/navigation/SessionBar.jsx":"53e0eaff298f","components/status/QueueRow.jsx":"506b17167b4e","components/status/StatusBadge.jsx":"5efd3442e015","components/status/StatusTrail.jsx":"e1d8a85c2afa","ui_kits/lab-portal/LabShell.jsx":"1cad2a196ae7","ui_kits/lab-portal/ResultUpload.jsx":"b83559b2925d","ui_kits/lab-portal/WorklistScreen.jsx":"70d78f6ecdac","ui_kits/patient-wallet/WalletScreens.jsx":"c96252330be0","ui_kits/patient-wallet/doc-page.js":"f52ae9c02fca","ui_kits/rhu-portal/NewReferral.jsx":"e7f7dbf3a15e","ui_kits/rhu-portal/QueueScreen.jsx":"3ab500b6974f","ui_kits/rhu-portal/ReferralDetail.jsx":"6bb609a6599d","ui_kits/rhu-portal/Shell.jsx":"6db70433406c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VITALDesignSystem_2895b5 = window.VITALDesignSystem_2895b5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TINTS = {
  paper: 'var(--color-cream-paper)',
  keylime: 'var(--color-keylime-wash)',
  mint: 'var(--color-mint-veil)',
  sage: 'var(--color-sage-mist)',
  slate: 'var(--color-slate-hush)'
};

/* Shadowless by default (DESIGN.md §4): depth comes from the tint layer. */
function Card({
  children,
  tint = 'paper',
  density = 'comfortable',
  bordered = false,
  statusBorder,
  style,
  ...rest
}) {
  const accent = statusBorder === 'clay' ? 'var(--color-clay-alert)' : statusBorder === 'amber' ? 'var(--color-amber-hold)' : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: TINTS[tint] || TINTS.paper,
      borderRadius: 'var(--radius-card)',
      padding: density === 'compact' ? 'var(--card-padding-compact)' : 'var(--card-padding-comfortable)',
      border: bordered ? '1px solid var(--color-border-strong)' : '1px solid transparent',
      borderLeft: accent ? `3px solid ${accent}` : undefined,
      color: 'var(--color-charcoal)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Lucide is the portal icon set (DESIGN.md §5). No icon binaries ship with
   this system, so the library is pulled from CDN and the SVG is built here
   at 1.5px stroke, currentColor. */
const LUCIDE_SRC = 'https://unpkg.com/lucide@0.460.0/dist/umd/lucide.js';
function pascal(name) {
  return String(name).split(/[-_ ]/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join('');
}
function ensureLucide(cb) {
  if (typeof window === 'undefined') return;
  if (window.lucide) return cb();
  if (!document.querySelector('script[data-lucide-lib]')) {
    const s = document.createElement('script');
    s.src = LUCIDE_SRC;
    s.setAttribute('data-lucide-lib', '');
    document.head.appendChild(s);
  }
  let tries = 0;
  const t = setInterval(() => {
    if (window.lucide) {
      clearInterval(t);
      cb();
    } else if (++tries > 100) clearInterval(t);
  }, 50);
}
function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  color,
  label,
  style,
  ...rest
}) {
  /* Fallback glyph: a visible ring, never an empty box. Every status badge's
     accessibility claim depends on an icon actually painting. */
  const FALLBACK = '<circle cx="12" cy="12" r="8"/>';
  const [markup, setMarkup] = React.useState(FALLBACK);
  React.useEffect(() => {
    let live = true;
    ensureLucide(() => {
      const node = window.lucide && (window.lucide.icons[pascal(name)] || window.lucide.icons[name]);
      if (!live) return;
      if (!node) {
        setMarkup(FALLBACK);
        return;
      }
      try {
        /* Lucide ships icons either as a flat list of child tuples
           ([['path',{d}],…]) or as a full IconNode (['svg',attrs,[children]]). */
        let kids = node;
        if (Array.isArray(node) && typeof node[0] === 'string') kids = node[2] || [];
        if (!Array.isArray(kids)) kids = [];
        const serialize = t => {
          if (!Array.isArray(t)) return '';
          const [tag, attrs, inner] = t;
          if (typeof tag !== 'string') return '';
          const a = Object.entries(attrs || {}).map(([k, v]) => `${k}="${v}"`).join(' ');
          const body = Array.isArray(inner) ? inner.map(serialize).join('') : '';
          return body ? `<${tag} ${a}>${body}</${tag}>` : `<${tag} ${a}/>`;
        };
        const out = kids.map(serialize).join('');
        setMarkup(out || FALLBACK);
      } catch (e) {
        setMarkup(FALLBACK);
      }
    });
    return () => {
      live = false;
    };
  }, [name]);
  return /*#__PURE__*/React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || 'currentColor',
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: label ? 'img' : 'presentation',
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    style: {
      display: 'block',
      flex: '0 0 auto',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: markup
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-2)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--font-weight-medium)',
  borderRadius: 'var(--radius-control)',
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'normal',
  /* Cebuano/Tagalog labels run long — wrap, never truncate */
  transition: 'background-color 120ms ease, border-color 120ms ease, color 120ms ease'
};
const SIZES = {
  md: {
    minHeight: 'var(--target-control)',
    padding: '0 var(--space-4)',
    fontSize: 'var(--text-body-sm)'
  },
  lg: {
    minHeight: 'var(--target-touch)',
    padding: '0 var(--space-6)',
    fontSize: 'var(--text-body)'
  }
};
function variantStyle(variant, hovered) {
  switch (variant) {
    case 'secondary':
      return {
        background: hovered ? 'var(--color-keylime-wash)' : 'transparent',
        color: 'var(--color-forest-ink)',
        border: '1px solid var(--color-forest-ink)'
      };
    case 'ghost':
      return {
        background: hovered ? 'var(--color-keylime-wash)' : 'transparent',
        color: 'var(--color-forest-ink)',
        border: '1px solid transparent'
      };
    case 'destructive':
      return {
        background: hovered ? 'var(--color-clay-wash)' : 'transparent',
        color: 'var(--color-clay-alert)',
        border: '1px solid var(--color-clay-alert)'
      };
    default:
      return {
        background: hovered ? 'var(--color-forest-shadow)' : 'var(--color-forest-ink)',
        color: 'var(--color-cream-paper)',
        border: '1px solid transparent'
      };
  }
}
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconAfter,
  disabled,
  fullWidth,
  as,
  href,
  style,
  onClick,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const Tag = as || (href ? 'a' : 'button');
  const disabledStyle = {
    background: 'var(--color-border-mist)',
    color: 'var(--color-disabled-ink)',
    border: '1px solid transparent',
    cursor: 'not-allowed'
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    onClick: disabled ? undefined : onClick,
    disabled: Tag === 'button' ? disabled : undefined,
    "aria-disabled": disabled || undefined,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      ...BASE,
      ...SIZES[size],
      ...(disabled ? disabledStyle : variantStyle(variant, hovered)),
      width: fullWidth ? '100%' : undefined,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 20 : 16
  }) : null, children, iconAfter ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconAfter,
    size: size === 'lg' ? 20 : 16
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  icon,
  label,
  variant = 'ghost',
  disabled,
  onClick,
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const skins = {
    ghost: {
      background: hovered ? 'var(--color-keylime-wash)' : 'transparent',
      color: 'var(--color-forest-ink)',
      border: '1px solid transparent'
    },
    outline: {
      background: hovered ? 'var(--color-keylime-wash)' : 'transparent',
      color: 'var(--color-forest-ink)',
      border: '1px solid var(--color-forest-ink)'
    },
    destructive: {
      background: hovered ? 'var(--color-clay-wash)' : 'transparent',
      color: 'var(--color-clay-alert)',
      border: '1px solid transparent'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    title: label,
    "aria-label": label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      width: 'var(--target-icon)',
      height: 'var(--target-icon)',
      padding: 'var(--space-2)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-control)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'background-color 120ms ease',
      ...(disabled ? {
        background: 'transparent',
        color: 'var(--color-disabled-ink)',
        border: '1px solid transparent'
      } : skins[variant]),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Scrim is tinted forest, never black. Title is sans even in the wallet —
   dialogs are functional. Destructive confirmations name the action. §7.4 */
function Dialog({
  open = true,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--scrim)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      zIndex: 50
    },
    onClick: onCancel
  }, /*#__PURE__*/React.createElement("div", _extends({
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--color-cream-paper)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--card-padding-comfortable)',
      maxWidth: 480,
      width: '100%',
      boxShadow: 'var(--shadow-floating)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-heading-sm)',
      lineHeight: 'var(--leading-heading-sm)',
      letterSpacing: 'var(--tracking-heading)',
      color: 'var(--color-forest-ink)',
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)',
      fontSize: 'var(--text-body-sm)',
      lineHeight: 'var(--leading-body-sm)',
      color: 'var(--color-charcoal)'
    }
  }, children), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "ghost",
    onClick: onCancel
  }, cancelLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: destructive ? 'destructive' : 'primary',
    onClick: onConfirm
  }, confirmLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* An empty screen is an invitation to act, not an apology. §7.5 */
function EmptyState({
  icon = 'inbox',
  message,
  actionLabel,
  onAction,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--color-keylime-wash)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-12) var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-4)',
      textAlign: 'center',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 32,
    color: "var(--color-sage-mist)"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal)'
    }
  }, message), actionLabel ? /*#__PURE__*/React.createElement(__ds_scope.Button, {
    onClick: onAction
  }, actionLabel) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/OfflineBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Persistent amber banner at the top of the portal — never a toast.
   Offline is not a missable condition. §7.5 */
function OfflineBanner({
  message = 'You are offline. Referrals will send when the connection returns.',
  queued,
  icon = 'cloud-off',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      background: 'var(--color-amber-wash)',
      color: 'var(--color-amber-hold)',
      padding: 'var(--space-2) var(--gutter-portal)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      fontWeight: 'var(--font-weight-medium)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, message), queued != null ? /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums',
      marginLeft: 'auto'
    }
  }, queued, " queued") : null);
}
Object.assign(__ds_scope, { OfflineBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/OfflineBanner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Skeleton blocks in Border Mist at the shape of the incoming content.
   No spinners on list views. §7.5 */
function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-control)',
  lines = 1,
  gap = 'var(--space-2)',
  style,
  ...rest
}) {
  const block = i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: lines > 1 && i === lines - 1 ? '60%' : width,
      height,
      borderRadius: radius,
      background: 'var(--color-border-mist)'
    }
  });
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...style
    }
  }, rest), Array.from({
    length: lines
  }, (_, i) => block(i)));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    background: 'var(--color-cream-paper)',
    color: 'var(--color-charcoal)',
    icon: 'info'
  },
  success: {
    background: 'var(--color-forest-ink)',
    color: 'var(--color-cream-paper)',
    icon: 'check-check'
  },
  attention: {
    background: 'var(--color-amber-wash)',
    color: 'var(--color-amber-hold)',
    icon: 'triangle-alert'
  },
  failure: {
    background: 'var(--color-clay-wash)',
    color: 'var(--color-clay-alert)',
    icon: 'circle-x'
  }
};

/* One of the three surfaces permitted a shadow. Never used for offline state. */
function Toast({
  message,
  tone = 'neutral',
  icon,
  onDismiss,
  style,
  ...rest
}) {
  const skin = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      background: skin.background,
      color: skin.color,
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-3) var(--space-4)',
      boxShadow: 'var(--shadow-floating)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || skin.icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, message), onDismiss ? /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    "aria-label": "Dismiss",
    style: {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      display: 'flex',
      padding: 0,
      marginLeft: 'var(--space-2)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  helper,
  checked,
  defaultChecked,
  onChange,
  disabled,
  size = 'portal',
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const box = size === 'wallet' ? 24 : 18;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)',
      alignItems: 'flex-start',
      minHeight: size === 'wallet' ? 'var(--target-touch)' : undefined,
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'wallet' ? 'var(--text-body)' : 'var(--text-body-sm)',
      color: disabled ? 'var(--color-disabled-ink)' : 'var(--color-charcoal)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: e => {
      if (!isControlled) setInternal(e.target.checked);
      onChange && onChange(e);
    },
    style: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: box,
      height: box,
      flex: '0 0 auto',
      marginTop: 2,
      borderRadius: 'var(--radius-icon)',
      border: on ? '1px solid var(--color-forest-ink)' : '1px solid var(--color-border-input)',
      background: disabled ? 'var(--color-border-mist)' : on ? 'var(--color-forest-ink)' : 'var(--color-cream-paper)',
      color: 'var(--color-cream-paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, on ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: box - 6,
    strokeWidth: 2
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, label), helper ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, helper) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Label above, always. No placeholder-as-label. DESIGN.md §7.1 */
function Input({
  label,
  value,
  defaultValue,
  onChange,
  placeholder,
  helper,
  error,
  disabled,
  required,
  type = 'text',
  size = 'portal',
  id,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'in';
  const fieldId = id || autoId;
  const height = size === 'wallet' ? 'var(--target-touch)' : 'var(--target-control)';
  const fontSize = size === 'wallet' ? 'var(--text-body)' : 'var(--text-body-sm)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 'var(--text-caption)',
      fontWeight: 'var(--font-weight-medium)',
      color: 'var(--color-charcoal)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-clay-alert)'
    }
  }, " *") : null), /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      height,
      fontSize,
      fontFamily: 'var(--font-sans)',
      color: disabled ? 'var(--color-disabled-ink)' : 'var(--color-charcoal)',
      background: disabled ? 'var(--color-border-mist)' : 'var(--color-cream-paper)',
      border: disabled ? '1px solid transparent' : `1px solid ${error ? 'var(--color-clay-alert)' : 'var(--color-border-input)'}`,
      borderRadius: 'var(--radius-control)',
      padding: '0 var(--space-3)',
      outline: focused ? 'var(--focus-ring-width) solid var(--color-focus)' : 'none',
      outlineOffset: 'var(--focus-ring-offset)'
    }
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      fontSize: 'var(--text-caption)',
      color: 'var(--color-clay-alert)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "triangle-alert",
    size: 16
  }), error) : helper ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, helper) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  helper,
  error,
  disabled,
  required,
  size = 'portal',
  id,
  style,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const autoId = React.useId ? React.useId() : 'sel';
  const fieldId = id || autoId;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)',
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: fieldId,
    style: {
      fontSize: 'var(--text-caption)',
      fontWeight: 'var(--font-weight-medium)',
      color: 'var(--color-charcoal)'
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-clay-alert)'
    }
  }, " *") : null), /*#__PURE__*/React.createElement("select", _extends({
    id: fieldId,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    style: {
      height: size === 'wallet' ? 'var(--target-touch)' : 'var(--target-control)',
      fontSize: size === 'wallet' ? 'var(--text-body)' : 'var(--text-body-sm)',
      fontFamily: 'var(--font-sans)',
      color: disabled ? 'var(--color-disabled-ink)' : 'var(--color-charcoal)',
      background: disabled ? 'var(--color-border-mist)' : 'var(--color-cream-paper)',
      border: disabled ? '1px solid transparent' : `1px solid ${error ? 'var(--color-clay-alert)' : 'var(--color-border-input)'}`,
      borderRadius: 'var(--radius-control)',
      padding: '0 var(--space-2)',
      outline: focused ? 'var(--focus-ring-width) solid var(--color-focus)' : 'none',
      outlineOffset: 'var(--focus-ring-offset)'
    }
  }, rest), options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  })), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-clay-alert)'
    }
  }, error) : helper ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, helper) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SessionBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Shared terminals: who is signed in must be legible at a glance, and the
   switch-user control is always visible, never in a dropdown. §7.6 */
function SessionBar({
  user,
  role,
  facility,
  onSwitchUser,
  right,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      background: 'var(--color-keylime-wash)',
      padding: 'var(--space-2) var(--gutter-portal)',
      borderBottom: '1px solid var(--color-border-strong)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "user-round",
    size: 16,
    color: "var(--color-forest-ink)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--font-weight-semibold)'
    }
  }, user), role ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-charcoal-muted)'
    }
  }, role) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--color-border-strong)'
    }
  }, "|"), /*#__PURE__*/React.createElement("span", null, facility), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)'
    }
  }, right, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    icon: "repeat",
    onClick: onSwitchUser,
    style: {
      minHeight: 32
    }
  }, "Switch user")));
}
Object.assign(__ds_scope, { SessionBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SessionBar.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* DESIGN.md §6.1 — grouped by what the viewer must do about it.
   Every badge carries an icon AND a label; colour never carries state alone. */
const STATUS_META = {
  created: {
    label: 'Created',
    group: 'waiting',
    icon: 'file-plus'
  },
  sent: {
    label: 'Sent',
    group: 'waiting',
    icon: 'send'
  },
  sending: {
    label: 'Sending',
    group: 'attention',
    icon: 'refresh-cw'
  },
  received: {
    label: 'Received',
    group: 'progress',
    icon: 'inbox'
  },
  accepted: {
    label: 'Accepted',
    group: 'progress',
    icon: 'check'
  },
  'patient-arrived': {
    label: 'Patient arrived',
    group: 'progress',
    icon: 'user-check'
  },
  endorsed: {
    label: 'Endorsed',
    group: 'progress',
    icon: 'stamp'
  },
  completed: {
    label: 'Completed',
    group: 'done',
    icon: 'check-check'
  },
  declined: {
    label: 'Declined',
    group: 'fail',
    icon: 'circle-x'
  },
  'wrong-patient-result': {
    label: 'Wrong-patient result',
    group: 'fail',
    icon: 'octagon-alert'
  },
  'consent-revoked': {
    label: 'Consent revoked',
    group: 'attention',
    icon: 'shield-off'
  },
  'no-show': {
    label: 'No-show',
    group: 'attention',
    icon: 'user-x'
  },
  overdue: {
    label: 'Overdue',
    group: 'attention',
    icon: 'clock'
  }
};
const STATUS_GROUP_STYLE = {
  waiting: {
    background: 'var(--color-border-mist)',
    color: 'var(--color-charcoal-muted)'
  },
  progress: {
    background: 'var(--color-slate-hush)',
    color: 'var(--color-forest-ink)'
  },
  done: {
    background: 'var(--color-forest-ink)',
    color: 'var(--color-cream-paper)'
  },
  fail: {
    background: 'var(--color-clay-wash)',
    color: 'var(--color-clay-alert)'
  },
  attention: {
    background: 'var(--color-amber-wash)',
    color: 'var(--color-amber-hold)'
  }
};
function StatusBadge({
  status,
  label,
  style,
  ...rest
}) {
  const meta = STATUS_META[status] || {
    label: label || status,
    group: 'waiting',
    icon: 'circle'
  };
  const skin = STATUS_GROUP_STYLE[meta.group];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: '4px 12px',
      borderRadius: 'var(--radius-badge)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-caption)',
      fontWeight: 'var(--font-weight-medium)',
      lineHeight: 1.5,
      ...skin,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: meta.icon,
    size: 16
  }), label || meta.label);
}
Object.assign(__ds_scope, { STATUS_META, STATUS_GROUP_STYLE, StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Uppercase column headers are the one permitted uppercase in the system.
   1px Border Strong dividers, no zebra striping, Keylime hover. §7.3 */
function DataTable({
  columns = [],
  rows = [],
  density = 'compact',
  onRowClick,
  statusKey = 'status',
  emptyMessage = 'Nothing here yet.',
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(-1);
  const rowHeight = density === 'compact' ? 'var(--row-height-compact)' : 'var(--row-height-comfortable)';
  const pad = density === 'compact' ? 'var(--space-3)' : 'var(--space-4)';
  return /*#__PURE__*/React.createElement("table", _extends({
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      padding: `var(--space-2) ${pad}`,
      fontSize: 'var(--text-caption)',
      fontWeight: 'var(--font-weight-semibold)',
      letterSpacing: 'var(--tracking-column-header)',
      textTransform: 'uppercase',
      color: 'var(--color-charcoal-muted)',
      borderBottom: '1px solid var(--color-border-strong)',
      width: c.width
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length,
    style: {
      padding: 'var(--space-6)',
      textAlign: 'center',
      color: 'var(--color-charcoal-muted)'
    }
  }, emptyMessage)) : rows.map((r, i) => {
    const group = (__ds_scope.STATUS_META[r[statusKey]] || {}).group;
    const accent = group === 'fail' ? 'var(--color-clay-alert)' : group === 'attention' ? 'var(--color-amber-hold)' : null;
    return /*#__PURE__*/React.createElement("tr", {
      key: r.id || i,
      onClick: onRowClick ? () => onRowClick(r) : undefined,
      onMouseEnter: () => setHovered(i),
      onMouseLeave: () => setHovered(-1),
      style: {
        height: rowHeight,
        background: hovered === i ? 'var(--color-keylime-wash)' : 'transparent',
        cursor: onRowClick ? 'pointer' : 'default'
      }
    }, columns.map((c, ci) => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        padding: `var(--space-2) ${pad}`,
        textAlign: c.align || 'left',
        borderBottom: '1px solid var(--color-border-strong)',
        borderLeft: ci === 0 ? `3px solid ${accent || 'transparent'}` : undefined,
        fontVariantNumeric: c.tabular ? 'tabular-nums' : undefined,
        whiteSpace: c.nowrap ? 'nowrap' : undefined
      }
    }, c.render ? c.render(r) : r[c.key])));
  })));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/status/QueueRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* A queue row in a failure or attention state carries a 3px left border in
   clay or amber — border, not fill (DESIGN.md §6.4). */
function QueueRow({
  status,
  selected,
  onClick,
  children,
  density = 'compact',
  style,
  ...rest
}) {
  const [hovered, setHovered] = React.useState(false);
  const group = (__ds_scope.STATUS_META[status] || {}).group;
  const accent = group === 'fail' ? 'var(--color-clay-alert)' : group === 'attention' ? 'var(--color-amber-hold)' : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "row",
    tabIndex: 0,
    onClick: onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: density === 'compact' ? 'var(--gap-compact)' : 'var(--gap-comfortable)',
      minHeight: density === 'compact' ? 'var(--row-height-compact)' : 'var(--row-height-comfortable)',
      padding: density === 'compact' ? '0 var(--space-3)' : '0 var(--space-4)',
      borderLeft: `3px solid ${accent || 'transparent'}`,
      borderBottom: '1px solid var(--color-border-strong)',
      background: selected ? 'var(--color-keylime-wash)' : hovered ? 'var(--color-keylime-wash)' : 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { QueueRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/QueueRow.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusTrail.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Append-only by design (DESIGN.md §6.3): no entry renders as editable,
   nothing offers delete, superseded entries stay in the view. */
function StatusTrail({
  entries = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("ol", _extends({
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, rest), entries.map((e, i) => {
    const meta = __ds_scope.STATUS_META[e.status] || {
      label: e.status,
      group: 'waiting',
      icon: 'circle'
    };
    const skin = __ds_scope.STATUS_GROUP_STYLE[meta.group];
    const last = i === entries.length - 1;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'grid',
        gridTemplateColumns: '28px 1fr',
        columnGap: 'var(--space-3)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-badge)',
        background: skin.background,
        color: skin.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: meta.icon,
      size: 16
    })), !last ? /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        width: 1,
        background: 'var(--color-border-strong)',
        minHeight: 16
      }
    }) : null), /*#__PURE__*/React.createElement("div", {
      style: {
        paddingBottom: last ? 0 : 'var(--space-4)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-body-sm)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-charcoal)'
      }
    }, e.label || meta.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-caption)',
        color: 'var(--color-charcoal-muted)'
      }
    }, [e.actor, e.facility].filter(Boolean).join(' · ')), /*#__PURE__*/React.createElement("div", {
      className: "tabular",
      style: {
        fontSize: 'var(--text-caption)',
        color: 'var(--color-charcoal-muted)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, e.timestamp)));
  }));
}
Object.assign(__ds_scope, { StatusTrail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusTrail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lab-portal/LabShell.jsx
try { (() => {
const {
  Icon,
  Button,
  Card,
  SessionBar,
  OfflineBanner
} = window.VITALDesignSystem_2895b5;
const LAB_NAV = [{
  id: 'worklist',
  label: 'Specimen worklist',
  icon: 'flask-conical'
}, {
  id: 'upload',
  label: 'Upload result',
  icon: 'upload'
}, {
  id: 'exceptions',
  label: 'Exceptions',
  icon: 'octagon-alert'
}];
function LabShell({
  screen,
  onNavigate,
  offline,
  onToggleOffline,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    "data-density": "compact",
    style: {
      position: 'relative',
      minHeight: '100%',
      background: 'var(--color-cream-paper)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal)'
    }
  }, offline ? /*#__PURE__*/React.createElement(OfflineBanner, {
    queued: 1,
    message: "You are offline. Uploaded results will send when the connection returns."
  }) : null, /*#__PURE__*/React.createElement(SessionBar, {
    user: "A. Reyes",
    role: "Medical Technologist",
    facility: "Bohol Provincial Laboratory",
    right: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      icon: offline ? 'wifi' : 'wifi-off',
      onClick: onToggleOffline,
      style: {
        minHeight: 32
      }
    }, offline ? 'Simulate online' : 'Simulate offline')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '236px 1fr',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      borderRight: '1px solid var(--color-border-strong)',
      padding: 'var(--space-4) var(--space-3)',
      minHeight: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      letterSpacing: '0.14em',
      color: 'var(--color-forest-ink)',
      padding: '0 var(--space-3) var(--space-4)'
    }
  }, "VITAL"), LAB_NAV.map(n => {
    const on = screen === n.id;
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => onNavigate(n.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        minHeight: 40,
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-control)',
        border: '1px solid transparent',
        background: on ? 'var(--color-keylime-wash)' : 'transparent',
        color: 'var(--color-forest-ink)',
        fontWeight: on ? 600 : 400,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-body-sm)',
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: n.icon,
      size: 16
    }), n.label);
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tint: "keylime",
    density: "compact",
    style: {
      fontSize: 'var(--text-caption)'
    }
  }, "Every result is checked against the referral's patient ID before it attaches."))), /*#__PURE__*/React.createElement("main", {
    style: {
      padding: 'var(--space-6) var(--gutter-portal)'
    }
  }, children)));
}
function LabHead({
  title,
  count,
  actions
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-heading-md)',
      lineHeight: 'var(--leading-heading-md)',
      letterSpacing: 'var(--tracking-heading)',
      color: 'var(--color-forest-ink)',
      margin: 0
    }
  }, title), count != null ? /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums',
      color: 'var(--color-charcoal-muted)'
    }
  }, count) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'flex-end'
    }
  }, actions));
}
Object.assign(window, {
  LabShell,
  LabHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lab-portal/LabShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lab-portal/ResultUpload.jsx
try { (() => {
const {
  Button,
  Card,
  Input,
  Select,
  Icon,
  StatusBadge,
  StatusTrail,
  Toast
} = window.VITALDesignSystem_2895b5;
function ResultUpload({
  specimen,
  onDone
}) {
  const s = specimen || {
    id: 'REF-0411',
    patient: 'Sarabia, N.',
    patientId: 'PH-3318-0924',
    test: 'Complete blood count',
    from: 'Loon RHU',
    status: 'patient-arrived'
  };
  const [typedId, setTypedId] = React.useState('');
  const [toast, setToast] = React.useState(null);
  const mismatch = typedId.length > 3 && typedId !== s.patientId;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1000
    }
  }, /*#__PURE__*/React.createElement(LabHead, {
    title: "Upload result",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: onDone
    }, "Back to worklist")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 'var(--space-6)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-subheading)',
      margin: 0,
      color: 'var(--color-forest-ink)'
    }
  }, s.patient), /*#__PURE__*/React.createElement(StatusBadge, {
    status: s.status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 'var(--space-4)',
      fontSize: 'var(--text-body-sm)'
    }
  }, [['Referral', s.id, true], ['Patient ID', s.patientId, true], ['Test', s.test, false], ['Referred by', s.from, false]].map(([l, v, t]) => /*#__PURE__*/React.createElement("div", {
    key: l
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: t ? 'tabular-nums' : undefined
    }
  }, v))))), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Identity check"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Re-type the patient ID on the specimen label",
    required: true,
    value: typedId,
    onChange: e => setTypedId(e.target.value),
    placeholder: "PH-0000-0000",
    error: mismatch ? 'Does not match the referral. Do not attach this result.' : undefined,
    helper: !mismatch ? 'Typed, not pasted. This is the check that catches a wrong-patient result.' : undefined
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Specimen condition",
    options: ['Acceptable', 'Haemolysed', 'Insufficient volume']
  }))), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Result file"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px dashed var(--color-border-input)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--space-8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-2)',
      color: 'var(--color-charcoal-muted)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-up",
    size: 32,
    color: "var(--color-sage-mist)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)'
    }
  }, "Drop the signed PDF here, or"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary"
  }, "Choose file"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "check-check",
    disabled: mismatch || typedId !== s.patientId,
    onClick: () => setToast('Result attached, referral marked completed, and the patient notified.')
  }, "Attach and complete"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: onDone
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    variant: "destructive",
    icon: "octagon-alert",
    onClick: () => setToast('Flagged as a wrong-patient result. Referring RHU notified.')
  }, "Flag wrong-patient result"))), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Status trail"), /*#__PURE__*/React.createElement(StatusTrail, {
    entries: [{
      status: 'patient-arrived',
      actor: 'Front desk',
      facility: 'Bohol Provincial Laboratory',
      timestamp: '14 Mar 2026 · 11:03'
    }, {
      status: 'accepted',
      actor: 'A. Reyes, MT',
      facility: 'Bohol Provincial Laboratory',
      timestamp: '13 Mar 2026 · 16:52'
    }, {
      status: 'received',
      actor: 'Intake',
      facility: 'Bohol Provincial Laboratory',
      timestamp: '13 Mar 2026 · 16:45'
    }, {
      status: 'sent',
      actor: 'J. Bacarro, Midwife',
      facility: 'Loon RHU',
      timestamp: '13 Mar 2026 · 16:40'
    }]
  }))), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: toast,
    onDismiss: () => setToast(null)
  })) : null);
}
Object.assign(window, {
  ResultUpload
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lab-portal/ResultUpload.jsx", error: String((e && e.message) || e) }); }

// ui_kits/lab-portal/WorklistScreen.jsx
try { (() => {
const {
  Button,
  IconButton,
  Card,
  DataTable,
  StatusBadge,
  Icon,
  Dialog,
  Toast,
  QueueRow
} = window.VITALDesignSystem_2895b5;
const SPECIMENS = [{
  id: 'REF-0411',
  patient: 'Sarabia, N.',
  patientId: 'PH-3318-0924',
  test: 'Complete blood count',
  from: 'Loon RHU',
  status: 'patient-arrived',
  received: '14 Mar · 11:03'
}, {
  id: 'REF-0409',
  patient: 'Boteros, R.',
  patientId: 'PH-1180-6631',
  test: 'Urinalysis',
  from: 'Loon RHU',
  status: 'no-show',
  received: '13 Mar · 17:55'
}, {
  id: 'REF-0408',
  patient: 'Tirol, G.',
  patientId: 'PH-6620-3390',
  test: 'HbA1c',
  from: 'Loon RHU',
  status: 'wrong-patient-result',
  received: '13 Mar · 15:10'
}, {
  id: 'REF-0402',
  patient: 'Cortes, B.',
  patientId: 'PH-4471-9902',
  test: 'Sputum AFB',
  from: 'Maribojoc RHU',
  status: 'endorsed',
  received: '13 Mar · 13:44'
}, {
  id: 'REF-0399',
  patient: 'Uy, S.',
  patientId: 'PH-2288-3310',
  test: 'Lipid panel',
  from: 'Calape RHU',
  status: 'accepted',
  received: '12 Mar · 08:30'
}, {
  id: 'REF-0397',
  patient: 'Lumbo, A.',
  patientId: 'PH-2204-7751',
  test: 'Lipid panel',
  from: 'Loon RHU',
  status: 'completed',
  received: '11 Mar · 09:12'
}];
function WorklistScreen({
  onOpen
}) {
  const [confirm, setConfirm] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [done, setDone] = React.useState([]);
  const rows = SPECIMENS.map(s => done.includes(s.id) ? {
    ...s,
    status: 'completed'
  } : s);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(LabHead, {
    title: "Specimen worklist",
    count: `${rows.length} specimens`,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "scan-line"
    }, "Scan specimen label"), /*#__PURE__*/React.createElement(IconButton, {
      icon: "printer",
      label: "Print worklist",
      variant: "outline"
    }))
  }), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(DataTable, {
    rows: rows,
    onRowClick: onOpen,
    columns: [{
      key: 'id',
      header: 'Referral',
      tabular: true,
      width: 110,
      nowrap: true
    }, {
      key: 'patient',
      header: 'Patient'
    }, {
      key: 'patientId',
      header: 'Patient ID',
      tabular: true
    }, {
      key: 'test',
      header: 'Test'
    }, {
      key: 'from',
      header: 'Referred by'
    }, {
      key: 'status',
      header: 'Status',
      render: r => /*#__PURE__*/React.createElement(StatusBadge, {
        status: r.status
      })
    }, {
      key: 'received',
      header: 'Received',
      tabular: true,
      nowrap: true
    }, {
      key: 'action',
      header: '',
      align: 'right',
      render: r => r.status === 'completed' ? null : /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        icon: "upload",
        onClick: e => {
          e.stopPropagation();
          setConfirm(r);
        }
      }, "Attach result")
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-2)'
    }
  }, "Exceptions needing an answer today"), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(QueueRow, {
    status: "wrong-patient-result"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "octagon-alert",
    size: 16,
    color: "var(--color-clay-alert)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums',
      width: 88
    }
  }, "REF-0408"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "HbA1c result was attached to Tirol, G. but the specimen label reads Tirol, C."), /*#__PURE__*/React.createElement(Button, {
    variant: "destructive",
    onClick: () => setToast('Result detached and the referring RHU notified.')
  }, "Detach result")), /*#__PURE__*/React.createElement(QueueRow, {
    status: "no-show"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user-x",
    size: 16,
    color: "var(--color-amber-hold)"
  }), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums',
      width: 88
    }
  }, "REF-0409"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Patient did not arrive within the 48-hour window."), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => setToast('Loon RHU notified of the no-show.')
  }, "Notify RHU")))), /*#__PURE__*/React.createElement(Dialog, {
    open: !!confirm,
    title: confirm ? `Attach result to ${confirm.patient}?` : '',
    confirmLabel: "Attach result",
    onCancel: () => setConfirm(null),
    onConfirm: () => {
      setDone(d => [...d, confirm.id]);
      setToast(`Result attached to ${confirm.id} and released to the patient.`);
      setConfirm(null);
    }
  }, confirm ? /*#__PURE__*/React.createElement("div", null, "Confirm the identifiers before attaching. A result on the wrong record is a reportable incident.", /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--space-2)',
      background: 'var(--color-keylime-wash)',
      borderRadius: 'var(--radius-control)',
      padding: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, "Referral"), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, confirm.id)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, "Patient ID"), /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, confirm.patientId)))) : null), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: toast,
    onDismiss: () => setToast(null)
  })) : null);
}
Object.assign(window, {
  WorklistScreen,
  SPECIMENS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/lab-portal/WorklistScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-wallet/WalletScreens.jsx
try { (() => {
const {
  Button,
  Card,
  Checkbox,
  StatusBadge,
  StatusTrail,
  Dialog,
  Toast,
  EmptyState
} = window.VITALDesignSystem_2895b5;

/* The wallet is the Android surface, so it uses Material Symbols Rounded
   rather than Lucide (DESIGN.md §5). The font is loaded in index.html. */
function WIcon({
  name,
  size = 24,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "material-symbols-rounded",
    "aria-hidden": "true",
    style: {
      fontSize: size,
      color: color || 'inherit',
      lineHeight: 1
    }
  }, name);
}
const WALLET_REFERRALS = [{
  id: 'REF-0411',
  service: 'Complete blood count',
  facility: 'Bohol Provincial Laboratory',
  status: 'patient-arrived',
  when: '14 Mar 2026'
}, {
  id: 'REF-0412',
  service: 'Chest X-ray',
  facility: 'Bohol Provincial Hospital',
  status: 'declined',
  when: '14 Mar 2026'
}, {
  id: 'REF-0407',
  service: 'Lipid panel',
  facility: 'Bohol Provincial Laboratory',
  status: 'completed',
  when: '13 Mar 2026'
}, {
  id: 'REF-0398',
  service: 'Prenatal ultrasound',
  facility: 'Tagbilaran District Hospital',
  status: 'consent-revoked',
  when: '09 Mar 2026'
}];
function TopBar({
  title,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: 'var(--space-4) var(--gutter-wallet)',
      minHeight: 'var(--target-touch)'
    }
  }, onBack ? /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Back",
    style: {
      width: 48,
      height: 48,
      marginLeft: -12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      color: 'var(--color-forest-ink)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(WIcon, {
    name: "arrow_back"
  })) : null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-serif-display)',
      fontWeight: 300,
      fontSize: 'var(--text-heading-lg)',
      lineHeight: 'var(--leading-heading-lg)',
      letterSpacing: 'var(--tracking-heading-lg)',
      color: 'var(--color-forest-ink)',
      margin: 0
    }
  }, title));
}
function TabBar({
  tab,
  onTab
}) {
  const tabs = [{
    id: 'list',
    label: 'Referrals',
    icon: 'description'
  }, {
    id: 'consent',
    label: 'Consent',
    icon: 'verified_user'
  }, {
    id: 'profile',
    label: 'Me',
    icon: 'person'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      borderTop: '1px solid var(--color-border-strong)',
      background: 'var(--color-cream-paper)'
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => onTab(t.id),
    style: {
      minHeight: 'var(--target-touch)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 'var(--space-2)',
      color: tab === t.id ? 'var(--color-forest-ink)' : 'var(--color-charcoal-muted)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-caption)',
      fontWeight: tab === t.id ? 600 : 400
    }
  }, /*#__PURE__*/React.createElement(WIcon, {
    name: t.icon,
    size: 22
  }), t.label)));
}
function WalletList({
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter-wallet) var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gap-comfortable)'
    }
  }, WALLET_REFERRALS.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.id,
    tint: "keylime",
    onClick: () => onOpen(r),
    style: {
      cursor: 'pointer',
      padding: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body)',
      fontWeight: 500,
      color: 'var(--color-charcoal)'
    }
  }, r.service), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal-muted)'
    }
  }, r.facility), /*#__PURE__*/React.createElement("div", {
    className: "tabular",
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)',
      fontVariantNumeric: 'tabular-nums',
      marginTop: 4
    }
  }, r.id, " \xB7 ", r.when)), /*#__PURE__*/React.createElement(WIcon, {
    name: "chevron_right",
    color: "var(--color-forest-ink)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: r.status
  })))));
}
function WalletDetail({
  referral,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter-wallet) var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gap-comfortable)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tint: "keylime"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-subheading)',
      fontWeight: 500
    }
  }, referral.service), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal-muted)',
      marginBottom: 'var(--space-3)'
    }
  }, referral.facility), /*#__PURE__*/React.createElement(StatusBadge, {
    status: referral.status
  })), referral.status === 'declined' ? /*#__PURE__*/React.createElement(Card, {
    statusBorder: "clay",
    bordered: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--color-clay-alert)',
      marginBottom: 4
    }
  }, "This referral was declined"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)'
    }
  }, "The hospital's radiology unit is closed until 18 March. Your health centre has been told and will arrange another facility. You do not need to do anything.")) : null, /*#__PURE__*/React.createElement(Card, {
    bordered: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)',
      marginBottom: 'var(--space-3)'
    }
  }, "What has happened so far"), /*#__PURE__*/React.createElement(StatusTrail, {
    entries: [{
      status: referral.status,
      actor: 'Bohol Provincial Laboratory',
      timestamp: '14 Mar 2026 · 11:03'
    }, {
      status: 'accepted',
      actor: 'Bohol Provincial Laboratory',
      timestamp: '13 Mar 2026 · 16:52'
    }, {
      status: 'sent',
      actor: 'Loon RHU',
      timestamp: '13 Mar 2026 · 16:40'
    }, {
      status: 'created',
      actor: 'Loon RHU',
      timestamp: '13 Mar 2026 · 16:31'
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    tint: "mint",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(WIcon, {
    name: "qr_code_2",
    size: 48,
    color: "var(--color-forest-ink)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)'
    }
  }, "Show this code at the facility desk so they can find your referral without asking for documents.")), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    fullWidth: true,
    variant: "secondary"
  }, "Show my referral code"));
}
function WalletConsent() {
  const [granted, setGranted] = React.useState(true);
  const [confirm, setConfirm] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter-wallet) var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gap-comfortable)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-body)',
      lineHeight: 'var(--leading-body)'
    }
  }, "You decide who can see your records. Turning off access stops new sharing straight away. Results already sent stay in the receiving facility's own file."), /*#__PURE__*/React.createElement(Card, {
    tint: granted ? 'keylime' : 'paper',
    bordered: !granted,
    statusBorder: granted ? undefined : 'amber'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body)',
      fontWeight: 500
    }
  }, "Bohol Provincial Laboratory"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal-muted)'
    }
  }, "Complete blood count \xB7 REF-0411")), granted ? /*#__PURE__*/React.createElement(StatusBadge, {
    status: "accepted",
    label: "Access granted"
  }) : /*#__PURE__*/React.createElement(StatusBadge, {
    status: "consent-revoked"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-4)'
    }
  }, granted ? /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    fullWidth: true,
    variant: "destructive",
    onClick: () => setConfirm(true)
  }, "Stop sharing with this laboratory") : /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    fullWidth: true,
    variant: "secondary",
    onClick: () => {
      setGranted(true);
      setToast('Access restored.');
    }
  }, "Share again"))), /*#__PURE__*/React.createElement(Card, {
    bordered: true
  }, /*#__PURE__*/React.createElement(Checkbox, {
    size: "wallet",
    defaultChecked: true,
    label: "Tell me when a facility opens my record",
    helper: "You will get a notification each time."
  })), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "Stop sharing with this laboratory?",
    destructive: true,
    confirmLabel: "Stop sharing",
    cancelLabel: "Keep sharing",
    onCancel: () => setConfirm(false),
    onConfirm: () => {
      setGranted(false);
      setConfirm(false);
      setToast('Sharing stopped. The laboratory has been notified.');
    }
  }, "The laboratory will no longer be able to open your record or add new results to this referral. Your health centre will see that access was withdrawn."), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 8
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "neutral",
    message: toast,
    onDismiss: () => setToast(null),
    style: {
      width: '100%'
    }
  })) : null);
}
function WalletProfile() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 var(--gutter-wallet)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tint: "keylime"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body)',
      fontWeight: 500
    }
  }, "Nenita Sarabia"), /*#__PURE__*/React.createElement("div", {
    className: "tabular",
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal-muted)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "PH-3318-0924 \xB7 Loon, Bohol")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: "settings",
    message: "Settings are not drawn. Only screens in the MVP scope are mocked."
  })));
}
Object.assign(window, {
  WIcon,
  TopBar,
  TabBar,
  WalletList,
  WalletDetail,
  WalletConsent,
  WalletProfile,
  WALLET_REFERRALS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-wallet/WalletScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/patient-wallet/doc-page.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
// Copied omelette starter. Re-running copy_starter_component with this kind overwrites this file with the latest version (page content is unaffected).
/* BEGIN USAGE */
/**
 * <doc-page> — paged-document shell for printable HTML.
 *
 * FIRST, decide how the document paginates — up front, before building:
 *
 * - FLOWING document (the default): write the whole document as one
 *   normal HTML flow inside <doc-page>; the browser's print engine
 *   splits it onto pages at export. Use for long-form documents with a
 *   single text flow: reports, memos, letters, essays.
 * - EXPLICIT pagination: a fixed set of pre-paginated pages, one
 *   <section class="page"> child per page. Use when the user asks for a
 *   specific page count, or the design implies one: a one-page resume, a
 *   two-sided flier, a poster, a certificate, a brochure — any richly
 *   laid-out document without a single text flow.
 * - If in doubt, ask the user as part of the build.
 *
 * PAGE SIZING — paper differs by country (letter vs A4), so the printed
 * sheet is not one fixed truth:
 * - FLOWING documents pin NO paper size: the print engine paginates
 *   onto the user's real paper, and the content reflows to it.
 * - EXPLICITLY PAGINATED documents print each page at a FIXED page box
 *   with overflow hidden — letter by default, size="a4" for a clearly
 *   metric user, the user's chosen paper when they export. Design each
 *   page to FILL that box, fitting letter and A4 alike without overlap.
 * - width/height pin an explicit fixed size, ONLY when the user gives
 *   one.
 * Never write your own @page rule or hard-code paper dimensions in the
 * content.
 *
 * Sizing modes (attributes):
 *   (none)                      — portrait: flowing docs use the user's
 *           paper; explicitly paginated pages use the named size box
 *           (letter unless size="a4")
 *   orientation="landscape"     — the same, landscape
 *   width / height              — explicit fixed size, ONLY when the user
 *           gives one (e.g. width="22in" height="30in" for a 22×30
 *           poster): the page IS the design's size, printed at true
 *           dimensions (or scaled onto the user's paper at print time).
 *           Any absolute CSS length: px/in/mm/cm/pt/pc.
 * The component announces the chosen mode to the host app at runtime (a
 * meta tag it injects), so the print path can inject the user's true
 * paper size.
 *
 * On screen the document renders on a desk background: a flowing
 * document as one tall scrolling sheet (Google Docs' pageless view);
 * explicitly paginated documents as one card per page.
 *
 * EXPLICIT pagination usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page>
 *     <section class="page" id="p1">…one page's design…</section>
 *     <section class="page" id="p2">…</section>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * How the page box works, concretely: each .page prints as ONE full-bleed
 * sheet at a FIXED physical size — letter by default (set size="a4" for
 * a clearly metric user), the user's chosen paper when they export —
 * with overflow hidden. Nothing scrolls and nothing reflows onto a next
 * sheet: content that misses the box is CLIPPED. Design each page to
 * FILL that page box, and to fit it — letter and A4 alike — without
 * overlap. Each page is a size container; don't size anything in
 * viewport units (they track the window, not the page), and never set
 * width or height on the .page section itself (the component sizes the
 * page box; an authored height like 100% is meaningless at print and is
 * overridden). The component owns the page box, the screen card chrome,
 * and the page breaks (never add your own break-before/after). Don't mix
 * .page sections with flowing content or header/footer slots in the same
 * document.
 *
 * FLOWING usage:
 *   <style>doc-page:not(:defined){visibility:hidden}</style>
 *   <doc-page margin="0.75in">
 *     <h1>Title</h1>
 *     <p>…body…</p>
 *   </doc-page>
 *   <script src="doc-page.js"></script>
 * There is no manual page-splitting — the browser's print engine
 * paginates at export. Standard break-hygiene rules (`break-inside:
 * avoid` on figures, code blocks, images and table rows; `orphans/
 * widows: 3`) are applied so paragraphs and groups split cleanly. On
 * screen and at print, headings default to `text-wrap: balance` and
 * body text to `text-wrap: pretty`; the defaults have zero specificity,
 * so any text-wrap you declare wins.
 *
 * Other attributes:
 *   size    — letter | a4 | legal (default letter). Flowing documents:
 *           preview proportion only — it does NOT pin their printed
 *           paper (the print dialog's paper governs); leave it alone
 *           there. Explicitly paginated documents: it sets the page box
 *           the cards and the pinned @page share (the export dialog's
 *           choice overrides both at print) — set size="a4" for a
 *           clearly metric user. Scaled-fit: names the sheet the fit is
 *           computed against, same a4-for-metric-users advice.
 *   content-width / content-height — the design's own fixed dimensions
 *           (CSS lengths), for scaling a fixed-size design ONTO the
 *           named sheet: content lays out at exactly this size, and the
 *           component scales it to fit that sheet's printable area
 *           (centered horizontally, top-aligned; the export dialog
 *           re-fits to the user's actual paper choice where available).
 *           Both must be set; they do not change the page box. For pages
 *           WITHOUT running header/footer slots.
 *   margin  — printable inset on every page of a FLOWING document
 *           (default 0.75in); margin="0" makes pages full-bleed.
 *           Explicitly paginated pages are always full-bleed.
 *
 * Running header/footer (flowing documents only): give an element
 * `slot="header"` or `slot="footer"` and it repeats on every printed
 * page via `position: fixed`. To keep body text from sliding under it,
 * the component prints inside a single-cell table whose <thead>/<tfoot>
 * are spacers sized to the header/footer height — browsers repeat
 * thead/tfoot on every page, so each sheet's content starts below the
 * header and ends above the footer. On screen the header/footer render
 * once at the top/bottom of the sheet.
 *
 * At print the component injects `@page { margin: 0 }` (which leaves
 * Chrome no margin box to draw its date/URL/page-count header in) and
 * moves the visual margin onto the sheet's own padding. It also marks
 * the document as owning its print CSS (a
 * `meta[name="omelette-owns-print"]` it injects at runtime), so the
 * PDF export never injects page-geometry CSS of its own on top.
 *
 * Print best practices for the content you author:
 * - Multi-column text: use CSS columns (`column-count` +
 *   `column-gap`), never side-by-side flex/grid columns — only real
 *   CSS columns flow and break across pages. `column-span: all` lets
 *   a heading span the columns; `hyphens: auto` (needs `lang` on
 *   the html element) keeps narrow columns readable.
 * - Page breaks in flowing documents: `break-before: page` on an
 *   element that must start a new page (a chapter, an appendix). Add
 *   your own kept-together blocks (callouts, stat tiles, cards) to a
 *   `break-inside: avoid` rule, and keep each one shorter than a page.
 * - Extend `orphans: 3; widows: 3` to any custom text blocks you add
 *   (p and li are covered by default).
 * - Give long tables a <thead> — browsers repeat it on every printed
 *   page.
 * - No `position: fixed`/`sticky` and no viewport units in content:
 *   fixed elements stamp every printed page (running headers/footers go
 *   in the component's slots) and `100vh` mis-sizes at print.
 *
 * Author content as static HTML so the user can click-to-edit any text
 * directly. Do not set width/padding/background on the document body —
 * the component owns the sheet box.
 */
/* END USAGE */

(() => {
  const PAPER = {
    letter: ['8.5in', '11in'],
    a4: ['210mm', '297mm'],
    legal: ['8.5in', '14in']
  };
  const CSS_LENGTH = /^\d+(\.\d+)?(px|in|mm|cm|pt|pc)$/;
  // Unitless "0" is a valid CSS length and the natural way to write
  // margin="0"; normalise it to 0px so max()/calc() (which reject a bare
  // number) keep working.
  const safeLen = (v, fb) => {
    v = (v || '').trim();
    return v === '0' ? '0px' : CSS_LENGTH.test(v) ? v : fb;
  };
  // WebKit (Safari and every iOS browser shell) never repeats a table's
  // thead/tfoot on printed pages (WebKit bug 17205), so the spacer-borne
  // vertical margins of a FLOWING document reach only the first page
  // there. Engine check, not browser check: vendor is 'Apple Computer,
  // Inc.' exactly for WebKit and 'Google Inc.' for Blink.
  const WK_PRINT = /apple/i.test(navigator.vendor || '');
  // CSS length → px number (CSS absolute units are exact: 1in = 96px).
  // Returns NaN for anything safeLen would reject — callers gate on it.
  const PX_PER = {
    px: 1,
    in: 96,
    mm: 96 / 25.4,
    cm: 96 / 2.54,
    pt: 96 / 72,
    pc: 16
  };
  const toPx = v => {
    const m = /^(\d+(?:\.\d+)?)(px|in|mm|cm|pt|pc)$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) * PX_PER[m[2]] : NaN;
  };
  const stylesheet = `
    :host {
      position: relative;
      display: block;
      /* When the viewport is narrower than the page, grow to wrap the
       * sheet (plus this padding) instead of staying viewport-width, so
       * the desk background and right margin reach the sheet's far edge
       * in the horizontal scroll. */
      min-width: max-content;
      min-height: 100vh;
      background: #f5f5f4;
      padding: 48px 24px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      --doc-page-w: 8.5in;
      --doc-page-h: 11in;
      --doc-page-margin: 0.75in;
      --doc-hdr-h: 0px;
      --doc-ftr-h: 0px;
      --doc-hdr-pad: 0px;
      --doc-ftr-pad: 0px;
    }
    .sheet {
      width: var(--doc-page-w);
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(20, 20, 19, 0.12);
      border-radius: 7px;
      box-sizing: border-box;
      padding: var(--doc-page-margin);
    }
    .frame { width: 100%; border-collapse: collapse; }
    /* Scaled-fit mode (content-width/content-height): the inner .fit box
     * lays the content out at its authored fixed size and scales it onto
     * the printable area; .fit-box reserves the scaled footprint in flow
     * (transforms don't affect layout) and centers it. Without the mode,
     * both divs are unstyled block pass-throughs. */
    /* Explicit pagination: direct .page children are the pages. The sheet
     * becomes a transparent stack and each page carries the card look on
     * screen; at print each page is exactly one full-bleed sheet. The
     * ::slotted defaults are deliberately weak (document CSS wins), so
     * authored page styling can override any of this. */
    .sheet.paginated {
      background: transparent;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .paginated ::slotted(.page) {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: var(--doc-page-ar);
      container-type: size;
      overflow: hidden;
      box-sizing: border-box;
      background: #fff;
      border-radius: 7px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
    .paginated ::slotted(.page:not(:first-child)) { margin-top: 1rem; }
    @media print {
      .sheet.paginated { padding: 0; }
      /* The flowing-document vertical inset lives on the repeating
       * thead/tfoot spacers, not the sheet padding — they must go too,
       * or each full-sheet .page is pushed ~margin down and spills onto
       * a second sheet. Paginated pages are full-bleed by definition
       * (content owns its insets). */
      .sheet.paginated .hdr-space,
      .sheet.paginated .ftr-space { height: 0; }
      .paginated ::slotted(.page) {
        border-radius: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        /* Physical page-box sizing, no viewport units: Safari resolves
         * 100vh against the window, not the page box, so a vh-sized card
         * paginates wrong there. --doc-page-w/h are the named size by
         * default and are overridden to the user's chosen paper by the
         * export path, so every card is exactly one sheet either way.
         * Width + height (same source values as @page size) rather than
         * width + aspect-ratio: the ratio is a 6-decimal rounding of the
         * same division, and a few millionths of overflow would spill a
         * blank sheet after every page. The screen-only aspect-ratio
         * (preview proportions) must not leak into print. cqh typography
         * tracks the same box.
         *
         * Every declaration is !important: per CSS Scoping, unimportant
         * shadow ::slotted rules LOSE to the document context, so a page
         * section's authored inline style would silently beat this print
         * geometry. A model-authored height:100% did exactly that — the
         * percentage resolves as auto in the all-auto print ancestry, the
         * base rule's size containment turns auto into ZERO, and
         * overflow:hidden then paints nothing: a blank PDF with perfect
         * page boxes. At print the component's geometry is the design's
         * whole contract, so it must win over any authored sizing. */
        aspect-ratio: auto !important;
        width: var(--doc-page-w) !important;
        height: var(--doc-page-h) !important;
        overflow: hidden !important;
      }
      .paginated ::slotted(.page:not(:first-child)) {
        break-before: page !important;
        margin-top: 0 !important;
      }
    }
    .fit-mode .fit-box {
      width: calc(var(--doc-fit-w) * var(--doc-fit-scale));
      height: calc(var(--doc-fit-h) * var(--doc-fit-scale));
      margin: 0 auto;
      break-inside: avoid;
    }
    /* Monolithic at print: Blink slices a transform-scaled child at
     * fragmentainer boundaries mapped in UNSCALED layout coordinates
     * (transforms are paint-time), so the .fit box (authored size, e.g.
     * 1400x990) gets cut at the page's free block space and spills onto
     * a second sheet even though its SCALED footprint fits the page by
     * construction. overflow:hidden makes .fit-box a scroll container —
     * monolithic under fragmentation (css-break-3) — so the scaled
     * content prints atomically on one sheet. No clipping for content
     * within the authored box: .fit-box is calc-sized to exactly the
     * scaled footprint. (Content that bleeds past content-width/height
     * is clipped at the footprint — fit mode's contract; it previously
     * painted beyond it at print.) Print-only, so the screen rendering
     * keeps visible overflow for editor affordances.
     * The export path injects the same rule into frozen copies
     * (print-eval.ts om-print-fit-contain). The .fit-mode scope is
     * load-bearing: .fit-box wraps slotted content in EVERY mode, and an
     * unscoped overflow:hidden would make whole flowing documents
     * monolithic (one truncated sheet). overflow:hidden, never clip —
     * clip is not a scroll container, so not monolithic. */
    @media print {
      .fit-mode .fit-box { overflow: hidden; }
    }
    .fit-mode .fit {
      width: var(--doc-fit-w);
      height: var(--doc-fit-h);
      transform: scale(var(--doc-fit-scale));
      transform-origin: top left;
    }
    .frame td, .frame th { padding: 0; text-align: left; font-weight: inherit; }
    .hdr-space { height: var(--doc-hdr-h); }
    .ftr-space { height: var(--doc-ftr-h); }
    ::slotted([slot="header"]),
    ::slotted([slot="footer"]) { display: block; box-sizing: border-box; }
    @media print {
      :host { background: none; padding: 0; min-width: 0; min-height: 0; }
      .sheet {
        width: auto; margin: 0; box-shadow: none; border-radius: 0;
        padding: 0 var(--doc-page-margin);
      }
      /* The thead/tfoot spacers repeat on every page, so they carry the
       * vertical page margin (which the sheet's own padding cannot, since
       * that padding is consumed once on the first/last page). The running
       * header/footer are fixed inside that band. */
      /* The 0.35in is breathing room between a running header/footer and
       * the body; without one the spacer is exactly the page margin, so a
       * margin="0" full-bleed document gets truly full-bleed pages. */
      .hdr-space { height: max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))); }
      .ftr-space { height: max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))); }
      /* WebKit flowing documents: @page carries the vertical margin (see
       * _syncPrintPageRule), so the spacers keep only whatever a running
       * header/footer needs BEYOND it — page 1 would otherwise double its
       * top inset. Paginated sheets already zero their spacers above. */
      .sheet.wk-print:not(.paginated) .hdr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-hdr-h) + var(--doc-hdr-pad))) - var(--doc-page-margin))); }
      .sheet.wk-print:not(.paginated) .ftr-space { height: max(0px, calc(max(var(--doc-page-margin), calc(var(--doc-ftr-h) + var(--doc-ftr-pad))) - var(--doc-page-margin))); }
      ::slotted([slot="header"]) {
        position: fixed; top: 0; left: 0; right: 0; margin: 0;
        padding: calc(var(--doc-page-margin) * 0.45) var(--doc-page-margin) 0;
      }
      ::slotted([slot="footer"]) {
        position: fixed; bottom: 0; left: 0; right: 0; margin: 0;
        padding: 0 var(--doc-page-margin) calc(var(--doc-page-margin) * 0.45);
      }
    }
  `;
  class DocPage extends HTMLElement {
    static get observedAttributes() {
      return ['size', 'width', 'height', 'margin', 'orientation', 'content-width', 'content-height'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._mo = typeof MutationObserver === 'function' ? new MutationObserver(() => this._scheduleMeasure()) : null;
    }

    /** The named paper's [w, h], swapped when orientation="landscape".
     *  Only the named size swaps — explicit width/height are exact values
     *  the author already oriented. */
    _paperSize() {
      const named = PAPER[(this.getAttribute('size') || '').toLowerCase()] || PAPER.letter;
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? [named[1], named[0]] : named;
    }
    get pageWidth() {
      return safeLen(this.getAttribute('width'), this._paperSize()[0]);
    }
    get pageHeight() {
      return safeLen(this.getAttribute('height'), this._paperSize()[1]);
    }
    get pageMargin() {
      return safeLen(this.getAttribute('margin'), '0.75in');
    }

    /** Scaled-fit mode's content box [w, h] as CSS lengths, or null when
     *  the mode is off (either attribute missing/invalid/zero — a partial
     *  declaration falls back to normal flow rather than guessing). */
    _contentFit() {
      const w = safeLen(this.getAttribute('content-width'), null);
      const h = safeLen(this.getAttribute('content-height'), null);
      if (!w || !h) return null;
      const wPx = toPx(w),
        hPx = toPx(h);
      return wPx > 0 && hPx > 0 ? [w, h, wPx, hPx] : null;
    }
    connectedCallback() {
      if (!this._sheet) this._render();
      this._syncSize();
      this._syncPrintPageRule();
      this._ensureTextWrapDefaults();
      this._ensureOwnsPrintMeta();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      if (this._mo) this._mo.observe(this, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true
      });
      this._onResize = () => this._scheduleMeasure();
      window.addEventListener('resize', this._onResize);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this._scheduleMeasure());
      }
      this._scheduleMeasure();
    }
    disconnectedCallback() {
      window.removeEventListener('resize', this._onResize);
      if (this._mo) this._mo.disconnect();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      // Drop the head rules when the last doc-page leaves, so a deleted
      // document's @page geometry and text-wrap defaults can't apply to
      // whatever replaces it.
      const survivor = document.querySelector('doc-page');
      if (!survivor) {
        ['doc-page-print', 'doc-page-text-wrap', 'doc-page-owns-print', 'doc-page-fixed-size', 'doc-page-print-sizing'].forEach(id => {
          const tag = document.getElementById(id);
          if (tag) tag.remove();
        });
        // A live deck-stage deferred its own print-sizing meta to ours —
        // hand the page-global meta over so the deck isn't left unmarked.
        const deck = document.querySelector('deck-stage');
        if (deck && typeof deck._ensurePrintSizingMeta === 'function') {
          deck._ensurePrintSizingMeta();
        }
      } else {
        // A departed owner hands each page-global meta to whatever
        // doc-page remains (or it's removed).
        if (typeof survivor._syncFixedSizeMeta === 'function') {
          survivor._syncFixedSizeMeta();
        }
        if (typeof survivor._syncPrintSizingMeta === 'function') {
          survivor._syncPrintSizingMeta();
        }
      }
    }
    attributeChangedCallback() {
      if (!this._sheet) return;
      this._syncSize();
      this._syncPrintPageRule();
      this._syncFixedSizeMeta();
      this._syncPrintSizingMeta();
      this._scheduleMeasure();
    }
    _render() {
      this._root.innerHTML = `
        <style>${stylesheet}</style>
        <style id="vars"></style>
        <div class="sheet" data-screen-label="Document">
          <table class="frame" role="presentation">
            <thead><tr><th><div class="hdr-space"><slot name="header"></slot></div></th></tr></thead>
            <tbody><tr><td class="body"><div class="fit-box"><div class="fit"><slot></slot></div></div></td></tr></tbody>
            <tfoot><tr><td><div class="ftr-space"><slot name="footer"></slot></div></td></tr></tfoot>
          </table>
        </div>`;
      this._sheet = this._root.querySelector('.sheet');
      this._vars = this._root.getElementById('vars');
    }

    /** Runtime sizing lives in a shadow <style> :host rule, never on the
     *  light-DOM host element, so serialize-persist can't write it back. */
    _syncSize(hdrH, ftrH) {
      // Scaled-fit mode: content at its authored size, scaled onto the
      // printable area (page minus margins on both axes). The factor is a
      // plain number var so calc(length * number) stays valid; 4 decimals
      // keeps the shadow style stable across re-measures. Upscaling is
      // allowed — print transforms are vector, so text and CSS stay crisp
      // (raster images soften, which the catalog bullet warns about).
      const fit = this._contentFit();
      let fitVars = '';
      if (fit) {
        const marginPx = toPx(this.pageMargin) || 0;
        const availW = toPx(this.pageWidth) - 2 * marginPx;
        const availH = toPx(this.pageHeight) - 2 * marginPx;
        const scale = Math.min(availW / fit[2], availH / fit[3]);
        if (scale > 0 && Number.isFinite(scale)) {
          fitVars = '--doc-fit-w:' + fit[0] + ';' + '--doc-fit-h:' + fit[1] + ';' + '--doc-fit-scale:' + scale.toFixed(4) + ';';
        }
      }
      this._sheet.classList.toggle('fit-mode', !!fitVars);
      // Numeric w/h ratio for the paginated page cards' aspect-ratio —
      // aspect-ratio takes a number, not a length ratio, so compute it
      // here (CSS length division isn't portable). 6 decimals keeps the
      // shadow style stable across re-syncs.
      const arW = toPx(this.pageWidth);
      const arH = toPx(this.pageHeight);
      const ar = arW > 0 && arH > 0 ? (arW / arH).toFixed(6) : '0.772727';
      this._vars.textContent = ':host{' + fitVars + '--doc-page-ar:' + ar + ';' + '--doc-page-w:' + this.pageWidth + ';' + '--doc-page-h:' + this.pageHeight + ';' + '--doc-page-margin:' + this.pageMargin + ';' + '--doc-hdr-h:' + (hdrH || 0) + 'px;' + '--doc-ftr-h:' + (ftrH || 0) + 'px;' + '--doc-hdr-pad:' + (hdrH ? '0.35in' : '0px') + ';' + '--doc-ftr-pad:' + (ftrH ? '0.35in' : '0px') + '}';
    }

    /** @page is a no-op inside shadow DOM, so the rule lives in <head>.
     *  Re-appended on every sync so it stays last in source order — the
     *  @page cascade is source-order per descriptor, so this rule wins
     *  over any other @page rule in the document.
     *
     *  The @page SIZE is pinned where the page box IS part of the design:
     *  explicit-fixed-size mode (width + height authored), scaled-fit
     *  mode (the named sheet the fit targets), and explicit pagination
     *  (the named size the cards share — so card and sheet agree on
     *  every print path, and the export path's chosen paper overrides
     *  BOTH with one later rule). For FLOWING documents no paper size is
     *  emitted at all — the true size comes from the user's preference,
     *  injected by the export path or chosen in the print dialog — so a
     *  flowing document never fights the paper it lands on.
     *  margin: 0 is emitted in every mode: it leaves Chrome no margin box
     *  to draw its date/URL/page-count header in, and the visual margin
     *  lives on the sheet's own padding. */
    _syncPrintPageRule() {
      const id = 'doc-page-print';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
      }
      document.head.appendChild(tag);
      // Three print-geometry regimes:
      // - true-size: the page IS the design — pin its exact size.
      // - scaled-fit (content-width/height): the fit factor is computed
      //   against the NAMED paper's printable area, so that paper must
      //   stay pinned or the scaled content overflows a smaller sheet
      //   (the export path re-fits and re-pins at print time on top).
      // - default modes: no paper size — but landscape still needs the
      //   paper-agnostic 'size: landscape' keyword, because the size
      //   descriptor is what carries orientation; without it a landscape
      //   document prints portrait whenever nothing injects a size.
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      // Explicit pagination pins the page box to the SAME values that
      // size the cards (the named size by default, the export path's
      // chosen paper when its later rule overrides both) — card and
      // sheet agree on every print path, and a mismatched real paper
      // shrinks-to-fit in the dialog instead of clipping a Letter card
      // on A4. Declared before the paginated read below so both derive
      // from one check.
      const paginatedNow = this.querySelector(':scope > .page') !== null;
      const sizeDescriptor = this._trueSizePx() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : this._contentFit() ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : paginatedNow ? 'size: ' + this.pageWidth + ' ' + this.pageHeight + '; ' : landscape ? 'size: landscape; ' : '';
      // WebKit never repeats the thead/tfoot spacers that carry a flowing
      // document's vertical page margins (see WK_PRINT above), so pages
      // after the first print edge-to-edge there. Carry the VERTICAL
      // margins on @page for WebKit instead, and the shadow print CSS
      // trims the first-page spacers by the same amount (.sheet.wk-print
      // rules). Horizontal inset stays on the sheet's own padding in
      // every engine. Blink keeps margin: 0 (a nonzero margin there
      // re-opens the box Chrome draws its header furniture in). One cost,
      // learned in testing: Safari's own date/URL headers are a USER
      // dialog setting ("Print headers and footers") that renders in the
      // margin area when room exists — margin: 0 only suppressed it by
      // leaving no room, and no CSS controls it. The export dialog's
      // Safari guide teaches turning the setting off for flowing
      // documents. Explicitly paginated and fixed-size documents keep
      // margin: 0 everywhere: their pages ARE the sheet.
      const wkFlowing = WK_PRINT && !paginatedNow && !this._trueSizePx() && !this._contentFit();
      const marginDescriptor = wkFlowing ? 'margin: ' + this.pageMargin + ' 0; ' : 'margin: 0; ';
      // Shadow-internal marker (never serialized), kept in lockstep with
      // the @page decision above: the print CSS trims the first-page
      // spacers ONLY while @page actually carries the margins — a
      // true-size or scaled-fit sheet keeps margin: 0 and must keep its
      // spacers too. Re-synced here so attribute changes and pagination
      // flips move both together.
      if (this._sheet) this._sheet.classList.toggle('wk-print', wkFlowing);
      tag.textContent = '@page { ' + sizeDescriptor + marginDescriptor + '} ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; height: auto !important; overflow: visible !important; } ' + 'h1,h2,h3,h4,h5,h6 { break-after: avoid; } ' + 'figure,pre,blockquote,img,svg,tr { break-inside: avoid; } ' + 'p,li { orphans: 3; widows: 3; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; ' + 'backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } ' + '*, *::before, *::after { animation-delay: -99s !important; animation-duration: .001s !important; ' + 'animation-iteration-count: 1 !important; animation-fill-mode: both !important; ' + 'animation-play-state: running !important; transition-duration: 0s !important; } }';
    }

    /** Typographic defaults for document text: balance headings, avoid
     *  widowed/orphaned words in body copy (browsers without text-wrap
     *  support drop the declarations). Zero-specificity via :where() so
     *  any text-wrap authored on those elements wins; document-level so the
     *  rules reach the slotted (light DOM) content — shadow styles can't.
     *  data-omelette-injected marks the tag for the host editor to strip
     *  at serialize, so it is never written back as authored source. */
    _ensureTextWrapDefaults() {
      if (document.getElementById('doc-page-text-wrap')) return;
      const tag = document.createElement('style');
      tag.id = 'doc-page-text-wrap';
      tag.setAttribute('data-omelette-injected', '');
      tag.textContent = ':where(h1,h2,h3,h4,h5,h6){text-wrap:balance}' + ':where(p,li,blockquote,figcaption){text-wrap:pretty}';
      document.head.appendChild(tag);
    }

    /** Declares that this document owns its print CSS. The instant-PDF
     *  export checks for the meta by NAME PRESENCE alone (content is
     *  ignored) and skips its automatic print-CSS injections, so the
     *  component's @page geometry is never overridden by a heuristic.
     *  data-omelette-injected keeps it out of serialized source. */
    _ensureOwnsPrintMeta() {
      if (document.getElementById('doc-page-owns-print')) return;
      const tag = document.createElement('meta');
      tag.id = 'doc-page-owns-print';
      tag.name = 'omelette-owns-print';
      tag.content = 'true';
      tag.setAttribute('data-omelette-injected', '');
      document.head.appendChild(tag);
    }

    /** This page's valid true-size page box (explicit width AND height)
     *  as [w, h] px ints, or null when the mode is off. */
    _trueSizePx() {
      if (!safeLen(this.getAttribute('width'), null) || !safeLen(this.getAttribute('height'), null)) return null;
      const w = Math.round(toPx(this.pageWidth));
      const h = Math.round(toPx(this.pageHeight));
      return w > 0 && h > 0 ? [w, h] : null;
    }

    /** True-size pages (explicit width AND height) also declare the page
     *  box as the preview size: the in-app preview reads
     *  meta[name="omelette-fixed-size"] (content "W,H" in px ints) and
     *  scales the sheet into view — without it an 18in poster previews at
     *  true size with scrollbars. Never overrides an author-set meta
     *  (only the component's own id is managed). The meta is page-global
     *  while doc-page instances are not, so every sync recomputes the
     *  page-wide owner — the first connected true-size doc-page — and a
     *  non-true-size sibling's sync can never delete the owner's meta.
     *  Removed when no true-size page remains (the owner's disconnect
     *  re-syncs via any survivor) or when an author-set meta exists. */
    _syncFixedSizeMeta() {
      const id = 'doc-page-fixed-size';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-fixed-size"]:not([data-omelette-injected])');
      // The page-wide owner, not this instance: an upgraded true-size page
      // anywhere in the document keeps the meta alive and sized.
      let box = null;
      for (const el of document.querySelectorAll('doc-page')) {
        box = typeof el._trueSizePx === 'function' ? el._trueSizePx() : null;
        if (box) break;
      }
      if (!box || authored) {
        if (own) own.remove();
        return;
      }
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-fixed-size';
      tag.content = box[0] + ',' + box[1];
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }

    /** This page's print-sizing mode: 'fixed' when an explicit width AND
     *  height are authored (the page is the design's own size), else the
     *  default paper in the authored orientation. */
    _printSizingMode() {
      if (this._trueSizePx()) return 'fixed';
      const landscape = (this.getAttribute('orientation') || '').trim().toLowerCase() === 'landscape';
      return landscape ? 'default-landscape' : 'default-portrait';
    }

    /** Announces the print-sizing mode to the host app:
     *  meta[name="omelette-print-sizing"] with content 'default-portrait',
     *  'default-landscape', or 'fixed' (fixed pages also carry the
     *  omelette-fixed-size meta with the page box in px). The export path
     *  probes it to decide what true paper size to inject at print time —
     *  in the default modes the component emits no paper size of its own.
     *  Same page-global ownership rules as the fixed-size meta above:
     *  first connected doc-page owns it, an authored meta is never
     *  overridden, removed when no doc-page remains. */
    _syncPrintSizingMeta() {
      const id = 'doc-page-print-sizing';
      const own = document.getElementById(id);
      const authored = document.querySelector('meta[name="omelette-print-sizing"]:not([data-omelette-injected])');
      // A fixed page wins outright (mirroring the fixed-size loop above,
      // so the two metas can never contradict each other in a mixed
      // multi-page document); otherwise the first page's mode holds.
      let mode = null;
      for (const el of document.querySelectorAll('doc-page')) {
        if (typeof el._printSizingMode !== 'function') continue;
        const m = el._printSizingMode();
        if (m === 'fixed') {
          mode = m;
          break;
        }
        if (mode === null) mode = m;
      }
      if (!mode || authored) {
        if (own) own.remove();
        return;
      }
      // A deck-stage that connected first injected its own meta and
      // defers to any existing one — take it over, or the document ends
      // up with two conflicting injected metas (a doc-page page is the
      // document; the deck re-ensures its meta if every doc-page leaves).
      const deckMeta = document.getElementById('deck-stage-print-sizing');
      if (deckMeta) deckMeta.remove();
      const tag = own || document.createElement('meta');
      tag.id = id;
      tag.name = 'omelette-print-sizing';
      tag.content = mode;
      tag.setAttribute('data-omelette-injected', '');
      if (!own) document.head.appendChild(tag);
    }
    _scheduleMeasure() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = null;
        this._measure();
      });
    }

    /** Slot heights feed the print spacers (--doc-hdr-h / --doc-ftr-h), so
     *  they re-measure on content mutation, resize, and font load. The
     *  same pass detects explicit pagination (direct .page children) and
     *  toggles the sheet between the flowing-document card and the
     *  page-per-card stack — content edits can add or remove pages at any
     *  time, so this tracks the same mutations the measurement does. */
    _measure() {
      const hdr = this.querySelector(':scope > [slot="header"]');
      const ftr = this.querySelector(':scope > [slot="footer"]');
      const wasPaginated = this._sheet.classList.contains('paginated');
      this._sheet.classList.toggle('paginated', this.querySelector(':scope > .page') !== null);
      // The WebKit @page margin is flowing-only, so a pagination flip
      // must re-emit the rule (content edits can add or remove .page
      // sections at any time).
      if (this._sheet.classList.contains('paginated') !== wasPaginated) {
        this._syncPrintPageRule();
      }
      this._syncSize(hdr ? hdr.offsetHeight : 0, ftr ? ftr.offsetHeight : 0);
    }
  }
  if (!customElements.get('doc-page')) {
    customElements.define('doc-page', DocPage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/patient-wallet/doc-page.js", error: String((e && e.message) || e) }); }

// ui_kits/rhu-portal/NewReferral.jsx
try { (() => {
const {
  Button,
  Card,
  Input,
  Select,
  Checkbox,
  Icon,
  StatusBadge
} = window.VITALDesignSystem_2895b5;
function NewReferral({
  onSubmit,
  offline
}) {
  const [facility, setFacility] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const showError = submitted && !facility;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 880
    }
  }, /*#__PURE__*/React.createElement(PageHead, {
    title: "New referral",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost"
    }, "Save draft")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Patient"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Family name",
    defaultValue: "Bagatsing",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Given name",
    defaultValue: "Liwayway",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Patient ID",
    defaultValue: "PH-8812-0031",
    helper: "PhilHealth or facility number",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Date of birth",
    defaultValue: "04 Feb 1958"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Barangay",
    defaultValue: "Napo, Loon"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Contact number",
    defaultValue: "0917 442 1180"
  }))), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Referral"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Refer to",
    required: true,
    options: [{
      value: '',
      label: 'Select a facility'
    }, 'Bohol Provincial Hospital', 'Tagbilaran District Hospital', 'Bohol Provincial Laboratory'],
    value: facility,
    onChange: e => setFacility(e.target.value),
    error: showError ? 'Select a facility to continue' : undefined
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Service requested",
    options: ['Chest X-ray', 'Complete blood count', 'Urinalysis', 'Prenatal ultrasound']
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Priority",
    options: ['Routine', 'Urgent']
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Preferred date",
    defaultValue: "18 Mar 2026",
    helper: "Patient has no transport on Fridays."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Clinical note",
    defaultValue: "Persistent cough, three weeks. No fever. Requesting PA view."
  }))), /*#__PURE__*/React.createElement(Card, {
    tint: "keylime",
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Consent"), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Patient consents to share this referral and its results with the receiving facility",
    helper: "Scope is this referral only. The patient can revoke consent at any time from their wallet."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "send",
    onClick: () => {
      setSubmitted(true);
      if (facility) onSubmit();
    }
  }, "Send referral"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Discard"), offline ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      fontSize: 'var(--text-caption)',
      color: 'var(--color-amber-hold)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cloud-off",
    size: 16
  }), "Offline \u2014 this referral queues and stays visible as ", /*#__PURE__*/React.createElement(StatusBadge, {
    status: "sending"
  }), " until the server confirms.") : null)));
}
Object.assign(window, {
  NewReferral
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rhu-portal/NewReferral.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rhu-portal/QueueScreen.jsx
try { (() => {
const {
  Button,
  IconButton,
  Card,
  DataTable,
  StatusBadge,
  Icon,
  Select,
  Skeleton,
  EmptyState
} = window.VITALDesignSystem_2895b5;
const REFERRALS = [{
  id: 'REF-0412',
  patient: 'Dela Cruz, M.',
  patientId: 'PH-4409-1182',
  service: 'Chest X-ray',
  to: 'Bohol Provincial Hospital',
  status: 'declined',
  updated: '14 Mar · 14:22'
}, {
  id: 'REF-0411',
  patient: 'Sarabia, N.',
  patientId: 'PH-3318-0924',
  service: 'Complete blood count',
  to: 'Bohol Provincial Laboratory',
  status: 'patient-arrived',
  updated: '14 Mar · 11:03'
}, {
  id: 'REF-0410',
  patient: 'Amodia, F.',
  patientId: 'PH-7712-4408',
  service: 'Prenatal ultrasound',
  to: 'Tagbilaran District Hospital',
  status: 'consent-revoked',
  updated: '14 Mar · 08:47'
}, {
  id: 'REF-0409',
  patient: 'Boteros, R.',
  patientId: 'PH-1180-6631',
  service: 'Urinalysis',
  to: 'Bohol Provincial Laboratory',
  status: 'no-show',
  updated: '13 Mar · 17:55'
}, {
  id: 'REF-0408',
  patient: 'Tirol, G.',
  patientId: 'PH-6620-3390',
  service: 'HbA1c',
  to: 'Bohol Provincial Laboratory',
  status: 'wrong-patient-result',
  updated: '13 Mar · 15:10'
}, {
  id: 'REF-0407',
  patient: 'Lumbo, A.',
  patientId: 'PH-2204-7751',
  service: 'Lipid panel',
  to: 'Bohol Provincial Laboratory',
  status: 'completed',
  updated: '13 Mar · 09:12'
}, {
  id: 'REF-0406',
  patient: 'Ompad, C.',
  patientId: 'PH-9931-2205',
  service: 'ECG',
  to: 'Bohol Provincial Hospital',
  status: 'accepted',
  updated: '12 Mar · 16:28'
}, {
  id: 'REF-0405',
  patient: 'Racho, D.',
  patientId: 'PH-5540-8817',
  service: 'Sputum AFB',
  to: 'Bohol Provincial Laboratory',
  status: 'sent',
  updated: '12 Mar · 10:02'
}];
function QueueScreen({
  onOpen,
  loading,
  pending
}) {
  const [filter, setFilter] = React.useState('All statuses');
  const rows = React.useMemo(() => {
    const base = pending ? [{
      id: 'REF-0413',
      patient: 'Bagatsing, L.',
      patientId: 'PH-8812-0031',
      service: 'Chest X-ray',
      to: 'Bohol Provincial Hospital',
      status: 'sending',
      updated: 'just now'
    }, ...REFERRALS] : REFERRALS;
    if (filter === 'All statuses') return base;
    if (filter === 'Needs attention') return base.filter(r => ['consent-revoked', 'no-show', 'overdue', 'sending'].includes(r.status));
    if (filter === 'Failed') return base.filter(r => ['declined', 'wrong-patient-result'].includes(r.status));
    return base.filter(r => ['received', 'accepted', 'patient-arrived', 'endorsed'].includes(r.status));
  }, [filter, pending]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHead, {
    title: "Referral queue",
    count: `${rows.length} referrals`,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Select, {
      label: "",
      "aria-label": "Filter by status",
      options: ['All statuses', 'Needs attention', 'Failed', 'In progress'],
      value: filter,
      onChange: e => setFilter(e.target.value),
      style: {
        minWidth: 180
      }
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: "printer",
      label: "Print queue",
      variant: "outline",
      style: {
        alignSelf: 'flex-end'
      }
    }))
  }), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Skeleton, {
    lines: 6,
    height: 24
  })) : rows.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    message: "No referrals match this filter."
  }) : /*#__PURE__*/React.createElement(DataTable, {
    rows: rows,
    onRowClick: onOpen,
    columns: [{
      key: 'id',
      header: 'Referral',
      tabular: true,
      width: 110,
      nowrap: true
    }, {
      key: 'patient',
      header: 'Patient'
    }, {
      key: 'patientId',
      header: 'Patient ID',
      tabular: true
    }, {
      key: 'service',
      header: 'Service'
    }, {
      key: 'to',
      header: 'Referred to'
    }, {
      key: 'status',
      header: 'Status',
      render: r => /*#__PURE__*/React.createElement(StatusBadge, {
        status: r.status
      })
    }, {
      key: 'updated',
      header: 'Updated',
      tabular: true,
      align: 'right',
      nowrap: true
    }]
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)',
      marginTop: 'var(--space-3)'
    }
  }, "Synthetic records. Never place real patient data in a prototype."));
}
Object.assign(window, {
  QueueScreen,
  REFERRALS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rhu-portal/QueueScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rhu-portal/ReferralDetail.jsx
try { (() => {
const {
  Button,
  Card,
  Icon,
  StatusBadge,
  StatusTrail,
  Dialog,
  Toast
} = window.VITALDesignSystem_2895b5;
function Field({
  label,
  value,
  tabular
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      fontVariantNumeric: tabular ? 'tabular-nums' : undefined
    }
  }, value));
}
function ReferralDetail({
  referral,
  onBack
}) {
  const [status, setStatus] = React.useState(referral.status);
  const [dialog, setDialog] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [trail, setTrail] = React.useState([{
    status: referral.status,
    actor: 'Bohol Provincial Laboratory',
    facility: 'Receiving facility',
    timestamp: '14 Mar 2026 · 14:22'
  }, {
    status: 'sent',
    actor: 'J. Bacarro, Midwife',
    facility: 'Loon RHU',
    timestamp: '13 Mar 2026 · 16:40'
  }, {
    status: 'created',
    actor: 'J. Bacarro, Midwife',
    facility: 'Loon RHU',
    timestamp: '13 Mar 2026 · 16:31'
  }]);
  function apply(next, label) {
    setStatus(next);
    setTrail(t => [{
      status: next,
      actor: 'J. Bacarro, Midwife',
      facility: 'Loon RHU',
      timestamp: '15 Mar 2026 · 09:14'
    }, ...t]);
    setDialog(null);
    setToast(label);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      background: 'none',
      border: 'none',
      padding: 0,
      marginBottom: 'var(--space-3)',
      color: 'var(--color-forest-ink)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 16
  }), "Back to queue"), /*#__PURE__*/React.createElement(PageHead, {
    title: referral.id,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      icon: "printer"
    }, "Print"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "repeat",
      onClick: () => apply('sent', 'Referral re-sent to Bohol Provincial Hospital.')
    }, "Re-send"), /*#__PURE__*/React.createElement(Button, {
      variant: "destructive",
      icon: "circle-x",
      onClick: () => setDialog('cancel')
    }, "Cancel referral"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 'var(--space-6)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-subheading)',
      margin: 0,
      color: 'var(--color-forest-ink)'
    }
  }, referral.patient), /*#__PURE__*/React.createElement(StatusBadge, {
    status: status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Patient ID",
    value: referral.patientId,
    tabular: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Date of birth",
    value: "12 Sep 1961",
    tabular: true
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Barangay",
    value: "Cogon Norte, Loon"
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Service requested",
    value: referral.service
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Referred to",
    value: referral.to
  }), /*#__PURE__*/React.createElement(Field, {
    label: "Priority",
    value: "Routine"
  }))), /*#__PURE__*/React.createElement(Card, {
    tint: "keylime",
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)',
      marginBottom: 'var(--space-1)'
    }
  }, "Clinical note"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-body-sm)',
      lineHeight: 'var(--leading-body-sm)'
    }
  }, "Persistent cough, three weeks. No fever. Requesting PA view and radiologist read. Patient has no transport on Fridays.")), status === 'declined' ? /*#__PURE__*/React.createElement(Card, {
    statusBorder: "clay",
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-x",
    size: 20,
    color: "var(--color-clay-alert)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--color-clay-alert)'
    }
  }, "Declined by Bohol Provincial Hospital"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)',
      marginTop: 4
    }
  }, "Radiology unit closed for maintenance until 18 March. Reason given: capacity."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 'var(--space-2)',
      marginTop: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: () => apply('sent', 'Referral redirected to Tagbilaran District Hospital.')
  }, "Redirect to another facility"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Contact facility"))))) : null, /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)',
      marginBottom: 'var(--space-2)'
    }
  }, "Consent"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 20,
    color: "var(--color-forest-ink)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)'
    }
  }, "Patient granted access to Bohol Provincial Hospital on ", /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, "13 Mar 2026"), ". Scope: this referral only.")))), /*#__PURE__*/React.createElement(Card, {
    bordered: true,
    density: "compact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "column-header",
    style: {
      marginBottom: 'var(--space-3)'
    }
  }, "Status trail"), /*#__PURE__*/React.createElement(StatusTrail, {
    entries: trail
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal-muted)',
      marginTop: 'var(--space-4)',
      marginBottom: 0
    }
  }, "Append-only. Entries cannot be edited or removed."))), /*#__PURE__*/React.createElement(Dialog, {
    open: dialog === 'cancel',
    title: "Cancel this referral?",
    destructive: true,
    confirmLabel: "Cancel referral",
    cancelLabel: "Keep referral",
    onCancel: () => setDialog(null),
    onConfirm: () => apply('declined', 'Referral cancelled. The receiving facility has been notified.')
  }, "Bohol Provincial Hospital will be notified and the referral closes. The status trail keeps every prior entry."), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 60
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: toast,
    onDismiss: () => setToast(null)
  })) : null);
}
Object.assign(window, {
  ReferralDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rhu-portal/ReferralDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rhu-portal/Shell.jsx
try { (() => {
const {
  Icon,
  Button,
  IconButton,
  Card,
  SessionBar,
  OfflineBanner
} = window.VITALDesignSystem_2895b5;
const NAV = [{
  id: 'queue',
  label: 'Referral queue',
  icon: 'list'
}, {
  id: 'new',
  label: 'New referral',
  icon: 'file-plus'
}, {
  id: 'patients',
  label: 'Patients',
  icon: 'users'
}, {
  id: 'reports',
  label: 'Reports',
  icon: 'chart-no-axes-column'
}];
function Shell({
  screen,
  onNavigate,
  offline,
  onToggleOffline,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    "data-density": "compact",
    style: {
      position: 'relative',
      minHeight: '100%',
      background: 'var(--color-cream-paper)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      color: 'var(--color-charcoal)'
    }
  }, offline ? /*#__PURE__*/React.createElement(OfflineBanner, {
    queued: 2
  }) : null, /*#__PURE__*/React.createElement(SessionBar, {
    user: "J. Bacarro",
    role: "Midwife",
    facility: "Loon RHU",
    right: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      icon: offline ? 'wifi' : 'wifi-off',
      onClick: onToggleOffline,
      style: {
        minHeight: 32
      }
    }, offline ? 'Simulate online' : 'Simulate offline')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '236px 1fr',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      borderRight: '1px solid var(--color-border-strong)',
      padding: 'var(--space-4) var(--space-3)',
      minHeight: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      letterSpacing: '0.14em',
      color: 'var(--color-forest-ink)',
      padding: '0 var(--space-3) var(--space-4)'
    }
  }, "VITAL"), NAV.map(n => {
    const on = screen === n.id || screen === 'detail' && n.id === 'queue';
    return /*#__PURE__*/React.createElement("button", {
      key: n.id,
      onClick: () => onNavigate(n.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        minHeight: 40,
        padding: '0 var(--space-3)',
        borderRadius: 'var(--radius-control)',
        border: '1px solid transparent',
        background: on ? 'var(--color-keylime-wash)' : 'transparent',
        color: 'var(--color-forest-ink)',
        fontWeight: on ? 600 : 400,
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-body-sm)',
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: n.icon,
      size: 16
    }), n.label);
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tint: "keylime",
    density: "compact",
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--color-charcoal)'
    }
  }, "Shared terminal. Sign out when you leave the desk."))), /*#__PURE__*/React.createElement("main", {
    style: {
      padding: 'var(--space-6) var(--gutter-portal)'
    }
  }, children)));
}
function PageHead({
  title,
  count,
  actions
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-4)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-heading-md)',
      lineHeight: 'var(--leading-heading-md)',
      letterSpacing: 'var(--tracking-heading)',
      color: 'var(--color-forest-ink)',
      margin: 0
    }
  }, title), count != null ? /*#__PURE__*/React.createElement("span", {
    className: "tabular",
    style: {
      fontVariantNumeric: 'tabular-nums',
      color: 'var(--color-charcoal-muted)'
    }
  }, count) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 'var(--space-2)'
    }
  }, actions));
}
Object.assign(window, {
  Shell,
  PageHead
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rhu-portal/Shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.OfflineBanner = __ds_scope.OfflineBanner;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.SessionBar = __ds_scope.SessionBar;

__ds_ns.QueueRow = __ds_scope.QueueRow;

__ds_ns.STATUS_META = __ds_scope.STATUS_META;

__ds_ns.STATUS_GROUP_STYLE = __ds_scope.STATUS_GROUP_STYLE;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.StatusTrail = __ds_scope.StatusTrail;

})();
