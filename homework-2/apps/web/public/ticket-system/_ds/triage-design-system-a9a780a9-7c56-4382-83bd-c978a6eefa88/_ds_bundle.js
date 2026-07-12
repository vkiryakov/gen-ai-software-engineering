/* @ds-bundle: {"format":4,"namespace":"TriageDesignSystem_a9a780","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"PriorityTag","sourcePath":"components/data-display/PriorityTag.jsx"},{"name":"StatusTag","sourcePath":"components/data-display/StatusTag.jsx"},{"name":"Banner","sourcePath":"components/feedback/Banner.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FieldLabel","sourcePath":"components/forms/FieldLabel.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"f46714689e0a","components/buttons/IconButton.jsx":"7d82587c7c7e","components/data-display/Avatar.jsx":"5bc0d83a34b4","components/data-display/Badge.jsx":"549362254a58","components/data-display/Card.jsx":"15cb5075c213","components/data-display/PriorityTag.jsx":"33f39e140c0b","components/data-display/StatusTag.jsx":"baf239dac32d","components/feedback/Banner.jsx":"a1ef28160514","components/feedback/Spinner.jsx":"7745fb791642","components/feedback/Toast.jsx":"e4d239d01617","components/feedback/Tooltip.jsx":"c3165f42c233","components/forms/Checkbox.jsx":"049f95b2539a","components/forms/FieldLabel.jsx":"b78f67ab92c7","components/forms/Input.jsx":"9db6441e51ab","components/forms/Radio.jsx":"20a410fb3a56","components/forms/Select.jsx":"ecdfffb6869f","components/forms/Switch.jsx":"ed5939952fc5","components/forms/Textarea.jsx":"9220e4f29609","components/navigation/NavItem.jsx":"a1f57b699aa1","components/navigation/Tabs.jsx":"07376615a6e0","components/overlays/Modal.jsx":"f090f8de428d","ui_kits/agent-app/ImportModal.jsx":"2366d3767de7","ui_kits/agent-app/Sidebar.jsx":"5faac062cf91","ui_kits/agent-app/TicketDetail.jsx":"95107a9aad64","ui_kits/agent-app/TicketList.jsx":"c606a39787b7","ui_kits/agent-app/data.js":"e343fab14874"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TriageDesignSystem_a9a780 = window.TriageDesignSystem_a9a780 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--weight-semibold)',
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
  userSelect: 'none',
  textDecoration: 'none',
  lineHeight: 1
};
const sizes = {
  sm: {
    height: '30px',
    padding: '0 10px',
    fontSize: 'var(--text-sm)'
  },
  md: {
    height: '36px',
    padding: '0 14px',
    fontSize: 'var(--text-base)'
  },
  lg: {
    height: '42px',
    padding: '0 18px',
    fontSize: 'var(--text-md)'
  }
};
const variants = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--accent)'
  },
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-xs)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent'
  },
  danger: {
    background: 'var(--danger)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--danger)'
  },
  'danger-soft': {
    background: 'var(--danger-bg)',
    color: 'var(--danger)',
    borderColor: 'var(--danger-border)'
  }
};
const hoverBg = {
  primary: 'var(--accent-hover)',
  secondary: 'var(--surface-hover)',
  ghost: 'var(--surface-hover)',
  danger: '#bd2932',
  'danger-soft': '#fbdfe2'
};

/**
 * Triage primary action control. Compact, semibold, functional.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  as = 'button',
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const Tag = as;
  const v = variants[variant] || variants.primary;
  const composed = {
    ...base,
    ...sizes[size],
    ...v,
    ...(hover && !disabled ? {
      background: hoverBg[variant] || v.background
    } : null),
    ...(fullWidth ? {
      width: '100%'
    } : null),
    ...(disabled ? {
      opacity: 0.5,
      cursor: 'not-allowed',
      boxShadow: 'none'
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: composed,
    disabled: Tag === 'button' ? disabled : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, rest), iconLeft, children != null && /*#__PURE__*/React.createElement("span", null, children), iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: {
    width: '30px',
    height: '30px',
    fontSize: '15px'
  },
  md: {
    width: '36px',
    height: '36px',
    fontSize: '17px'
  },
  lg: {
    width: '42px',
    height: '42px',
    fontSize: '19px'
  }
};
const variants = {
  secondary: {
    background: 'var(--surface-card)',
    color: 'var(--text-secondary)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-xs)'
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent'
  },
  primary: {
    background: 'var(--accent)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--accent)'
  }
};
const hoverBg = {
  secondary: 'var(--surface-hover)',
  ghost: 'var(--surface-hover)',
  primary: 'var(--accent-hover)'
};

/**
 * Square icon-only button for toolbars and dense row actions.
 */
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const v = variants[variant] || variants.ghost;
  const composed = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
    ...sizes[size],
    ...v,
    ...(hover && !disabled ? {
      background: hoverBg[variant],
      color: variant === 'primary' ? 'var(--text-inverse)' : 'var(--text-primary)'
    } : null),
    ...(disabled ? {
      opacity: 0.45
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    style: composed,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, rest), icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
const sizes = {
  xs: 20,
  sm: 26,
  md: 32,
  lg: 40
};
// Deterministic tint from name so avatars are stable per agent/customer.
const palette = [['#e3e2fb', '#3c319e'], ['#e5f5ed', '#17935a'], ['#fdf0e6', '#d9631a'], ['#e9f1fb', '#2f7ecb'], ['#fbf3d9', '#8a6207'], ['#fdecee', '#bd2932']];
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = h * 31 + str.charCodeAt(i) | 0;
  return Math.abs(h);
}
function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

