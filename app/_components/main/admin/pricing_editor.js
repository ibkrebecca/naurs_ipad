"use client";

import { AddSquare, Trash } from "iconsax-react";

const emptyTable = () => ({
  title: "",
  columns: ["", ""],
  rows: [{ cells: ["", ""] }],
});

const PricingEditor = ({ value, onChange }) => {
  const tables = Array.isArray(value) ? value : [];

  const updateTable = (ti, next) => {
    const copy = tables.map((t, i) => (i === ti ? next : t));
    onChange(next === null ? copy.filter((_, i) => i !== ti) : copy);
  };

  const addTable = () => onChange([...tables, emptyTable()]);

  const setTitle = (ti, title) => updateTable(ti, { ...tables[ti], title });

  const setColumn = (ti, ci, label) => {
    const columns = tables[ti].columns.map((c, i) => (i === ci ? label : c));
    updateTable(ti, { ...tables[ti], columns });
  };

  const addColumn = (ti) => {
    const t = tables[ti];
    updateTable(ti, {
      ...t,
      columns: [...t.columns, `Column ${t.columns.length + 1}`],
      rows: t.rows.map((r) => ({ cells: [...r.cells, ""] })),
    });
  };

  const removeColumn = (ti, ci) => {
    const t = tables[ti];
    if (t.columns.length <= 1) return;
    updateTable(ti, {
      ...t,
      columns: t.columns.filter((_, i) => i !== ci),
      rows: t.rows.map((r) => ({
        cells: r.cells.filter((_, i) => i !== ci),
      })),
    });
  };

  const addRow = (ti) => {
    const t = tables[ti];
    updateTable(ti, {
      ...t,
      rows: [...t.rows, { cells: t.columns.map(() => "") }],
    });
  };

  const removeRow = (ti, ri) => {
    const t = tables[ti];
    updateTable(ti, { ...t, rows: t.rows.filter((_, i) => i !== ri) });
  };

  const setCell = (ti, ri, ci, val) => {
    const t = tables[ti];
    const rows = t.rows.map((r, i) =>
      i === ri ? { cells: r.cells.map((c, j) => (j === ci ? val : c)) } : r,
    );
    updateTable(ti, { ...t, rows });
  };

  return (
    <div className="mb-3">
      <label className="form-label">Pricing (optional)</label>

      {tables.map((t, ti) => (
        <div key={ti} className="border rounded p-3 mb-3 bg-white">
          <div className="d-flex align-items-center mb-3">
            <input
              type="text"
              className="form-control cus-form-control me-2"
              placeholder="Table title (e.g. Per Class)"
              value={t.title ?? ""}
              onChange={(e) => setTitle(ti, e.target.value)}
            />

            <button
              type="button"
              className="btn bg-danger text-white flex-shrink-0"
              onClick={() => updateTable(ti, null)}
              title="Remove table"
            >
              <Trash size={18} color="white" />
            </button>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-2">
              <thead>
                <tr>
                  {t.columns.map((col, ci) => (
                    <th key={ci} style={{ minWidth: 120 }}>
                      <div className="d-flex align-items-center">
                        <input
                          type="text"
                          className="form-control cus-form-control form-control-sm me-1"
                          placeholder={`Column ${ci + 1}`}
                          value={col}
                          onChange={(e) => setColumn(ti, ci, e.target.value)}
                        />
                        {t.columns.length > 1 && (
                          <Trash
                            size={16}
                            color="red"
                            className="text-danger pe-active flex-shrink-0"
                            onClick={() => removeColumn(ti, ci)}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                  <th style={{ width: 40 }} />
                </tr>
              </thead>

              <tbody>
                {t.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.cells.map((cell, ci) => (
                      <td key={ci}>
                        <textarea
                          rows={2}
                          className="form-control cus-form-control form-control-sm"
                          placeholder={ci === 0 ? "Label" : "Value"}
                          value={cell}
                          onChange={(e) => setCell(ti, ri, ci, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="text-center">
                      <Trash
                        size={16}
                        color="red"
                        className="text-danger pe-active"
                        onClick={() => removeRow(ti, ri)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex">
            <button
              type="button"
              className="btn btn-sm btn-outline-dark me-2"
              onClick={() => addColumn(ti)}
            >
              <AddSquare size={16} color="black" /> Column
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-dark"
              onClick={() => addRow(ti)}
            >
              <AddSquare size={16} color="black" /> Row
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-sm btn-dark" onClick={addTable}>
        <AddSquare size={18} color="white" /> Add Pricing Table
      </button>
    </div>
  );
};

export default PricingEditor;
