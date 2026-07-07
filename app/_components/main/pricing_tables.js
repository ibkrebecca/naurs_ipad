"use client";

import { Fragment } from "react";

const multiline = (cell) =>
  String(cell ?? "")
    .split("\n")
    .map((line, i, arr) => (
      <Fragment key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </Fragment>
    ));

const PricingTables = ({ tables }) => {
  const list = Array.isArray(tables) ? tables : [];
  if (list.length === 0) return null;

  return (
    <div className="col-md-12 mt-4">
      {list.map((table, ti) => {
        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const rows = Array.isArray(table?.rows) ? table.rows : [];
        if (columns.length === 0) return null;

        return (
          <div key={ti} className="mb-4">
            {table?.title && <h5 className="fw-normal mb-3">{table.title}</h5>}

            <div className="table-responsive">
              <table className="table align-middle text-start pricing-table mb-0">
                <thead>
                  <tr>
                    {columns.map((col, ci) => (
                      <th key={ci}>{col}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri}>
                      {columns.map((_, ci) => (
                        <td key={ci} className={ci === 0 ? "pink fw-bold" : ""}>
                          {multiline(row?.cells?.[ci])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PricingTables;