/**
 * Circular avatar with image fallback to deterministic colored initials.
 */
function Avatar({
  name = '',
  src = null,
  size = 'md',
  style = {}
}) {
  const px = sizes[size] || sizes.md;
  const [bg, fg] = palette[hash(name) % palette.length];
  const common = {
    width: px,
    height: px,
    borderRadius: '50%',
    flex: '0 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-bold)',
    fontSize: px * 0.42,
    letterSpacing: '0.01em',
    overflow: 'hidden',
    userSelect: 'none',
    ...style
  };
  if (src) {
    return /*#__PURE__*/React.createElement("img", {
      src: src,
      alt: name,
      style: {
        ...common,
        objectFit: 'cover'
      }
    });
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...common,
      background: bg,
      color: fg
    }
  }, initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
const tones = {
  neutral: {
    fg: 'var(--ink-700)',
    bg: 'var(--ink-100)',
    bd: 'var(--ink-200)'
  },
  brand: {
    fg: 'var(--brand-700)',
    bg: 'var(--brand-50)',
    bd: 'var(--brand-200)'
  },
  success: {
    fg: 'var(--success)',
    bg: 'var(--success-bg)',
    bd: 'var(--success-border)'
  },
  warning: {
    fg: 'var(--warning)',
    bg: 'var(--warning-bg)',
    bd: 'var(--warning-border)'
  },
  danger: {
    fg: 'var(--danger)',
    bg: 'var(--danger-bg)',
    bd: 'var(--danger-border)'
  },
  info: {
    fg: 'var(--info)',
    bg: 'var(--info-bg)',
    bd: 'var(--info-border)'
  }
};

/**
 * Small labelled chip for counts, categories, SLA, channel, and metadata.
 */
