// CrisisTypeModal.jsx
import PropTypes from "prop-types";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { QUICK_PICK_IDS, CRISIS_TYPES, CATEGORY_ORDER, getByIds } from "../../constants/crisisTypes";

const CrisisTypeModal = forwardRef(function CrisisTypeModal(
  { isOpen, onConfirm, onViewChange, defaultType = "wildfire" },
  ref
) {
  const [view, setView] = useState("quick");
  const [selectedCategory, setSelectedCategory] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      goBack() {
        if (view === "list") {
          setView("categories");
          setSelectedCategory(null);
        } else if (view === "categories") {
          setView("quick");
        }
      },
    }),
    [view]
  );

  useEffect(() => {
    onViewChange?.(view);
  }, [view, onViewChange]);

  useEffect(() => {
    if (!isOpen) {
      setView("quick");
      setSelectedCategory(null);
    }
  }, [isOpen]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const t of CRISIS_TYPES) {
      (map[t.category] ??= []).push(t);
    }
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.label.localeCompare(b.label)));
    return map;
  }, []);

  const categoriesInOrder = useMemo(() => CATEGORY_ORDER.filter((c) => byCategory[c]?.length), [byCategory]);

  if (!isOpen) return null;

  const quickPicks = getByIds(QUICK_PICK_IDS);

  const handleQuickPick = (id) => {
    if (id === "categories") {
      setView("categories");
      return;
    }
    onConfirm(id);
  };

  return (
    <div className="crisis-modal">
      {view === "quick" && (
        <div className="crisis-modal-content">
          {quickPicks.map((t, i) => (
            <button
              key={t.id}
              style={{ "--i": i }}
              className={`crisis-button ${defaultType === t.id ? "selected" : ""}`}
              onClick={() => handleQuickPick(t.id)}
              title={t.label}
            >
              <span className="emoji">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      )}

      {view === "categories" && (
        <div className="crisis-modal-content modal-grid">
          {categoriesInOrder.map((cat, i) => (
            <button
              key={cat}
              style={{ "--i": i }}
              className="crisis-button"
              onClick={() => {
                setSelectedCategory(cat);
                setView("list");
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="crisis-modal-content modal-grid">
          {(byCategory[selectedCategory] ?? []).map((t, i) => (
            <button
              key={t.id}
              style={{ "--i": i }}
              className="crisis-button"
              onClick={() => onConfirm(t.id)}
              title={t.label}
            >
              <span className="emoji">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

CrisisTypeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onViewChange: PropTypes.func,
  defaultType: PropTypes.string,
};

export default CrisisTypeModal;
