import { useState } from "react";
import { ArrowRight, Trash } from "lucide-react";
import { DrillingData } from "./DrillingInterface";
import { ChannelBankItem } from './ChannelBank';

type ColumnMappingProps = {
  data: DrillingData;
  channelBank: ChannelBankItem[];   // full channel objects
  onMappingComplete: (mappings: Array<{
    original: string;
    mapped: string;
    originalUnit: string;
    mappedUnit: string;
  }>) => void;
};

// Function to normalize and standardize units from uploaded file
const replaceUnit = (unit: string | undefined): string | undefined => {
  if (!unit) return unit;

  // Normalize value: lowercase, remove spaces/underscores/dots, unify special chars
  const normalize = (val: string) =>
    val
      .toLowerCase()
      .replace(/\s|_|\.|-/g, "") // remove spaces, underscores, dots, dashes
      .replace(/³/g, "3")        // replace superscript ³ with 3
      .replace(/°/g, "");        // remove degree symbol (so "°c" => "c")

  const val = normalize(unit);

  // Variations (all normalized, so no °, spaces, underscores)
  const tonneVariation = ["tonne", "ton", "t", "metrictonne", "tmetric", "tf"];
  const torqueVariation = ["knm"]; // "kN.m" will normalize to "knm"
  const tempVariationF = ["f"];    // both "f" and "°f" normalize to "f"
  const tempVariationC = ["c"];    // both "c" and "°c" normalize to "c"
  const densityVariation = ["lbmft3","lbm/ft³"]; // "lbm/ft³" => "lbmft3"
  const apiVariation = ["api"];
  const timeVariation = ["sec", "s"];

  if (tonneVariation.includes(val)) {
    return "1000 kgf";
  } else if (torqueVariation.includes(val)) {
    return "1000 N.m";
  } else if (tempVariationF.includes(val)) {
    return "degF";
  } else if (tempVariationC.includes(val)) {
    return "degC";
  } else if (densityVariation.includes(val)) {
    return "lbm/gal";
  } else if (apiVariation.includes(val)) {
    return "gAPI";
  } else if (timeVariation.includes(val)) {
    return "h";
  }

  // No match → return original unit untouched
  return unit;
};