function Badge({
  children,
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  style = {}
}) {
  const t = tones[tone] || tones.neutral;
  const outlined = variant === 'outline';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      height: '20px',
      padding: '0 7px',
      background: outlined ? 'transparent' : t.bg,
      color: t.fg,
      border: `1px solid ${outlined ? t.bd : 'transparent'}`,
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: 'var(--tracking-wide)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      background: t.fg
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Surface container. Border-defined by default; `raised` adds shadow;
 * `interactive` adds hover lift for clickable cards.
 */
function Card({
  children,
  padding = 'md',
  variant = 'default',
  interactive = false,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const pads = {
    none: '0',
    sm: 'var(--space-5)',
    md: 'var(--space-7)',
    lg: 'var(--space-9)'
  };
  const composed = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: pads[padding],
    boxShadow: variant === 'raised' ? 'var(--shadow-md)' : 'var(--shadow-xs)',
    transition: 'box-shadow var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)',
    ...(interactive ? {
      cursor: 'pointer'
    } : null),
    ...(interactive && hover ? {
      boxShadow: 'var(--shadow-md)',
      borderColor: 'var(--border-strong)',
      transform: 'translateY(-1px)'
    } : null),
    ...style
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: composed,
    onMouseEnter: interactive ? () => setHover(true) : undefined,
    onMouseLeave: interactive ? () => setHover(false) : undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/PriorityTag.jsx
try { (() => {
const LEVELS = {
  urgent: {
    label: 'Urgent',
    fg: 'var(--priority-urgent)',
    bg: 'var(--priority-urgent-bg)',
    bd: 'var(--priority-urgent-border)',
    bars: 4
  },
  high: {
    label: 'High',
    fg: 'var(--priority-high)',
    bg: 'var(--priority-high-bg)',
    bd: 'var(--priority-high-border)',
    bars: 3
  },
  medium: {
    label: 'Medium',
    fg: 'var(--priority-medium)',
    bg: 'var(--priority-medium-bg)',
    bd: 'var(--priority-medium-border)',
    bars: 2
  },
  low: {
    label: 'Low',
    fg: 'var(--priority-low)',
    bg: 'var(--priority-low-bg)',
    bd: 'var(--priority-low-border)',
    bars: 1
  },
  none: {
    label: 'None',
    fg: 'var(--priority-none)',
    bg: 'var(--priority-none-bg)',
    bd: 'var(--priority-none-border)',
    bars: 0
  }
};
function Signal({
  level,
  color
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'flex-end',
      gap: '1.5px',
      height: '11px'
    }
  }, [1, 2, 3, 4].map(n => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      width: '2.5px',
      height: `${3 + n * 2}px`,
      borderRadius: '1px',
      background: n <= level ? color : 'currentColor',
      opacity: n <= level ? 1 : 0.25
    }
  })));
}

/**
 * Priority indicator for a ticket. Shows a signal-bar glyph + label, or bare glyph when compact.
 */
function PriorityTag({
  level = 'none',
  variant = 'soft',
  showLabel = true,
  style = {}
}) {
  const p = LEVELS[level] || LEVELS.none;
  if (variant === 'bare') {
    return /*#__PURE__*/React.createElement("span", {
      title: p.label,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: p.fg,
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-semibold)',
        ...style
      }
    }, /*#__PURE__*/React.createElement(Signal, {
      level: p.bars,
      color: p.fg
    }), showLabel && p.label);
  }
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      height: '22px',
      padding: '0 8px',
      background: p.bg,
      color: p.fg,
      border: `1px solid ${p.bd}`,
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: 'var(--tracking-snug)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement(Signal, {
    level: p.bars,
    color: p.fg
  }), showLabel && p.label);
}
Object.assign(__ds_scope, { PriorityTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/PriorityTag.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatusTag.jsx
try { (() => {
const STATUSES = {
  new: {
    label: 'New',
    fg: 'var(--status-new)',
    bg: 'var(--status-new-bg)'
  },
  open: {
    label: 'Open',
    fg: 'var(--status-open)',
    bg: 'var(--status-open-bg)'
  },
  pending: {
    label: 'Pending',
    fg: 'var(--status-pending)',
    bg: 'var(--status-pending-bg)'
  },
  solved: {
    label: 'Solved',
    fg: 'var(--status-solved)',
    bg: 'var(--status-solved-bg)'
  },
  closed: {
    label: 'Closed',
    fg: 'var(--status-closed)',
    bg: 'var(--status-closed-bg)'
  }
};

/**
 * Ticket lifecycle status pill. Dot + label, pill-shaped.
 */
function StatusTag({
  status = 'open',
  label,
  style = {}
}) {
  const s = STATUSES[status] || STATUSES.open;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      height: '22px',
      padding: '0 10px 0 8px',
      background: s.bg,
      color: s.fg,
      borderRadius: 'var(--radius-pill)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      letterSpacing: 'var(--tracking-snug)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: s.fg
    }
  }), label || s.label);
}
Object.assign(__ds_scope, { StatusTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatusTag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Banner.jsx
try { (() => {
const tones = {
  info: {
    fg: 'var(--info)',
    bg: 'var(--info-bg)',
    bd: 'var(--info-border)',
    icon: 'info'
  },
  success: {
    fg: 'var(--success)',
    bg: 'var(--success-bg)',
    bd: 'var(--success-border)',
    icon: 'check-circle-2'
  },
  warning: {
    fg: 'var(--warning)',
    bg: 'var(--warning-bg)',
    bd: 'var(--warning-border)',
    icon: 'alert-triangle'
  },
  danger: {
    fg: 'var(--danger)',
    bg: 'var(--danger-bg)',
    bd: 'var(--danger-border)',
    icon: 'alert-octagon'
  }
};
const icons = {
  info: 'M12 16v-4M12 8h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  'check-circle-2': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  'alert-triangle': 'm10.29 3.86-8.48 14.7A2 2 0 0 0 3.53 21h16.94a2 2 0 0 0 1.72-2.44l-8.48-14.7a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  'alert-octagon': 'M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2zM12 8v4M12 16h.01'
};

/**
 * Inline contextual message banner — imports, SLA breaches, system notices.
 */
function Banner({
  tone = 'info',
  title,
  children,
  onClose,
  action,
  style = {}
}) {
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
      padding: '12px 14px',
      background: t.bg,
      color: 'var(--text-primary)',
      border: `1px solid ${t.bd}`,
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: t.fg,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      flex: '0 0 auto',
      marginTop: '1px'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: icons[t.icon]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-base)',
      color: t.fg,
      marginBottom: children ? '2px' : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)',
      lineHeight: 'var(--leading-normal)'
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '10px'
    }
  }, action)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      flex: '0 0 auto',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-tertiary)',
      padding: '2px',
      lineHeight: 0,
      borderRadius: 'var(--radius-xs)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Banner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
/**
 * Indeterminate loading spinner (SVG stroke rotation).
 */
function Spinner({
  size = 18,
  thickness = 2.5,
  color = 'var(--accent)',
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    role: "status",
    "aria-label": "Loading",
    style: {
      display: 'inline-flex',
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    style: {
      animation: 'triage-spin 0.7s linear infinite'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9",
    fill: "none",
    stroke: "currentColor",
    strokeOpacity: "0.18",
    strokeWidth: thickness,
    style: {
      color
    }
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 0 0-9-9",
    fill: "none",
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("style", null, `@keyframes triage-spin{to{transform:rotate(360deg)}}`));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const tones = {
  neutral: 'var(--ink-800)',
  success: 'var(--success)',
  danger: 'var(--danger)',
  info: 'var(--info)'
};

/**
 * Transient confirmation toast. Render inside a fixed-position stack; caller
 * controls timing/dismissal. Dark surface, accent dot.
 */
function Toast({
  tone = 'neutral',
  title,
  children,
  onClose,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      minWidth: '280px',
      maxWidth: '400px',
      padding: '12px 14px',
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: tones[tone] || tones.neutral,
      marginTop: '5px',
      flex: '0 0 auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 'var(--weight-semibold)',
      fontSize: 'var(--text-base)'
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-sm)',
      color: 'var(--ink-300)',
      marginTop: title ? '2px' : 0
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--ink-400)',
      padding: '2px',
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/**
 * Hover/focus tooltip. Wraps its child trigger; shows a dark label on delay.
 */
function Tooltip({
  label,
  side = 'top',
  children,
  style = {}
}) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: '7px'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '7px'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: '7px'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: '7px'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos[side],
      zIndex: 50,
      background: 'var(--ink-900)',
      color: 'var(--white)',
      padding: '5px 8px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-medium)',
      whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-md)',
      pointerEvents: 'none',
      ...style
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/**
 * Checkbox with label. Supports indeterminate (e.g. select-all header).
 */
function Checkbox({
  checked = false,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
  style = {}
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const on = checked || indeterminate;
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: '17px',
      height: '17px',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: ref,
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '17px',
      height: '17px',
      borderRadius: 'var(--radius-xs)',
      background: on ? 'var(--accent)' : 'var(--surface-card)',
      border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
      transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      color: '#fff'
    }
  }, indeterminate ? /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "10",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  })) : checked ? /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  })) : null)), label != null && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FieldLabel.jsx
