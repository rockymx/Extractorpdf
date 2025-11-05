
import React from 'react';
import type { ProcessedTable } from '../types';

interface DataTableProps {
  table: ProcessedTable;
}

export const DataTable: React.FC<DataTableProps> = ({ table }) => {
  if (!table.data || table.data.length === 0) {
    return (
        <div className="bg-slate-800 p-4 rounded-lg my-4 text-slate-400">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{table.name || 'Tabla sin nombre'}</h3>
            <p>No se encontraron datos para esta tabla.</p>
        </div>
    );
  }

  const headers = Object.keys(table.data[0]);

  return (
    <div className="my-8 bg-slate-800/50 rounded-xl shadow-lg overflow-hidden">
        <h3 className="text-xl font-bold text-slate-200 p-4 bg-slate-700/50">{table.name || 'Tabla Extraída'}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-200 uppercase bg-slate-700">
                    <tr>
                        {headers.map((header) => (
                            <th key={header} scope="col" className="px-6 py-3">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                            {headers.map((header) => (
                                <td key={`${rowIndex}-${header}`} className="px-6 py-4">
                                    {row[header]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