export const ColumnMapping = ({ data, channelBank, onMappingComplete }: ColumnMappingProps) => {
  // State for mappings
  const [mappings, setMappings] = useState(() => {
    // Sort headers alphabetically
    const sortedHeaders = [...data.headers].sort((a, b) => a.localeCompare(b));
    
    return data.headers.map((header, index) => {
      const headerLower = header.toLowerCase().trim();

      // Step 1: Try exact alias match
      let matchedChannel = channelBank.find(channel =>
        channel.aliases.some(alias => alias.toLowerCase() === headerLower)
      );

      // Step 2: If no exact match, try partial match
      if (!matchedChannel) {
        matchedChannel = channelBank.find(channel =>
          channel.aliases.some(
            alias => headerLower.includes(alias.toLowerCase()) || alias.toLowerCase().includes(headerLower)
          )
        );
      }

      const originalUnit = data.units[index] || '';

      // Always process the unit, regardless of channel match
      const standardizedUnit = replaceUnit(originalUnit) || originalUnit;

      const mappedName = matchedChannel ? matchedChannel.standardName : '';
      return {
        original: header,
        mapped: mappedName,
        originalUnit,
        mappedUnit: mappedName === "TIME" ? "" : standardizedUnit,
        manualEdit: false
      };

    });
  });





  const [toast, setToast] = useState<string | null>(null); // Toast state

  // Update a mapping field
  const updateMapping = (index: number, field: 'mapped' | 'mappedUnit', value: string) => {
    const newMappings = [...mappings];
    let updated = { ...newMappings[index], [field]: value };

    // Special rule: if channel mapped as TIME, force unit = ""
    if (field === "mapped" && value === "TIME") {
      updated.mappedUnit = "";
    }
    if (updated.mapped === "TIME") {
      updated.mappedUnit = "";
    }

    newMappings[index] = updated;
    setMappings(newMappings);
  };


  // Handle removing a mapping row
  const removeMapping = (index: number) => {
    const removedRow = mappings[index];
    setMappings(prev => prev.filter((_, i) => i !== index));

    // Show toast
    setToast(`Removed row: "${removedRow.original}"`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleComplete = () => {
    const incomplete = mappings.some(m => !m.mapped || !m.mappedUnit);

    if (incomplete) {
      alert("Please complete all the channels and units mapping to proceed");
      return;
    }

    onMappingComplete(
      mappings.map(m => ({
        original: m.original,
        mapped: m.mapped,
        originalUnit: m.originalUnit,
        mappedUnit: m.mapped === "TIME" ? "" : m.mappedUnit,
      }))
    );


  };

  const standardChannels = channelBank.map(c => c.standardName);
  const standardUnits = ["",
    "ft", "m", "API", "ohm.m", "fraction", "g/cm3", "datetime", "sec",
    "1000 kgf", "1000 N.m", "degC", "degF", "lbm/gal", "gAPI", "m/h",
    "bbl","h","lbm/ft³","ppm","gpm","spm","rpm","lbf·ft","%","psi"
  ];


  return (
    <div className="space-y-6 relative">

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-yellow-200 text-black px-4 py-2 rounded shadow-md z-50">
          {toast}
        </div>
      )}


      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Column Mapping Configuration
        </h2>
        <p className="text-muted-foreground">
          Map your channel headers to standardized drilling platform names
        </p>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="bg-table-header text-black p-4">
          <div className="grid grid-cols-5 gap-4 font-medium">
            <div>Original Header</div>
            <div>Mapped Channel</div>
            <div>Original Unit</div>
            <div>Mapped Unit</div>
            <div>Action</div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {mappings.map((mapping, index) => {
            const matched = !!mapping.mapped;

            return (
              <div 
                key={index} 
                className={`p-4 grid grid-cols-5 gap-4 items-center ${
                  index % 2 === 0 ? 'bg-background' : 'bg-table-row-even'
                } hover:bg-table-row-hover transition-colors`}
              >
                <div className="font-medium text-foreground">{mapping.original}</div>

                <div>
                  {mapping.manualEdit ? (
                    <input
                      type="text"
                      value={mapping.mapped}
                      onChange={(e) => updateMapping(index, 'mapped', e.target.value)}
                      className="w-full p-2 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter channel name"
                    />
                  ) : (
                    <select
                      value={mapping.mapped}
                      onChange={(e) => updateMapping(index, 'mapped', e.target.value)}
                      className={`w-full p-2 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${
                        mapping.mapped ? 'bg-green-200' : 'bg-red-200'
                      }`}
                    >
                      <option value="">Select channel...</option>
                      {standardChannels.map(channel => (
                        <option key={channel} value={channel}>{channel}</option>
                      ))}
                    </select>
                  )}
                </div>


                <div className="text-muted-foreground">{mapping.originalUnit || "N/A"}</div>

                <div>
                  {mapping.mapped === "TIME" ? (
                    <input
                      type="text"
                      value={mapping.mappedUnit}
                      onChange={(e) => updateMapping(index, 'mappedUnit', e.target.value)}
                      className="w-full p-2 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="(optional)"
                    />
                  ) : mapping.manualEdit ? (
                    <input
                      type="text"
                      value={mapping.mappedUnit}
                      onChange={(e) => updateMapping(index, 'mappedUnit', e.target.value)}
                      className="w-full p-2 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter unit"
                    />
                  ) : (
                    <select
                      value={mapping.mappedUnit}
                      onChange={(e) => updateMapping(index, 'mappedUnit', e.target.value)}
                      className={`w-full p-2 border border-border rounded text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${
                        standardUnits.includes(mapping.mappedUnit) ? 'bg-green-200' : 'bg-red-200'
                      }`}
                    >
                      <option value="">Select unit...</option>
                      {standardUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  )}
                </div>









                <div className="flex justify-center items-center space-x-2 text-center">
                  <button
                    onClick={() => {
                      const newMappings = [...mappings];
                      newMappings[index].manualEdit = !newMappings[index].manualEdit;
                      setMappings(newMappings);
                    }}
                    className="p-1 hover:bg-background rounded"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H3v-4.5L16.732 3.732z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => removeMapping(index)}
                    className="p-1 hover:bg-background rounded"
                  >
                    <Trash className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Mapping Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handleComplete}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-hover flex items-center space-x-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Complete Mapping</span>
        </button>
      </div>
    </div>
  );
};
