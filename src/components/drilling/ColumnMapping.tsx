import { useState } from "react";
import { ArrowRight, Trash } from "lucide-react";
import { DrillingData } from "./DrillingInterface";
import { ChannelBankItem } from './ChannelBank';

type ColumnMappingProps = {
  data: DrillingData;
  channelBank: ChannelBankItem[];
  savedState?: any;   // ✅ add savedState
  onSaveState?: (state: any) => void; // ✅ add onSaveState
  onMappingComplete: (
    mappings: Array<{
      original: string;
      mapped: string;
      originalUnit: string;
      mappedUnit: string;
    }>,
    mappedData: any[]
  ) => void;
};



// Utility to normalize units
const replaceUnit = (unit?: string): string | undefined => {
  if (!unit) return unit;
  const normalize = (val: string) =>
    val.toLowerCase()
      .replace(/\s|_|\.|-/g, "")
      .replace(/³/g, "3")
      .replace(/°/g, "");
  const val = normalize(unit);
  const variations = {
    tonne: ["tonne", "ton", "t", "metrictonne", "tmetric", "tf"],
    torque: ["knm"],
    tempF: ["f"],
    tempC: ["c"],
    density: ["lbmft3", "lbm/ft³"],
    api: ["api"],
    time: ["sec", "s"]
  };
  if (variations.tonne.includes(val)) return "1000 kgf";
  if (variations.torque.includes(val)) return "1000 N.m";
  if (variations.tempF.includes(val)) return "degF";
  if (variations.tempC.includes(val)) return "degC";
  if (variations.density.includes(val)) return "lbm/gal";
  if (variations.api.includes(val)) return "gAPI";
  if (variations.time.includes(val)) return "h";
  return unit;
};

export const ColumnMapping = ({ data, channelBank, savedState, onSaveState, onMappingComplete }: ColumnMappingProps) => {
  const safeHeaders = Array.isArray(data?.headers) ? data.headers : [];
  const safeUnits = Array.isArray(data?.units) ? data.units : [];

  if (!safeHeaders.length) {
    console.warn("⚠️ ColumnMapping: No headers received", data);
  }


  const [mappings, setMappings] = useState(() => {
    // ✅ if savedState exists, restore it
    if (savedState) {
      return savedState;
    }

    // otherwise build from headers
    return safeHeaders.map((header, index) => {
      const headerLower = header.toLowerCase().trim();
      let matchedChannel = channelBank?.find(ch =>
        ch.aliases.some(alias => alias.toLowerCase() === headerLower)
      );
      if (!matchedChannel) {
        matchedChannel = channelBank?.find(ch =>
          ch.aliases.some(alias =>
            headerLower.includes(alias.toLowerCase()) || alias.toLowerCase().includes(headerLower)
          )
        );
      }
      const originalUnit = safeUnits[index] || "";
      const standardizedUnit = replaceUnit(originalUnit) || originalUnit;
      const mappedName = matchedChannel?.standardName || "";
      return {
        original: header,
        mapped: mappedName,
        originalUnit,
        mappedUnit: mappedName === "TIME" ? "N/A" : standardizedUnit,
        manualEdit: false
      };
    });
  });


  const [toast, setToast] = useState<string | null>(null);

  const updateMapping = (index: number, field: "mapped" | "mappedUnit", value: string) => {
    const newMappings = [...mappings];
    let updated = { ...newMappings[index], [field]: value };
    if (field === "mapped" && value === "TIME") updated.mappedUnit = "";
    if (updated.mapped === "TIME") updated.mappedUnit = "";
    newMappings[index] = updated;
    setMappings(newMappings);
    onSaveState?.(newMappings);   // ✅ save to parent
  };

  const removeMapping = (index: number) => {
    const removedRow = mappings[index];
    const newMappings = mappings.filter((_, i) => i !== index);
    setMappings(newMappings);
    onSaveState?.(newMappings);   // ✅ save to parent
    setToast(`Removed row: "${removedRow.original}"`);
    setTimeout(() => setToast(null), 3000);
  };


  const handleComplete = () => {
    if (mappings.some(m => !m.mapped || !m.mappedUnit)) {
      alert("Please complete all the channels and units mapping to proceed");
      return;
    }

    const finalMappings = mappings.map(m => ({
      original: m.original,
      mapped: m.mapped,
      originalUnit: m.originalUnit,
      mappedUnit: m.mapped === "TIME" ? "" : m.mappedUnit,
    }));

    // 🔑 Build new mapped dataset
    const mappedData = data.data.map((row) => {
      const newRow: Record<string, any> = {};
      finalMappings.forEach((m) => {
        if (Array.isArray(row)) {
          const colIndex = data.headers.indexOf(m.original);
          newRow[m.mapped] = colIndex >= 0 ? row[colIndex] : null;
        } else {
          newRow[m.mapped] = row[m.original] ?? null;
        }
      });
      return newRow;
    });

    onSaveState?.(mappings);

    onMappingComplete(finalMappings, mappedData); // ✅ pass mapped data only
  };




  const standardChannels = channelBank?.map(c => c.standardName) || [];
  const standardUnits = ["N/A", "ft", "m", "API", "ohm.m", "fraction", "g/cm3", "datetime", "sec",
    "1000 kgf", "1000 N.m", "degC", "degF", "lbm/gal", "gAPI", "m/h", "bbl", "h",
    "lbm/ft³", "ppm", "gpm", "spm", "rpm", "lbf·ft", "%", "psi"];

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed bottom-4 right-4 bg-yellow-200 text-black px-4 py-2 rounded shadow-md z-50">
          {toast}
        </div>
      )}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Column Mapping Configuration</h2>
        <p className="text-muted-foreground">Map your channel headers to standardized drilling platform names</p>
      </div>

      {safeHeaders.length === 0 ? (
        <p className="text-center text-red-500">⚠️ No headers found in data. Check TimestampFormat output.</p>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <div className="grid grid-cols-5 gap-4 font-medium text-center">
              <div>Original Header</div>
              <div>Mapped Channel</div>
              <div>Original Unit</div>
              <div>Mapped Unit</div>
              <div>Action</div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {mappings.map((mapping, index) => (
              <div key={index} className={`p-4 grid grid-cols-5 gap-4 items-center ${index % 2 === 0 ? 'bg-background' : 'bg-table-row-even'} hover:bg-table-row-hover`}>
                <div>{mapping.original}</div>
                <div>
                  <select
                    value={mapping.mapped}
                    onChange={(e) => updateMapping(index, "mapped", e.target.value)}
                    className={`w-full p-2 border rounded ${mapping.mapped ? 'bg-green-200' : 'bg-red-200'}`}
                  >
                    <option value="">Select channel...</option>
                    {standardChannels.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>{mapping.originalUnit || "N/A"}</div>
                <div>
                  <select
                    value={mapping.mappedUnit}
                    onChange={(e) => updateMapping(index, "mappedUnit", e.target.value)}
                    className={`w-full p-2 border rounded ${standardUnits.includes(mapping.mappedUnit) ? 'bg-green-200' : 'bg-red-200'}`}
                  >
                    <option value="">Select unit...</option>
                    {standardUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-center">
                  <button onClick={() => removeMapping(index)} className="p-1">
                    <Trash className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-4">
        <button onClick={handleComplete} className="px-6 py-2 bg-primary text-white rounded-md">
           Complete Mapping
        </button>
      </div>
    </div>
  );
};