try { (() => {
/**
 * Form field label with optional required marker and helper/error text.
 * Wrap any control (Input, Select, Textarea).
 */
function FieldLabel({
  label,
  required = false,
  hint,
  error,
  htmlFor,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%',
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-semibold)',
      color: 'var(--text-primary)'
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger)',
      marginLeft: '3px'
    }
  }, "*")), children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--danger)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-tertiary)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { FieldLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FieldLabel.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input with optional leading icon and error state.
 */
function Input({
  size = 'md',
  invalid = false,
  iconLeft = null,
  disabled = false,
  style = {},
  wrapperStyle = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const heights = {
    sm: '30px',
    md: '36px',
    lg: '42px'
  };
  const fonts = {
    sm: 'var(--text-sm)',
    md: 'var(--text-base)',
    lg: 'var(--text-md)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      width: '100%',
      ...wrapperStyle
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '10px',
      display: 'inline-flex',
      color: 'var(--text-tertiary)',
      pointerEvents: 'none',
      fontSize: '16px'
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      width: '100%',
      height: heights[size],
      boxSizing: 'border-box',
      padding: iconLeft ? '0 12px 0 32px' : '0 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: fonts[size],
      color: 'var(--text-primary)',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? invalid ? '0 0 0 3px var(--danger-bg)' : 'var(--shadow-focus)' : 'var(--shadow-inset)',
      outline: 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      cursor: disabled ? 'not-allowed' : 'text',
      ...style
    }
  }, rest)));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
/**
 * Radio with label. Group by sharing a `name`.
 */
function Radio({
  checked = false,
  disabled = false,
  label,
  name,
  value,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: '17px',
      height: '17px',
      flex: '0 0 auto'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: onChange,
    style: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      margin: 0,
      cursor: 'inherit'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '17px',
      height: '17px',
      borderRadius: '50%',
      background: 'var(--surface-card)',
      border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
      transition: 'border-color var(--dur-fast) var(--ease-standard)'
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  }))), label != null && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Native select styled to match Input, with a chevron affordance.
 */
function Select({
  size = 'md',
  invalid = false,
  disabled = false,
  children,
  style = {},
  wrapperStyle = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const heights = {
    sm: '30px',
    md: '36px',
    lg: '42px'
  };
  const fonts = {
    sm: 'var(--text-sm)',
    md: 'var(--text-base)',
    lg: 'var(--text-md)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: '100%',
      ...wrapperStyle
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: heights[size],
      boxSizing: 'border-box',
      padding: '0 32px 0 12px',
      appearance: 'none',
      WebkitAppearance: 'none',
      fontFamily: 'var(--font-sans)',
      fontSize: fonts[size],
      color: 'var(--text-primary)',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? 'var(--shadow-focus)' : 'var(--shadow-inset)',
      outline: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: '11px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-tertiary)',
      fontSize: '14px',
      lineHeight: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * On/off toggle for settings (e.g. auto-assign, notifications).
 */
function Switch({
  checked = false,
  disabled = false,
  label,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '9px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": checked,
    onClick: () => !disabled && onChange?.(!checked),
    style: {
      position: 'relative',
      width: '34px',
      height: '20px',
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--accent)' : 'var(--ink-300)',
      transition: 'background var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: '2px',
      left: checked ? '16px' : '2px',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-sm)',
      transition: 'left var(--dur-base) var(--ease-out)'
    }
  })), label != null && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Multi-line text input — reply drafts, internal notes.
 */
function Textarea({
  invalid = false,
  rows = 4,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    disabled: disabled,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '9px 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      lineHeight: 'var(--leading-normal)',
      color: 'var(--text-primary)',
      resize: 'vertical',
      minHeight: '76px',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: `1px solid ${invalid ? 'var(--danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
      boxShadow: focus ? invalid ? '0 0 0 3px var(--danger-bg)' : 'var(--shadow-focus)' : 'var(--shadow-inset)',
      outline: 'none',
      transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
/**
 * Left-nav item for the app sidebar. Icon + label + optional count.
 */
function NavItem({
  icon,
  label,
  count,
  active = false,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      width: '100%',
      padding: '7px 10px',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      background: active ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'transparent',
      color: active ? 'var(--brand-700)' : 'var(--text-secondary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-base)',
      fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
      transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)',
      textAlign: 'left'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flex: '0 0 auto',
      color: active ? 'var(--brand-600)' : 'var(--text-tertiary)'
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, label), count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      color: active ? 'var(--brand-600)' : 'var(--text-tertiary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, count));
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/**
 * Underline tab bar. Controlled: pass `value` + `onChange`.
 * `items`: [{ value, label, count }]
 */
function Tabs({
  items = [],
  value,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: '2px',
      borderBottom: '1px solid var(--border-subtle)',
      ...style
    }
  }, items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      "aria-selected": active,
      onClick: () => onChange?.(it.value),
      style: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '9px 12px 11px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-base)',
        fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
        transition: 'color var(--dur-fast) var(--ease-standard)'
      }
    }, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: '18px',
        height: '18px',
        padding: '0 5px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-bold)',
        background: active ? 'var(--brand-100)' : 'var(--ink-100)',
        color: active ? 'var(--brand-700)' : 'var(--text-tertiary)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, it.count), /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: '6px',
        right: '6px',
        bottom: '-1px',
        height: '2px',
        borderRadius: '2px 2px 0 0',
        background: 'var(--accent)',
        opacity: active ? 1 : 0,
        transition: 'opacity var(--dur-fast) var(--ease-standard)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
/**
 * Centered modal dialog with scrim. Uncontrolled visibility via `open`.
 */
function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
  style = {}
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'rgba(20,23,29,0.45)',
      backdropFilter: 'blur(2px)'
    },
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose?.();
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: '100%',
      maxWidth: `${width}px`,
      maxHeight: '86vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-xl)',
      overflow: 'hidden',
      ...style
    }
  }, (title || onClose) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '18px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 'var(--text-xl)',
      fontWeight: 'var(--weight-bold)'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: '4px',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-secondary)'
    }
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-tertiary)',
      padding: '4px',
      lineHeight: 0,
      borderRadius: 'var(--radius-sm)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px',
      overflowY: 'auto',
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)',
      lineHeight: 'var(--leading-normal)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
      padding: '14px 20px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--ink-50)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/agent-app/ImportModal.jsx
try { (() => {
// Triage agent app — import tickets modal (multi-format ingest)
(function () {
  const {
    Modal,
    Button,
    Banner,
    Badge,
    Radio
  } = window.TriageDesignSystem_a9a780;
  function FormatRow({
    icon,
    name,
    ext
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": icon,
      style: {
        width: 16,
        height: 16,
        color: 'var(--text-tertiary)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)'
      }
    }, name), /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)'
      }
    }, ext));
  }
  function ImportModal({
    open,
    onClose
  }) {
    return /*#__PURE__*/React.createElement(Modal, {
      open: open,
      onClose: onClose,
      width: 520,
      title: "Import tickets",
      description: "Drop an export from another tool. Triage auto-detects the format, then categorizes and prioritizes each ticket on ingest.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: onClose
      }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
        onClick: onClose,
        iconLeft: /*#__PURE__*/React.createElement("i", {
          "data-lucide": "upload",
          style: {
            width: 15,
            height: 15
          }
        })
      }, "Start import"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        border: '1.5px dashed var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: '26px',
        textAlign: 'center',
        background: 'var(--surface-sunken)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "file-up",
      style: {
        width: 28,
        height: 28,
        color: 'var(--brand-500)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginTop: '8px'
      }
    }, "Drag a file here, or browse"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)',
        marginTop: '2px'
      }
    }, "Up to 50 MB")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '2px'
      }
    }, "Supported formats"), /*#__PURE__*/React.createElement(FormatRow, {
      icon: "file-spreadsheet",
      name: "Comma-separated values",
      ext: ".csv"
    }), /*#__PURE__*/React.createElement(FormatRow, {
      icon: "file-json",
      name: "JSON export",
      ext: ".json"
    }), /*#__PURE__*/React.createElement(FormatRow, {
      icon: "mail",
      name: "Email archive",
      ext: ".eml / .mbox"
    }), /*#__PURE__*/React.createElement(FormatRow, {
      icon: "package",
      name: "Zendesk / Intercom export",
      ext: ".zip"
    })), /*#__PURE__*/React.createElement(Banner, {
      tone: "info",
      title: "Auto-classification is on"
    }, "Imported tickets are categorized and assigned a priority automatically. You can review and override before they enter your queues.")));
  }
  window.ImportModal = ImportModal;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/agent-app/ImportModal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/agent-app/Sidebar.jsx
try { (() => {
// Triage agent app — left sidebar (brand, queues, views, agent footer)
(function () {
  const {
    NavItem,
    Avatar,
    Badge
  } = window.TriageDesignSystem_a9a780;
  function SidebarSection({
    title
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 10px 6px',
        fontSize: 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: 'var(--tracking-caps)',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)'
      }
    }, title);
  }
  function Sidebar({
    activeQueue,
    onSelectQueue
  }) {
    const {
      queues,
      views
    } = window.TRIAGE_DATA;
    const icon = name => /*#__PURE__*/React.createElement("i", {
      "data-lucide": name,
      style: {
        width: 17,
        height: 17
      }
    });
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 'var(--sidebar-w)',
        flex: '0 0 auto',
        height: '100%',
        boxSizing: 'border-box',
        background: 'var(--surface-card)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        height: 'var(--topbar-h)',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: '2.5px',
        height: '18px'
      }
    }, [9, 13, 17, 21].map((h, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        width: '4px',
        height: h,
        borderRadius: '1.5px',
        background: 'var(--brand-500)'
      }
    }))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '19px',
        letterSpacing: '-0.03em',
        color: 'var(--text-primary)'
      }
    }, "Triage")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px 10px'
      }
    }, /*#__PURE__*/React.createElement(SidebarSection, {
      title: "Queues"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1px'
      }
    }, queues.map(q => /*#__PURE__*/React.createElement(NavItem, {
      key: q.id,
      icon: icon(q.icon),
      label: q.label,
      count: q.count,
      active: activeQueue === q.id,
      onClick: () => onSelectQueue(q.id)
    }))), /*#__PURE__*/React.createElement(SidebarSection, {
      title: "Shared views"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1px'
      }
    }, views.map(v => /*#__PURE__*/React.createElement(NavItem, {
      key: v.id,
      icon: icon(v.icon),
      label: v.label,
      count: v.count,
      active: activeQueue === v.id,
      onClick: () => onSelectQueue(v.id)
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '10px 14px',
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Priya Nair",
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, "Priya Nair"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)'
      }
    }, "Support agent")), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--success)'
      },
      title: "Online"
    })));
  }
  window.Sidebar = Sidebar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/agent-app/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/agent-app/TicketDetail.jsx
try { (() => {
// Triage agent app — ticket detail (conversation + properties panel + composer)
(function () {
  const {
    PriorityTag,
    StatusTag,
    Badge,
    Avatar,
    Button,
    IconButton,
    Select,
    Textarea,
    Tooltip
  } = window.TriageDesignSystem_a9a780;
  function Message({
    m
  }) {
    const isAgent = m.from === 'agent';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '10px',
        flexDirection: isAgent ? 'row-reverse' : 'row'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: m.name,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: '78%'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '8px',
        alignItems: 'baseline',
        marginBottom: '3px',
        flexDirection: isAgent ? 'row-reverse' : 'row'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }
    }, m.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)'
      }
    }, m.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 13px',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-normal)',
        background: isAgent ? 'var(--brand-500)' : 'var(--surface-card)',
        color: isAgent ? '#fff' : 'var(--text-primary)',
        border: isAgent ? 'none' : '1px solid var(--border-subtle)',
        borderTopRightRadius: isAgent ? '3px' : 'var(--radius-lg)',
        borderTopLeftRadius: isAgent ? 'var(--radius-lg)' : '3px'
      }
    }, m.body)));
  }
  function PropRow({
    label,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: 'var(--tracking-caps)',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)'
      }
    }, label), children);
  }
  function TicketDetail({
    t
  }) {
    const [reply, setReply] = React.useState('');
    const {
      agents
    } = window.TRIAGE_DATA;
    const ib = (n, l) => /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": n,
        style: {
          width: 16,
          height: 16
        }
      }),
      label: l,
      variant: "ghost"
    });
    return /*#__PURE__*/React.createElement("section", {
      style: {
        flex: 1,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)'
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        padding: '11px 18px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '9px'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 'var(--text-xl)',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.subject), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)'
      }
    }, "#", t.id)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '6px',
        marginTop: '6px',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement(PriorityTag, {
      level: t.priority
    }), /*#__PURE__*/React.createElement(StatusTag, {
      status: t.status
    }), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, t.category), /*#__PURE__*/React.createElement(Badge, {
      tone: "info",
      variant: "outline"
    }, t.channel))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '2px'
      }
    }, /*#__PURE__*/React.createElement(Tooltip, {
      label: "Merge tickets",
      side: "bottom"
    }, ib('git-merge', 'Merge')), /*#__PURE__*/React.createElement(Tooltip, {
      label: "Snooze",
      side: "bottom"
    }, ib('alarm-clock', 'Snooze')), /*#__PURE__*/React.createElement(Tooltip, {
      label: "More",
      side: "bottom"
    }, ib('more-horizontal', 'More'))), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm"
    }, "Solve")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        minHeight: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }
    }, t.thread.map((m, i) => /*#__PURE__*/React.createElement(Message, {
      key: i,
      m: m
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '12px 18px 16px',
        background: 'var(--surface-card)',
        borderTop: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '4px',
        marginBottom: '8px'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      iconLeft: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "reply",
        style: {
          width: 15,
          height: 15
        }
      })
    }, "Reply"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      iconLeft: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "sticky-note",
        style: {
          width: 15,
          height: 15
        }
      })
    }, "Internal note")), /*#__PURE__*/React.createElement(Textarea, {
      rows: 3,
      placeholder: "Write a reply to the customer\u2026",
      value: reply,
      onChange: e => setReply(e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px'
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "paperclip",
        style: {
          width: 16,
          height: 16
        }
      }),
      label: "Attach",
      variant: "secondary",
      size: "sm"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "smile",
        style: {
          width: 16,
          height: 16
        }
      }),
      label: "Emoji",
      variant: "secondary",
      size: "sm"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "sparkles",
        style: {
          width: 16,
          height: 16
        }
      }),
      label: "Suggest reply",
      variant: "secondary",
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Reply & solve"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      iconRight: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "send",
        style: {
          width: 15,
          height: 15
        }
      })
    }, "Send reply")))), /*#__PURE__*/React.createElement("aside", {
      style: {
        width: '256px',
        flex: '0 0 auto',
        borderLeft: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: t.requester,
      size: "md"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-base)',
        fontWeight: 600
      }
    }, t.requester), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.email))), /*#__PURE__*/React.createElement(PropRow, {
      label: "Assignee"
    }, /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      defaultValue: t.assignee || ''
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "Unassigned"), agents.map(a => /*#__PURE__*/React.createElement("option", {
      key: a.id,
      value: a.id
    }, a.name)))), /*#__PURE__*/React.createElement(PropRow, {
      label: "Priority"
    }, /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      defaultValue: t.priority
    }, /*#__PURE__*/React.createElement("option", {
      value: "urgent"
    }, "Urgent"), /*#__PURE__*/React.createElement("option", {
      value: "high"
    }, "High"), /*#__PURE__*/React.createElement("option", {
      value: "medium"
    }, "Medium"), /*#__PURE__*/React.createElement("option", {
      value: "low"
    }, "Low"), /*#__PURE__*/React.createElement("option", {
      value: "none"
    }, "None"))), /*#__PURE__*/React.createElement(PropRow, {
      label: "Status"
    }, /*#__PURE__*/React.createElement(Select, {
      size: "sm",
      defaultValue: t.status
    }, /*#__PURE__*/React.createElement("option", {
      value: "new"
    }, "New"), /*#__PURE__*/React.createElement("option", {
      value: "open"
    }, "Open"), /*#__PURE__*/React.createElement("option", {
      value: "pending"
    }, "Pending"), /*#__PURE__*/React.createElement("option", {
      value: "solved"
    }, "Solved"), /*#__PURE__*/React.createElement("option", {
      value: "closed"
    }, "Closed"))), /*#__PURE__*/React.createElement(PropRow, {
      label: "Tags"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap'
      }
    }, t.tags.length ? t.tags.map(tag => /*#__PURE__*/React.createElement(Badge, {
      key: tag,
      tone: "brand"
    }, tag)) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)'
      }
    }, "No tags"))), /*#__PURE__*/React.createElement(PropRow, {
      label: "Auto-classified"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "sparkles",
      style: {
        width: 14,
        height: 14,
        color: 'var(--brand-500)'
      }
    }), t.category, " \xB7 ", t.priority, " priority")))));
  }
  window.TicketDetail = TicketDetail;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/agent-app/TicketDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/agent-app/TicketList.jsx
try { (() => {
// Triage agent app — ticket list pane (toolbar, tabs, rows)
(function () {
  const {
    PriorityTag,
    StatusTag,
    Badge,
    Avatar,
    Checkbox,
    Input,
    Button,
    IconButton,
    Tabs
  } = window.TriageDesignSystem_a9a780;
  function TicketRow({
    t,
    selected,
    active,
    onSelect,
    onToggle
  }) {
    const [hover, setHover] = React.useState(false);
    return /*#__PURE__*/React.createElement("div", {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      onClick: () => onSelect(t.id),
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '11px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        background: active ? 'var(--surface-selected)' : hover ? 'var(--surface-hover)' : 'var(--surface-card)',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        paddingTop: '2px'
      },
      onClick: e => {
        e.stopPropagation();
        onToggle(t.id);
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      checked: selected,
      onChange: () => onToggle(t.id)
    })), /*#__PURE__*/React.createElement(Avatar, {
      name: t.requester,
      size: "sm"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: t.unread ? 700 : 600,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1
      }
    }, t.requester), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        whiteSpace: 'nowrap'
      }
    }, t.updated)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-base)',
        fontWeight: t.unread ? 600 : 400,
        color: t.unread ? 'var(--text-primary)' : 'var(--text-secondary)',
        marginTop: '1px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, t.subject), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)',
        marginTop: '2px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, t.preview), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '7px',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement(PriorityTag, {
      level: t.priority
    }), /*#__PURE__*/React.createElement(StatusTag, {
      status: t.status
    }), /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, t.category), t.sla !== '—' && (t.priority === 'urgent' || t.priority === 'high') && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--danger)'
      }
    }, "SLA ", t.sla))));
  }
  function TicketList({
    tickets,
    activeId,
    onSelect,
    tab,
    onTab
  }) {
    const [selected, setSelected] = React.useState(new Set());
    const search = /*#__PURE__*/React.createElement("i", {
      "data-lucide": "search",
      style: {
        width: 16,
        height: 16
      }
    });
    const toggle = id => setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    return /*#__PURE__*/React.createElement("section", {
      style: {
        width: 'var(--list-pane-w)',
        flex: '0 0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 'var(--text-lg)',
        fontWeight: 700,
        flex: 1
      }
    }, "All tickets"), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "arrow-up-down",
        style: {
          width: 16,
          height: 16
        }
      }),
      label: "Sort",
      variant: "secondary",
      size: "sm"
    }), /*#__PURE__*/React.createElement(IconButton, {
      icon: /*#__PURE__*/React.createElement("i", {
        "data-lucide": "sliders-horizontal",
        style: {
          width: 16,
          height: 16
        }
      }),
      label: "Filter",
      variant: "secondary",
      size: "sm"
    })), /*#__PURE__*/React.createElement(Input, {
      iconLeft: search,
      placeholder: "Search tickets\u2026",
      size: "sm"
    })), selected.size > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        background: 'var(--surface-selected)',
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: 'var(--brand-700)'
      }
    }, selected.size, " selected"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Assign"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary"
    }, "Merge"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "danger-soft"
    }, "Close")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 14px',
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement(Tabs, {
      value: tab,
      onChange: onTab,
      items: [{
        value: 'open',
        label: 'Open',
        count: tickets.filter(t => ['new', 'open', 'pending'].includes(t.status)).length
      }, {
        value: 'mine',
        label: 'Assigned to me',
        count: tickets.filter(t => t.assignee === 'priya').length
      }, {
        value: 'all',
        label: 'All'
      }]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: 'auto'
      }
    }, tickets.map(t => /*#__PURE__*/React.createElement(TicketRow, {
      key: t.id,
      t: t,
      selected: selected.has(t.id),
      active: t.id === activeId,
      onSelect: onSelect,
      onToggle: toggle
    }))));
  }
  window.TicketList = TicketList;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/agent-app/TicketList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/agent-app/data.js
try { (() => {
// Mock ticket data for the Triage agent-app UI kit.
window.TRIAGE_DATA = function () {
  const agents = [{
    id: 'priya',
    name: 'Priya Nair'
  }, {
    id: 'marco',
    name: 'Marco Diaz'
  }, {
    id: 'sam',
    name: 'Sam Lee'
  }, {
    id: 'jo',
    name: 'Jo Kim'
  }];
  const tickets = [{
    id: 4790,
    subject: 'Refund not showing on my statement',
    requester: 'Alex Turner',
    email: 'alex.turner@fastmail.com',
    priority: 'urgent',
    status: 'open',
    category: 'Billing',
    channel: 'email',
    assignee: 'priya',
    updated: '2h ago',
    sla: '01:42',
    unread: true,
    preview: "It's been five business days and the refund still hasn't appeared. Can you confirm it was actually processed?",
    tags: ['refund', 'p1'],
    thread: [{
      from: 'customer',
      name: 'Alex Turner',
      time: '09:14',
      body: "Hi — I was told my refund of $128.40 was processed on the 3rd, but nothing has shown up on my statement. It's now been five business days. Can you confirm it actually went through on your end? Order #A-99321."
    }, {
      from: 'agent',
      name: 'Priya Nair',
      time: '09:31',
      body: "Hi Alex, thanks for flagging this. I can see the refund was authorized on the 3rd but it looks like it didn't clear our processor. I'm re-issuing it now and escalating so it's prioritized."
    }, {
      from: 'customer',
      name: 'Alex Turner',
      time: '09:40',
      body: "Appreciate the quick reply. How long until I see it this time?"
    }]
  }, {
    id: 4788,
    subject: 'Cannot log in after password reset',
    requester: 'Dana Okoro',
    email: 'dana@okoro.io',
    priority: 'high',
    status: 'open',
    category: 'Account',
    channel: 'chat',
    assignee: 'priya',
    updated: '25m ago',
    sla: '03:10',
    unread: true,
    preview: 'I reset my password twice but it still says invalid credentials on the web app.',
    tags: ['login', 'auth'],
    thread: [{
      from: 'customer',
      name: 'Dana Okoro',
      time: '11:02',
      body: "I've reset my password twice now and it still says invalid credentials when I try to log in on web. Mobile works fine though."
    }]
  }, {
    id: 4787,
    subject: 'Feature request: bulk export to CSV',
    requester: 'Wei Zhang',
    email: 'wei.z@northloop.co',
    priority: 'low',
    status: 'pending',
    category: 'Feedback',
    channel: 'email',
    assignee: 'marco',
    updated: '1h ago',
    sla: '—',
    unread: false,
    preview: 'Would love to export all my records to CSV in one click rather than page by page.',
    tags: ['feature-request'],
    thread: [{
      from: 'customer',
      name: 'Wei Zhang',
      time: '10:20',
      body: "Would love to be able to export all my records to CSV in one click instead of page by page. Is that on the roadmap?"
    }, {
      from: 'agent',
      name: 'Marco Diaz',
      time: '10:45',
      body: "Thanks Wei — passing this to the product team. I'll mark it as pending while we track interest."
    }]
  }, {
    id: 4785,
    subject: 'Double charged for annual plan',
    requester: 'Grace Miller',
    email: 'grace.miller@gmail.com',
    priority: 'urgent',
    status: 'new',
    category: 'Billing',
    channel: 'email',
    assignee: null,
    updated: '8m ago',
    sla: '00:52',
    unread: true,
    preview: 'I see two identical charges of $240 on the same day for my annual subscription.',
    tags: ['billing', 'refund', 'p1'],
    thread: [{
      from: 'customer',
      name: 'Grace Miller',
      time: '11:31',
      body: "I've just noticed two identical $240 charges on the same day for my annual subscription. Please refund the duplicate."
    }]
  }, {
    id: 4782,
    subject: 'How do I add teammates to my workspace?',
    requester: 'Tom Becker',
    email: 'tom@beckerlabs.dev',
    priority: 'medium',
    status: 'open',
    category: 'How-to',
    channel: 'chat',
    assignee: 'sam',
    updated: '3h ago',
    sla: '05:20',
    unread: false,
    preview: 'Trying to invite two colleagues but I only see a personal settings page.',
    tags: ['onboarding'],
    thread: [{
      from: 'customer',
      name: 'Tom Becker',
      time: '08:50',
      body: "I'm trying to invite two colleagues to my workspace but I only see a personal settings page — where do team invites live?"
    }]
  }, {
    id: 4779,
    subject: 'API returning 500 on /tickets endpoint',
    requester: 'Lena Fischer',
    email: 'lena@stackpoint.io',
    priority: 'high',
    status: 'open',
    category: 'Technical',
    channel: 'api',
    assignee: null,
    updated: '4h ago',
    sla: '02:05',
    unread: false,
    preview: 'Since this morning about 1 in 5 calls to /v2/tickets returns a 500.',
    tags: ['api', 'bug'],
    thread: [{
      from: 'customer',
      name: 'Lena Fischer',
      time: '07:40',
      body: "Since ~6am UTC roughly 1 in 5 calls to /v2/tickets returns a 500 with no body. Nothing changed on our side. Can you check?"
    }]
  }, {
    id: 4771,
    subject: 'Thanks for the quick help yesterday!',
    requester: 'Omar Haddad',
    email: 'omar.h@brightway.org',
    priority: 'none',
    status: 'solved',
    category: 'Feedback',
    channel: 'email',
    assignee: 'jo',
    updated: 'Yesterday',
    sla: '—',
    unread: false,
    preview: 'Just wanted to say the support was excellent — issue resolved in minutes.',
    tags: [],
    thread: [{
      from: 'customer',
      name: 'Omar Haddad',
      time: 'Yesterday',
      body: "Just wanted to say thanks — the issue was resolved in minutes. Great support."
    }, {
      from: 'agent',
      name: 'Jo Kim',
      time: 'Yesterday',
      body: "Really glad to hear it, Omar. Reach out any time!"
    }]
  }];
  const queues = [{
    id: 'all',
    label: 'All tickets',
    icon: 'inbox',
    count: 128
  }, {
    id: 'mine',
    label: 'Assigned to me',
    icon: 'user',
    count: 12
  }, {
    id: 'unassigned',
    label: 'Unassigned',
    icon: 'user-x',
    count: 34
  }, {
    id: 'urgent',
    label: 'Urgent',
    icon: 'flame',
    count: 6
  }, {
    id: 'pending',
    label: 'Pending',
    icon: 'clock',
    count: 19
  }, {
    id: 'solved',
    label: 'Solved',
    icon: 'check-check',
    count: 240
  }];
  const views = [{
    id: 'billing',
    label: 'Billing escalations',
    icon: 'credit-card',
    count: 8
  }, {
    id: 'api',
    label: 'API & technical',
    icon: 'terminal',
    count: 14
  }, {
    id: 'feedback',
    label: 'Product feedback',
    icon: 'message-square',
    count: 22
  }];
  return {
    agents,
    tickets,
    queues,
    views
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/agent-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.PriorityTag = __ds_scope.PriorityTag;

__ds_ns.StatusTag = __ds_scope.StatusTag;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FieldLabel = __ds_scope.FieldLabel;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Modal = __ds_scope.Modal;

})();

